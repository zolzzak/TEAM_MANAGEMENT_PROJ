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

export interface AuthResponse {
  user: User
  token: string
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
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
