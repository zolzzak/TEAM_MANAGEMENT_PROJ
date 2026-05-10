<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Calendar, Users, Bell, Settings, LogOut, Menu, X, ChevronDown, Plus } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import { authApi } from '@/services/api'

const router = useRouter()
const route = useRoute()

const isSidebarOpen = ref(true)
const isMobileSidebarOpen = ref(false)
const isUserMenuOpen = ref(false)

// Mock 사용자 데이터 (나중에 store에서 가져올 예정)
const currentUser = ref({
  name: '홍길동',
  email: 'test@example.com'
})

const navigation = [
  { name: '내 일정', href: '/dashboard', icon: Calendar },
  { name: '팀 관리', href: '/teams', icon: Users },
  { name: '알림', href: '/notifications', icon: Bell, badge: 3 },
  { name: '설정', href: '/settings', icon: Settings },
]

const isActive = (href: string) => {
  if (href === '/dashboard') {
    return route.path === '/dashboard' || route.path.startsWith('/calendar')
  }
  return route.path.startsWith(href)
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

const handleLogout = async () => {
  const token = localStorage.getItem('token')
  await authApi.logout(token)
  localStorage.removeItem('token')
  router.push('/login')
}

const navigateTo = (href: string) => {
  router.push(href)
  isMobileSidebarOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-muted/30">
    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="isMobileSidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="toggleMobileSidebar"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed left-0 top-0 z-50 h-full bg-background border-r border-border transition-all duration-300',
        isSidebarOpen ? 'w-64' : 'w-20',
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <!-- Logo -->
      <div class="flex h-16 items-center justify-between px-4 border-b border-border">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            T
          </div>
          <span
            v-if="isSidebarOpen"
            class="font-semibold text-foreground whitespace-nowrap"
          >
            팀 캘린더
          </span>
        </div>
        <button
          v-if="isSidebarOpen"
          class="lg:hidden p-1 hover:bg-muted rounded"
          @click="toggleMobileSidebar"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-2">
        <button
          v-for="item in navigation"
          :key="item.name"
          @click="navigateTo(item.href)"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive(item.href)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          ]"
        >
          <component :is="item.icon" class="h-5 w-5 flex-shrink-0" />
          <span v-if="isSidebarOpen" class="whitespace-nowrap">{{ item.name }}</span>
          <span
            v-if="item.badge && isSidebarOpen"
            class="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs px-1.5"
          >
            {{ item.badge }}
          </span>
        </button>
      </nav>

      <!-- User Section -->
      <div class="border-t border-border p-4">
        <div
          :class="[
            'flex items-center gap-3',
            isSidebarOpen ? '' : 'justify-center'
          ]"
        >
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium flex-shrink-0">
            {{ currentUser.name.charAt(0) }}
          </div>
          <div v-if="isSidebarOpen" class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground truncate">{{ currentUser.name }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ currentUser.email }}</p>
          </div>
          <button
            v-if="isSidebarOpen"
            @click="handleLogout"
            class="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
            title="로그아웃"
          >
            <LogOut class="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div
      :class="[
        'transition-all duration-300',
        isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
      ]"
    >
      <!-- Top Header -->
      <header class="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
        <button
          class="lg:hidden p-2 hover:bg-muted rounded-lg"
          @click="toggleMobileSidebar"
        >
          <Menu class="h-5 w-5" />
        </button>
        
        <button
          class="hidden lg:flex p-2 hover:bg-muted rounded-lg"
          @click="toggleSidebar"
        >
          <Menu class="h-5 w-5" />
        </button>

        <div class="flex-1" />

        <!-- Quick Actions -->
        <Button size="sm" class="gap-2">
          <Plus class="h-4 w-4" />
          <span class="hidden sm:inline">새 일정</span>
        </Button>
      </header>

      <!-- Page Content -->
      <main class="p-4 lg:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
