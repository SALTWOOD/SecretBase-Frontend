<script setup lang="ts">
import { MdPreview, MdCatalog } from "md-editor-v3";
import { getPagesSlugBySlug } from "~~/packages/api/src/sdk.gen";
import "md-editor-v3/lib/preview.css";

definePageMeta({
  layout: "background",
});

const route = useRoute();
const slug = route.params.slug as string;

const scrollElement = ref<HTMLElement | null>(null);
onMounted(() => {
  scrollElement.value = document.documentElement;
});

const colorMode = useColorMode();
const theme = computed(() => (colorMode.value === "dark" ? "dark" : "light"));

const { data: page, pending: isLoading } = await useAsyncData(
  `page-${slug}`,
  async () => (await getPagesSlugBySlug({ path: { slug } })).data,
);

useSeoMeta({
  title: page.value?.title,
});

const formatDate = (date: any) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
</script>

<template>
  <UContainer class="py-10 relative">
    <div v-if="isLoading" class="space-y-6">
      <USkeleton class="h-12 w-3/4 rounded-lg" />
      <UCard class="page-card">
        <div class="space-y-4">
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-5/6" />
          <USkeleton class="h-64 w-full" />
        </div>
      </UCard>
    </div>

    <UAlert
      v-else-if="!page"
      icon="i-lucide-circle-alert"
      color="error"
      variant="subtle"
      title="页面未找到"
      description="您访问的页面不存在或已被移除。"
    />

    <div v-else-if="page" class="flex flex-col gap-8">
      <UCard class="page-card overflow-visible!">
        <article class="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12">
          <div class="min-w-0">
            <header class="mb-10">
              <UBreadcrumb
                :items="[
                  { label: '首页', to: '/' },
                  { label: page.title || 'Untitled' },
                ]"
                class="mb-6"
              />

              <h1
                class="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-gray-900 dark:text-white"
              >
                {{ page.title }}
              </h1>

              <div
                class="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400"
              >
                <div
                  v-if="page.author?.username"
                  class="flex items-center gap-2"
                >
                  <UAvatar
                    :src="page.author.avatar || undefined"
                    :alt="page.author.username"
                    size="xs"
                  />
                  <span class="font-medium">{{ page.author.username }}</span>
                </div>
                <div v-if="page.updatedAt" class="flex items-center gap-1">
                  <UIcon name="i-lucide-calendar" />
                  <time>{{ formatDate(page.updatedAt) }}</time>
                </div>
              </div>
            </header>

            <div class="prose prose-primary dark:prose-invert max-w-none">
              <ClientOnly>
                <MdPreview
                  id="page-content"
                  :modelValue="page.content"
                  :theme="theme"
                  class="custom-md-preview"
                />
              </ClientOnly>
            </div>
          </div>

          <aside class="hidden lg:block">
            <div
              class="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pl-8 border-l border-gray-100 dark:border-gray-800"
            >
              <div
                class="flex items-center gap-2 mb-4 text-gray-900 dark:text-white"
              >
                <UIcon name="i-lucide-list-tree" class="w-4 h-4" />
                <span class="text-sm font-bold uppercase tracking-widest"
                  >目录</span
                >
              </div>

              <ClientOnly>
                <MdCatalog
                  editorId="page-content"
                  :scrollElement="scrollElement!"
                  class="text-sm custom-catalog"
                  :offsetTop="100"
                  :scrollElementOffsetTop="80"
                />
              </ClientOnly>
            </div>
          </aside>
        </article>
      </UCard>
    </div>
  </UContainer>
</template>

<style scoped>
@reference 'tailwindcss';

.page-card {
  @apply p-4 md:p-8 rounded-xl shadow-xl transition-colors duration-300;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.dark .page-card {
  background-color: rgba(23, 23, 23, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

:deep(.custom-md-preview) {
  background-color: transparent;
  --md-bk-color: transparent;
}

:deep(.md-editor-catalog-link span:hover) {
  color: var(--ui-primary);
}

:deep(.md-editor-catalog-active > span) {
  color: var(--ui-primary);
  font-weight: 600;
}
</style>
