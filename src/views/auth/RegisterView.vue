<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, CheckCircle } from 'lucide-vue-next'

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

const registerSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, '이름을 입력해주세요').min(2, '이름은 최소 2자 이상입니다'),
    email: z.string().min(1, '이메일을 입력해주세요').email('올바른 이메일 형식이 아닙니다'),
    password: z
      .string()
      .min(1, '비밀번호를 입력해주세요')
      .min(8, '비밀번호는 최소 8자 이상입니다')
      .regex(/[A-Za-z]/, '영문자를 포함해야 합니다')
      .regex(/[0-9]/, '숫자를 포함해야 합니다')
      .regex(/[^A-Za-z0-9]/, '특수문자를 포함해야 합니다'),
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요')
  }).refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm']
  })
)

const { errors, defineField, handleSubmit, meta } = useForm({
  validationSchema: registerSchema
})

const [name, nameAttrs] = defineField('name')
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const [passwordConfirm, passwordConfirmAttrs] = defineField('passwordConfirm')

const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const isLoading = ref(false)
const serverError = ref('')
const isSuccess = ref(false)

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const togglePasswordConfirm = () => {
  showPasswordConfirm.value = !showPasswordConfirm.value
}

const onSubmit = handleSubmit(async (values) => {
  isLoading.value = true
  serverError.value = ''
  
  try {
    const response = await authApi.register({
      name: values.name,
      email: values.email,
      password: values.password,
      passwordConfirm: values.passwordConfirm
    })
    
    if (response.success) {
      isSuccess.value = true
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      serverError.value = response.message || '회원가입에 실패했습니다'
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
        <CardTitle class="text-2xl">회원가입</CardTitle>
        <CardDescription>
          새 계정을 만들어 팀과 함께 일정을 관리하세요
        </CardDescription>
      </CardHeader>
      
      <CardContent class="px-0 lg:px-6">
        <!-- 성공 메시지 -->
        <div
          v-if="isSuccess"
          class="flex flex-col items-center justify-center py-8 space-y-4"
        >
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle class="h-8 w-8 text-green-600" />
          </div>
          <div class="text-center space-y-2">
            <h3 class="text-lg font-semibold">회원가입 완료!</h3>
            <p class="text-sm text-muted-foreground">
              잠시 후 로그인 페이지로 이동합니다...
            </p>
          </div>
        </div>
        
        <form v-else @submit="onSubmit" class="space-y-4">
          <!-- 서버 에러 메시지 -->
          <div
            v-if="serverError"
            class="p-3 text-sm text-destructive bg-destructive/10 rounded-md"
          >
            {{ serverError }}
          </div>
          
          <!-- 이름 필드 -->
          <FormField>
            <Label for="name" :error="!!errors.name">이름</Label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                v-model="name"
                v-bind="nameAttrs"
                type="text"
                placeholder="홍길동"
                :error="!!errors.name"
                class="pl-10"
              />
            </div>
            <FormMessage v-if="errors.name">{{ errors.name }}</FormMessage>
          </FormField>
          
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
            <Label for="password" :error="!!errors.password">비밀번호</Label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                v-model="password"
                v-bind="passwordAttrs"
                :type="showPassword ? 'text' : 'password'"
                placeholder="8자 이상, 영문/숫자 포함"
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
          
          <!-- 비밀번호 확인 필드 -->
          <FormField>
            <Label for="passwordConfirm" :error="!!errors.passwordConfirm">비밀번호 확인</Label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="passwordConfirm"
                v-model="passwordConfirm"
                v-bind="passwordConfirmAttrs"
                :type="showPasswordConfirm ? 'text' : 'password'"
                placeholder="비밀번호를 다시 입력하세요"
                :error="!!errors.passwordConfirm"
                class="pl-10 pr-10"
              />
              <button
                type="button"
                @click="togglePasswordConfirm"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <EyeOff v-if="showPasswordConfirm" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <FormMessage v-if="errors.passwordConfirm">{{ errors.passwordConfirm }}</FormMessage>
          </FormField>
          
          <!-- 회원가입 버튼 -->
          <Button
            type="submit"
            class="w-full"
            :loading="isLoading"
            :disabled="!meta.valid"
          >
            회원가입
          </Button>
        </form>
      </CardContent>
      
      <CardFooter v-if="!isSuccess" class="px-0 lg:px-6">
        <p class="text-center text-sm text-muted-foreground w-full">
          이미 계정이 있으신가요?
          <RouterLink to="/login" class="text-primary hover:underline font-medium">
            로그인
          </RouterLink>
        </p>
      </CardFooter>
    </Card>
  </AuthLayout>
</template>
