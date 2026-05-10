<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Schedule, TeamListItem, RecurrenceType } from '@/types'
import { scheduleApi } from '@/services/api'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'

const props = defineProps<{
  isOpen: boolean
  schedule: Schedule | null
  initialDate: Date | null
  teams: TeamListItem[]
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const teamId = ref<number | ''>('')
const title = ref('')
const description = ref('')
const startLocal = ref('')
const endLocal = ref('')
const isAllDay = ref(false)
const color = ref('#5b8dee')
const recurrence = ref<RecurrenceType>('NONE')
const recurrenceEndDate = ref('')
const isSaving = ref(false)
const error = ref('')

function isoToDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function defaultDayBounds(day: Date) {
  const start = new Date(day)
  start.setHours(9, 0, 0, 0)
  const end = new Date(day)
  end.setHours(10, 0, 0, 0)
  return { start: start.toISOString(), end: end.toISOString() }
}

watch(
  () => [props.isOpen, props.schedule, props.initialDate, props.teams] as const,
  ([open, sch, initDate, teams]) => {
    if (!open) return
    error.value = ''
    if (sch) {
      teamId.value = Number(sch.teamId)
      title.value = sch.title
      description.value = sch.description ?? ''
      startLocal.value = isoToDatetimeLocal(sch.startAt)
      endLocal.value = isoToDatetimeLocal(sch.endAt)
      isAllDay.value = sch.isAllDay ?? false
      color.value = sch.color ?? '#5b8dee'
      recurrence.value = sch.recurrence ?? 'NONE'
      recurrenceEndDate.value = ''
    } else {
      teamId.value = teams[0]?.teamId ?? ''
      title.value = ''
      description.value = ''
      const base = initDate ? new Date(initDate) : new Date()
      const { start, end } = defaultDayBounds(base)
      startLocal.value = isoToDatetimeLocal(start)
      endLocal.value = isoToDatetimeLocal(end)
      isAllDay.value = false
      color.value = '#5b8dee'
      recurrence.value = 'NONE'
      recurrenceEndDate.value = ''
    }
  },
  { immediate: true }
)

async function save() {
  if (!title.value.trim() || teamId.value === '') {
    error.value = '팀과 제목을 입력해주세요'
    return
  }
  isSaving.value = true
  error.value = ''
  const startAt = new Date(startLocal.value).toISOString()
  const endAt = new Date(endLocal.value).toISOString()
  try {
    if (props.schedule) {
      const r = await scheduleApi.update(props.schedule.scheduleId, {
        title: title.value.trim(),
        description: description.value.trim() || undefined,
        startAt,
        endAt,
        color: color.value
      })
      if (!r.success) error.value = r.message ?? '수정에 실패했습니다'
      else emit('saved')
    } else {
      const r = await scheduleApi.create({
        teamId: Number(teamId.value),
        title: title.value.trim(),
        description: description.value.trim() || undefined,
        startAt,
        endAt,
        isAllDay: isAllDay.value,
        color: color.value,
        recurrence: recurrence.value,
        ...(recurrence.value !== 'NONE' && recurrenceEndDate.value
          ? { recurrenceEndDate: recurrenceEndDate.value }
          : {})
      })
      if (!r.success) error.value = r.message ?? '저장에 실패했습니다'
      else emit('saved')
    }
  } finally {
    isSaving.value = false
  }
}

function onOpenUpdate(v: boolean) {
  if (!v) emit('close')
}
</script>

<template>
  <Modal
    :open="isOpen"
    :title="schedule ? '일정 수정' : '새 일정'"
    description="팀 일정을 추가하거나 수정합니다"
    size="lg"
    @update:open="onOpenUpdate"
  >
    <div class="space-y-4">
      <div v-if="error" class="text-sm text-destructive bg-destructive/10 rounded-md p-3">
        {{ error }}
      </div>

      <div class="space-y-2">
        <Label for="sch-team">팀</Label>
        <select
          id="sch-team"
          v-model="teamId"
          :disabled="!!schedule"
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="" disabled>팀 선택</option>
          <option v-for="t in teams" :key="t.teamId" :value="t.teamId">
            {{ t.name }}
          </option>
        </select>
      </div>

      <div class="space-y-2">
        <Label for="sch-title">제목</Label>
        <Input id="sch-title" v-model="title" placeholder="일정 제목" maxlength="100" />
      </div>

      <div class="space-y-2">
        <Label for="sch-desc">설명 (선택)</Label>
        <textarea
          id="sch-desc"
          v-model="description"
          rows="3"
          class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="상세 설명"
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="sch-start">시작</Label>
          <Input id="sch-start" v-model="startLocal" type="datetime-local" />
        </div>
        <div class="space-y-2">
          <Label for="sch-end">종료</Label>
          <Input id="sch-end" v-model="endLocal" type="datetime-local" />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <input id="sch-allday" v-model="isAllDay" type="checkbox" class="rounded border-input" />
        <Label for="sch-allday" class="font-normal cursor-pointer">종일</Label>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="sch-color">색상</Label>
          <Input id="sch-color" v-model="color" type="color" class="h-10 w-full p-1" />
        </div>
        <div v-if="!schedule" class="space-y-2">
          <Label for="sch-rec">반복</Label>
          <select
            id="sch-rec"
            v-model="recurrence"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="NONE">없음</option>
            <option value="DAILY">매일</option>
            <option value="WEEKLY">매주</option>
            <option value="MONTHLY">매월</option>
          </select>
        </div>
      </div>

      <div v-if="!schedule && recurrence !== 'NONE'" class="space-y-2">
        <Label for="sch-rec-end">반복 종료일 (선택)</Label>
        <Input id="sch-rec-end" v-model="recurrenceEndDate" type="date" />
      </div>
    </div>

    <template #footer>
      <Button variant="outline" @click="emit('close')">취소</Button>
      <Button :loading="isSaving" @click="save">저장</Button>
    </template>
  </Modal>
</template>
