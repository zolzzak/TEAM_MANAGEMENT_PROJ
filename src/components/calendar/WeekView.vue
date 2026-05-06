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
  selectDate: [date: Date]
  selectSchedule: [schedule: Schedule]
}>()

const weekDays = ['일', '월', '화', '수', '목', '금', '토']
const hours = Array.from({ length: 24 }, (_, i) => i)

const weekDates = computed(() => {
  const dates: Date[] = []
  const startOfWeek = new Date(props.currentDate)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(date.getDate() + i)
    dates.push(date)
  }
  
  return dates
})

const today = new Date()

function isToday(date: Date): boolean {
  return date.toDateString() === today.toDateString()
}

function getSchedulesForDay(date: Date): Schedule[] {
  return props.schedules.filter(schedule => {
    const start = new Date(schedule.startAt)
    return start.toDateString() === date.toDateString()
  })
}

function getSchedulePosition(schedule: Schedule) {
  const start = new Date(schedule.startAt)
  const end = new Date(schedule.endAt)
  
  const startHour = start.getHours() + start.getMinutes() / 60
  const endHour = end.getHours() + end.getMinutes() / 60
  const duration = endHour - startHour
  
  return {
    top: `${startHour * 48}px`,
    height: `${Math.max(duration * 48, 24)}px`
  }
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

function handleCellClick(date: Date, hour: number) {
  const selectedDate = new Date(date)
  selectedDate.setHours(hour, 0, 0, 0)
  emit('selectDate', selectedDate)
}

function handleScheduleClick(event: Event, schedule: Schedule) {
  event.stopPropagation()
  emit('selectSchedule', schedule)
}
</script>

<template>
  <div class="overflow-x-auto">
    <div class="min-w-[800px]">
      <!-- Header -->
      <div class="grid grid-cols-8 border-b border-border">
        <div class="py-2 px-2 text-center text-sm text-muted-foreground">
          <!-- Empty corner -->
        </div>
        <div
          v-for="(date, index) in weekDates"
          :key="index"
          :class="[
            'py-2 px-2 text-center border-l border-border',
            isToday(date) && 'bg-primary/5'
          ]"
        >
          <div :class="[
            'text-sm font-medium',
            index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-muted-foreground'
          ]">
            {{ weekDays[index] }}
          </div>
          <div
            :class="[
              'inline-flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold',
              isToday(date) ? 'bg-primary text-primary-foreground' : 'text-foreground'
            ]"
          >
            {{ date.getDate() }}
          </div>
        </div>
      </div>

      <!-- Time grid -->
      <div class="relative">
        <div class="grid grid-cols-8">
          <!-- Time labels -->
          <div class="border-r border-border">
            <div
              v-for="hour in hours"
              :key="hour"
              class="h-12 border-b border-border flex items-start justify-end pr-2"
            >
              <span class="text-xs text-muted-foreground -mt-2">{{ formatHour(hour) }}</span>
            </div>
          </div>

          <!-- Day columns -->
          <div
            v-for="(date, dayIndex) in weekDates"
            :key="dayIndex"
            class="relative border-l border-border"
          >
            <!-- Hour cells -->
            <div
              v-for="hour in hours"
              :key="hour"
              @click="handleCellClick(date, hour)"
              class="h-12 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
            />

            <!-- Schedules -->
            <button
              v-for="schedule in getSchedulesForDay(date)"
              :key="schedule.id"
              @click="handleScheduleClick($event, schedule)"
              class="absolute left-0.5 right-0.5 px-1.5 py-0.5 rounded text-xs overflow-hidden hover:opacity-90 transition-opacity"
              :style="{
                ...getSchedulePosition(schedule),
                backgroundColor: (schedule.color || '#2563eb') + '20',
                borderLeft: `3px solid ${schedule.color || '#2563eb'}`,
                color: schedule.color || '#2563eb'
              }"
            >
              <div class="font-medium truncate">{{ schedule.title }}</div>
              <div class="text-[10px] opacity-80">
                {{ new Date(schedule.startAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
