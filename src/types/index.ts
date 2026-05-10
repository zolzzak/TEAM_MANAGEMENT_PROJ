// 사용자 타입
export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

// 인증 관련 타입
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  passwordConfirm: string
}

export interface ForgotPasswordRequest {
  email: string
}

/** RPC auth.login 성공 시 data */
export interface AuthUser {
  userId: number
  email: string
  name: string
  profileImageUrl: string | null
}

export interface AuthLoginData {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: AuthUser
}

/** RPC auth.signup 성공 시 data */
export interface AuthSignupData {
  userId: number
  email: string
  name: string
  createdAt: string
}

/** RPC 공통 에러 본문 */
export interface RpcErrorBody {
  code: string
  message: string
  field?: string
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  /** 레거시 폼 검증 등 — RPC는 error 사용 */
  errors?: Record<string, string[]>
  error?: RpcErrorBody
}

// 팀 관련 타입 (추후 사용)
export interface Team {
  id: string
  name: string
  description?: string
  createdAt: string
  ownerId: string
}

export type TeamRole = 'Admin' | 'User'

export interface TeamMember {
  id: string
  userId: string
  teamId: string
  role: TeamRole
  user: User
}

// 일정 관련 타입 (추후 사용)
export interface Schedule {
  id: string
  title: string
  content?: string
  startAt: string
  endAt: string
  teamId: string
  createdBy: string
  color?: string
  isDeleted: boolean
}

export interface ScheduleParticipant {
  id: string
  scheduleId: string
  userId: string
  user: User
}
