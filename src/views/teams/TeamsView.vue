<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Users, Settings, MoreVertical, UserPlus, LogOut, Trash2, Copy, Check } from 'lucide-vue-next'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Modal from '@/components/ui/Modal.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Badge from '@/components/ui/Badge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { TeamListItem, TeamRole } from '@/types'
import { teamApi } from '@/services/api'

const router = useRouter()

function roleLabel(role: TeamRole) {
  if (role === 'OWNER') return '소유자'
  if (role === 'ADMIN') return '관리자'
  return '멤버'
}

function canManageTeam(role: TeamRole) {
  return role === 'OWNER' || role === 'ADMIN'
}

// State
const teams = ref<TeamListItem[]>([])
const isLoading = ref(true)

// Modals
const showCreateModal = ref(false)
const showJoinModal = ref(false)
const showInviteModal = ref(false)
const showDeleteModal = ref(false)

// Form state
const createForm = ref({ name: '', description: '' })
const joinCode = ref('')
const selectedTeam = ref<TeamListItem | null>(null)
const inviteCode = ref('')
const copiedCode = ref(false)

// Dropdown state
const activeDropdown = ref<string | null>(null)

// Loading states
const isCreating = ref(false)
const isJoining = ref(false)
const isDeleting = ref(false)
const isGeneratingCode = ref(false)

// Fetch teams
const fetchTeams = async () => {
  isLoading.value = true
  const response = await teamApi.getMyTeams()
  if (response.success && response.data) {
    teams.value = response.data
  }
  isLoading.value = false
}

// Create team
const handleCreateTeam = async () => {
  if (!createForm.value.name.trim()) return
  
  isCreating.value = true
  const response = await teamApi.createTeam(createForm.value.name, createForm.value.description)
  if (response.success) {
    showCreateModal.value = false
    createForm.value = { name: '', description: '' }
    await fetchTeams()
  }
  isCreating.value = false
}

// Join team with code
const handleJoinTeam = async () => {
  if (!joinCode.value.trim()) return
  
  isJoining.value = true
  const response = await teamApi.joinWithCode(joinCode.value)
  if (response.success) {
    showJoinModal.value = false
    joinCode.value = ''
    await fetchTeams()
  } else {
    alert(response.message || '팀 가입에 실패했습니다')
  }
  isJoining.value = false
}

// Generate invite code
const handleGenerateInviteCode = async (team: TeamListItem) => {
  selectedTeam.value = team
  showInviteModal.value = true
  isGeneratingCode.value = true
  
  const response = await teamApi.generateInviteCode(String(team.teamId))
  if (response.success && response.data) {
    inviteCode.value = response.data.inviteCode
  }
  isGeneratingCode.value = false
}

// Copy invite code
const copyInviteCode = async () => {
  await navigator.clipboard.writeText(inviteCode.value)
  copiedCode.value = true
  setTimeout(() => {
    copiedCode.value = false
  }, 2000)
}

// Delete team
const handleDeleteTeam = async () => {
  if (!selectedTeam.value) return
  
  isDeleting.value = true
  const response = await teamApi.deleteTeam(String(selectedTeam.value.teamId))
  if (response.success) {
    showDeleteModal.value = false
    selectedTeam.value = null
    await fetchTeams()
  }
  isDeleting.value = false
}

// Leave team
const handleLeaveTeam = async (team: TeamListItem) => {
  if (!confirm('정말로 이 팀에서 탈퇴하시겠습니까?')) return
  
  const response = await teamApi.leaveTeam(String(team.teamId))
  if (response.success) {
    await fetchTeams()
  }
}

// Toggle dropdown
const toggleDropdown = (teamId: number) => {
  const key = String(teamId)
  activeDropdown.value = activeDropdown.value === key ? null : key
}

// Navigate to team detail
const goToTeamDetail = (teamId: string) => {
  router.push(`/teams/${teamId}`)
}

// Close dropdown on outside click
const closeDropdown = () => {
  activeDropdown.value = null
}

onMounted(() => {
  fetchTeams()
  document.addEventListener('click', closeDropdown)
})
</script>

<template>
  <DashboardLayout>
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">팀 관리</h1>
        <p class="text-muted-foreground">팀을 생성하고 관리하세요</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="showJoinModal = true">
          <UserPlus class="h-4 w-4 mr-2" />
          초대 코드로 가입
        </Button>
        <Button @click="showCreateModal = true">
          <Plus class="h-4 w-4 mr-2" />
          팀 만들기
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="i in 3"
        :key="i"
        class="h-48 rounded-lg bg-muted animate-pulse"
      />
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="teams.length === 0"
      :icon="Users"
      title="아직 참여한 팀이 없습니다"
      description="새 팀을 만들거나 초대 코드로 기존 팀에 참여하세요"
    >
      <template #action>
        <div class="flex gap-2">
          <Button variant="outline" @click="showJoinModal = true">
            초대 코드로 가입
          </Button>
          <Button @click="showCreateModal = true">
            <Plus class="h-4 w-4 mr-2" />
            팀 만들기
          </Button>
        </div>
      </template>
    </EmptyState>

    <!-- Team List -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="team in teams"
        :key="team.teamId"
        class="hover:border-primary/50 transition-colors cursor-pointer group"
        @click="goToTeamDetail(String(team.teamId))"
      >
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                {{ team.name.charAt(0) }}
              </div>
              <div>
                <CardTitle class="text-base">{{ team.name }}</CardTitle>
                <Badge :variant="canManageTeam(team.myRole) ? 'default' : 'secondary'" class="mt-1">
                  {{ roleLabel(team.myRole) }}
                </Badge>
              </div>
            </div>
            <div class="relative" @click.stop>
              <button
                class="p-1.5 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                @click="toggleDropdown(team.teamId)"
              >
                <MoreVertical class="h-4 w-4" />
              </button>
              
              <!-- Dropdown Menu -->
              <div
                v-if="activeDropdown === String(team.teamId)"
                class="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-background shadow-lg z-10"
              >
                <div class="py-1">
                  <button
                    v-if="canManageTeam(team.myRole)"
                    class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                    @click="handleGenerateInviteCode(team)"
                  >
                    <UserPlus class="h-4 w-4" />
                    초대 코드 생성
                  </button>
                  <button
                    class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                    @click="goToTeamDetail(String(team.teamId))"
                  >
                    <Settings class="h-4 w-4" />
                    팀 설정
                  </button>
                  <hr class="my-1 border-border" />
                  <button
                    v-if="canManageTeam(team.myRole)"
                    class="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                    @click="selectedTeam = team; showDeleteModal = true"
                  >
                    <Trash2 class="h-4 w-4" />
                    팀 삭제
                  </button>
                  <button
                    v-else-if="team.myRole === 'MEMBER'"
                    class="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                    @click="handleLeaveTeam(team)"
                  >
                    <LogOut class="h-4 w-4" />
                    팀 탈퇴
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p v-if="team.description" class="text-sm text-muted-foreground line-clamp-2 mb-3">
            {{ team.description }}
          </p>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Users class="h-4 w-4" />
            <span>{{ team.memberCount }}명의 멤버</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Create Team Modal -->
    <Modal
      v-model:open="showCreateModal"
      title="새 팀 만들기"
      description="팀을 만들고 멤버를 초대하세요"
    >
      <form @submit.prevent="handleCreateTeam" class="space-y-4">
        <div class="space-y-2">
          <Label for="teamName">팀 이름 *</Label>
          <Input
            id="teamName"
            v-model="createForm.name"
            placeholder="예: 마케팅팀"
            required
          />
        </div>
        <div class="space-y-2">
          <Label for="teamDescription">설명 (선택)</Label>
          <Input
            id="teamDescription"
            v-model="createForm.description"
            placeholder="팀에 대한 간단한 설명"
          />
        </div>
      </form>
      <template #footer>
        <Button variant="outline" @click="showCreateModal = false">취소</Button>
        <Button :loading="isCreating" @click="handleCreateTeam">만들기</Button>
      </template>
    </Modal>

    <!-- Join Team Modal -->
    <Modal
      v-model:open="showJoinModal"
      title="초대 코드로 가입"
      description="팀 관리자에게 받은 초대 코드를 입력하세요"
    >
      <form @submit.prevent="handleJoinTeam" class="space-y-4">
        <div class="space-y-2">
          <Label for="inviteCode">초대 코드</Label>
          <Input
            id="inviteCode"
            v-model="joinCode"
            placeholder="예: ABC123XYZ"
            required
          />
        </div>
      </form>
      <template #footer>
        <Button variant="outline" @click="showJoinModal = false">취소</Button>
        <Button :loading="isJoining" @click="handleJoinTeam">가입하기</Button>
      </template>
    </Modal>

    <!-- Invite Code Modal -->
    <Modal
      v-model:open="showInviteModal"
      title="초대 코드"
      :description="`'${selectedTeam?.name}' 팀 초대 코드`"
    >
      <div v-if="isGeneratingCode" class="flex justify-center py-8">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
      <div v-else class="space-y-4">
        <div class="flex items-center gap-2">
          <Input
            :model-value="inviteCode"
            readonly
            class="font-mono text-lg tracking-wider"
          />
          <Button variant="outline" size="icon" @click="copyInviteCode">
            <Check v-if="copiedCode" class="h-4 w-4 text-green-600" />
            <Copy v-else class="h-4 w-4" />
          </Button>
        </div>
        <p class="text-sm text-muted-foreground">
          이 코드를 팀원에게 공유하세요. 코드를 재생성하면 기존 코드는 무효화됩니다.
        </p>
      </div>
      <template #footer>
        <Button variant="outline" @click="showInviteModal = false">닫기</Button>
      </template>
    </Modal>

    <!-- Delete Team Modal -->
    <Modal
      v-model:open="showDeleteModal"
      title="팀 삭제"
      description="이 작업은 되돌릴 수 없습니다"
    >
      <p class="text-sm text-muted-foreground">
        <strong class="text-foreground">{{ selectedTeam?.name }}</strong> 팀을 삭제하시겠습니까?
        모든 일정과 데이터가 영구적으로 삭제됩니다.
      </p>
      <template #footer>
        <Button variant="outline" @click="showDeleteModal = false">취소</Button>
        <Button variant="destructive" :loading="isDeleting" @click="handleDeleteTeam">삭제</Button>
      </template>
    </Modal>
  </DashboardLayout>
</template>
