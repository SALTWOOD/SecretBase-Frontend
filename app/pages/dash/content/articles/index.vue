<script setup lang="ts">
import { deleteArticlesById, getArticles } from "~~/packages/api/src/sdk.gen";
import type { ArticleResponse } from "~~/packages/api/src/types.gen";

// Fetch article list using the auto-generated client from OpenAPI if available
const articles: Ref<ArticleResponse[]> = ref([]);
const refresh = async () => {
  const response = await getArticles();
  if (!response.error && response.data) {
    articles.value = response.data;
  }
};

const failedCovers = ref(new Set<string | number | undefined>());

const handleImageError = (id: string | number | undefined) => {
  if (id) failedCovers.value.add(id);
};

const isCoverValid = (id: string | number | undefined, cover: string | null | undefined) => {
  return cover && !failedCovers.value.has(id);
};

const deleteArticle = async (id: string | number) => {
  try {
    await deleteArticlesById({
      path: { id },
    });
    refresh();
  } catch (err) {
    console.error("Failed to delete article:", err);
  }
};

const formatDate = (dateStr: string | Date) => {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

onMounted(refresh);
</script>

<template>
  <UContainer class="py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">文章管理</h1>
      <UButton
        to="/dash/content/articles/create"
        icon="i-heroicons-plus"
        color="primary"
      >发布新文章</UButton>
    </div>

    <!-- 文章卡片列表 -->
    <div v-if="articles.length" class="grid gap-4">
      <article
        v-for="{ id, title, cover, content, isPublished, authorUsername, createdAt, commentCount } in articles"
        :key="id"
        class="group flex gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-default hover:border-primary/50 transition-colors"
      >
        <div class="shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <template v-if="isCoverValid(id, cover)">
            <img
              :src="cover!"
              :alt="title"
              class="w-full h-full object-cover"
              @error="handleImageError(id)"
            />
          </template>
          <UIcon v-else name="i-lucide-file-text" class="size-8 text-gray-400" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h2 class="text-lg font-semibold text-highlighted truncate">
                {{ title }}
              </h2>
              <p class="text-sm text-muted mt-1 line-clamp-2">
                {{ content?.replace(/[#*`\->]/g, "").slice(0, 120) || "无内容" }}...
              </p>
            </div>
            <UBadge
              :color="isPublished ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ isPublished ? "已发布" : "草稿" }}
            </UBadge>
          </div>

          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-4 text-xs text-muted">
              <span v-if="authorUsername" class="flex items-center gap-1">
                <UIcon name="i-lucide-user" class="size-3" />
                {{ authorUsername }}
              </span>
              <span v-if="createdAt" class="flex items-center gap-1">
                <UIcon name="i-lucide-calendar" class="size-3" />
                {{ formatDate(createdAt) }}
              </span>
              <span v-if="commentCount" class="flex items-center gap-1">
                <UIcon name="i-lucide-message-circle" class="size-3" />
                {{ commentCount }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                :to="`/articles/${id}`"
                variant="ghost"
                size="sm"
                icon="i-lucide-eye"
                color="neutral"
              />
              <UButton
                :to="`/dash/content/articles/${id}`"
                variant="ghost"
                size="sm"
                icon="i-lucide-pencil"
              />
              <UButton
                color="error"
                variant="ghost"
                size="sm"
                icon="i-lucide-trash"
                @click="id && deleteArticle(id)"
              />
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- 空状态 -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <UIcon
        name="i-lucide-file-x"
        class="size-16 text-muted mb-4 opacity-30"
      />
      <p class="text-muted mb-4">暂无文章</p>
      <UButton
        to="/dash/content/articles/create"
        icon="i-heroicons-plus"
        color="primary"
      >发布第一篇文章</UButton>
    </div>
  </UContainer>
</template>
