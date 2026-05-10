<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Schedule, TeamListItem, ScheduleDetailData, ScheduleUpdateScope } from '@/types'
import { scheduleApi } from '@/services/api'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'

const props = defineProps<{
  isOpen: boolean
  schedule: Schedule | null
  teams: TeamListItem[]
}>()

const emit = defineEmits<{
  close: []
  edit: [s: Schedule]
  deleted: []
}>()

const detail = ref<ScheduleDetailData | null>(null)
const isLoading = ref(false)
const isDeleting = ref(false)
const deleteScope = ref<ScheduleUpdateScope>('THIS_ONLY')
const error = ref('')

watch(
  () => [props.isOpen, props.schedule?.scheduleId] as const,
  async ([open, sid]) => {
    if (!open || sid == null) {
      detail.value = null
      return
    }
    isLoading.value = true
    error.value = ''
    const r = await scheduleApi.getDetail(sid)
    if (r.success && r.data) detail.value = r.data
    else error.value = r.message ?? '불러오지 못했습니다'
    isLoading.value = false
  }
)

function teamLabel(teamIdStr: string) {
  return props.teams.find(t => String(t.teamId) === teamIdStr)?.name ?? '팀'
}

async function onDelete() {
  if (!props.schedule) return
  isDeleting.value = true
  error.value = ''
  const scope =
    detail.value?.recurrence && detail.value.recurrence !== 'NONE' ? deleteScope.value : undefined
  const r = await scheduleApi.delete(props.schedule.scheduleId, scope)
  isDeleting.value = false
  if (r.success) emit('deleted')
  else error.value = r.message ?? '삭제에 실패했습니다'
}

function onEdit() {
  if (props.schedule) emit('edit', props.schedule)
}

function onOpenUpdate(v: boolean) {
  if (!v) emit('close')
}

function formatRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  return `${s.toLocaleString('ko-KR', opt)} – ${e.toLocaleString('ko-KR', opt)}`
}
</script>

<template>
  <Modal :open="isOpen" title="일정 상세" size="lg" @update:open="onOpenUpdate">
    <div v-if="isLoading" class="py-12 text-center text-muted-foreground text-sm">불러오는 중…</div>
    <div v-else-if="error && !detail" class="text-sm text-destructive">{{ error }}</div>
    <div v-else-if="detail && schedule" class="space-y-4">
      <div v-if="error" class="text-sm text-destructive bg-destructive/10 rounded-md p-3">{{ error }}</div>

      <div>
        <h3 class="text-lg font-semibold text-foreground">{{ detail.title }}</h3>
        <p class="text-sm text-muted-foreground mt-1">
          {{ formatRange(detail.startAt, detail.endAt) }}
        </p>
        <Badge variant="secondary" class="mt-2">{{ teamLabel(schedule.teamId) }}</Badge>
      </div>

      <p v-if="detail.description" class="text-sm text-foreground whitespace-pre-wrap">
        {{ detail.description }}
      </p>

      <div class="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>생성: {{ detail.creatorName }}</span>
        <span v-if="detail.recurrence !== 'NONE'">반복: {{ detail.recurrence }}</span>
        <span>내 상태: {{ detail.myStatus }}</span>
      </div>

      <div v-if="detail.participants.length" class="border-t border-border pt-3">
        <p class="text-sm font-medium mb-2">참여자</p>
        <ul class="space-y-1 text-sm">
          <li v-for="p in detail.participants" :key="p.userId" class="flex justify-between gap-2">
            <span>{{ p.name }}</span>
            <span class="text-muted-foreground">{{ p.status }}</span>
          </li>
        </ul>
      </div>

      <div
        v-if="detail.recurrence !== 'NONE'"
        class="space-y-2 border-t border-border pt-3"
      >
        <p class="text-sm font-medium">삭제 범위 (반복 일정)</p>
        <select
          v-model="deleteScope"
          class="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="THIS_ONLY">이 일정만</option>
          <option value="THIS_AND_AFTER">이후 전체</option>
          <option value="ALL">전체 반복</option>
        </select>
      </div>
    </div>

    <template v-if="schedule && detail" #footer>
      <Button variant="outline" @click="emit('close')">닫기</Button>
      <Button variant="destructive" :loading="isDeleting" @click="onDelete">삭제</Button>
      <Button @click="onEdit">수정</Button>
    </template>
  </Modal>
</template>
