<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  icon?: Component
  title: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div v-if="icon" class="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
      <component :is="icon" class="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 class="text-lg font-medium text-foreground">{{ title }}</h3>
    <p v-if="description" class="mt-1 text-sm text-muted-foreground max-w-sm">
      {{ description }}
    </p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
