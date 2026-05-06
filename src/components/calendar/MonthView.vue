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

const calendarDays = computed(() => {
  const year = props.currentDate.getFullYear()
  const month = props.currentDate.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = []
  
  // Previous month days
  const startDayOfWeek = firstDay.getDay()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({ date, isCurrentMonth: false, isToday: false })
  }
  
  // Current month days
  const today = new Date()
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    const isToday = date.toDateString() === today.toDateString()
    days.push({ date, isCurrentMonth: true, isToday })
  }
  
  // Next month days
  const remainingDays = 42 - days.length // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push({ date, isCurrentMonth: false, isToday: false })
  }
  
  return days
})

function getSchedulesForDay(date: Date): Schedule[] {
  return props.schedules.filter(schedule => {
    const start = new Date(schedule.startAt)
    return start.toDateString() === date.toDateString()
  })
}

function handleDayClick(date: Date) {
  emit('selectDate', date)
}

function handleScheduleClick(event: Event, schedule: Schedule) {
  event.stopPropagation()
  emit('selectSchedule', schedule)
}
</script>

<template>
  <div>
    <!-- Week days header -->
    <div class="grid grid-cols-7 mb-2">
      <div
        v-for="day in weekDays"
        :key="day"
        :class="[
          'py-2 text-center text-sm font-medium',
          day === '일' ? 'text-red-500' : day === '토' ? 'text-blue-500' : 'text-muted-foreground'
        ]"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar grid -->
    <div class="grid grid-cols-7 border-t border-l border-border">
      <button
        v-for="(day, index) in calendarDays"
        :key="index"
        @click="handleDayClick(day.date)"
        :class="[
          'min-h-24 sm:min-h-32 p-1 sm:p-2 border-r border-b border-border text-left transition-colors hover:bg-muted/50',
          !day.isCurrentMonth && 'bg-muted/30',
          day.isToday && 'bg-primary/5'
        ]"
      >
        <div class="flex items-center justify-between">
          <span
            :class="[
              'inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-sm',
              day.isToday && 'bg-primary text-primary-foreground font-semibold',
              !day.isCurrentMonth && 'text-muted-foreground',
              day.date.getDay() === 0 && day.isCurrentMonth && !day.isToday && 'text-red-500',
              day.date.getDay() === 6 && day.isCurrentMonth && !day.isToday && 'text-blue-500'
            ]"
          >
            {{ day.date.getDate() }}
          </span>
        </div>
        
        <!-- Schedules -->
        <div class="mt-1 space-y-0.5 overflow-hidden">
          <button
            v-for="schedule in getSchedulesForDay(day.date).slice(0, 3)"
            :key="schedule.id"
            @click="handleScheduleClick($event, schedule)"
            class="w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate hover:opacity-80 transition-opacity"
            :style="{ backgroundColor: (schedule.color || '#2563eb') + '20', color: schedule.color || '#2563eb' }"
          >
            <span class="truncate font-medium">{{ schedule.title }}</span>
          </button>
          <div
            v-if="getSchedulesForDay(day.date).length > 3"
            class="text-xs text-muted-foreground px-1.5"
          >
            +{{ getSchedulesForDay(day.date).length - 3 }}개 더
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
