<script setup lang="ts">
/**
 * Blog Index Page with Remote SEO Meta
 * Logic: Fetch SEO meta and articles using openapi-ts SDK with SSR
 */

import { getSiteSeo, getArticles } from "@secret-base/api/src/sdk.gen";

// Fetch SEO meta data
const { data: seoData, pending: seoPending } = await useAsyncData(
  "site-seo",
  () => getSiteSeo().then((res) => res.data),
);

// Fetch articles list
const { data: articlesData, pending: articlesPending } = await useAsyncData(
  "articles",
  () => getArticles().then((res) => res.data),
);

// Computed properties for cleaner template access
const seoMeta = computed(() => seoData.value);
const articles = computed(() => articlesData.value || []);

// Synchronize SEO Meta with Remote Data
// This will be rendered on the server side (SSR)
useSeoMeta({
  title: () => seoMeta.value?.title || "Secret Base",
  ogTitle: () => seoMeta.value?.ogTitle || seoMeta.value?.title,
  description: () =>
    seoMeta.value?.description || "Secret Base - 探索技术与创新的博客",
  ogDescription: () =>
    seoMeta.value?.ogDescription || seoMeta.value?.description,
  keywords: () => seoMeta.value?.keywords,
  ogImage: () => seoMeta.value?.ogImage || "/default-og.png",
  twitterCard: () => seoMeta.value?.twitterCard || "summary_large_image",
  robots: () => seoMeta.value?.robots || "index, follow",
});

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const truncateContent = (content: string, maxLength = 150) => {
  if (!content) return "";
  return content.length > maxLength
    ? content.slice(0, maxLength) + "..."
    : content;
};
</script>

<template>
  <div
    class="min-h-screen bg-default bg-grid-slate selection:bg-(--ui-primary)/30"
  >
    <nav
      class="sticky top-0 z-50 border-b border-default bg-default/50 backdrop-blur-md"
    >
      <UContainer class="flex items-center justify-between h-16">
        <NuxtLink to="/" class="flex items-center gap-2">
          <UIcon name="i-lucide-zap" class="text-primary size-6" />
          <span class="text-lg font-bold tracking-tight text-highlighted"
            >Secret Base</span
          >
        </NuxtLink>
        <div class="flex items-center gap-4">
          <UColorModeButton />
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-simple-icons-github"
            to="https://github.com/SALTWOOD/SecretBase-Frontend"
            target="_blank"
          />
          <UButton
            color="primary"
            to="/dash"
            trailing-icon="i-lucide-arrow-right"
            >控制台</UButton
          >
        </div>
      </UContainer>
    </nav>

    <main class="relative overflow-hidden pt-12 pb-32">
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 rounded-full bg-primary/10 blur-[120px] -z-10"
      />

      <UContainer>
        <header class="mb-16 text-center lg:text-left">
          <h1
            class="text-4xl font-extrabold tracking-tight text-highlighted mb-4"
          >
            探索技术与创新
          </h1>
          <p class="text-muted max-w-2xl">
            分享最新的技术见解、开发经验和创新思维
          </p>
        </header>

        <div
          v-if="!articlesPending && articles.length"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <article
            v-for="article in articles"
            :key="article.id"
            class="group relative flex flex-col p-6 rounded-2xl border border-default bg-default hover:border-primary/50 transition-all duration-300"
          >
            <div class="flex items-center gap-2 mb-4">
              <UBadge
                v-if="article.isPublished"
                size="sm"
                variant="subtle"
                color="primary"
                >已发布</UBadge
              >
              <UBadge v-else size="sm" variant="subtle" color="neutral"
                >草稿</UBadge
              >
              <time v-if="article.createdAt" class="text-xs text-muted">{{
                formatDate(article.createdAt)
              }}</time>
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
              {{ truncateContent(article.content!) }}
            </p>
            <div class="flex items-center justify-between">
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
          v-if="articlesPending"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <USkeleton v-for="i in 6" :key="i" class="h-64 w-full rounded-xl" />
        </div>

        <div
          v-if="!articlesPending && !articles.length"
          class="text-center py-12"
        >
          <p class="text-muted">暂无文章</p>
        </div>
      </UContainer>
    </main>
  </div>
</template>

<style>
@reference 'tailwindcss';
</style>
