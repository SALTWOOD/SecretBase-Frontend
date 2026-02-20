<script setup lang="ts">
import type { ArticleResponse } from "~~/packages/api/src/types.gen";
import { getArticlesById } from "~~/packages/api/src/sdk.gen";

const route = useRoute();
const articleId = route.params.id as string;

const {
  data: article,
  pending: isLoading,
  refresh,
} = await useAsyncData(
  `article-${articleId}`,
  async () => (await getArticlesById({ path: { id: articleId } })).data,
);

useSeoMeta({
  title: article.value?.title
});

const formatDate = (date: any, full = false) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(full ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

const handleCommentCountChange = (count: number) => {
  if (article.value) article.value.commentCount = count;
};
</script>

<template>
  <UContainer class="py-10 max-w-4xl">
    <div v-if="isLoading" class="space-y-4">
      <USkeleton class="h-10 w-3/4" />
      <USkeleton class="h-4 w-1/4" />
      <USkeleton class="h-64 w-full" />
    </div>

    <UAlert
      v-else-if="!article"
      icon="i-lucide-circle-alert"
      color="error"
      variant="subtle"
      title="文章未找到"
      description="您寻找的文章可能已被移动或删除。"
    />

    <article v-else-if="article">
      <header class="mb-8">
        <UBreadcrumb
          :items="[
            { label: '首页', to: '/' },
            { label: '文章', to: '/articles' },
            { label: article.title || '' },
          ]"
          class="mb-4"
        />

        <h1
          class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4"
        >
          {{ article.title }}
        </h1>

        <div
          class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400"
        >
          <UAvatar
            :src="undefined"
            :alt="article.authorUsername ?? undefined"
            size="sm"
          />
          <span>{{ article.authorUsername }}</span>
          <time :datetime="article.createdAt?.toString()">{{
            formatDate(article.createdAt)
          }}</time>
          <UBadge
            variant="soft"
            color="primary"
            v-if="article.isPublished === false"
          >
            草稿
          </UBadge>
        </div>
      </header>

      <!-- Markdown 内容渲染 -->
      <div class="prose prose-primary dark:prose-invert max-w-none">
        <MDC :value="article.content || ''" />
      </div>

      <UDivider class="my-10" />

      <footer class="space-y-8">
        <div class="flex justify-between items-center">
          <div class="flex gap-2">
            <UButton icon="i-lucide-thumbs-up" variant="ghost" color="neutral">
              {{ article.commentCount ?? 0 }}
            </UButton>
            <UButton
              icon="i-lucide-message-square"
              variant="ghost"
              color="neutral"
            >
              {{ article.commentCount ?? 0 }}
            </UButton>
          </div>
          <UButton icon="i-lucide-share-2" variant="ghost" color="neutral" />
        </div>

        <!-- 评论组件 -->
        <CommentSection
          :article-id="articleId"
          @comment-count-change="handleCommentCountChange"
        />
      </footer>
    </article>
  </UContainer>
</template>

<style scoped>
.prose {
  line-height: 1.75;
}
</style>
