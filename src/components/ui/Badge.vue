<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const variantClasses = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/80',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
  outline: 'text-foreground border border-input'
}

const badgeClasses = computed(() =>
  cn(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
    variantClasses[props.variant]
  )
)
</script>

<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>
