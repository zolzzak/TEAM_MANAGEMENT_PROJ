<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import MonthView from '@/components/calendar/MonthView.vue'
import WeekView from '@/components/calendar/WeekView.vue'
import DayView from '@/components/calendar/DayView.vue'
import ScheduleModal from '@/components/calendar/ScheduleModal.vue'
import ScheduleDetailModal from '@/components/calendar/ScheduleDetailModal.vue'
import { scheduleApi, teamApi } from '@/services/api'
import type { Schedule, TeamListItem } from '@/types'

type ViewType = 'month' | 'week' | 'day'

// State
const currentDate = ref(new Date())
const viewType = ref<ViewType>('month')
const schedules = ref<Schedule[]>([])
const teams = ref<TeamListItem[]>([])
const selectedTeamId = ref<string | null>(null)
const isLoading = ref(true)

// Modals
const isScheduleModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const selectedSchedule = ref<Schedule | null>(null)
const selectedDate = ref<Date | null>(null)

// Computed
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const monthName = computed(() => {
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  return months[currentMonth.value]
})

const headerTitle = computed(() => {
  if (viewType.value === 'month') {
    return `${currentYear.value}년 ${monthName.value}`
  } else if (viewType.value === 'week') {
    const weekStart = getWeekStart(currentDate.value)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${weekStart.getFullYear()}년 ${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 - ${weekEnd.getDate()}일`
    }
    return `${weekStart.getFullYear()}년 ${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 - ${weekEnd.getMonth() + 1}월 ${weekEnd.getDate()}일`
  } else {
    return `${currentYear.value}년 ${currentMonth.value + 1}월 ${currentDate.value.getDate()}일`
  }
})

const filteredSchedules = computed(() => {
  if (!selectedTeamId.value) return schedules.value
  return schedules.value.filter(s => s.teamId === selectedTeamId.value)
})

function formatYmd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** RPC schedule 조회 구간 (로컬 날짜 YYYY-MM-DD) */
function getRangeForView(view: ViewType, anchor: Date): { startDate: string; endDate: string } {
  if (view === 'day') {
    const d = formatYmd(anchor)
    return { startDate: d, endDate: d }
  }
  if (view === 'week') {
    const weekStart = new Date(anchor)
    const dow = weekStart.getDay()
    weekStart.setDate(weekStart.getDate() - dow)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    return { startDate: formatYmd(weekStart), endDate: formatYmd(weekEnd) }
  }
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
  return { startDate: formatYmd(monthStart), endDate: formatYmd(monthEnd) }
}

// Methods
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

function navigatePrev() {
  const newDate = new Date(currentDate.value)
  if (viewType.value === 'month') {
    newDate.setMonth(newDate.getMonth() - 1)
  } else if (viewType.value === 'week') {
    newDate.setDate(newDate.getDate() - 7)
  } else {
    newDate.setDate(newDate.getDate() - 1)
  }
  currentDate.value = newDate
}

function navigateNext() {
  const newDate = new Date(currentDate.value)
  if (viewType.value === 'month') {
    newDate.setMonth(newDate.getMonth() + 1)
  } else if (viewType.value === 'week') {
    newDate.setDate(newDate.getDate() + 7)
  } else {
    newDate.setDate(newDate.getDate() + 1)
  }
  currentDate.value = newDate
}

function goToToday() {
  currentDate.value = new Date()
}

function openCreateModal(date?: Date) {
  selectedSchedule.value = null
  selectedDate.value = date || new Date()
  isScheduleModalOpen.value = true
}

function openDetailModal(schedule: Schedule) {
  selectedSchedule.value = schedule
  isDetailModalOpen.value = true
}

function openEditModal(schedule: Schedule) {
  selectedSchedule.value = schedule
  isDetailModalOpen.value = false
  isScheduleModalOpen.value = true
}

async function handleScheduleSaved() {
  isScheduleModalOpen.value = false
  await loadSchedules()
}

async function handleScheduleDeleted() {
  isDetailModalOpen.value = false
  await loadSchedules()
}

async function loadTeams() {
  const result = await teamApi.getMyTeams()
  if (result.success && result.data) {
    teams.value = result.data
  }
}

async function loadSchedules() {
  isLoading.value = true
  const { startDate, endDate } = getRangeForView(viewType.value, currentDate.value)
  const teamId = selectedTeamId.value ? Number(selectedTeamId.value) : null
  const result = await scheduleApi.loadCalendarSchedules({ startDate, endDate, teamId })
  if (result.success && result.data) {
    schedules.value = result.data
  }
  isLoading.value = false
}

watch([currentDate, selectedTeamId, viewType], () => {
  loadSchedules()
})

onMounted(async () => {
  await Promise.all([loadTeams(), loadSchedules()])
})
</script>

<template>
  <DashboardLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">캘린더</h1>
          <p class="text-muted-foreground mt-1">팀 일정을 확인하고 관리하세요</p>
        </div>
        <Button @click="openCreateModal()" class="gap-2">
          <Plus class="h-4 w-4" />
          새 일정
        </Button>
      </div>

      <!-- Calendar Controls -->
      <div class="bg-background rounded-xl border border-border shadow-sm">
        <div class="flex flex-col gap-4 p-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
          <!-- Navigation -->
          <div class="flex items-center gap-2">
            <Button variant="outline" size="icon" @click="navigatePrev">
              <ChevronLeft class="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" @click="navigateNext">
              <ChevronRight class="h-4 w-4" />
            </Button>
            <Button variant="ghost" @click="goToToday" class="ml-2">
              오늘
            </Button>
            <h2 class="text-lg font-semibold ml-4">{{ headerTitle }}</h2>
          </div>

          <!-- View Type & Filter -->
          <div class="flex items-center gap-2">
            <!-- Team Filter -->
            <select
              v-model="selectedTeamId"
              class="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option :value="null">모든 팀</option>
              <option v-for="team in teams" :key="team.teamId" :value="String(team.teamId)">
                {{ team.name }}
              </option>
            </select>

            <!-- View Toggle -->
            <div class="flex rounded-lg border border-border p-1 bg-muted/50">
              <button
                @click="viewType = 'month'"
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  viewType === 'month' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                ]"
              >
                월
              </button>
              <button
                @click="viewType = 'week'"
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  viewType === 'week' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                ]"
              >
                주
              </button>
              <button
                @click="viewType = 'day'"
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  viewType === 'day' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                ]"
              >
                일
              </button>
            </div>
          </div>
        </div>

        <!-- Calendar View -->
        <div class="p-4">
          <MonthView
            v-if="viewType === 'month'"
            :currentDate="currentDate"
            :schedules="filteredSchedules"
            :isLoading="isLoading"
            @select-date="openCreateModal"
            @select-schedule="openDetailModal"
          />
          <WeekView
            v-else-if="viewType === 'week'"
            :currentDate="currentDate"
            :schedules="filteredSchedules"
            :isLoading="isLoading"
            @select-date="openCreateModal"
            @select-schedule="openDetailModal"
          />
          <DayView
            v-else
            :currentDate="currentDate"
            :schedules="filteredSchedules"
            :isLoading="isLoading"
            @select-time="openCreateModal"
            @select-schedule="openDetailModal"
          />
        </div>
      </div>

      <!-- Today's Schedule Summary -->
      <div class="bg-background rounded-xl border border-border shadow-sm p-4">
        <h3 class="font-semibold text-foreground mb-3">오늘의 일정</h3>
        <div v-if="filteredSchedules.filter(s => {
          const today = new Date()
          const start = new Date(s.startAt)
          return start.toDateString() === today.toDateString()
        }).length === 0" class="text-muted-foreground text-sm py-4 text-center">
          오늘 예정된 일정이 없습니다
        </div>
        <div v-else class="space-y-2">
          <button
            v-for="schedule in filteredSchedules.filter(s => {
              const today = new Date()
              const start = new Date(s.startAt)
              return start.toDateString() === today.toDateString()
            }).slice(0, 5)"
            :key="schedule.id"
            @click="openDetailModal(schedule)"
            class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <div
              class="w-1 h-10 rounded-full"
              :style="{ backgroundColor: schedule.color || '#2563eb' }"
            />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-foreground truncate">{{ schedule.title }}</p>
              <p class="text-sm text-muted-foreground">
                {{ new Date(schedule.startAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }}
                -
                {{ new Date(schedule.endAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }}
              </p>
            </div>
            <Badge variant="secondary" size="sm">
              {{ teams.find(t => String(t.teamId) === schedule.teamId)?.name || '개인' }}
            </Badge>
          </button>
        </div>
      </div>
    </div>

    <!-- Schedule Create/Edit Modal -->
    <ScheduleModal
      :isOpen="isScheduleModalOpen"
      :schedule="selectedSchedule"
      :initialDate="selectedDate"
      :teams="teams"
      @close="isScheduleModalOpen = false"
      @saved="handleScheduleSaved"
    />

    <!-- Schedule Detail Modal -->
    <ScheduleDetailModal
      :isOpen="isDetailModalOpen"
      :schedule="selectedSchedule"
      :teams="teams"
      @close="isDetailModalOpen = false"
      @edit="openEditModal"
      @deleted="handleScheduleDeleted"
    />
  </DashboardLayout>
</template>
