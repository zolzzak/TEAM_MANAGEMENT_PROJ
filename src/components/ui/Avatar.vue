<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  fallback: '?'
})

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base'
}

const avatarClasses = computed(() =>
  cn(
    'relative flex shrink-0 overflow-hidden rounded-full',
    sizeClasses[props.size]
  )
)
</script>

<template>
  <span :class="avatarClasses">
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      class="aspect-square h-full w-full object-cover"
    />
    <span
      v-else
      class="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-medium"
    >
      {{ fallback }}
    </span>
  </span>
</template>
