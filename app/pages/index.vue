<script setup lang="ts">
/**
 * @file Index page for Secret Base
 * @description List articles with a beautiful background image
 */
import { getArticles, getSettingsSeo } from "@secret-base/api/src/sdk.gen";

const BACKGROUND_IMAGE_URL = "";


const { data: seoMeta, pending: seoPending } = await useAsyncData(
  "site-seo",
  async () => (await getSettingsSeo()).data,
);

const { data: articles, pending: articlesPending } = await useAsyncData(
  "articles-list",
  async () => (await getArticles()).data,
);

const isLoading = computed(() => seoPending.value || articlesPending.value);

const formatDate = (dateStr: string | Date) => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const truncateContent = (content: string, length: number = 100) => {
  if (!content) return "";
  const cleanText = content.replace(/[#*`\->]/g, "");
  return cleanText.length > length
    ? cleanText.slice(0, length) + "..."
    : cleanText;
};

useSeoMeta({
  title: () => seoMeta.value?.title || "Secret Base",
  description: () =>
    seoMeta.value?.description || "A mysterious space for tech.",
});
</script>

<template>
  <main
    class="relative min-h-screen overflow-hidden pt-12 pb-32 bg-cover bg-center bg-no-repeat bg-fixed"
    :style="{ backgroundImage: `url(${BACKGROUND_IMAGE_URL})` }"
  >
    <div
      class="absolute inset-0 bg-white/70 dark:bg-slate-900/80 backdrop-blur-[2px] -z-10"
    />

    <div
      class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-primary/5 to-transparent -z-10"
    />

    <UContainer>
      <header class="mb-16 text-center lg:text-left">
        <h1
          class="text-4xl md:text-5xl font-extrabold tracking-tight text-highlighted mb-4"
        >
          {{ seoMeta?.title || "探索技术与创新" }}
        </h1>
        <p class="text-muted max-w-2xl text-lg">
          {{ seoMeta?.description || "分享最新的技术见解、开发经验和创新思维" }}
        </p>
      </header>

      <div
        v-if="isLoading"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <USkeleton v-for="i in 6" :key="i" class="h-64 w-full rounded-2xl" />
      </div>

      <template v-else>
        <div
          v-if="articles && articles.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <article
            v-for="article in articles"
            :key="article.id"
            class="group relative flex flex-col p-6 rounded-2xl border border-default bg-default/80 backdrop-blur-md hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
          >
            <div class="flex items-center gap-2 mb-4">
              <UBadge
                :color="article.isPublished ? 'primary' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ article.isPublished ? "已发布" : "草稿" }}
              </UBadge>
              <time v-if="article.createdAt" class="text-xs text-muted">
                {{ formatDate(article.createdAt) }}
              </time>
            </div>

            <h2
              class="text-xl font-bold text-highlighted mb-3 group-hover:text-primary transition-colors"
            >
              <NuxtLink :to="`/articles/${article.id}`">
                {{ article.title }}
                <span class="absolute inset-0" />
              </NuxtLink>
            </h2>

            <p class="text-sm text-muted line-clamp-3 mb-6 grow">
              {{ truncateContent(article.content || '') }}
            </p>

            <div class="flex items-center justify-between mt-auto">
              <div class="flex items-center text-primary text-sm font-medium">
                阅读全文
                <UIcon
                  name="i-lucide-chevron-right"
                  class="ml-1 size-4 transition-transform group-hover:translate-x-1"
                />
              </div>
              <div
                v-if="article.commentCount !== undefined"
                class="flex items-center gap-1 text-xs text-muted"
              >
                <UIcon name="i-lucide-message-circle" class="size-3" />
                <span>{{ article.commentCount }}</span>
              </div>
            </div>
          </article>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center py-24 text-center"
        >
          <UIcon
            name="i-lucide-ghost"
            class="size-16 text-muted mb-4 opacity-20"
          />
          <p class="text-muted text-lg">这里的代码库空空如也喵...</p>
          <UButton to="/dash" variant="link" color="primary" class="mt-2"
            >去写第一篇博客</UButton
          >
        </div>
      </template>
    </UContainer>
  </main>
</template>

<style scoped>
@reference 'tailwindcss';
/* 针对文字高亮效果的自定义颜色变量，需确保你的 tailwind.config 有对应配置 */
.text-highlighted {
  @apply text-slate-900 dark:text-white;
}
.text-muted {
  @apply text-slate-600 dark:text-slate-400;
}
.border-default {
  @apply border-slate-200 dark:border-slate-800;
}
.bg-default {
  @apply bg-white dark:bg-slate-900;
}
</style>
