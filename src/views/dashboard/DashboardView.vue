<script setup lang="ts">
import { Calendar } from 'lucide-vue-next'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Button from '@/components/ui/Button.vue'
</script>

<template>
  <DashboardLayout>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-foreground">내 일정</h1>
      <p class="text-muted-foreground">오늘의 일정을 확인하세요</p>
    </div>

    <EmptyState
      :icon="Calendar"
      title="캘린더 기능 준비 중"
      description="이 화면은 다음 단계에서 구현됩니다"
    >
      <template #action>
        <Button variant="outline" disabled>
          곧 출시 예정
        </Button>
      </template>
    </EmptyState>
  </DashboardLayout>
</template>
