import express from 'express'
import 'dotenv/config'
import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import nodemailer from 'nodemailer'

const app = express()
app.use(express.json())
app.use(cors({ origin: 'http://localhost:5173' }))

const MONGO_URI  = process.env.MONGO_URI
const DB_NAME    = 'startusphere'
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

let db
let emailTransporter
MongoClient.connect(MONGO_URI)
  .then(async client => {
    db = client.db(DB_NAME)
    console.log(' Connected to MongoDB')
    db.collection('users').createIndex({ email: 1 }, { unique: true })
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        emailTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 465,
          secure: process.env.SMTP_PORT == '587' ? false : true, // true for 465, false for 587
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })
        console.log(' Mailer configured (Real SMTP provider)')
      } else {
        const testAccount = await nodemailer.createTestAccount()
        emailTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        })
        console.log(' Mailer configured (Ethereal test account) - Provide SMTP_USER & SMTP_PASS in .env to send real emails')
      }
    } catch (err) {
      console.error('Failed to configure mailer', err)
    }
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

  const cleanEmail = email.trim().toLowerCase()

  try {
    const existingUser = await db.collection('users').findOne({ email: cleanEmail })
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered — sign in instead.' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otp_expiry = new Date(Date.now() + 10 * 60 * 1000)

    await db.collection('pending_users').updateOne(
      { email: cleanEmail },
      { $set: { name: name.trim(), email: cleanEmail, password: hashed, role, otp, otp_expiry, createdAt: new Date() } },
      { upsert: true }
    )
    
    if (emailTransporter) {
      const info = await emailTransporter.sendMail({
        from: '"StartupSphere" <noreply@startupsphere.com>',
        to: cleanEmail,
        subject: 'Your StartupSphere Verification Code',
        text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
      })
      console.log(' OTP Email Preview URL: %s', nodemailer.getTestMessageUrl(info))
    }

    res.status(201).json({ message: 'OTP sent', needsVerification: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body
  if (!email?.trim() || !otp?.trim())
    return res.status(400).json({ error: 'Email and OTP are required.' })

  const cleanEmail = email.trim().toLowerCase()

  try {
    const pending = await db.collection('pending_users').findOne({ email: cleanEmail })
    if (!pending) return res.status(404).json({ error: 'No pending registration found. Please register again.' })

    if (pending.otp !== otp || pending.otp_expiry < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired OTP.' })
    }

    const result = await db.collection('users').insertOne({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      role: pending.role,
      createdAt: new Date(),
    })

    await db.collection('pending_users').deleteOne({ _id: pending._id })

    const user = { id: result.insertedId.toString(), name: pending.name, email: pending.email, role: pending.role }
    res.json({ user, token: makeToken(user) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email?.trim() || !password?.trim())
    return res.status(400).json({ error: 'Email and password are required.' })

  const cleanEmail = email.trim().toLowerCase()

  try {
    const found = await db.collection('users').findOne({ email: cleanEmail })
    if (!found || !(await bcrypt.compare(password, found.password))) {
      const pending = await db.collection('pending_users').findOne({ email: cleanEmail })
      if (pending && await bcrypt.compare(password, pending.password)) {
        return res.status(403).json({ error: 'Your account is pending verification. Please register again to get a new OTP.' })
      }
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

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

app.post('/api/messages', authMiddleware, async (req, res) => {
  const { receiverId, text } = req.body
  if (!receiverId || !text?.trim())
    return res.status(400).json({ error: 'receiverId and text are required.' })

  try {
    const isInvestor = req.user.role === 'investor'
    const startupId = isInvestor ? receiverId : req.user.id
    const investorId = isInvestor ? req.user.id : receiverId

    const result = await db.collection('messages').insertOne({
      senderId: req.user.id,
      receiverId,
      startupId,
      investorId,
      text: text.trim(),
      read: false,
      createdAt: new Date()
    })
    res.status(201).json({ message: { id: result.insertedId.toString(), senderId: req.user.id, receiverId, text: text.trim(), read: false, createdAt: new Date() } })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error.' })
  }
})

app.get('/api/messages/conversations', authMiddleware, async (req, res) => {
  try {
    const isInvestor = req.user.role === 'investor'
    const filter = isInvestor ? { investorId: req.user.id } : { startupId: req.user.id }
    
    // Find all messages involving this user
    const messages = await db.collection('messages').find(filter).sort({ createdAt: -1 }).toArray()
    
    // Group by conversation and count unread
    const conversationsMap = new Map()
    for (const msg of messages) {
      const otherUserId = msg.senderId === req.user.id ? msg.receiverId : msg.senderId
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          lastMsg: msg,
          unreadCount: (msg.receiverId === req.user.id && !msg.read) ? 1 : 0
        })
      } else {
        const entry = conversationsMap.get(otherUserId)
        if (msg.receiverId === req.user.id && !msg.read) {
          entry.unreadCount += 1
        }
      }
    }

    const otherUserIds = Array.from(conversationsMap.keys())
    const otherUsers = await db.collection('users')
      .find({ _id: { $in: otherUserIds.map(id => new ObjectId(id)) } })
      .toArray()
      
    const userMap = Object.fromEntries(otherUsers.map(u => [u._id.toString(), { name: u.name, role: u.role }]))

    const conversations = otherUserIds.map(id => {
      const entry = conversationsMap.get(id)
      return {
        userId: id,
        userName: userMap[id]?.name ?? 'Unknown',
        userRole: userMap[id]?.role ?? 'Unknown',
        lastMessage: entry.lastMsg.text,
        lastMessageAt: entry.lastMsg.createdAt,
        unreadCount: entry.unreadCount
      }
    }).sort((a, b) => b.lastMessageAt - a.lastMessageAt)

    res.json({ conversations })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error.' })
  }
})

app.get('/api/messages/:otherUserId', authMiddleware, async (req, res) => {
  const { otherUserId } = req.params
  try {
    const messages = await db.collection('messages').find({
      $or: [
        { senderId: req.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user.id }
      ]
    }).sort({ createdAt: 1 }).toArray()

    res.json({
      messages: messages.map(m => ({
        id: m._id.toString(),
        senderId: m.senderId,
        receiverId: m.receiverId,
        text: m.text,
        createdAt: m.createdAt
      }))
    })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error.' })
  }
})

app.post('/api/messages/:otherUserId/read', authMiddleware, async (req, res) => {
  const { otherUserId } = req.params
  try {
    await db.collection('messages').updateMany(
      { senderId: otherUserId, receiverId: req.user.id, read: { $ne: true } },
      { $set: { read: true } }
    )
    res.json({ success: true })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error.' })
  }
})
app.post('/api/bookmarks', authMiddleware, async (req, res) => {
  if (req.user.role !== 'investor') return res.status(403).json({ error: 'Only investors can bookmark startups.' })
  const { startupUserId } = req.body
  if (!startupUserId) return res.status(400).json({ error: 'startupUserId is required.' })

  try {
    const existing = await db.collection('bookmarks').findOne({ investorUserId: req.user.id, startupUserId })
    if (existing) {
      await db.collection('bookmarks').deleteOne({ _id: existing._id })
      return res.json({ bookmarked: false })
    } else {
      await db.collection('bookmarks').insertOne({ investorUserId: req.user.id, startupUserId, createdAt: new Date() })
      return res.json({ bookmarked: true })
    }
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error.' })
  }
})

app.get('/api/bookmarks', authMiddleware, async (req, res) => {
  if (req.user.role !== 'investor') return res.status(403).json({ error: 'Only investors have bookmarks.' })
  try {
    const bookmarks = await db.collection('bookmarks').find({ investorUserId: req.user.id }).toArray()
    const startupIds = bookmarks.map(b => b.startupUserId)
    const startups = await db.collection('startups').find({ userId: { $in: startupIds } }).toArray()
    
    // Also return the bookmarks mapping so frontend knows what is bookmarked easily, though all of these are.
    res.json({ startups })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error.' })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))