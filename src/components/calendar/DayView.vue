<script setup lang="ts">
import { computed } from 'vue'
import type { Schedule } from '@/types'

interface Props {
  currentDate: Date
  schedules: Schedule[]
  isLoading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectTime: [date: Date]
  selectSchedule: [schedule: Schedule]
}>()

const hours = Array.from({ length: 24 }, (_, i) => i)

const daySchedules = computed(() => {
  return props.schedules.filter(schedule => {
    const start = new Date(schedule.startAt)
    return start.toDateString() === props.currentDate.toDateString()
  })
})

const isToday = computed(() => {
  return props.currentDate.toDateString() === new Date().toDateString()
})

const dayName = computed(() => {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  return days[props.currentDate.getDay()]
})

function getSchedulePosition(schedule: Schedule) {
  const start = new Date(schedule.startAt)
  const end = new Date(schedule.endAt)
  
  const startHour = start.getHours() + start.getMinutes() / 60
  const endHour = end.getHours() + end.getMinutes() / 60
  const duration = endHour - startHour
  
  return {
    top: `${startHour * 64}px`,
    height: `${Math.max(duration * 64, 32)}px`
  }
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

function handleCellClick(hour: number) {
  const selectedDate = new Date(props.currentDate)
  selectedDate.setHours(hour, 0, 0, 0)
  emit('selectTime', selectedDate)
}

function handleScheduleClick(event: Event, schedule: Schedule) {
  event.stopPropagation()
  emit('selectSchedule', schedule)
}
</script>

<template>
  <div>
    <!-- Day header -->
    <div
      :class="[
        'py-4 px-4 mb-4 rounded-lg text-center',
        isToday ? 'bg-primary/10' : 'bg-muted/50'
      ]"
    >
      <div class="text-sm text-muted-foreground">{{ dayName }}</div>
      <div
        :class="[
          'text-3xl font-bold',
          isToday ? 'text-primary' : 'text-foreground'
        ]"
      >
        {{ currentDate.getDate() }}
      </div>
      <div class="text-sm text-muted-foreground mt-1">
        {{ daySchedules.length }}개의 일정
      </div>
    </div>

    <!-- Time grid -->
    <div class="relative">
      <div class="grid grid-cols-[60px_1fr]">
        <!-- Time labels -->
        <div>
          <div
            v-for="hour in hours"
            :key="hour"
            class="h-16 flex items-start justify-end pr-3"
          >
            <span class="text-xs text-muted-foreground -mt-2">{{ formatHour(hour) }}</span>
          </div>
        </div>

        <!-- Schedule area -->
        <div class="relative border-l border-border">
          <!-- Hour cells -->
          <div
            v-for="hour in hours"
            :key="hour"
            @click="handleCellClick(hour)"
            class="h-16 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
          />

          <!-- Schedules -->
          <button
            v-for="schedule in daySchedules"
            :key="schedule.id"
            @click="handleScheduleClick($event, schedule)"
            class="absolute left-1 right-1 px-3 py-2 rounded-lg overflow-hidden hover:opacity-90 transition-opacity text-left"
            :style="{
              ...getSchedulePosition(schedule),
              backgroundColor: (schedule.color || '#2563eb') + '15',
              borderLeft: `4px solid ${schedule.color || '#2563eb'}`,
            }"
          >
            <div class="font-medium text-foreground truncate">{{ schedule.title }}</div>
            <div class="text-sm text-muted-foreground">
              {{ new Date(schedule.startAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }}
              -
              {{ new Date(schedule.endAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }}
            </div>
            <div v-if="schedule.content" class="text-sm text-muted-foreground mt-1 truncate">
              {{ schedule.content }}
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
