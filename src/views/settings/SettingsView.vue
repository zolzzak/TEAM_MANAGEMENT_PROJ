<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Settings, UserCircle } from 'lucide-vue-next'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import { userApi } from '@/services/api'
import type { UserMeData, UserSettingsData } from '@/types'

const profile = ref<UserMeData | null>(null)
const nameEdit = ref('')
const profileUrlEdit = ref('')
const loadingProfile = ref(true)
const savingProfile = ref(false)
const profileError = ref('')
const profileOk = ref('')

const prefs = ref<UserSettingsData | null>(null)
const loadingPrefs = ref(true)
const savingPrefs = ref(false)
const prefsError = ref('')
const prefsOk = ref('')

async function loadProfile() {
  loadingProfile.value = true
  profileError.value = ''
  const r = await userApi.getMe()
  if (r.success && r.data) {
    profile.value = r.data
    nameEdit.value = r.data.name
    profileUrlEdit.value = r.data.profileImageUrl ?? ''
  } else profileError.value = r.message ?? '프로필을 불러오지 못했습니다.'
  loadingProfile.value = false
}

async function loadPrefs() {
  loadingPrefs.value = true
  prefsError.value = ''
  const r = await userApi.getSettings()
  if (r.success && r.data) prefs.value = { ...r.data }
  else prefsError.value = r.message ?? '설정을 불러오지 못했습니다.'
  loadingPrefs.value = false
}

async function saveProfile() {
  savingProfile.value = true
  profileOk.value = ''
  profileError.value = ''
  const r = await userApi.updateProfile({
    name: nameEdit.value.trim() || undefined,
    profileImageUrl: profileUrlEdit.value.trim() || null
  })
  savingProfile.value = false
  if (r.success) profileOk.value = '저장되었습니다.'
  else profileError.value = r.message ?? '저장에 실패했습니다.'
}

async function savePrefs() {
  if (!prefs.value) return
  savingPrefs.value = true
  prefsOk.value = ''
  prefsError.value = ''
  const r = await userApi.updateSettings({ ...prefs.value })
  savingPrefs.value = false
  if (r.success && r.data) {
    prefs.value = r.data
    prefsOk.value = '저장되었습니다.'
  } else prefsError.value = r.message ?? '저장에 실패했습니다.'
}

onMounted(async () => {
  await Promise.all([loadProfile(), loadPrefs()])
})
</script>

<template>
  <DashboardLayout>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-foreground">설정</h1>
      <p class="text-muted-foreground">계정과 앱 설정을 관리하세요</p>
    </div>

    <div class="grid gap-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <UserCircle class="h-5 w-5" />
            프로필
          </CardTitle>
          <CardDescription>이름과 프로필 이미지 URL(S3 업로드 후)을 수정할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="loadingProfile" class="h-24 bg-muted rounded animate-pulse" />
          <template v-else-if="profile">
            <div class="grid gap-2">
              <Label>이메일</Label>
              <Input :model-value="profile.email" disabled class="bg-muted" />
              <p class="text-xs text-muted-foreground">로그인 이메일은 변경할 수 없습니다 · {{ profile.provider }}</p>
            </div>
            <div class="grid gap-2">
              <Label for="set-name">이름</Label>
              <Input id="set-name" v-model="nameEdit" minlength="2" maxlength="20" />
            </div>
            <div class="grid gap-2">
              <Label for="set-avatar">프로필 이미지 URL (선택)</Label>
              <Input id="set-avatar" v-model="profileUrlEdit" placeholder="https://..." type="url" />
            </div>
            <p v-if="profileError" class="text-sm text-destructive">{{ profileError }}</p>
            <p v-if="profileOk" class="text-sm text-green-600">{{ profileOk }}</p>
            <Button :loading="savingProfile" @click="saveProfile">프로필 저장</Button>
          </template>
          <p v-else-if="profileError" class="text-sm text-destructive">{{ profileError }}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <Settings class="h-5 w-5" />
            알림 및 앱 설정
          </CardTitle>
          <CardDescription>알림 수신과 기본 캘린더 뷰 등을 저장합니다.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="loadingPrefs" class="h-32 bg-muted rounded animate-pulse" />
          <template v-else-if="prefs">
            <label class="flex items-center gap-2 text-sm">
              <input v-model="prefs.emailNotification" type="checkbox" class="rounded border-input" />
              이메일 알림 수신
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="prefs.inAppNotification" type="checkbox" class="rounded border-input" />
              인앱 알림 수신
            </label>
            <div class="grid gap-2">
              <Label>기본 캘린더 뷰</Label>
              <select
                v-model="prefs.defaultCalendarView"
                class="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="month">월</option>
                <option value="week">주</option>
                <option value="day">일</option>
              </select>
            </div>
            <div class="grid gap-2">
              <Label for="tz">타임존</Label>
              <Input id="tz" v-model="prefs.timezone" placeholder="Asia/Seoul" />
            </div>
            <div class="grid gap-2">
              <Label>언어</Label>
              <select v-model="prefs.language" class="flex h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="ko">한국어 (ko)</option>
                <option value="en">English (en)</option>
              </select>
            </div>
            <p v-if="prefsError" class="text-sm text-destructive">{{ prefsError }}</p>
            <p v-if="prefsOk" class="text-sm text-green-600">{{ prefsOk }}</p>
            <Button :loading="savingPrefs" @click="savePrefs">설정 저장</Button>
          </template>
          <p v-else-if="prefsError" class="text-sm text-destructive">{{ prefsError }}</p>
        </CardContent>
      </Card>
    </div>
  </DashboardLayout>
</template>
