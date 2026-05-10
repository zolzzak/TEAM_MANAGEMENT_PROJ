<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-vue-next'

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

const forgotPasswordSchema = toTypedSchema(
  z.object({
    email: z.string().min(1, '이메일을 입력해주세요').email('올바른 이메일 형식이 아닙니다')
  })
)

const { errors, defineField, handleSubmit, meta } = useForm({
  validationSchema: forgotPasswordSchema
})

const [email, emailAttrs] = defineField('email')

const isLoading = ref(false)
const serverError = ref('')
const isSuccess = ref(false)
const submittedEmail = ref('')

const onSubmit = handleSubmit(async (values) => {
  isLoading.value = true
  serverError.value = ''
  
  try {
    const response = await authApi.forgotPassword(values.email)
    
    if (response.success) {
      submittedEmail.value = values.email
      isSuccess.value = true
    } else {
      serverError.value = response.message || '요청 처리에 실패했습니다'
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
        <CardTitle class="text-2xl">비밀번호 찾기</CardTitle>
        <CardDescription>
          가입한 이메일 주소를 입력하면 비밀번호 재설정 안내를 보내드립니다
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
            <h3 class="text-lg font-semibold">요청을 접수했습니다</h3>
            <p class="text-sm text-muted-foreground">
              입력하신 주소(<span class="font-medium text-foreground">{{ submittedEmail }}</span>)로 안내가
              발송될 수 있습니다. 메일함을 확인해 주세요.
            </p>
          </div>
          <RouterLink to="/login">
            <Button variant="outline" class="mt-4">
              <ArrowLeft class="h-4 w-4 mr-2" />
              로그인으로 돌아가기
            </Button>
          </RouterLink>
        </div>
        
        <form v-else @submit="onSubmit" class="space-y-4">
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
          
          <!-- 임시 비밀번호 발급 버튼 -->
          <Button
            type="submit"
            class="w-full"
            :loading="isLoading"
            :disabled="!meta.valid"
          >
            재설정 메일 요청
          </Button>
        </form>
      </CardContent>
      
      <CardFooter v-if="!isSuccess" class="px-0 lg:px-6">
        <RouterLink to="/login" class="w-full">
          <Button variant="ghost" class="w-full">
            <ArrowLeft class="h-4 w-4 mr-2" />
            로그인으로 돌아가기
          </Button>
        </RouterLink>
      </CardFooter>
    </Card>
  </AuthLayout>
</template>
