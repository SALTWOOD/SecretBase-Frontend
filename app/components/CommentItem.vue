<script setup lang="ts">
// 假设你的 OpenAPI 生成了 Comment 相关的类型
// import type { CommentResponse } from "~~/packages/api/src/types.gen";

interface Props {
  authorName: string;
  avatar?: string;
  content: string;
  createdAt: string | Date;
  likesCount?: number;
  isLiked?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  likesCount: 0,
  isLiked: false
});

const emit = defineEmits<{
  reply: [];
  like: [active: boolean];
}>();

// 简单的格式化，或者使用你页面里定义的 formatDate
const timeAgo = (date: string | Date) => {
  // 生产环境建议用 @vueuse/core 的 useTimeAgo
  return new Date(date).toLocaleDateString("zh-CN");
};

const handleLike = () => {
  emit('like', !props.isLiked);
};
</script>

<template>
  <div class="flex gap-4 py-4 group">
    <UAvatar
      :src="avatar"
      :alt="authorName"
      size="md"
      class="flex-shrink-0"
    />

    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center gap-2">
          <span class="font-medium text-sm text-gray-900 dark:text-white">
            {{ authorName }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ timeAgo(createdAt) }}
          </span>
        </div>

        <UDropdownMenu :items="[[{ label: 'Report', icon: 'i-lucide-flag' }]]">
          <UButton
            icon="i-lucide-ellipsis"
            variant="ghost"
            color="neutral"
            size="xs"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </UDropdownMenu>
      </div>

      <div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
        {{ content }}
      </div>

      <div class="flex items-center gap-4">
        <UButton
          :icon="isLiked ? 'i-lucide-thumbs-up-fill' : 'i-lucide-thumbs-up'"
          :color="isLiked ? 'primary' : 'neutral'"
          variant="ghost"
          size="xs"
          :label="String(likesCount)"
          @click="handleLike"
        />
        <UButton
          icon="i-lucide-message-circle"
          variant="ghost"
          color="neutral"
          size="xs"
          label="Reply"
          @click="emit('reply')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 可以在这里微调回复列表的缩进线 */
</style>
