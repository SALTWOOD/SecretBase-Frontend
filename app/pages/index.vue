<script setup lang="ts">
import {
  getArticles,
  getSettingsFooter,
  getSettingsHomeBanner,
  getSettingsSeoGeneral,
} from "@secret-base/api/src/sdk.gen";

definePageMeta({
  layout: "background",
});

const [
  { data: seoGeneral, pending: seoPending },
  { data: bannerSettings, pending: bannerPending },
  { data: articles, pending: articlesPending },
  { data: footer },
] = await Promise.all([
  useAsyncData("site-seo", async () => (await getSettingsSeoGeneral()).data),
  useAsyncData("home-banner", async () => (await getSettingsHomeBanner()).data),
  useAsyncData("articles-list", async () => (await getArticles()).data),
  useAsyncData("footer", async () => (await getSettingsFooter()).data),
]);

const policeLink = computed(() => {
  const policeStr = footer.value?.beian?.police;
  if (!policeStr) return "https://beian.mps.gov.cn/";
  const code = policeStr.match(/\d+/)?.[0];
  return code
    ? `https://beian.mps.gov.cn/#/query/webSearch?code=${code}`
    : "https://beian.mps.gov.cn/";
});

const isLoading = computed(
  () => seoPending.value || bannerPending.value || articlesPending.value,
);

const bannerDisplayMode = computed(
  () => bannerSettings.value?.displayMode || "full",
);
const bannerContent = computed(() => bannerSettings.value?.content || "");
const showBanner = computed(() => bannerDisplayMode.value !== "hidden");
const isFullScreenMode = computed(() => bannerDisplayMode.value === "screen");
const isMiniMode = computed(() => bannerDisplayMode.value === "mini");

const masonryColumns = "columns-1 md:columns-2 lg:columns-3";

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
  title: () => seoGeneral.value?.title || "Secret Base",
  description: () =>
    seoGeneral.value?.description || "A mysterious space for tech.",
});
</script>

<template>
  <main class="min-h-screen">
    <div v-if="showBanner && isFullScreenMode" class="banner-full">
      <h1
        class="text-5xl md:text-7xl font-extrabold tracking-tight text-highlighted mb-6"
      >
        {{ seoGeneral?.title || "探索技术与创新" }}
      </h1>
      <p class="text-muted max-w-2xl text-xl mb-8">
        {{
          bannerContent ||
          seoGeneral?.description ||
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
            {{ seoGeneral?.title || "探索技术与创新" }}
          </h1>
          <p class="text-muted max-w-2xl text-lg">
            {{
              bannerContent ||
              seoGeneral?.description ||
              "分享最新的技术见解、开发经验和创新思维"
            }}
          </p>
        </header>

        <div
          v-if="isLoading"
          :class="[masonryColumns, 'gap-8 pb-20 space-y-8']"
        >
          <USkeleton
            v-for="i in 6"
            :key="i"
            class="h-64 w-full rounded-2xl break-inside-avoid"
          />
        </div>

        <template v-else>
          <div
            v-if="articles?.length"
            :class="[masonryColumns, 'gap-8 pb-20 space-y-8']"
          >
            <article
              v-for="article in articles"
              :key="article.id"
              class="article-card break-inside-avoid"
            >
              <NuxtLink
                v-if="getArticleCover(article)"
                :to="`/articles/${article.id}`"
                class="block mb-4 -mx-6 -mt-6 overflow-hidden rounded-t-2xl"
              >
                <img
                  :src="getArticleCover(article)!"
                  :alt="article.title"
                  class="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                />
              </NuxtLink>

              <div class="flex items-center gap-2 mb-4">
                <UBadge
                  :color="article.isPublished ? 'primary' : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ article.isPublished ? "已发布" : "草稿" }}
                </UBadge>
                <time v-if="article.createdAt" class="text-xs text-muted"
                  >{{ formatDate(article.createdAt) }}
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

  <footer class="footer-card">
    <UCard
      class="w-full max-w-4xl shadow-xl shadow-gray-950/20"
      :ui="{
        root: 'bg-neutral-800/80 backdrop-blur-md border-0 rounded-2xl ring-1 ring-white/10',
        body: 'flex flex-col items-center gap-3 p-8 text-center',
      }"
    >
      <div v-if="footer?.beian" class="flex flex-col items-center gap-2">
        <a
          v-if="footer?.beian?.icp"
          v-text="footer.beian.icp"
          href="https://beian.miit.gov.cn/"
          target="_blank"
        />

        <div v-if="footer?.beian?.police">
          <a v-text="footer.beian.police" :href="policeLink" target="_blank" />
        </div>
      </div>

      <a href="https://github.com/SALTWOOD/SecretBase-Frontend">
        <UIcon name="i-simple-icons-github" />
        SALTWOOD/SecretBase-Frontend
      </a>
    </UCard>
  </footer>
</template>

<style scoped>
@reference 'tailwindcss';

.banner-full {
  @apply h-[100vh] flex flex-col items-center justify-center text-center px-4;
  @apply border-b dark:border-white/5;
}

.dark .banner-full {
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0.3)
  );
}

.article-card {
  @apply relative flex flex-col p-6 rounded-2xl transition-all duration-300;
  @apply bg-white/40 dark:bg-neutral-900/40 backdrop-blur-sm;
  @apply border border-white/50 dark:border-white/10;
}

.article-card:hover {
  @apply bg-white/60;
  @apply -translate-y-1.5 shadow-2xl;
}

.dark .article-card:hover {
  @apply bg-neutral-900/60;
}

.footer-card {
  @apply w-full flex justify-center py-10 px-4;

  & a,
  & span {
    @apply text-neutral-400 underline-offset-4 transition-all duration-300 ease-in-out;
  }

  & a:hover {
    color: var(--ui-primary);
    @apply underline;
  }
}
</style>
