<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  error?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  error: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputClasses = computed(() =>
  cn(
    'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm',
    'ring-offset-background',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    props.error ? 'border-destructive focus-visible:ring-destructive' : 'border-input',
    props.class
  )
)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="inputClasses"
    @input="handleInput"
  />
</template>
