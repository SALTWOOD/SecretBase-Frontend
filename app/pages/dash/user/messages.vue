<template>
  <div class="space-y-6">
    <div class="flex justify-between items-end">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">我的消息</h1>
        <p class="text-muted text-sm">你收到的系统通知与邀请状态</p>
      </div>
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-lucide-circle-check"
        @click="markAllAsRead"
      >
        全部标记为已读
      </UButton>
    </div>

    <UCard
      class="glass-card bg-(--ui-bg-elevated)/40 border border-default shadow-xl"
      :ui="{ body: 'p-0' }"
    >
      <div v-if="messages.length === 0" class="p-12 text-center text-muted">
        <UIcon
          name="i-lucide-inbox"
          class="w-12 h-12 mx-auto mb-2 opacity-20"
        />
        暂无消息
      </div>

      <ul v-else class="divide-y divide-default">
        <li
          v-for="msg in messages"
          :key="msg.id"
          class="p-4 hover:bg-primary/5 transition-colors flex gap-4"
        >
          <div class="mt-1">
            <span
              :class="[
                'block w-2 h-2 rounded-full',
                msg.read
                  ? 'bg-transparent'
                  : 'bg-primary shadow-[0_0_8px_var(--ui-primary)]',
              ]"
            ></span>
          </div>

          <div class="flex-1">
            <div class="flex justify-between mb-1">
              <h4 class="font-bold text-highlighted text-sm">
                {{ msg.title }}
              </h4>
              <span class="text-xs text-muted">{{ msg.time }}</span>
            </div>
            <p class="text-sm text-muted leading-relaxed">
              {{ msg.content }}
            </p>
          </div>
        </li>
      </ul>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const messages = ref([
  {
    id: 1,
    title: "系统升级完成",
    content: "秘密基地已升级至 v0.1 Beta，修复了部分样式闪烁问题。",
    time: "10:30",
    read: false,
  },
  {
    id: 2,
    title: "邀请码被使用",
    content: '你生成的邀请码 [BASE-666] 已被用户 "NuxtLover" 使用。',
    time: "昨天",
    read: true,
  },
  {
    id: 3,
    title: "欢迎来到秘密基地",
    content: "账户创建成功，通过 ASP.NET Core 与 Nuxt 4 强力驱动。",
    time: "2026-01-20",
    read: true,
  },
]);

const markAllAsRead = () => {
  messages.value.forEach((m) => (m.read = true));
  console.log("All read");
};
</script>

<style scoped>
@reference "~/assets/css/main.css";

.glass-card {
  @apply backdrop-blur-xl overflow-hidden;
}
</style>
