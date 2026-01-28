<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">
          午安，Admin
        </h1>
        <p class="text-slate-400 mt-1">欢迎回到秘密基地，今天想处理些什么？</p>
      </div>
      <UButton color="primary" variant="subtle" icon="i-heroicons-sparkles">
        系统状态正常
      </UButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard v-for="stat in stats" :key="stat.label" class="glass-card">
        <div class="flex items-center gap-4">
          <div :class="['p-3 rounded-lg bg-opacity-10', stat.colorClass]">
            <UIcon :name="stat.icon" class="w-6 h-6" :class="stat.textColor" />
          </div>
          <div>
            <p class="text-sm text-slate-500 font-medium">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-white">{{ stat.value }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <UCard class="glass-card">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-clock" class="text-blue-500" />
          <span class="font-bold">最近动态</span>
        </div>
      </template>
      <div class="text-slate-400 text-sm py-8 text-center">
        正在同步云端数据...
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const stats = [
  { label: '活跃用户', value: '1,284', icon: 'i-heroicons-users', colorClass: 'bg-blue-500', textColor: 'text-blue-500' },
  { label: '今日邀请', value: '12', icon: 'i-heroicons-ticket', colorClass: 'bg-pink-500', textColor: 'text-pink-500' },
  { label: '系统负载', value: '14%', icon: 'i-heroicons-cpu-chip', colorClass: 'bg-emerald-500', textColor: 'text-emerald-500' },
]
</script>