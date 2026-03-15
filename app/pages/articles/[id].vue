<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { MdPreview, MdCatalog } from "md-editor-v3";
import { getArticlesById } from "~~/packages/api/src/sdk.gen";
import 'md-editor-v3/lib/preview.css';

const route = useRoute();
const articleId = route.params.id as string;

const scrollElement = ref<HTMLElement | null>(null);
onMounted(() => {
  scrollElement.value = document.documentElement;
});

const colorMode = useColorMode();
const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));

const {
  data: article,
  pending: isLoading,
} = await useAsyncData(
  `article-${articleId}`,
  async () => (await getArticlesById({ path: { id: articleId } })).data,
);

useSeoMeta({
  title: article.value?.title,
});

const formatDate = (date: any) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const handleCommentCountChange = (count: number) => {
  if (article.value) article.value.commentCount = count;
};
</script>

<template>
  <UContainer class="py-10 relative">
    <div v-if="isLoading" class="space-y-4">
      <USkeleton class="h-10 w-3/4" />
      <USkeleton class="h-64 w-full" />
    </div>

    <UAlert
      v-else-if="!article"
      icon="i-lucide-circle-alert"
      color="error"
      variant="subtle"
      title="Article Not Found"
    />

    <article v-else-if="article" class="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-8">
      <div>
        <header class="mb-8">
          <UBreadcrumb
            :items="[
              { label: 'Home', to: '/' },
              { label: 'Articles', to: '/articles' },
              { label: article.title || '' },
            ]"
            class="mb-4"
          />

          <h1 class="text-4xl font-bold tracking-tight mb-4">
            {{ article.title }}
          </h1>

          <div class="flex items-center gap-4 text-sm text-gray-500">
            <span>{{ article.authorUsername }}</span>
            <time>{{ formatDate(article.createdAt) }}</time>
          </div>
        </header>

        <div class="prose prose-primary dark:prose-invert max-w-none">
          <ClientOnly>
            <MdPreview
              id="article-content"
              :modelValue="article.content"
              :theme="theme"
              class="custom-md-preview"
            />
          </ClientOnly>
        </div>

        <footer class="space-y-8">
          <CommentSection
            :article-id="articleId"
            @comment-count-change="handleCommentCountChange"
          />
        </footer>
      </div>

      <aside class="hidden lg:block">
        <div class="sticky top-24">
          <p class="text-sm font-semibold mb-4 text-gray-900 dark:text-white">目录</p>
          <ClientOnly>
            <MdCatalog
              editorId="article-content"
              :scrollElement="scrollElement!"
              class="text-sm"
            />
          </ClientOnly>
        </div>
      </aside>
    </article>
  </UContainer>
</template>

<style scoped>
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
