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
  Schedule
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

// 일정 관련 API (SCHEDULE RPC 스펙 연동 시 확장)
export const scheduleApi = {
  async getSchedules(_params: {
    year: number
    month: number
    teamId?: string
  }): Promise<ApiResponse<Schedule[]>> {
    return { success: true, data: [] }
  }
}
