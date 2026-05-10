import type {
  ApiResponse,
  AuthLoginData,
  AuthSignupData,
  RegisterRequest,
  RpcErrorBody,
  User,
  Team,
  TeamMember,
  TeamRole
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

// HTTP 요청 헬퍼 (TEAM/SCHEDULE 등 레거시 REST — 추후 RPC로 통합)
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || '요청 처리에 실패했습니다'
      }
    }

    return {
      success: true,
      data
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

// Mock 팀 데이터
const mockTeams: (Team & { members: TeamMember[] })[] = [
  {
    id: '1',
    name: '개발팀',
    description: '프로덕트 개발을 담당하는 팀입니다',
    createdAt: new Date().toISOString(),
    ownerId: '1',
    members: [
      {
        id: 'm1',
        userId: '1',
        teamId: '1',
        role: 'Admin',
        user: mockUsers[0]
      }
    ]
  }
]

// Mock 초대 코드
const mockInviteCodes: Record<string, { teamId: string; code: string; createdAt: string }> = {
  '1': { teamId: '1', code: 'DEV2024ABC', createdAt: new Date().toISOString() }
}

// 현재 로그인 사용자 ID (Mock)
const getCurrentUserId = () => '1'

// 랜덤 초대 코드 생성
const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// 팀 관련 API
export const teamApi = {
  /**
   * 내가 속한 팀 목록 조회
   */
  async getMyTeams(): Promise<ApiResponse<(Team & { members: TeamMember[]; role: TeamRole })[]>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      
      const userId = getCurrentUserId()
      const myTeams = mockTeams
        .filter(team => team.members.some(m => m.userId === userId))
        .map(team => {
          const member = team.members.find(m => m.userId === userId)
          return {
            ...team,
            role: member?.role || 'User' as TeamRole
          }
        })
      
      return {
        success: true,
        data: myTeams
      }
    }
    
    return fetchApi('/api/teams')
  },

  /**
   * 팀 상세 조회
   */
  async getTeamById(teamId: string): Promise<ApiResponse<{ team: Team; members: TeamMember[]; currentUserRole: TeamRole }>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      
      const team = mockTeams.find(t => t.id === teamId)
      if (!team) {
        return { success: false, message: '팀을 찾을 수 없습니다' }
      }
      
      const userId = getCurrentUserId()
      const currentMember = team.members.find(m => m.userId === userId)
      
      return {
        success: true,
        data: {
          team: { id: team.id, name: team.name, description: team.description, createdAt: team.createdAt, ownerId: team.ownerId },
          members: team.members,
          currentUserRole: currentMember?.role || 'User'
        }
      }
    }
    
    return fetchApi(`/api/teams/${teamId}`)
  },

  /**
   * 팀 생성
   */
  async createTeam(name: string, description?: string): Promise<ApiResponse<Team>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      
      const userId = getCurrentUserId()
      const user = mockUsers.find(u => u.id === userId)
      
      const newTeam: Team & { members: TeamMember[] } = {
        id: String(mockTeams.length + 1),
        name,
        description,
        createdAt: new Date().toISOString(),
        ownerId: userId,
        members: [
          {
            id: `m${Date.now()}`,
            userId,
            teamId: String(mockTeams.length + 1),
            role: 'Admin',
            user: user!
          }
        ]
      }
      
      mockTeams.push(newTeam)
      
      return {
        success: true,
        data: newTeam
      }
    }
    
    return fetchApi('/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name, description })
    })
  },

  /**
   * 팀 정보 수정 (Admin만)
   */
  async updateTeam(teamId: string, name: string, description?: string): Promise<ApiResponse<Team>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      
      const team = mockTeams.find(t => t.id === teamId)
      if (!team) {
        return { success: false, message: '팀을 찾을 수 없습니다' }
      }
      
      team.name = name
      team.description = description
      
      return {
        success: true,
        data: team
      }
    }
    
    return fetchApi(`/api/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description })
    })
  },

  /**
   * 팀 삭제 (Admin만)
   */
  async deleteTeam(teamId: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      
      const index = mockTeams.findIndex(t => t.id === teamId)
      if (index === -1) {
        return { success: false, message: '팀을 찾을 수 없습니다' }
      }
      
      mockTeams.splice(index, 1)
      
      return { success: true }
    }
    
    return fetchApi(`/api/teams/${teamId}`, { method: 'DELETE' })
  },

  /**
   * 초대 코드 생성 (Admin만)
   */
  async generateInviteCode(teamId: string): Promise<ApiResponse<{ code: string }>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      
      const code = generateRandomCode()
      mockInviteCodes[teamId] = {
        teamId,
        code,
        createdAt: new Date().toISOString()
      }
      
      return {
        success: true,
        data: { code }
      }
    }
    
    return fetchApi(`/api/teams/${teamId}/invite-code`, { method: 'POST' })
  },

  /**
   * 초대 코드로 팀 가입
   */
  async joinWithCode(code: string): Promise<ApiResponse<Team>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      
      const inviteEntry = Object.values(mockInviteCodes).find(inv => inv.code === code)
      if (!inviteEntry) {
        return { success: false, message: '유효하지 않은 초대 코드입니다' }
      }
      
      const team = mockTeams.find(t => t.id === inviteEntry.teamId)
      if (!team) {
        return { success: false, message: '팀을 찾을 수 없습니다' }
      }
      
      const userId = getCurrentUserId()
      const existingMember = team.members.find(m => m.userId === userId)
      if (existingMember) {
        return { success: false, message: '이미 이 팀의 멤버입니다' }
      }
      
      const user = mockUsers.find(u => u.id === userId)
      team.members.push({
        id: `m${Date.now()}`,
        userId,
        teamId: team.id,
        role: 'User',
        user: user!
      })
      
      return {
        success: true,
        data: team
      }
    }
    
    return fetchApi('/api/teams/join', {
      method: 'POST',
      body: JSON.stringify({ code })
    })
  },

  /**
   * 팀 탈퇴
   */
  async leaveTeam(teamId: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      
      const team = mockTeams.find(t => t.id === teamId)
      if (!team) {
        return { success: false, message: '팀을 찾을 수 없습니다' }
      }
      
      const userId = getCurrentUserId()
      const memberIndex = team.members.findIndex(m => m.userId === userId)
      if (memberIndex === -1) {
        return { success: false, message: '팀 멤버가 아닙니다' }
      }
      
      team.members.splice(memberIndex, 1)
      
      return { success: true }
    }
    
    return fetchApi(`/api/teams/${teamId}/leave`, { method: 'POST' })
  },

  /**
   * 멤버 역할 변경 (Admin만)
   */
  async changeMemberRole(teamId: string, userId: string, newRole: TeamRole): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      
      const team = mockTeams.find(t => t.id === teamId)
      if (!team) {
        return { success: false, message: '팀을 찾을 수 없습니다' }
      }
      
      const member = team.members.find(m => m.userId === userId)
      if (!member) {
        return { success: false, message: '멤버를 찾을 수 없습니다' }
      }
      
      member.role = newRole
      
      return { success: true }
    }
    
    return fetchApi(`/api/teams/${teamId}/members/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    })
  },

  /**
   * 멤버 제거 (Admin만)
   */
  async removeMember(teamId: string, userId: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY)
      
      const team = mockTeams.find(t => t.id === teamId)
      if (!team) {
        return { success: false, message: '팀을 찾을 수 없습니다' }
      }
      
      const memberIndex = team.members.findIndex(m => m.userId === userId)
      if (memberIndex === -1) {
        return { success: false, message: '멤버를 찾을 수 없습니다' }
      }
      
      team.members.splice(memberIndex, 1)
      
      return { success: true }
    }
    
    return fetchApi(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' })
  }
}

// 일정 관련 API (추후 구현)
export const scheduleApi = {
  // TODO: 일정 CRUD API 구현
}
