import type {
  ApiResponse,
  AuthLoginData,
  AuthSignupData,
  RegisterRequest,
  RpcErrorBody,
  User,
  TeamListItem,
  TeamCreateData,
  TeamDetailData,
  TeamUpdateData,
  TeamInviteCodeData,
  TeamJoinData,
  TeamChangeMemberRoleData,
  TeamRole,
  TeamMemberRpc,
  Schedule,
  ScheduleListByTeamItem,
  ScheduleListByRangeItem,
  ScheduleCreateData,
  ScheduleDetailData,
  ScheduleUpdateData,
  RecurrenceType,
  ScheduleUpdateScope,
  NotificationListData,
  NotificationMarkReadData,
  NotificationMarkAllReadData,
  NotificationItem,
  UserMeData,
  UserProfileUpdateData,
  UserSettingsData
} from '@/types'

// API 기본 URL - 환경변수로 설정 가능
const API_BASE = import.meta.env.VITE_API_URL || ''

// Mock 모드 여부 확인
const USE_MOCK = !import.meta.env.VITE_API_URL

// RPC 단일 엔드포인트 (POST + action / params)
const RPC_PATH = '/api/rpc'

// 지연 시간 시뮬레이션 (ms)
const MOCK_DELAY = 800

// Mock 데이터
const mockUsers: User[] = [
  {
    id: '1',
    name: '홍길동',
    email: 'test@example.com',
    createdAt: new Date().toISOString()
  }
]

// Mock 비밀번호 저장소 (실제로는 해시화되어야 함)
const mockPasswords: Record<string, string> = {
  'test@example.com': 'Passw0rd!'
}

// 지연 시뮬레이션 헬퍼
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function getStoredAccessToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem('token')
}

function generateInviteCodeString(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function scheduleRowId(scheduleId: number, startAt: string) {
  return `${scheduleId}-${startAt}`
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function overlapsRange(startAt: string, endAt: string, rangeStart: string, rangeEnd: string): boolean {
  const a0 = new Date(startAt).getTime()
  const a1 = new Date(endAt).getTime()
  const b0 = parseYmd(rangeStart).getTime()
  const b1 = parseYmd(rangeEnd).getTime() + 86400000 - 1
  return a0 <= b1 && a1 >= b0
}

function mapTeamItemToSchedule(row: ScheduleListByTeamItem, teamId: number, teamName?: string): Schedule {
  return {
    id: scheduleRowId(row.scheduleId, row.startAt),
    scheduleId: row.scheduleId,
    title: row.title,
    startAt: row.startAt,
    endAt: row.endAt,
    teamId: String(teamId),
    teamName,
    color: row.color,
    isAllDay: row.isAllDay,
    recurrence: row.recurrence,
    creatorId: row.creatorId,
    creatorName: row.creatorName,
    participantCount: row.participantCount,
    myStatus: row.myStatus,
    content: undefined
  }
}

function mapRangeItemToSchedule(row: ScheduleListByRangeItem): Schedule {
  return {
    id: scheduleRowId(row.scheduleId, row.startAt),
    scheduleId: row.scheduleId,
    title: row.title,
    startAt: row.startAt,
    endAt: row.endAt,
    teamId: String(row.teamId),
    teamName: row.teamName,
    color: row.color,
    myStatus: row.myStatus
  }
}

function utcToday(hour: number, minute: number): string {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour, minute, 0)).toISOString()
}

/** POST /api/rpc — 스펙: HTTP 200 + body.success 로 성공/실패 구분 */
async function rpcCall<T>(
  action: string,
  params: Record<string, unknown>,
  init?: { accessToken?: string | null }
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (init?.accessToken) {
    headers.Authorization = `Bearer ${init.accessToken}`
  }

  try {
    const response = await fetch(`${API_BASE}${RPC_PATH}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ action, params })
    })

    const text = await response.text()
    let json: unknown
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      return { success: false, message: '응답을 해석할 수 없습니다' }
    }

    const body = json as {
      success?: boolean
      data?: T
      error?: RpcErrorBody
    }

    if (body.success === false && body.error) {
      return {
        success: false,
        message: body.error.message,
        error: body.error
      }
    }

    if (body.success === true) {
      return {
        success: true,
        data: body.data as T
      }
    }

    return {
      success: false,
      message: '알 수 없는 응답 형식입니다'
    }
  } catch {
    return {
      success: false,
      message: '서버와 통신할 수 없습니다'
    }
  }
}

// 인증 관련 API — RPC action: auth.*
export const authApi = {
  /**
   * 로그인 — auth.login
   */
  async login(email: string, password: string): Promise<ApiResponse<AuthLoginData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)

      const user = mockUsers.find(u => u.email === email)
      const storedPassword = mockPasswords[email]

      if (!user || storedPassword !== password) {
        return {
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다',
          error: { code: 'E001', message: '이메일 또는 비밀번호가 올바르지 않습니다' }
        }
      }

      const uid = Number.parseInt(user.id, 10)
      return {
        success: true,
        data: {
          accessToken: 'mock-access-token-' + Date.now(),
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            userId: Number.isFinite(uid) ? uid : 1,
            email: user.email,
            name: user.name,
            profileImageUrl: null
          }
        }
      }
    }

    return rpcCall<AuthLoginData>('auth.login', { email, password })
  },

  /**
   * 회원가입 — auth.signup (params: email, password, name)
   */
  async register(data: RegisterRequest): Promise<ApiResponse<AuthSignupData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)

      const existingUser = mockUsers.find(u => u.email === data.email)
      if (existingUser) {
        return {
          success: false,
          message: '이미 사용 중인 이메일입니다',
          error: { code: 'E005', message: '이미 사용 중인 이메일입니다' }
        }
      }

      const newUser: User = {
        id: String(mockUsers.length + 1),
        name: data.name,
        email: data.email,
        createdAt: new Date().toISOString()
      }

      mockUsers.push(newUser)
      mockPasswords[data.email] = data.password

      return {
        success: true,
        data: {
          userId: Number.parseInt(newUser.id, 10),
          email: newUser.email,
          name: newUser.name,
          createdAt: newUser.createdAt
        }
      }
    }

    return rpcCall<AuthSignupData>('auth.signup', {
      email: data.email,
      password: data.password,
      name: data.name
    })
  },

  /**
   * 로그아웃 — auth.logout (Bearer + Refresh 쿠키)
   */
  async logout(accessToken: string | null): Promise<ApiResponse<null>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      return { success: true, data: null }
    }

    if (!accessToken) {
      return { success: true, data: null }
    }

    return rpcCall<null>('auth.logout', {}, { accessToken })
  },

  /**
   * 액세스 토큰 갱신 — auth.refresh (Refresh Token: HttpOnly Cookie)
   */
  async refresh(): Promise<ApiResponse<AuthLoginData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const user = mockUsers[0]
      const uid = Number.parseInt(user.id, 10)
      return {
        success: true,
        data: {
          accessToken: 'mock-refreshed-token-' + Date.now(),
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            userId: Number.isFinite(uid) ? uid : 1,
            email: user.email,
            name: user.name,
            profileImageUrl: null
          }
        }
      }
    }

    return rpcCall<AuthLoginData>('auth.refresh', {})
  },

  /**
   * 비밀번호 찾기 — auth.forgotPassword (성공 시 data: null)
   */
  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      return { success: true, data: null }
    }

    return rpcCall<null>('auth.forgotPassword', { email })
  },

  /**
   * 비밀번호 변경 — auth.changePassword (인증 필요)
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
    newPasswordConfirm: string,
    accessToken: string
  ): Promise<ApiResponse<null>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      return { success: true, data: null }
    }

    return rpcCall<null>(
      'auth.changePassword',
      {
        currentPassword,
        newPassword,
        newPasswordConfirm
      },
      { accessToken }
    )
  }
}

type MockMember = {
  userId: number
  name: string
  email: string
  profileImageUrl: string | null
  role: TeamRole
  joinedAt: string
}

type MockTeam = {
  teamId: number
  name: string
  description?: string
  inviteCode: string
  createdAt: string
  members: MockMember[]
}

/** Mock 팀 저장소 (RPC team.* 와 동일 도메인 모델) */
let mockTeamStore: MockTeam[] = [
  {
    teamId: 1,
    name: '개발팀',
    description: '프로덕트 개발을 담당하는 팀입니다',
    inviteCode: 'ABC123XY',
    createdAt: new Date().toISOString(),
    members: [
      {
        userId: 1,
        name: '홍길동',
        email: 'test@example.com',
        profileImageUrl: null,
        role: 'OWNER',
        joinedAt: new Date().toISOString()
      }
    ]
  }
]

const getCurrentUserId = (): number => 1

function findMockTeam(teamId: number): MockTeam | undefined {
  return mockTeamStore.find(t => t.teamId === teamId)
}

function getMockTeamName(teamId: number): string {
  return findMockTeam(teamId)?.name ?? '팀'
}

type MockScheduleRecord = {
  scheduleId: number
  teamId: number
  title: string
  description?: string
  startAt: string
  endAt: string
  isAllDay: boolean
  color: string
  recurrence: RecurrenceType
  recurrenceEndDate?: string
  creatorId: number
  creatorName: string
  participantUserIds: number[]
}

let mockScheduleSeq = 101
const mockScheduleRecords: MockScheduleRecord[] = [
  {
    scheduleId: 100,
    teamId: 1,
    title: '스프린트 회의',
    description: '주간 스프린트 리뷰',
    startAt: utcToday(9, 0),
    endAt: utcToday(10, 0),
    isAllDay: false,
    color: '#5b8dee',
    recurrence: 'NONE',
    creatorId: 1,
    creatorName: '홍길동',
    participantUserIds: []
  }
]

function recordToTeamItem(r: MockScheduleRecord): ScheduleListByTeamItem {
  return {
    scheduleId: r.scheduleId,
    title: r.title,
    startAt: r.startAt,
    endAt: r.endAt,
    isAllDay: r.isAllDay,
    color: r.color,
    recurrence: r.recurrence,
    creatorId: r.creatorId,
    creatorName: r.creatorName,
    participantCount: Math.max(1, r.participantUserIds.length + 1),
    myStatus: 'ACCEPTED'
  }
}

function recordToRangeItem(r: MockScheduleRecord): ScheduleListByRangeItem {
  return {
    scheduleId: r.scheduleId,
    title: r.title,
    startAt: r.startAt,
    endAt: r.endAt,
    color: r.color,
    teamId: r.teamId,
    teamName: getMockTeamName(r.teamId),
    myStatus: 'ACCEPTED'
  }
}

function toDetailData(team: MockTeam, myUserId: number): TeamDetailData {
  const me = team.members.find(m => m.userId === myUserId)
  const members: TeamMemberRpc[] = team.members.map(m => ({
    userId: m.userId,
    name: m.name,
    email: m.email,
    profileImageUrl: m.profileImageUrl,
    role: m.role,
    joinedAt: m.joinedAt
  }))
  return {
    teamId: team.teamId,
    name: team.name,
    description: team.description,
    inviteCode: team.inviteCode,
    myRole: me?.role ?? 'MEMBER',
    members
  }
}

/** 팀 관련 API — RPC action: team.* */
export const teamApi = {
  async getMyTeams(): Promise<ApiResponse<TeamListItem[]>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const uid = getCurrentUserId()
      const list: TeamListItem[] = mockTeamStore
        .filter(t => t.members.some(m => m.userId === uid))
        .map(t => {
          const me = t.members.find(m => m.userId === uid)!
          return {
            teamId: t.teamId,
            name: t.name,
            description: t.description,
            memberCount: t.members.length,
            myRole: me.role,
            createdAt: t.createdAt
          }
        })
      return { success: true, data: list }
    }

    return rpcCall<TeamListItem[]>('team.getMyList', {}, { accessToken: getStoredAccessToken() })
  },

  async getTeamById(teamId: string): Promise<ApiResponse<TeamDetailData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const id = Number(teamId)
      const team = findMockTeam(id)
      if (!team) {
        return { success: false, message: '팀을 찾을 수 없습니다', error: { code: 'E004', message: '팀을 찾을 수 없습니다' } }
      }
      return {
        success: true,
        data: toDetailData(team, getCurrentUserId())
      }
    }

    return rpcCall<TeamDetailData>('team.getDetail', { teamId: Number(teamId) }, { accessToken: getStoredAccessToken() })
  },

  async createTeam(name: string, description?: string): Promise<ApiResponse<TeamCreateData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const uid = getCurrentUserId()
      const u = mockUsers.find(x => Number(x.id) === uid)
      if (!u) {
        return { success: false, message: '사용자를 찾을 수 없습니다' }
      }
      const nextId = Math.max(0, ...mockTeamStore.map(t => t.teamId)) + 1
      const now = new Date().toISOString()
      const code = generateInviteCodeString(8)
      const newTeam: MockTeam = {
        teamId: nextId,
        name,
        description,
        inviteCode: code,
        createdAt: now,
        members: [
          {
            userId: uid,
            name: u.name,
            email: u.email,
            profileImageUrl: null,
            role: 'OWNER',
            joinedAt: now
          }
        ]
      }
      mockTeamStore.push(newTeam)
      return {
        success: true,
        data: {
          teamId: newTeam.teamId,
          name: newTeam.name,
          description: newTeam.description,
          inviteCode: newTeam.inviteCode,
          memberCount: 1,
          myRole: 'OWNER',
          createdAt: newTeam.createdAt
        }
      }
    }

    return rpcCall<TeamCreateData>(
      'team.create',
      {
        name,
        ...(description !== undefined && description !== '' ? { description } : {})
      },
      { accessToken: getStoredAccessToken() }
    )
  },

  async updateTeam(teamId: string, name: string, description?: string): Promise<ApiResponse<TeamUpdateData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const team = findMockTeam(Number(teamId))
      if (!team) {
        return { success: false, message: '팀을 찾을 수 없습니다' }
      }
      const me = team.members.find(m => m.userId === getCurrentUserId())
      if (me?.role === 'MEMBER') {
        return {
          success: false,
          message: '권한이 없습니다',
          error: { code: 'E003', message: '권한이 없습니다' }
        }
      }
      team.name = name
      team.description = description
      return {
        success: true,
        data: {
          teamId: team.teamId,
          name: team.name,
          description: team.description
        }
      }
    }

    const params: Record<string, unknown> = {
      teamId: Number(teamId),
      name,
      ...(description !== undefined ? { description } : {})
    }
    return rpcCall<TeamUpdateData>('team.update', params, { accessToken: getStoredAccessToken() })
  },

  async deleteTeam(teamId: string): Promise<ApiResponse<null>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const id = Number(teamId)
      const idx = mockTeamStore.findIndex(t => t.teamId === id)
      if (idx === -1) {
        return { success: false, message: '팀을 찾을 수 없습니다' }
      }
      mockTeamStore.splice(idx, 1)
      return { success: true, data: null }
    }

    return rpcCall<null>('team.delete', { teamId: Number(teamId) }, { accessToken: getStoredAccessToken() })
  },

  async generateInviteCode(teamId: string): Promise<ApiResponse<TeamInviteCodeData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const team = findMockTeam(Number(teamId))
      if (!team) {
        return { success: false, message: '팀을 찾을 수 없습니다' }
      }
      team.inviteCode = generateInviteCodeString(8)
      return {
        success: true,
        data: { teamId: team.teamId, inviteCode: team.inviteCode }
      }
    }

    return rpcCall<TeamInviteCodeData>(
      'team.regenerateInviteCode',
      { teamId: Number(teamId) },
      { accessToken: getStoredAccessToken() }
    )
  },

  async joinWithCode(inviteCode: string): Promise<ApiResponse<TeamJoinData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const trimmed = inviteCode.trim().toUpperCase()
      const team = mockTeamStore.find(t => t.inviteCode.toUpperCase() === trimmed)
      if (!team) {
        return {
          success: false,
          message: '유효하지 않은 초대 코드입니다',
          error: { code: 'E007', message: '유효하지 않은 초대 코드입니다' }
        }
      }
      const uid = getCurrentUserId()
      if (team.members.some(m => m.userId === uid)) {
        return {
          success: false,
          message: '이미 가입된 팀입니다',
          error: { code: 'E005', message: '이미 가입된 팀입니다' }
        }
      }
      const user = mockUsers.find(u => Number(u.id) === uid)
      if (!user) {
        return { success: false, message: '사용자를 찾을 수 없습니다' }
      }
      team.members.push({
        userId: uid,
        name: user.name,
        email: user.email,
        profileImageUrl: null,
        role: 'MEMBER',
        joinedAt: new Date().toISOString()
      })
      return {
        success: true,
        data: {
          teamId: team.teamId,
          name: team.name,
          myRole: 'MEMBER'
        }
      }
    }

    return rpcCall<TeamJoinData>('team.join', { inviteCode: inviteCode.trim() }, { accessToken: getStoredAccessToken() })
  },

  async leaveTeam(teamId: string): Promise<ApiResponse<null>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const team = findMockTeam(Number(teamId))
      if (!team) {
        return { success: false, message: '팀을 찾을 수 없습니다' }
      }
      const uid = getCurrentUserId()
      const member = team.members.find(m => m.userId === uid)
      if (!member) {
        return { success: false, message: '팀 멤버가 아닙니다' }
      }
      if (member.role === 'OWNER') {
        return {
          success: false,
          message: '역할 위임 후 탈퇴해 주세요',
          error: { code: 'E003', message: '역할 위임 후 탈퇴해 주세요' }
        }
      }
      const idx = team.members.findIndex(m => m.userId === uid)
      team.members.splice(idx, 1)
      return { success: true, data: null }
    }

    return rpcCall<null>('team.leave', { teamId: Number(teamId) }, { accessToken: getStoredAccessToken() })
  },

  async changeMemberRole(
    teamId: string,
    targetUserId: string | number,
    newRole: Extract<TeamRole, 'ADMIN' | 'MEMBER'>
  ): Promise<ApiResponse<TeamChangeMemberRoleData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const team = findMockTeam(Number(teamId))
      if (!team) {
        return { success: false, message: '팀을 찾을 수 없습니다' }
      }
      const tid = typeof targetUserId === 'string' ? Number(targetUserId) : targetUserId
      const member = team.members.find(m => m.userId === tid)
      if (!member) {
        return { success: false, message: '멤버를 찾을 수 없습니다' }
      }
      if (member.role === 'OWNER') {
        return {
          success: false,
          message: '권한이 없습니다',
          error: { code: 'E003', message: '권한이 없습니다' }
        }
      }
      member.role = newRole
      return {
        success: true,
        data: { userId: tid, role: newRole }
      }
    }

    return rpcCall<TeamChangeMemberRoleData>(
      'team.changeMemberRole',
      {
        teamId: Number(teamId),
        targetUserId: typeof targetUserId === 'string' ? Number(targetUserId) : targetUserId,
        role: newRole
      },
      { accessToken: getStoredAccessToken() }
    )
  },

  async kickMember(teamId: string, targetUserId: string | number): Promise<ApiResponse<null>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const team = findMockTeam(Number(teamId))
      if (!team) {
        return { success: false, message: '팀을 찾을 수 없습니다' }
      }
      const tid = typeof targetUserId === 'string' ? Number(targetUserId) : targetUserId
      const member = team.members.find(m => m.userId === tid)
      if (!member) {
        return { success: false, message: '멤버를 찾을 수 없습니다' }
      }
      if (member.role === 'OWNER') {
        return {
          success: false,
          message: '권한이 없습니다',
          error: { code: 'E003', message: '권한이 없습니다' }
        }
      }
      const idx = team.members.findIndex(m => m.userId === tid)
      team.members.splice(idx, 1)
      return { success: true, data: null }
    }

    return rpcCall<null>(
      'team.kickMember',
      {
        teamId: Number(teamId),
        targetUserId: typeof targetUserId === 'string' ? Number(targetUserId) : targetUserId
      },
      { accessToken: getStoredAccessToken() }
    )
  }
}

/** 일정 RPC — 액션 이름은 백엔드와 불일치 시 문자열만 조정 */
export const scheduleApi = {
  async listByTeam(
    teamId: number,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<ScheduleListByTeamItem[]>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const rows = mockScheduleRecords.filter(
        r => r.teamId === teamId && overlapsRange(r.startAt, r.endAt, startDate, endDate)
      )
      return { success: true, data: rows.map(recordToTeamItem) }
    }
    return rpcCall<ScheduleListByTeamItem[]>(
      'schedule.listByTeam',
      { teamId, startDate, endDate },
      { accessToken: getStoredAccessToken() }
    )
  },

  async listByRange(
    startDate: string,
    endDate: string,
    teamIds?: number[]
  ): Promise<ApiResponse<ScheduleListByRangeItem[]>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const uid = getCurrentUserId()
      const myTeamIds = mockTeamStore.filter(t => t.members.some(m => m.userId === uid)).map(t => t.teamId)
      const filterTeams = teamIds?.length ? teamIds : myTeamIds
      const rows = mockScheduleRecords.filter(
        r => filterTeams.includes(r.teamId) && overlapsRange(r.startAt, r.endAt, startDate, endDate)
      )
      return { success: true, data: rows.map(recordToRangeItem) }
    }
    const params: Record<string, unknown> = { startDate, endDate }
    if (teamIds?.length) params.teamIds = teamIds
    return rpcCall<ScheduleListByRangeItem[]>(
      'schedule.listByRange',
      params,
      { accessToken: getStoredAccessToken() }
    )
  },

  /** 월/주/일 뷰에서 사용 — 팀 필터 시 listByTeam, 아니면 listByRange */
  async loadCalendarSchedules(opts: {
    startDate: string
    endDate: string
    teamId: number | null
  }): Promise<ApiResponse<Schedule[]>> {
    if (opts.teamId != null) {
      const r = await scheduleApi.listByTeam(opts.teamId, opts.startDate, opts.endDate)
      if (!r.success || !r.data) {
        return { success: false, message: r.message, error: r.error }
      }
      const mapped = r.data.map(row => mapTeamItemToSchedule(row, opts.teamId!))
      return { success: true, data: mapped }
    }
    const r = await scheduleApi.listByRange(opts.startDate, opts.endDate)
    if (!r.success || !r.data) {
      return { success: false, message: r.message, error: r.error }
    }
    return { success: true, data: r.data.map(mapRangeItemToSchedule) }
  },

  async create(params: {
    teamId: number
    title: string
    description?: string
    startAt: string
    endAt: string
    isAllDay?: boolean
    color?: string
    recurrence?: RecurrenceType
    recurrenceEndDate?: string
    participantUserIds?: number[]
  }): Promise<ApiResponse<ScheduleCreateData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const id = mockScheduleSeq++
      const u = mockUsers[0]
      mockScheduleRecords.push({
        scheduleId: id,
        teamId: params.teamId,
        title: params.title,
        description: params.description,
        startAt: params.startAt,
        endAt: params.endAt,
        isAllDay: params.isAllDay ?? false,
        color: params.color ?? '#5b8dee',
        recurrence: params.recurrence ?? 'NONE',
        recurrenceEndDate: params.recurrenceEndDate,
        creatorId: Number.parseInt(u.id, 10) || 1,
        creatorName: u.name,
        participantUserIds: params.participantUserIds ?? []
      })
      return {
        success: true,
        data: {
          scheduleId: id,
          title: params.title,
          startAt: params.startAt,
          endAt: params.endAt,
          color: params.color ?? '#5b8dee',
          recurrence: params.recurrence ?? 'NONE'
        }
      }
    }
    const body: Record<string, unknown> = {
      teamId: params.teamId,
      title: params.title,
      startAt: params.startAt,
      endAt: params.endAt,
      isAllDay: params.isAllDay ?? false
    }
    if (params.description !== undefined) body.description = params.description
    if (params.color !== undefined) body.color = params.color
    if (params.recurrence !== undefined) body.recurrence = params.recurrence
    if (params.recurrenceEndDate !== undefined) body.recurrenceEndDate = params.recurrenceEndDate
    if (params.participantUserIds?.length) body.participantUserIds = params.participantUserIds
    return rpcCall<ScheduleCreateData>('schedule.create', body, { accessToken: getStoredAccessToken() })
  },

  async getDetail(scheduleId: number): Promise<ApiResponse<ScheduleDetailData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const r = mockScheduleRecords.find(x => x.scheduleId === scheduleId)
      if (!r) {
        return {
          success: false,
          message: '일정을 찾을 수 없습니다',
          error: { code: 'E004', message: '일정을 찾을 수 없습니다' }
        }
      }
      const team = findMockTeam(r.teamId)
      const participants = r.participantUserIds.map(uid => {
        const m = team?.members.find(mem => mem.userId === uid)
        return {
          userId: uid,
          name: m?.name ?? `사용자 ${uid}`,
          status: 'PENDING' as const
        }
      })
      return {
        success: true,
        data: {
          scheduleId: r.scheduleId,
          title: r.title,
          description: r.description ?? null,
          startAt: r.startAt,
          endAt: r.endAt,
          isAllDay: r.isAllDay,
          color: r.color,
          recurrence: r.recurrence,
          creatorId: r.creatorId,
          creatorName: r.creatorName,
          myStatus: 'ACCEPTED',
          participants
        }
      }
    }
    return rpcCall<ScheduleDetailData>(
      'schedule.getDetail',
      { scheduleId },
      { accessToken: getStoredAccessToken() }
    )
  },

  async update(
    scheduleId: number,
    patch: {
      title?: string
      description?: string
      startAt?: string
      endAt?: string
      color?: string
      updateScope?: ScheduleUpdateScope
      participantUserIds?: number[]
    }
  ): Promise<ApiResponse<ScheduleUpdateData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const r = mockScheduleRecords.find(x => x.scheduleId === scheduleId)
      if (!r) {
        return {
          success: false,
          message: '일정을 찾을 수 없습니다',
          error: { code: 'E004', message: '일정을 찾을 수 없습니다' }
        }
      }
      if (patch.title !== undefined) r.title = patch.title
      if (patch.description !== undefined) r.description = patch.description
      if (patch.startAt !== undefined) r.startAt = patch.startAt
      if (patch.endAt !== undefined) r.endAt = patch.endAt
      if (patch.color !== undefined) r.color = patch.color
      if (patch.participantUserIds) r.participantUserIds = patch.participantUserIds
      return {
        success: true,
        data: {
          scheduleId: r.scheduleId,
          title: r.title,
          startAt: r.startAt,
          endAt: r.endAt
        }
      }
    }
    const params: Record<string, unknown> = { scheduleId, ...patch }
    return rpcCall<ScheduleUpdateData>('schedule.update', params, { accessToken: getStoredAccessToken() })
  },

  async delete(scheduleId: number, deleteScope?: ScheduleUpdateScope): Promise<ApiResponse<null>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      const idx = mockScheduleRecords.findIndex(x => x.scheduleId === scheduleId)
      if (idx === -1) {
        return {
          success: false,
          message: '일정을 찾을 수 없습니다',
          error: { code: 'E004', message: '일정을 찾을 수 없습니다' }
        }
      }
      mockScheduleRecords.splice(idx, 1)
      return { success: true, data: null }
    }
    const params: Record<string, unknown> = { scheduleId }
    if (deleteScope) params.deleteScope = deleteScope
    return rpcCall<null>('schedule.delete', params, { accessToken: getStoredAccessToken() })
  }
}

// —— Notification mock
let mockNotifications: NotificationItem[] = [
  {
    notificationId: 55,
    type: 'SCHEDULE_INVITE',
    message: "김팀장님이 '스프린트 회의'에 초대했습니다.",
    isRead: false,
    relatedScheduleId: 100,
    createdAt: '2026-05-05T09:00:00Z'
  },
  {
    notificationId: 54,
    type: 'PARTICIPANT_RESPONSE',
    message: '이개발님이 일정 초대를 수락했습니다.',
    isRead: false,
    relatedScheduleId: 100,
    createdAt: '2026-05-04T08:00:00Z'
  },
  {
    notificationId: 53,
    type: 'MEMBER_KICK',
    message: '팀에서 탈퇴되었습니다.',
    isRead: true,
    relatedScheduleId: null,
    createdAt: '2026-05-03T12:00:00Z'
  }
]

function mockNotificationUnreadCount() {
  return mockNotifications.filter(n => !n.isRead).length
}

/** 알림 RPC */
export const notificationApi = {
  async list(opts?: {
    unreadOnly?: boolean
    page?: number
    size?: number
  }): Promise<ApiResponse<NotificationListData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY / 4)
      const pageNum = opts?.page ?? 0
      const size = opts?.size ?? 20
      let rows = [...mockNotifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      if (opts?.unreadOnly) rows = rows.filter(r => !r.isRead)
      const totalElements = rows.length
      const totalPages = Math.max(1, Math.ceil(totalElements / size))
      const slice = rows.slice(pageNum * size, pageNum * size + size)
      return {
        success: true,
        data: {
          unreadCount: mockNotificationUnreadCount(),
          notifications: slice,
          page: {
            number: pageNum,
            totalElements,
            totalPages
          }
        }
      }
    }
    const params: Record<string, unknown> = {}
    if (opts?.unreadOnly !== undefined) params.unreadOnly = opts.unreadOnly
    if (opts?.page !== undefined) params.page = opts.page
    if (opts?.size !== undefined) params.size = opts.size
    return rpcCall<NotificationListData>('notification.list', params, {
      accessToken: getStoredAccessToken()
    })
  },

  async markAsRead(notificationId: number): Promise<ApiResponse<NotificationMarkReadData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY / 6)
      const n = mockNotifications.find(x => x.notificationId === notificationId)
      if (!n) {
        return {
          success: false,
          message: '알림을 찾을 수 없습니다',
          error: { code: 'E004', message: '알림을 찾을 수 없습니다' }
        }
      }
      n.isRead = true
      return { success: true, data: { notificationId, isRead: true } }
    }
    return rpcCall<NotificationMarkReadData>(
      'notification.markAsRead',
      { notificationId },
      { accessToken: getStoredAccessToken() }
    )
  },

  async markAllAsRead(): Promise<ApiResponse<NotificationMarkAllReadData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY / 4)
      let c = 0
      mockNotifications.forEach(n => {
        if (!n.isRead) {
          n.isRead = true
          c++
        }
      })
      return { success: true, data: { updatedCount: c } }
    }
    return rpcCall<NotificationMarkAllReadData>(
      'notification.markAllAsRead',
      {},
      { accessToken: getStoredAccessToken() }
    )
  }
}

// —— User mock (프로필 / 설정)
let mockUserMe: UserMeData = {
  userId: 1,
  email: mockUsers[0].email,
  name: mockUsers[0].name,
  profileImageUrl: null,
  provider: 'LOCAL',
  createdAt: mockUsers[0].createdAt || new Date().toISOString()
}

let mockUserSettings: UserSettingsData = {
  emailNotification: true,
  inAppNotification: true,
  defaultCalendarView: 'month',
  timezone: 'Asia/Seoul',
  language: 'ko'
}

export const userApi = {
  async getMe(): Promise<ApiResponse<UserMeData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY / 6)
      return { success: true, data: { ...mockUserMe } }
    }
    return rpcCall<UserMeData>('user.getMe', {}, { accessToken: getStoredAccessToken() })
  },

  async updateProfile(patch: {
    name?: string
    profileImageUrl?: string | null
  }): Promise<ApiResponse<UserProfileUpdateData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY / 4)
      if (patch.name !== undefined) mockUserMe.name = patch.name
      if (patch.profileImageUrl !== undefined) mockUserMe.profileImageUrl = patch.profileImageUrl
      return {
        success: true,
        data: {
          userId: mockUserMe.userId,
          name: mockUserMe.name,
          profileImageUrl: mockUserMe.profileImageUrl
        }
      }
    }
    const params: Record<string, unknown> = {}
    if (patch.name !== undefined) params.name = patch.name
    if (patch.profileImageUrl !== undefined) params.profileImageUrl = patch.profileImageUrl
    return rpcCall<UserProfileUpdateData>('user.updateProfile', params, {
      accessToken: getStoredAccessToken()
    })
  },

  async getSettings(): Promise<ApiResponse<UserSettingsData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY / 6)
      return { success: true, data: { ...mockUserSettings } }
    }
    return rpcCall<UserSettingsData>('user.getSettings', {}, { accessToken: getStoredAccessToken() })
  },

  async updateSettings(patch: Partial<UserSettingsData>): Promise<ApiResponse<UserSettingsData>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY / 4)
      mockUserSettings = { ...mockUserSettings, ...patch }
      return { success: true, data: { ...mockUserSettings } }
    }
    return rpcCall<UserSettingsData>('user.updateSettings', patch, {
      accessToken: getStoredAccessToken()
    })
  }
}
