<script setup lang="ts">
import {
  getArticles,
  getSettingsGeneralInfo,
  getSettingsHomeBanner,
  getSettingsHomeSidebarLeft,
  getSettingsHomeSidebarRight,
  getSettingsSeoGeneral,
} from "@secret-base/api/src/sdk.gen";
import type {
  SidebarWidget,
  SidebarLinksWidget,
  SidebarHtmlWidget,
} from "~/types/sidebar";

definePageMeta({
  layout: "background",
});

const route = useRoute();
const router = useRouter();

const page = computed({
  get: () => Number(route.query.page) || 1,
  set: (val) => router.push({ query: { ...route.query, page: val } }),
});
const pageSize = 10;

// Fetch all initial data via Promise.all for SSR optimization
const [
  { data: seoGeneral, pending: seoPending },
  { data: bannerSettings, pending: bannerPending },
  { data: articleResult, pending: articlesPending },
] = await Promise.all([
  useAsyncData("site-seo", async () => (await getSettingsSeoGeneral()).data),
  useAsyncData("home-banner", async () => (await getSettingsHomeBanner()).data),
  useAsyncData(
    "articles-list",
    async () => {
      const headers = useRequestHeaders(["cookie"]) as Record<string, string>;
      const res = await getArticles({
        query: { page: page.value, pageSize },
        headers,
      });
      const total = Number(res.response.headers.get("x-total-count") ?? 0);
      return {
        items: res.data || [],
        total,
      };
    },
    {
      watch: [page],
    },
  ),
]);

const leftSidebarWidgets = ref<SidebarWidget[] | null>(null);
const rightSidebarWidgets = ref<SidebarWidget[] | null>(null);

// Computed shorthands
const articles = computed(() => articleResult.value?.items || []);
const totalCount = computed(() => articleResult.value?.total || 0);

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

const masonryColumns = "columns-1 lg:columns-2";

const uptimeDisplay = ref("0天0时0分0秒");

const computeUptime = (createdAt: Date) => {
  const diff = Date.now() - createdAt.getTime();
  if (diff < 0) return "0天0时0分0秒";
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}天${hours}时${minutes}分${seconds}秒`;
};

let uptimeTimer: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  const [generalRes, leftRes, rightRes] = await Promise.all([
    getSettingsGeneralInfo(),
    getSettingsHomeSidebarLeft(),
    getSettingsHomeSidebarRight(),
  ]);

  if (!generalRes.error && generalRes.data) {
    const creation = new Date(generalRes.data.siteCreatedAt);
    console.log(creation);
    uptimeDisplay.value = computeUptime(creation);
    uptimeTimer = setInterval(() => {
      if (creation) uptimeDisplay.value = computeUptime(creation);
    }, 1000);
  }

  leftSidebarWidgets.value = leftRes.data as SidebarWidget[] | null;
  rightSidebarWidgets.value = rightRes.data as SidebarWidget[] | null;
});

onUnmounted(() => {
  if (uptimeTimer) clearInterval(uptimeTimer);
});

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

// SEO Metadata
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
      <UButton
        to="#content-root"
        size="xl"
        icon="i-lucide-chevron-down"
        variant="soft"
        class="rounded-full"
      >
        浏览文章
      </UButton>
    </div>

    <div id="content-root" :class="['py-12', isFullScreenMode ? '' : 'pt-12']">
      <UContainer class="max-w-[75vw]">
        <div class="grid grid-cols-16 gap-8">
          <aside class="hidden xl:col-span-3 xl:block space-y-6">
            <SidebarProfileCard
              :site-title="seoGeneral?.title"
              avatar-url="https://github.com/SALTWOOD.png"
            />
            <template v-for="widget in leftSidebarWidgets" :key="widget.id">
              <SidebarLinksCard
                v-if="widget.type === 'links'"
                :widget="widget as SidebarLinksWidget"
              />
              <SidebarHtmlCard
                v-else-if="widget.type === 'html'"
                :widget="widget as SidebarHtmlWidget"
              />
            </template>
          </aside>

          <div class="col-span-12 xl:col-span-10 space-y-8">
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
                {{ bannerContent || seoGeneral?.description }}
              </p>
            </header>

            <div v-if="isLoading" :class="[masonryColumns, 'gap-6 space-y-6']">
              <USkeleton
                v-for="i in 4"
                :key="i"
                class="h-80 w-full rounded-2xl"
              />
            </div>

            <template v-else>
              <div
                v-if="articles.length"
                :class="[masonryColumns, 'gap-6 space-y-6']"
              >
                <article
                  v-for="article in articles"
                  :key="article.id"
                  class="article-card-v2 break-inside-avoid group"
                >
                  <NuxtLink
                    v-if="getArticleCover(article)"
                    :to="`/articles/${article.id}`"
                    class="block overflow-hidden rounded-t-xl bg-neutral-800"
                  >
                    <img
                      v-if="getArticleCover(article)"
                      :src="getArticleCover(article)!"
                      :alt="article.title"
                      loading="lazy"
                      decoding="async"
                      class="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                    />
                  </NuxtLink>

                  <div class="p-6">
                    <div class="flex items-center justify-between mb-3">
                      <UBadge
                        :color="article.isPublished ? 'primary' : 'neutral'"
                        variant="subtle"
                        size="sm"
                      >
                        {{ article.isPublished ? "Published" : "Draft" }}
                      </UBadge>
                      <time
                        class="text-[10px] uppercase tracking-wider text-muted font-mono"
                      >
                        {{ formatDate(article.createdAt!) }}
                      </time>
                    </div>
                    <h2
                      class="text-lg font-bold text-highlighted mb-2 line-clamp-2 group-hover:text-primary transition-colors"
                    >
                      <NuxtLink :to="`/articles/${article.id}`">{{
                        article.title
                      }}</NuxtLink>
                    </h2>
                    <p
                      class="text-sm text-muted line-clamp-2 mb-4 leading-relaxed"
                    >
                      {{ truncateContent(article.content || "") }}
                    </p>
                    <div class="flex items-center justify-end">
                      <UButton
                        icon="i-lucide-arrow-right"
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        :to="`/articles/${article.id}`"
                        >阅读全文</UButton
                      >
                    </div>
                  </div>
                </article>
              </div>

              <div v-if="articles.length" class="flex justify-center mt-12">
                <UPagination
                  v-model:page="page"
                  :total="totalCount"
                  :items-per-page="pageSize"
                  show-first
                  show-last
                />
              </div>

              <div
                v-else
                class="flex flex-col items-center justify-center py-24 text-center"
              >
                <UIcon
                  name="i-lucide-ghost"
                  class="size-16 text-muted mb-4 opacity-20"
                />
                <p class="text-muted text-lg font-medium">
                  这里的代码库空空如也喵...
                </p>
              </div>
            </template>
          </div>

          <aside class="hidden lg:col-span-3 lg:block">
            <div class="sticky top-24 space-y-6">
              <UCard class="side-card">
                <template #header>
                  <div
                    class="flex items-center gap-2 font-bold text-highlighted"
                  >
                    <UIcon name="i-lucide-chart-bar" class="text-primary" />
                    运行统计
                  </div>
                </template>
                <div class="space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-muted">文章总数</span>
                    <span class="font-mono">{{ totalCount }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted">运行时间</span>
                    <span class="font-mono">{{ uptimeDisplay }}</span>
                  </div>
                </div>
              </UCard>

              <template v-for="widget in rightSidebarWidgets" :key="widget.id">
                <SidebarHtmlCard
                  v-if="widget.type === 'html'"
                  :widget="widget as SidebarHtmlWidget"
                />
              </template>
            </div>
          </aside>
        </div>
      </UContainer>
    </div>
  </main>
</template>

<style scoped>
@reference 'tailwindcss';

.banner-full {
  @apply h-[100vh] flex flex-col items-center justify-center text-center px-4;
  @apply border-b dark:border-white/5;
  background: radial-gradient(
    circle at center,
    rgba(var(--ui-primary), 0.05) 0%,
    transparent 70%
  );
}

.side-card {
  @apply border-0 ring-1 ring-white/5 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md shadow-sm;
}

.article-card-v2 {
  @apply relative flex flex-col overflow-hidden rounded-xl transition-all duration-300;
  @apply bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm;
  @apply border border-white/50 dark:border-white/10 shadow-sm;
}

.article-card-v2:hover {
  @apply -translate-y-1 shadow-xl ring-1 bg-white/80 dark:bg-neutral-900/80;
}
</style>
