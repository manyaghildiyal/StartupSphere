export type Role  = 'startup' | 'investor'
export type Stage = 'idea' | 'mvp' | 'growth' | 'scale'
export type View  = 'landing' | 'auth' | 'app'

export type User = {
  id: string; name: string; email: string; password: string; role: Role
}
export type StartupProfile = {
  userId: string; startupName: string; industry: string
  description: string; fundingNeeded: number; teamSize: number
  stage: Stage; pitchDeckName: string
}
export type InvestorProfile = {
  userId: string; name?: string; investmentSectors: string[]
  investmentAmount: number; preferredStage: Stage
}
export type ContactRequest = {
  id: string; investorUserId: string; startupUserId: string
  message: string; createdAt: string
}
export type AppData = {
  users: User[]; startups: StartupProfile[]
  investors: InvestorProfile[]; requests: ContactRequest[]
}