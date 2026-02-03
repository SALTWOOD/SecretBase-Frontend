<template>
  <div class="space-y-8">
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-3xl font-bold text-foreground tracking-tight">
          {{ greetings() }}，{{ userStore.user?.username }}
        </h1>
        <p class="text-muted-foreground mt-1">
          欢迎回到秘密基地，今天想处理些什么？
        </p>
      </div>
      <UButton color="success" variant="subtle" icon="i-heroicons-check-circle">
        系统状态正常
      </UButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard v-for="stat in stats" :key="stat.label" class="overflow-hidden">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-xl">
            <UIcon :name="stat.icon" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground font-medium">
              {{ stat.label }}
            </p>
            <p class="text-2xl font-bold text-foreground">{{ stat.value }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-clock" class="text-primary w-5 h-5" />
          <span class="font-bold text-foreground">最近动态</span>
        </div>
      </template>
      <div
        class="text-muted-foreground text-sm py-12 text-center flex flex-col items-center gap-2"
      >
        <UIcon name="i-heroicons-arrow-path" class="animate-spin w-5 h-5" />
        正在同步云端数据...
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const userStore = useUserStore();

const stats = [
  {
    label: "活跃用户",
    value: "1,284",
    icon: "i-heroicons-users",
    color: "blue",
  },
  {
    label: "今日邀请",
    value: "12",
    icon: "i-heroicons-ticket",
    color: "pink",
  },
  {
    label: "系统负载",
    value: "14%",
    icon: "i-heroicons-cpu-chip",
    color: "emerald",
  },
];
</script>

<style scoped>
.dark .u-card {
  --ui-card-bg: rgb(var(--ui-color-neutral-900) / 0.4);
  backdrop-filter: blur(12px);
}
</style>
