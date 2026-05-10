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

/** RPC 팀 역할 */
export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER'

/** team.getMyList 항목 */
export interface TeamListItem {
  teamId: number
  name: string
  description?: string | null
  memberCount: number
  myRole: TeamRole
  createdAt: string
}

/** team.create 성공 data */
export interface TeamCreateData {
  teamId: number
  name: string
  description?: string | null
  inviteCode: string
  memberCount: number
  myRole: TeamRole
  createdAt: string
}

/** team.getDetail 멤버 */
export interface TeamMemberRpc {
  userId: number
  name: string
  email: string
  profileImageUrl: string | null
  role: TeamRole
  joinedAt: string
}

/** team.getDetail 성공 data */
export interface TeamDetailData {
  teamId: number
  name: string
  description?: string | null
  inviteCode: string
  myRole: TeamRole
  members: TeamMemberRpc[]
}

/** team.update 성공 data */
export interface TeamUpdateData {
  teamId: number
  name: string
  description?: string | null
}

/** team.regenerateInviteCode 성공 data */
export interface TeamInviteCodeData {
  teamId: number
  inviteCode: string
}

/** team.join 성공 data */
export interface TeamJoinData {
  teamId: number
  name: string
  myRole: TeamRole
}

/** team.changeMemberRole 성공 data */
export interface TeamChangeMemberRoleData {
  userId: number
  role: TeamRole
}

/** Schedule RPC enums */
export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
export type ParticipationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'
export type ScheduleUpdateScope = 'THIS_ONLY' | 'THIS_AND_AFTER' | 'ALL'

/** 팀 캘린더 조회 (teamId + 기간) 항목 */
export interface ScheduleListByTeamItem {
  scheduleId: number
  title: string
  startAt: string
  endAt: string
  isAllDay: boolean
  color: string
  recurrence: RecurrenceType
  creatorId: number
  creatorName: string
  participantCount: number
  myStatus: ParticipationStatus
}

/** 내 일정 조회 (기간 + teamIds 선택) 항목 */
export interface ScheduleListByRangeItem {
  scheduleId: number
  title: string
  startAt: string
  endAt: string
  color: string
  teamId: number
  teamName: string
  myStatus: ParticipationStatus
}

export interface ScheduleCreateData {
  scheduleId: number
  title: string
  startAt: string
  endAt: string
  color: string
  recurrence: RecurrenceType
}

export interface ScheduleDetailParticipant {
  userId: number
  name: string
  status: ParticipationStatus
}

export interface ScheduleDetailData {
  scheduleId: number
  title: string
  description?: string | null
  startAt: string
  endAt: string
  isAllDay: boolean
  color: string
  recurrence: RecurrenceType
  creatorId: number
  creatorName: string
  myStatus: ParticipationStatus
  participants: ScheduleDetailParticipant[]
}

export interface ScheduleUpdateData {
  scheduleId: number
  title: string
  startAt: string
  endAt: string
}

/** 캘린더 UI용 (목록·그리드) */
export interface Schedule {
  /** Vue 리스트 키 — 반복 확장 시 동일 scheduleId 구분 */
  id: string
  scheduleId: number
  title: string
  description?: string
  startAt: string
  endAt: string
  teamId: string
  teamName?: string
  color?: string
  isAllDay?: boolean
  recurrence?: RecurrenceType
  creatorId?: number
  creatorName?: string
  participantCount?: number
  myStatus?: ParticipationStatus
  /** DayView 등에서 본문 표시용 */
  content?: string
  createdBy?: string
  isDeleted?: boolean
}

export interface ScheduleParticipant {
  id: string
  scheduleId: string
  userId: string
  user: User
}

/** Notification RPC */
export type NotificationType =
  | 'SCHEDULE_INVITE'
  | 'SCHEDULE_UPDATE'
  | 'SCHEDULE_DELETE'
  | 'MEMBER_KICK'
  | 'PARTICIPANT_RESPONSE'

export interface NotificationItem {
  notificationId: number
  type: NotificationType
  message: string
  isRead: boolean
  relatedScheduleId?: number | null
  createdAt: string
}

export interface NotificationPageInfo {
  number: number
  totalElements: number
  totalPages: number
}

export interface NotificationListData {
  unreadCount: number
  notifications: NotificationItem[]
  page: NotificationPageInfo
}

export interface NotificationMarkReadData {
  notificationId: number
  isRead: boolean
}

export interface NotificationMarkAllReadData {
  updatedCount: number
}

/** User RPC — 프로필 / 설정 */
export type AuthProviderType = 'LOCAL' | 'GOOGLE'

export interface UserMeData {
  userId: number
  email: string
  name: string
  profileImageUrl: string | null
  provider: AuthProviderType
  createdAt: string
}

export interface UserProfileUpdateData {
  userId: number
  name: string
  profileImageUrl: string | null
}

export type CalendarDefaultViewPref = 'month' | 'week' | 'day'

export interface UserSettingsData {
  emailNotification: boolean
  inAppNotification: boolean
  defaultCalendarView: CalendarDefaultViewPref
  timezone: string
  language: string
}
