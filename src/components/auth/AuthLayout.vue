<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen flex">
    <!-- 좌측 브랜딩 영역 -->
    <div class="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground">
          <CalendarDays class="h-6 w-6 text-primary" />
        </div>
        <span class="text-xl font-bold text-primary-foreground">TeamSync</span>
      </div>
      
      <div class="space-y-6">
        <h1 class="text-4xl font-bold text-primary-foreground leading-tight text-balance">
          팀과 함께하는<br />스마트한 일정 관리
        </h1>
        <p class="text-lg text-primary-foreground/80 max-w-md text-pretty">
          팀원들과 일정을 공유하고, 실시간 알림을 받으며, 효율적으로 협업하세요.
        </p>
      </div>
      
      <p class="text-sm text-primary-foreground/60">
        2024 TeamSync. All rights reserved.
      </p>
    </div>
    
    <!-- 우측 폼 영역 -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
      <div class="w-full max-w-md">
        <!-- 모바일 로고 -->
        <div class="flex items-center gap-3 mb-8 lg:hidden">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <CalendarDays class="h-6 w-6 text-primary-foreground" />
          </div>
          <span class="text-xl font-bold text-foreground">TeamSync</span>
        </div>
        
        <slot />
      </div>
    </div>
  </div>
</template>
