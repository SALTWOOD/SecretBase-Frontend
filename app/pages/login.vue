<template>
    <div class="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <UCard class="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border-slate-800 shadow-2xl">
            <template #header>
                <div class="text-center">
                    <h2 class="text-2xl font-bold text-white">欢迎回来</h2>
                    <p class="text-slate-400 text-sm mt-1">进入你的秘密基地</p>
                </div>
            </template>

            <form @submit.prevent="handleLogin" class="space-y-6">
                <UFormField label="电子邮箱">
                    <UInput v-model="form.email" type="email" placeholder="name@example.com" icon="i-heroicons-envelope"
                        class="w-full" />
                </UFormField>

                <UFormField label="密码">
                    <UInput v-model="form.password" type="password" placeholder="••••••••"
                        icon="i-heroicons-lock-closed" class="w-full" />
                </UFormField>

                <client-only>
                    <UFormField label="人机验证">
                        <div
                            class="cap-wrapper w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40">
                            <cap-widget :data-cap-api-endpoint="api" @solve="handleCapSolve" @reset="handleCapReset" />
                        </div>
                    </UFormField>
                </client-only>

                <UButton type="submit" block color="primary" size="lg" :loading="loading"
                    :disabled="!capToken || loading">
                    立即登录
                </UButton>
            </form>

            <template #footer>
                <p class="text-center text-sm text-slate-500">
                    还没有账号？
                    <NuxtLink to="/register" class="text-primary-500 hover:underline">立即注册</NuxtLink>
                </p>
            </template>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import '@cap.js/widget'
import { useRequester } from '~/composables/useRequester'
import { PostLogin, type PostLoginResponse } from '@secret-base/api/src/api/auth/login.post'

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const capToken = ref('')
const api = '/api/cap/'
const toast = useToast()

const handleCapSolve = (e: CustomEvent) => {
    capToken.value = e.detail.token
    console.log(e);
    console.log('CAP Solved, token:', capToken.value)
}

const handleCapReset = (...rest: any[]) => {
    capToken.value = ''
    console.log('CAP Expired')
}

const handleLogin = async () => {
    loading.value = true
    try {
        const response = await useRequester().execute<PostLoginResponse>(new PostLogin({
            email: form.email,
            password: form.password,
            captcha_token: capToken.value
        }));
        console.log('Login response:', response);
        toast.add({
            title: 'Login success',
            color: 'success'
        })
    } catch (err) {
        toast.add({
            title: 'Login failed',
            description: (err as { message?: string })?.message || 'An error occurred during login.',
            color: 'error'
        })
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.cap-wrapper {
    --cap-widget-width: 100%;
}
</style>