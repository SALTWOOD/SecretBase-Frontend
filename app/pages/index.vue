<script setup lang="ts">
/**
 * @file Index page for Secret Base
 * @description List articles with a clean layout
 */
import {
  getArticles,
  getSettingsSeo,
  getSettingsHome,
} from "@secret-base/api/src/sdk.gen";

const { data: seoMeta, pending: seoPending } = await useAsyncData(
  "site-seo",
  async () => (await getSettingsSeo()).data,
);

const { data: homeSettings, pending: homePending } = await useAsyncData(
  "home-settings",
  async () => (await getSettingsHome()).data,
);

const { data: articles, pending: articlesPending } = await useAsyncData(
  "articles-list",
  async () => (await getArticles()).data,
);

const isLoading = computed(
  () => seoPending.value || homePending.value || articlesPending.value,
);

// Banner display logic
const bannerDisplayMode = computed(
  () => homeSettings.value?.bannerDisplayMode || "full",
);
const bannerContent = computed(() => homeSettings.value?.bannerContent || "");
const showBanner = computed(() => bannerDisplayMode.value !== "hidden");
const isFullScreenMode = computed(() => bannerDisplayMode.value === "screen");
const isMiniMode = computed(() => bannerDisplayMode.value === "mini");

const formatDate = (dateStr: string | Date) => {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
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
  <main class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <div
      v-if="showBanner && isFullScreenMode"
      class="h-[80vh] flex flex-col items-center justify-center text-center px-4 bg-white dark:bg-neutral-900 border-b border-default"
    >
      <h1
        class="text-5xl md:text-7xl font-extrabold tracking-tight text-highlighted mb-6"
      >
        {{ seoMeta?.title || "探索技术与创新" }}
      </h1>
      <p class="text-muted max-w-2xl text-xl mb-8">
        {{
          bannerContent ||
          seoMeta?.description ||
          "分享最新的技术见解、开发经验和创新思维"
        }}
      </p>
      <UButton to="#articles" size="xl" icon="i-lucide-chevron-down">
        浏览文章
      </UButton>
    </div>

    <div :class="['py-12 md:py-20', isFullScreenMode ? '' : 'pt-12']">
      <UContainer :id="isFullScreenMode ? 'articles' : undefined">
        <header
          v-if="showBanner && !isFullScreenMode"
          :class="['mb-12', isMiniMode ? 'text-center' : 'text-left']"
        >
          <h1
            :class="[
              'font-extrabold text-highlighted mb-4',
              isMiniMode ? 'text-3xl' : 'text-4xl md:text-5xl',
            ]"
          >
            {{ seoMeta?.title || "探索技术与创新" }}
          </h1>
          <p class="text-muted max-w-2xl text-lg">
            {{
              bannerContent ||
              seoMeta?.description ||
              "分享最新的技术见解、开发经验和创新思维"
            }}
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
            v-if="articles?.length"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20"
          >
            <article
              v-for="article in articles"
              :key="article.id"
              class="group relative flex flex-col p-6 rounded-2xl border border-default bg-white dark:bg-neutral-900 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div class="flex items-center gap-2 mb-4">
                <UBadge
                  :color="article.isPublished ? 'primary' : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ article.isPublished ? "已发布" : "草稿" }}
                </UBadge>
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
                {{ truncateContent(article.content || "") }}
              </p>
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
          </div>
        </template>
      </UContainer>
    </div>
  </main>
</template>
