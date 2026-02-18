<script setup lang="ts">
import type { ArticleResponse } from "~~/packages/api/src/types.gen";
import { getArticlesById } from "~~/packages/api/src/sdk.gen";

const route = useRoute();
const router = useRouter();
const articleId = route.params.id as string;

const { data: article, pending: isLoading, refresh } = await useAsyncData(`article-${articleId}`, async () => {
  const response = await getArticlesById({ path: { id: articleId } });
  if (response.error) throw response.error;

  useSeoMeta({
    title: response.data.title,
    description: response.data.content?.substring(0, 160)
  });

  return response.data;
});

const formatDate = (date: any, full = false) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric",
    ...(full ? { hour: "2-digit", minute: "2-digit" } : {})
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
      v-else-if="error"
      icon="i-lucide-circle-alert"
      color="error"
      variant="subtle"
      title="Article Not Found"
      description="The article you are looking for might have been moved or deleted."
    />

    <article v-else-if="article">
      <header class="mb-8">
        <UBreadcrumb
          :items="[{ label: 'Home', to: '/' }, { label: 'Articles', to: '/articles' }, { label: article.title }]"
          class="mb-4"
        />

        <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          {{ article.title }}
        </h1>

        <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <UAvatar :src="article.author?.avatar" :alt="article.author?.name" size="sm" />
          <span>{{ article.author?.name }}</span>
          <time :datetime="article.createdAt">{{ formatDate(article.createdAt) }}</time>
          <UBadge variant="soft" color="primary" v-if="article.category">
            {{ article.category }}
          </UBadge>
        </div>
      </header>

      <div class="prose prose-primary dark:prose-invert max-w-none">
        <div v-html="article.content" />
      </div>

      <UDivider class="my-10" />

      <footer class="space-y-8">
        <div class="flex justify-between items-center">
          <div class="flex gap-2">
            <UButton icon="i-lucide-thumbs-up" variant="ghost" color="neutral">
              {{ article.likesCount ?? 0 }}
            </UButton>
            <UButton icon="i-lucide-message-square" variant="ghost" color="neutral">
              {{ article.commentCount ?? 0 }}
            </UButton>
          </div>
          <UButton icon="i-lucide-share-2" variant="ghost" color="neutral" />
        </div>

        <section class="mt-12">
          <h3 class="text-lg font-semibold mb-4">Comments</h3>
          </section>
      </footer>
    </article>
  </UContainer>
</template>

<style scoped>
/* 如果没配置 Typography 模块，可以简单加一点样式 */
.prose {
  line-height: 1.75;
}
</style>
