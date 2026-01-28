<template>
  <div class="view-content max-w-4xl">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white tracking-tight">站点设置</h1>
      <p class="text-slate-400 text-sm mt-1">全局参数配置与系统安全管理</p>
    </div>

    <div class="space-y-6">
      <UCard class="glass-card">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-globe-alt" class="text-blue-500 w-5 h-5" />
            <span class="font-bold text-white">常规信息</span>
          </div>
        </template>

        <div class="space-y-4">
          <UFormField label="站点名称" description="显示在浏览器标签页和登录页的标题">
            <UInput v-model="settings.siteName" class="w-full" variant="subtle" />
          </UFormField>

          <UFormField label="站点描述" description="用于 SEO 的 meta 描述文字">
            <UTextarea v-model="settings.description" :rows="3" variant="subtle" />
          </UFormField>
        </div>
      </UCard>

      <UCard class="glass-card">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-shield-check" class="text-blue-500 w-5 h-5" />
            <span class="font-bold text-white">人机验证配置</span>
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-white">强制开启验证</p>
              <p class="text-xs text-slate-500">在登录和注册页面强制启用 Cap 验证码</p>
            </div>
            <USwitch v-model="settings.capEnabled" />
          </div>

          <UFormField label="Cap API Endpoint">
            <UInput v-model="settings.capEndpoint" icon="i-heroicons-link" variant="subtle" />
          </UFormField>
          
          <div class="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <p class="text-xs text-blue-400">
              提示：此处的 Endpoint 将覆盖环境变量中 `NUXT_PUBLIC_CAP_API_BASE` 的默认值。
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="glass-card border-red-500/20">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-lock-closed" class="text-red-500 w-5 h-5" />
            <span class="font-bold text-white">安全与维护</span>
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-white">禁止新用户注册</p>
              <p class="text-xs text-slate-500">开启后，只有持有邀请码的用户或管理员手动添加的用户可以进入</p>
            </div>
            <USwitch v-model="settings.disableRegistration" color="error" />
          </div>
        </div>
      </UCard>

      <div class="flex justify-end gap-3 pt-4">
        <UButton color="neutral" variant="ghost" @click="reset">取消</UButton>
        <UButton color="primary" :loading="saving" icon="i-heroicons-check" @click="saveSettings">
          保存更改
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
const toast = useToast()
const saving = ref(false)

// 模拟从数据库读取的配置
const settings = reactive({
  siteName: 'SECRET BASE',
  description: '这是一个基于 Nuxt 4 和 ASP.NET 的秘密基地',
  capEnabled: true,
  capEndpoint: '/api/cap',
  disableRegistration: false
})

const saveSettings = async () => {
  saving.value = true
  try {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.add({
      title: '配置已更新',
      description: '站点设置已成功保存到服务器。',
      color: 'success'
    })
  } catch (err) {
    toast.add({ title: '保存失败', color: 'error' })
  } finally {
    saving.value = false
  }
}

const reset = () => {
  // 实际项目中这里应该重新 fetch 数据
  console.log('Resetting...')
}
</script>

<style scoped>
@reference "~/assets/css/main.css";

.glass-card {
  @apply bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-lg transition-all duration-300;
}

/* 增强表单标签样式 */
:deep(.u-form-field-label) {
  @apply text-slate-300 font-semibold;
}

:deep(.u-form-field-description) {
  @apply text-slate-500 text-xs;
}
</style>    