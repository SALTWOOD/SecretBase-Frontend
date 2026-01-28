<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-white">个人资料</h1>
      <p class="text-slate-400 text-sm">管理你的账户信息与安全设置</p>
    </div>

    <UCard class="glass-card">
      <template #header>
        <h3 class="font-bold text-slate-200">基本信息</h3>
      </template>

      <form @submit.prevent="updateProfile" class="space-y-4">
        <div class="flex items-center gap-6 mb-6">
          <UAvatar src="https://github.com/nuxt.png" size="xl" />
          <UButton color="neutral" variant="ghost" icon="i-heroicons-camera">更换头像</UButton>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="用户名">
            <UInput v-model="user.name" placeholder="你的名字" />
          </UFormField>
          <UFormField label="电子邮箱">
            <UInput v-model="user.email" disabled />
          </UFormField>
        </div>

        <UFormField label="个人简介">
          <UTextarea v-model="user.bio" placeholder="介绍一下你自己..." autoresize />
        </UFormField>

        <div class="flex justify-end">
          <UButton type="submit" color="primary" :loading="saving">保存更改</UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const saving = ref(false)
const user = reactive({
  name: 'Admin User',
  email: 'admin@secret.base',
  bio: '这个家伙很懒，什么都没有留下。'
})

const updateProfile = async () => {
  saving.value = true
  // 简短的日志输出，符合你的偏好
  console.log('Update profile:', user)
  await new Promise(r => setTimeout(r, 1000)) // 模拟请求
  saving.value = false
  useToast().add({ title: 'Profile updated', color: 'success' })
}
</script>

<style scoped>
@reference "~/assets/css/main.css";
</style>