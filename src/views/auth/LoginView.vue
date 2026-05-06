<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-vue-next'

import AuthLayout from '@/components/auth/AuthLayout.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import CardFooter from '@/components/ui/CardFooter.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import FormField from '@/components/ui/FormField.vue'
import FormMessage from '@/components/ui/FormMessage.vue'

import { authApi } from '@/services/api'

const router = useRouter()

const loginSchema = toTypedSchema(
  z.object({
    email: z.string().min(1, '이메일을 입력해주세요').email('올바른 이메일 형식이 아닙니다'),
    password: z.string().min(1, '비밀번호를 입력해주세요').min(6, '비밀번호는 최소 6자 이상입니다')
  })
)

const { errors, defineField, handleSubmit, meta } = useForm({
  validationSchema: loginSchema
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const showPassword = ref(false)
const isLoading = ref(false)
const serverError = ref('')

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const onSubmit = handleSubmit(async (values) => {
  isLoading.value = true
  serverError.value = ''
  
  try {
    const response = await authApi.login(values.email, values.password)
    if (response.success) {
      // TODO: 로그인 성공 후 대시보드로 이동
      router.push('/')
    } else {
      serverError.value = response.message || '로그인에 실패했습니다'
    }
  } catch {
    serverError.value = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <AuthLayout>
    <Card class="border-0 shadow-none lg:border lg:shadow-sm">
      <CardHeader class="space-y-1 px-0 lg:px-6">
        <CardTitle class="text-2xl">로그인</CardTitle>
        <CardDescription>
          계정에 로그인하여 팀 일정을 관리하세요
        </CardDescription>
      </CardHeader>
      
      <CardContent class="px-0 lg:px-6">
        <form @submit="onSubmit" class="space-y-4">
          <!-- 서버 에러 메시지 -->
          <div
            v-if="serverError"
            class="p-3 text-sm text-destructive bg-destructive/10 rounded-md"
          >
            {{ serverError }}
          </div>
          
          <!-- 이메일 필드 -->
          <FormField>
            <Label for="email" :error="!!errors.email">이메일</Label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                v-model="email"
                v-bind="emailAttrs"
                type="email"
                placeholder="name@example.com"
                :error="!!errors.email"
                class="pl-10"
              />
            </div>
            <FormMessage v-if="errors.email">{{ errors.email }}</FormMessage>
          </FormField>
          
          <!-- 비밀번호 필드 -->
          <FormField>
            <div class="flex items-center justify-between">
              <Label for="password" :error="!!errors.password">비밀번호</Label>
              <RouterLink
                to="/forgot-password"
                class="text-sm text-primary hover:underline"
              >
                비밀번호 찾기
              </RouterLink>
            </div>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                v-model="password"
                v-bind="passwordAttrs"
                :type="showPassword ? 'text' : 'password'"
                placeholder="비밀번호를 입력하세요"
                :error="!!errors.password"
                class="pl-10 pr-10"
              />
              <button
                type="button"
                @click="togglePassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <EyeOff v-if="showPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <FormMessage v-if="errors.password">{{ errors.password }}</FormMessage>
          </FormField>
          
          <!-- 로그인 버튼 -->
          <Button
            type="submit"
            class="w-full"
            :loading="isLoading"
            :disabled="!meta.valid"
          >
            로그인
          </Button>
        </form>
      </CardContent>
      
      <CardFooter class="flex-col gap-4 px-0 lg:px-6">
        <div class="relative w-full">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground">또는</span>
          </div>
        </div>
        
        <p class="text-center text-sm text-muted-foreground">
          계정이 없으신가요?
          <RouterLink to="/register" class="text-primary hover:underline font-medium">
            회원가입
          </RouterLink>
        </p>
      </CardFooter>
    </Card>
  </AuthLayout>
</template>
