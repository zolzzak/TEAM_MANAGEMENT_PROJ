<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
}>()

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl'
}

const close = () => {
  emit('update:open', false)
  emit('close')
}

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.open) {
    close()
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50"
          @click="close"
        />

        <!-- Modal Content -->
        <Transition
          enter-active-class="duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="open"
            :class="cn(
              'relative w-full bg-background rounded-lg shadow-lg',
              sizeClasses[size]
            )"
          >
            <!-- Header -->
            <div v-if="title || $slots.header" class="flex items-start justify-between p-4 border-b border-border">
              <div>
                <slot name="header">
                  <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
                  <p v-if="description" class="mt-1 text-sm text-muted-foreground">{{ description }}</p>
                </slot>
              </div>
              <button
                @click="close"
                class="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <!-- Body -->
            <div class="p-4">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="flex items-center justify-end gap-2 p-4 border-t border-border">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
