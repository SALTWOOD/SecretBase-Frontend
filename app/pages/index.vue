<script setup lang="ts">
/**
 * @file Index page for Secret Base
 * @description List articles with a beautiful background image
 */
import { getArticles, getSettingsSeo, getSettingsHome } from "@secret-base/api/src/sdk.gen";

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

const isLoading = computed(() => seoPending.value || homePending.value || articlesPending.value);

// 计算背景样式
const backgroundStyle = computed(() => {
  const settings = homeSettings.value;
  const styles: Record<string, string> = {};

  if (settings?.backgroundUrl) {
    styles.backgroundImage = `url(${settings.backgroundUrl})`;
  }

  return styles;
});

// 计算遮罩层样式（透明度和虚化度）
const overlayStyle = computed(() => {
  const settings = homeSettings.value;
  const opacity = settings?.backgroundOpacity !== undefined
    ? Number(settings.backgroundOpacity)
    : 0.7;
  const blur = settings?.backgroundBlur !== undefined
    ? Number(settings.backgroundBlur)
    : 2;

  return {
    backgroundColor: `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: `blur(${blur}px)`,
  };
});

const darkOverlayStyle = computed(() => {
  const settings = homeSettings.value;
  const opacity = settings?.backgroundOpacity !== undefined
    ? Number(settings.backgroundOpacity)
    : 0.8;
  const blur = settings?.backgroundBlur !== undefined
    ? Number(settings.backgroundBlur)
    : 2;

  return {
    backgroundColor: `rgba(15, 23, 42, ${opacity})`,
    backdropFilter: `blur(${blur}px)`,
  };
});

// Banner 显示模式
const bannerDisplayMode = computed(() => {
  return homeSettings.value?.bannerDisplayMode || "full";
});

// Banner 内容
const bannerContent = computed(() => {
  return homeSettings.value?.bannerContent || "";
});

// 是否显示 Banner
const showBanner = computed(() => {
  return bannerDisplayMode.value !== "hidden";
});

// 是否为全屏模式
const isFullScreenMode = computed(() => {
  return bannerDisplayMode.value === "screen";
});

// 是否为迷你模式
const isMiniMode = computed(() => {
  return bannerDisplayMode.value === "mini";
});

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
    class="relative min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
    :style="backgroundStyle"
  >
    <div
      class="fixed inset-0 -z-10 dark:hidden"
      :style="overlayStyle"
    />
    <div
      class="fixed inset-0 -z-10 hidden dark:block"
      :style="darkOverlayStyle"
    />

    <div
      v-if="showBanner && isFullScreenMode"
      class="relative h-screen flex flex-col items-center justify-center text-center px-4"
    >
      <div class="z-10 flex flex-col items-center">
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-highlighted mb-6">
          {{ seoMeta?.title || "探索技术与创新" }}
        </h1>
        <p class="text-muted max-w-2xl text-xl mb-8">
          {{ bannerContent || seoMeta?.description || "分享最新的技术见解、开发经验和创新思维" }}
        </p>
        <UButton
          to="#articles"
          size="xl"
          color="primary"
          icon="i-lucide-chevron-down"
        >
          浏览文章
        </UButton>
      </div>
    </div>

    <div
      :class="[
        'relative',
        isFullScreenMode ? '' : 'pt-12 pb-32'
      ]"
    >
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-linear-to-b from-primary/5 to-transparent -z-10"
      />

      <UContainer :id="isFullScreenMode ? 'articles' : undefined" class="relative">
        <header
          v-if="showBanner && !isFullScreenMode"
          :class="[
            'mb-16 text-center',
            isMiniMode ? 'py-8' : 'lg:text-left'
          ]"
        >
          <h1
            :class="[
              'font-extrabold tracking-tight text-highlighted mb-4',
              isMiniMode ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl'
            ]"
          >
            {{ seoMeta?.title || "探索技术与创新" }}
          </h1>
          <p
            :class="[
              'text-muted max-w-2xl',
              isMiniMode ? 'text-base' : 'text-lg'
            ]"
          >
            {{ bannerContent || seoMeta?.description || "分享最新的技术见解、开发经验和创新思维" }}
          </p>
        </header>

        <header v-if="!showBanner" class="sr-only">
          <h1>{{ seoMeta?.title || "探索技术与创新" }}</h1>
        </header>

        <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <USkeleton v-for="i in 6" :key="i" class="h-64 w-full rounded-2xl" />
        </div>

        <template v-else>
          <div v-if="articles && articles.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
             <article
              v-for="article in articles"
              :key="article.id"
              class="group relative flex flex-col p-6 rounded-2xl border border-default bg-default/80 backdrop-blur-md hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
            >
              <div class="flex items-center gap-2 mb-4">
                <UBadge :color="article.isPublished ? 'primary' : 'neutral'" variant="subtle" size="sm">
                  {{ article.isPublished ? "已发布" : "草稿" }}
                </UBadge>
                <time v-if="article.createdAt" class="text-xs text-muted">{{ formatDate(article.createdAt) }}</time>
              </div>
              <h2 class="text-xl font-bold text-highlighted mb-3 group-hover:text-primary transition-colors">
                <NuxtLink :to="`/articles/${article.id}`">
                  {{ article.title }}
                  <span class="absolute inset-0" />
                </NuxtLink>
              </h2>
              <p class="text-sm text-muted line-clamp-3 mb-6 grow">
                {{ truncateContent(article.content || '') }}
              </p>
              </article>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-24 text-center">
            <UIcon name="i-lucide-ghost" class="size-16 text-muted mb-4 opacity-20" />
            <p class="text-muted text-lg">这里的代码库空空如也喵...</p>
          </div>
        </template>
      </UContainer>
    </div>
  </main>
</template>
