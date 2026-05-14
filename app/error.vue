<template>
  <UContainer class="flex min-h-screen items-center justify-center">
    <div class="text-center space-y-6">
      <div class="space-y-2">
        <p class="text-7xl font-bold text-muted tabular-nums">
          {{ props.statusCode }}
        </p>
        <h1 class="text-2xl font-semibold">
          {{ props.statusCode === 404 ? '页面未找到' : '出了点问题' }}
        </h1>
        <p class="text-muted">
          {{
            props.statusCode === 404
              ? '你访问的页面不存在，请检查地址是否正确。'
              : '服务器似乎遇到了一些问题，请稍后重试。'
          }}
        </p>
      </div>

      <UButton
        size="lg"
        color="primary"
        @click="handleGoHome"
      >
        返回首页
      </UButton>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const props = defineProps<{
  statusCode?: number
  message?: string
}>()

const handleGoHome = () => clearError({ redirect: '/' })
</script>
