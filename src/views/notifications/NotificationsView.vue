<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'
import { Bell, CheckCheck, MailOpen } from 'lucide-vue-next'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import { notificationApi } from '@/services/api'
import type { NotificationItem } from '@/types'

type RefreshBadge = () => Promise<void>

const refreshBadge = inject<RefreshBadge>('refreshNotificationBadge', async () => {})

const items = ref<NotificationItem[]>([])
const unreadCount = ref(0)
const isLoading = ref(true)
const isMarkingAll = ref(false)
const unreadOnly = ref(false)

const page = ref(0)
const totalPages = ref(1)

async function fetchPage(reset = false) {
  if (reset) page.value = 0
  isLoading.value = true
  const res = await notificationApi.list({
    unreadOnly: unreadOnly.value || undefined,
    page: page.value,
    size: 20
  })
  if (res.success && res.data) {
    items.value = res.data.notifications
    unreadCount.value = res.data.unreadCount
    totalPages.value = res.data.page.totalPages
    page.value = res.data.page.number
  }
  isLoading.value = false
}

async function markOne(n: NotificationItem) {
  if (n.isRead) return
  await notificationApi.markAsRead(n.notificationId)
  await fetchPage()
  await refreshBadge()
}

async function markAll() {
  isMarkingAll.value = true
  await notificationApi.markAllAsRead()
  await fetchPage()
  await refreshBadge()
  isMarkingAll.value = false
}

function nextPage() {
  if (page.value + 1 < totalPages.value) {
    page.value += 1
    fetchPage()
  }
}

function prevPage() {
  if (page.value > 0) {
    page.value -= 1
    fetchPage()
  }
}

onMounted(() => fetchPage())

async function toggleUnreadOnly() {
  unreadOnly.value = !unreadOnly.value
  await fetchPage(true)
}
</script>

<template>
  <DashboardLayout>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">알림</h1>
        <p class="text-muted-foreground">
          미읽음 {{ unreadCount }}건 · 목록 새로 확인하세요
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" @click="toggleUnreadOnly">
          {{ unreadOnly ? '전체 보기' : '미읽음만' }}
        </Button>
        <Button variant="outline" size="sm" :loading="isMarkingAll" @click="markAll">
          <CheckCheck class="h-4 w-4 mr-2" />
          전체 읽음
        </Button>
      </div>
    </div>

    <div v-if="isLoading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-20 rounded-lg bg-muted animate-pulse" />
    </div>

    <div v-else-if="items.length === 0" class="rounded-xl border border-border bg-muted/30 p-12 text-center">
      <Bell class="h-10 w-10 mx-auto text-muted-foreground mb-3" />
      <p class="text-foreground font-medium">알림이 없습니다</p>
      <p class="text-sm text-muted-foreground mt-1">{{ unreadOnly ? '미읽음 알림이 없습니다.' : '새 소식이 오면 여기에 표시됩니다.' }}</p>
    </div>

    <ul v-else class="space-y-2">
      <li v-for="n in items" :key="n.notificationId">
        <Card :class="!n.isRead ? 'border-primary/30 bg-primary/5' : ''">
          <CardContent class="p-4 flex gap-4 items-start">
            <MailOpen class="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div class="flex-1 min-w-0 space-y-1">
              <p class="text-sm text-foreground">{{ n.message }}</p>
              <div class="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                <span class="rounded bg-muted px-1.5 py-0.5 font-mono">{{ n.type }}</span>
                <span>{{ new Date(n.createdAt).toLocaleString('ko-KR') }}</span>
                <span v-if="n.relatedScheduleId != null">일정 #{{ n.relatedScheduleId }}</span>
              </div>
            </div>
            <Button v-if="!n.isRead" variant="outline" size="sm" class="shrink-0" @click="markOne(n)">
              읽음
            </Button>
          </CardContent>
        </Card>
      </li>
    </ul>

    <div v-if="totalPages > 1" class="mt-6 flex justify-center gap-2">
      <Button variant="outline" size="sm" :disabled="page <= 0" @click="prevPage">
        이전
      </Button>
      <span class="text-sm text-muted-foreground self-center px-2">
        {{ page + 1 }} / {{ totalPages }}
      </span>
      <Button variant="outline" size="sm" :disabled="page + 1 >= totalPages" @click="nextPage">
        다음
      </Button>
    </div>
  </DashboardLayout>
</template>
