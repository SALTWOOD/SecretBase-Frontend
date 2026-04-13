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
      <UButton color="success" variant="subtle" icon="i-lucide-circle-check">
        系统状态正常
      </UButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard v-for="stat in stats" :key="stat.label" class="overflow-hidden">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-xl" :class="stat.bgClass">
            <UIcon :name="stat.icon" class="w-6 h-6" :class="stat.iconClass" />
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
          <UIcon name="i-lucide-clock" class="text-primary w-5 h-5" />
          <span class="font-bold text-foreground">最近动态</span>
        </div>
      </template>
      <div
        v-if="pending"
        class="text-muted-foreground text-sm py-12 text-center flex flex-col items-center gap-2"
      >
        <UIcon name="i-lucide-refresh-cw" class="animate-spin w-5 h-5" />
        正在加载数据...
      </div>
      <div
        v-else-if="error"
        class="text-muted-foreground text-sm py-12 text-center flex flex-col items-center gap-2"
      >
        <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-red-500" />
        加载失败，请稍后重试
      </div>
      <div
        v-else-if="activities.length === 0"
        class="text-muted-foreground text-sm py-12 text-center"
      >
        暂无动态
      </div>
      <div v-else class="divide-y divide-border">
        <div
          v-for="(item, index) in activities"
          :key="index"
          class="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div
            class="mt-1 p-1.5 rounded-lg"
            :class="activityIcon(item.type).bg"
          >
            <UIcon
              :name="activityIcon(item.type).icon"
              class="w-4 h-4"
              :class="activityIcon(item.type).text"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-foreground">
              <span class="font-medium">{{ item.author || "匿名" }}</span>
              {{
                item.type === "article_published" ? "发布了文章" : "发表了评论"
              }}
            </p>
            <p class="text-sm text-muted-foreground truncate">
              {{ item.title }}
            </p>
          </div>
          <span class="text-xs text-muted-foreground whitespace-nowrap mt-1">{{
            formatTime(item.time)
          }}</span>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { getDashboardStats } from "~~/packages/api/src/sdk.gen";

const userStore = useUserStore();

const statsData = ref();
const pending = ref(true);
const error = ref(false);

const stats = computed(() => [
  {
    label: "用户数量",
    value: statsData.value?.totalUsers ?? "—",
    icon: "i-lucide-users",
    bgClass: "bg-blue-500/10",
    iconClass: "text-blue-500",
  },
  {
    label: "文章数量",
    value: statsData.value?.totalArticles ?? "—",
    icon: "i-lucide-file-text",
    bgClass: "bg-emerald-500/10",
    iconClass: "text-emerald-500",
  },
  {
    label: "评论数量",
    value: statsData.value?.totalComments ?? "—",
    icon: "i-lucide-message-circle",
    bgClass: "bg-amber-500/10",
    iconClass: "text-amber-500",
  },
]);

const activities = computed(() => statsData.value?.recentActivities ?? []);

function activityIcon(type: string) {
  if (type === "article_published") {
    return {
      icon: "i-lucide-file-text",
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
    };
  }
  return {
    icon: "i-lucide-message-circle",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
  };
}

function formatTime(time?: Date | string) {
  if (!time) return "";
  const d = new Date(time);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 小时前`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} 天前`;
  return d.toLocaleDateString("zh-CN");
}

onMounted(async () => {
  try {
    const response = await getDashboardStats();
    if (response.error || !response.data) return;
    statsData.value = response.data;
  } catch {
    error.value = true;
  } finally {
    pending.value = false;
  }
});
</script>
