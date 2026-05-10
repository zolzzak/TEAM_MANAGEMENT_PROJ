<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Users, Settings, UserPlus, Crown, MoreVertical, UserMinus, Shield, User, Copy, Check, RefreshCw } from 'lucide-vue-next'
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
import Avatar from '@/components/ui/Avatar.vue'
import type { TeamDetailData, TeamMemberRpc, TeamRole } from '@/types'
import { teamApi } from '@/services/api'

const route = useRoute()
const router = useRouter()

const teamId = computed(() => route.params.id as string)

function roleLabel(role: TeamRole) {
  if (role === 'OWNER') return '소유자'
  if (role === 'ADMIN') return '관리자'
  return '멤버'
}

function canManageMembers(myRole: TeamRole) {
  return myRole === 'OWNER' || myRole === 'ADMIN'
}

// State
const detail = ref<TeamDetailData | null>(null)
const isLoading = ref(true)

// Modals
const showEditModal = ref(false)
const showInviteModal = ref(false)
const showChangRoleModal = ref(false)
const showRemoveMemberModal = ref(false)

// Form state
const editForm = ref({ name: '', description: '' })
const inviteCode = ref('')
const copiedCode = ref(false)
const selectedMember = ref<TeamMemberRpc | null>(null)

// Loading states
const isUpdating = ref(false)
const isGeneratingCode = ref(false)
const isChangingRole = ref(false)
const isRemovingMember = ref(false)

// Dropdown state
const activeDropdown = ref<string | null>(null)

const members = computed(() => detail.value?.members ?? [])
const myRole = computed(() => detail.value?.myRole ?? 'MEMBER')
const canEditTeam = computed(() => canManageMembers(myRole.value))

// Fetch team details
const fetchTeamDetails = async () => {
  isLoading.value = true
  const response = await teamApi.getTeamById(teamId.value)
  if (response.success && response.data) {
    detail.value = response.data
    editForm.value = {
      name: response.data.name,
      description: response.data.description || ''
    }
  }
  isLoading.value = false
}

// Update team info
const handleUpdateTeam = async () => {
  if (!editForm.value.name.trim()) return
  
  isUpdating.value = true
  const response = await teamApi.updateTeam(
    teamId.value,
    editForm.value.name,
    editForm.value.description
  )
  if (response.success) {
    showEditModal.value = false
    await fetchTeamDetails()
  }
  isUpdating.value = false
}

// Generate invite code
const handleGenerateInviteCode = async () => {
  showInviteModal.value = true
  isGeneratingCode.value = true
  
  const response = await teamApi.generateInviteCode(teamId.value)
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

// Change member role
const openChangeRoleModal = (member: TeamMemberRpc) => {
  selectedMember.value = member
  showChangRoleModal.value = true
  activeDropdown.value = null
}

const handleChangeRole = async () => {
  if (!selectedMember.value) return
  if (selectedMember.value.role === 'OWNER') return

  isChangingRole.value = true
  const newRole: 'ADMIN' | 'MEMBER' =
    selectedMember.value.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'
  const response = await teamApi.changeMemberRole(
    teamId.value,
    selectedMember.value.userId,
    newRole
  )
  if (response.success) {
    showChangRoleModal.value = false
    selectedMember.value = null
    await fetchTeamDetails()
  }
  isChangingRole.value = false
}

// Remove member
const openRemoveMemberModal = (member: TeamMemberRpc) => {
  selectedMember.value = member
  showRemoveMemberModal.value = true
  activeDropdown.value = null
}

const handleRemoveMember = async () => {
  if (!selectedMember.value) return
  
  isRemovingMember.value = true
  const response = await teamApi.kickMember(teamId.value, selectedMember.value.userId)
  if (response.success) {
    showRemoveMemberModal.value = false
    selectedMember.value = null
    await fetchTeamDetails()
  }
  isRemovingMember.value = false
}

// Toggle dropdown
const toggleDropdown = (memberUserId: number) => {
  const key = String(memberUserId)
  activeDropdown.value = activeDropdown.value === key ? null : key
}

// Go back
const goBack = () => {
  router.push('/teams')
}

onMounted(() => {
  fetchTeamDetails()
})
</script>

<template>
  <DashboardLayout>
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div class="h-8 w-48 bg-muted rounded animate-pulse" />
      <div class="h-32 bg-muted rounded-lg animate-pulse" />
      <div class="h-64 bg-muted rounded-lg animate-pulse" />
    </div>

    <template v-else-if="detail">
      <!-- Header -->
      <div class="mb-6">
        <button
          class="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          @click="goBack"
        >
          <ArrowLeft class="h-4 w-4" />
          팀 목록으로
        </button>
        
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary text-xl font-bold">
              {{ detail.name.charAt(0) }}
            </div>
            <div>
              <h1 class="text-2xl font-bold text-foreground">{{ detail.name }}</h1>
              <p v-if="detail.description" class="text-muted-foreground">{{ detail.description }}</p>
            </div>
          </div>
          <div v-if="canEditTeam" class="flex gap-2">
            <Button variant="outline" @click="showEditModal = true">
              <Settings class="h-4 w-4 mr-2" />
              팀 설정
            </Button>
            <Button @click="handleGenerateInviteCode">
              <UserPlus class="h-4 w-4 mr-2" />
              초대 코드
            </Button>
          </div>
        </div>
      </div>

      <!-- Team Stats -->
      <div class="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users class="h-5 w-5 text-primary" />
              </div>
              <div>
                <p class="text-2xl font-bold">{{ members.length }}</p>
                <p class="text-sm text-muted-foreground">전체 멤버</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Crown class="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p class="text-2xl font-bold">{{ members.filter(m => m.role === 'OWNER' || m.role === 'ADMIN').length }}</p>
                <p class="text-sm text-muted-foreground">소유·관리</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <User class="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p class="text-2xl font-bold">{{ members.filter(m => m.role === 'MEMBER').length }}</p>
                <p class="text-sm text-muted-foreground">일반 멤버</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Members List -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Users class="h-5 w-5" />
            팀 멤버
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="divide-y divide-border">
            <div
              v-for="member in members"
              :key="member.userId"
              class="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div class="flex items-center gap-3">
                <Avatar :fallback="member.name.charAt(0)" />
                <div>
                  <p class="font-medium text-foreground">{{ member.name }}</p>
                  <p class="text-sm text-muted-foreground">{{ member.email }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Badge
                  :variant="member.role === 'MEMBER' ? 'secondary' : 'default'"
                >
                  <Crown v-if="member.role === 'OWNER'" class="h-3 w-3 mr-1" />
                  {{ roleLabel(member.role) }}
                </Badge>
                
                <div v-if="canEditTeam && member.role !== 'OWNER'" class="relative">
                  <button
                    class="p-1.5 hover:bg-muted rounded"
                    @click.stop="toggleDropdown(member.userId)"
                  >
                    <MoreVertical class="h-4 w-4" />
                  </button>
                  
                  <div
                    v-if="activeDropdown === String(member.userId)"
                    class="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-background shadow-lg z-10"
                    @click.stop
                  >
                    <div class="py-1">
                      <button
                        v-if="member.role === 'ADMIN' || member.role === 'MEMBER'"
                        class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                        @click="openChangeRoleModal(member)"
                      >
                        <Shield class="h-4 w-4" />
                        {{ member.role === 'ADMIN' ? '멤버로 변경' : '관리자로 변경' }}
                      </button>
                      <button
                        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                        @click="openRemoveMemberModal(member)"
                      >
                        <UserMinus class="h-4 w-4" />
                        팀에서 제거
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>

    <!-- Edit Team Modal -->
    <Modal
      v-model:open="showEditModal"
      title="팀 설정"
      description="팀 정보를 수정하세요"
    >
      <form @submit.prevent="handleUpdateTeam" class="space-y-4">
        <div class="space-y-2">
          <Label for="editTeamName">팀 이름 *</Label>
          <Input
            id="editTeamName"
            v-model="editForm.name"
            required
          />
        </div>
        <div class="space-y-2">
          <Label for="editTeamDescription">설명</Label>
          <Input
            id="editTeamDescription"
            v-model="editForm.description"
            placeholder="팀에 대한 간단한 설명"
          />
        </div>
      </form>
      <template #footer>
        <Button variant="outline" @click="showEditModal = false">취소</Button>
        <Button :loading="isUpdating" @click="handleUpdateTeam">저장</Button>
      </template>
    </Modal>

    <!-- Invite Code Modal -->
    <Modal
      v-model:open="showInviteModal"
      title="초대 코드"
      :description="`'${detail?.name}' 팀 초대 코드`"
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
        <Button variant="outline" class="w-full" @click="handleGenerateInviteCode">
          <RefreshCw class="h-4 w-4 mr-2" />
          새 코드 생성
        </Button>
      </div>
      <template #footer>
        <Button variant="outline" @click="showInviteModal = false">닫기</Button>
      </template>
    </Modal>

    <!-- Change Role Modal -->
    <Modal
      v-model:open="showChangRoleModal"
      title="역할 변경"
    >
      <p class="text-sm text-muted-foreground">
        <strong class="text-foreground">{{ selectedMember?.name }}</strong>님의 역할을
        <strong class="text-foreground">{{ selectedMember?.role === 'ADMIN' ? '멤버' : '관리자' }}</strong>로 변경하시겠습니까?
      </p>
      <template #footer>
        <Button variant="outline" @click="showChangRoleModal = false">취소</Button>
        <Button :loading="isChangingRole" @click="handleChangeRole">변경</Button>
      </template>
    </Modal>

    <!-- Remove Member Modal -->
    <Modal
      v-model:open="showRemoveMemberModal"
      title="멤버 제거"
    >
      <p class="text-sm text-muted-foreground">
        <strong class="text-foreground">{{ selectedMember?.name }}</strong>님을 팀에서 제거하시겠습니까?
      </p>
      <template #footer>
        <Button variant="outline" @click="showRemoveMemberModal = false">취소</Button>
        <Button variant="destructive" :loading="isRemovingMember" @click="handleRemoveMember">제거</Button>
      </template>
    </Modal>
  </DashboardLayout>
</template>
