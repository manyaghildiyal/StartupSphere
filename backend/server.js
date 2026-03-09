import express from 'express'
import 'dotenv/config'
import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cors from 'cors'

const app = express()
app.use(express.json())
app.use(cors({ origin: 'http://localhost:5173' }))

const MONGO_URI  = process.env.MONGO_URI
const DB_NAME    = 'startusphere'
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

let db
MongoClient.connect(MONGO_URI)
  .then(client => {
    db = client.db(DB_NAME)
    console.log(' Connected to MongoDB')
    db.collection('users').createIndex({ email: 1 }, { unique: true })
  })
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1) })

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name?.trim() || !email?.trim() || !password?.trim() || !role)
    return res.status(400).json({ error: 'All fields are required.' })

  try {
    const hashed = await bcrypt.hash(password, 10)
    const result = await db.collection('users').insertOne({
      name: name.trim(), email: email.trim().toLowerCase(),
      password: hashed, role, createdAt: new Date()
    })
    const user = { id: result.insertedId.toString(), name: name.trim(), email: email.trim().toLowerCase(), role }
    res.status(201).json({ user, token: makeToken(user) })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already registered — sign in instead.' })
    console.error(err)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email?.trim() || !password?.trim())
    return res.status(400).json({ error: 'Email and password are required.' })

  try {
    const found = await db.collection('users').findOne({ email: email.trim().toLowerCase() })
    if (!found || !(await bcrypt.compare(password, found.password)))
      return res.status(401).json({ error: 'Invalid email or password.' })

    const user = { id: found._id.toString(), name: found.name, email: found.email, role: found.role }
    res.json({ user, token: makeToken(user) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const found = await db.collection('users').findOne({ _id: new ObjectId(req.user.id) })
    if (!found) return res.status(404).json({ error: 'User not found' })
    res.json({ user: { id: found._id.toString(), name: found.name, email: found.email, role: found.role } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error.' })
  }
})

app.get('/api/startups/me', authMiddleware, async (req, res) => {
  try {
    const profile = await db.collection('startups').findOne({ userId: req.user.id })
    res.json({ profile: profile ?? null })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error.' })
  }
})

app.post('/api/startups/me', authMiddleware, async (req, res) => {
  const { startupName, industry, description, fundingNeeded, teamSize, stage, pitchDeckName } = req.body
  if (!startupName?.trim() || !industry?.trim() || !description?.trim())
    return res.status(400).json({ error: 'Name, industry and description are required.' })

  try {
    const profile = {
      userId: req.user.id,
      startupName: startupName.trim(),
      industry: industry.trim(),
      description: description.trim(),
      fundingNeeded: Number(fundingNeeded) || 0,
      teamSize: Number(teamSize) || 1,
      stage: stage || 'idea',
      pitchDeckName: pitchDeckName || '',
      updatedAt: new Date()
    }
    await db.collection('startups').updateOne(
      { userId: req.user.id },
      { $set: profile },
      { upsert: true }
    )
    res.json({ profile })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error.' })
  }
})

app.get('/api/startups', authMiddleware, async (req, res) => {
  try {
    const { industry, stage, maxFunding } = req.query
    const filter = {}
    if (industry) filter.industry = { $regex: industry, $options: 'i' }
    if (stage)    filter.stage = stage
    if (maxFunding) filter.fundingNeeded = { $lte: Number(maxFunding) }

    const startups = await db.collection('startups').find(filter).toArray()
    res.json({ startups })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error.' })
  }
})

app.get('/api/investors/me', authMiddleware, async (req, res) => {
  try {
    const profile = await db.collection('investors').findOne({ userId: req.user.id })
    res.json({ profile: profile ?? null })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error.' })
  }
})


app.post('/api/investors/me', authMiddleware, async (req, res) => {
  const { investmentSectors, investmentAmount, preferredStage } = req.body
  if (!investmentSectors?.length || !investmentAmount)
    return res.status(400).json({ error: 'Sectors and amount are required.' })

  try {
    const profile = {
      userId: req.user.id,
      investmentSectors: Array.isArray(investmentSectors)
        ? investmentSectors
        : investmentSectors.split(',').map(s => s.trim()).filter(Boolean),
      investmentAmount: Number(investmentAmount),
      preferredStage: preferredStage || 'growth',
      updatedAt: new Date()
    }
    await db.collection('investors').updateOne(
      { userId: req.user.id },
      { $set: profile },
      { upsert: true }
    )
    res.json({ profile })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error.' })
  }
})

app.post('/api/requests', authMiddleware, async (req, res) => {
  const { startupUserId, message } = req.body
  if (!startupUserId || !message?.trim())
    return res.status(400).json({ error: 'startupUserId and message are required.' })

  try {
    const result = await db.collection('requests').insertOne({
      investorUserId: req.user.id,
      startupUserId,
      message: message.trim(),
      createdAt: new Date()
    })
    res.status(201).json({ request: { id: result.insertedId.toString(), investorUserId: req.user.id, startupUserId, message: message.trim() } })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error.' })
  }
})

app.get('/api/requests/inbox', authMiddleware, async (req, res) => {
  try {
    const requests = await db.collection('requests')
      .find({ startupUserId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray()

    const investorIds = [...new Set(requests.map(r => r.investorUserId))]
    const investors = await db.collection('users')
      .find({ _id: { $in: investorIds.map(id => new ObjectId(id)) } })
      .toArray()
    const investorMap = Object.fromEntries(investors.map(i => [i._id.toString(), i.name]))

    res.json({
      requests: requests.map(r => ({
        id: r._id.toString(),
        investorUserId: r.investorUserId,
        investorName: investorMap[r.investorUserId] ?? 'Unknown',
        startupUserId: r.startupUserId,
        message: r.message,
        createdAt: r.createdAt
      }))
    })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error.' })
  }
})
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))