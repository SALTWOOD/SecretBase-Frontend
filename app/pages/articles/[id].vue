<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { MdPreview, MdCatalog } from "md-editor-v3";
import { getArticlesById } from "~~/packages/api/src/sdk.gen";
import "md-editor-v3/lib/preview.css";

const route = useRoute();
const articleId = route.params.id as string;

definePageMeta({
  layout: "background",
});

const scrollElement = ref<HTMLElement | null>(null);
onMounted(() => {
  scrollElement.value = document.documentElement;
});

const colorMode = useColorMode();
const theme = computed(() => (colorMode.value === "dark" ? "dark" : "light"));

const { data: article, pending: isLoading } = await useAsyncData(
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
    <div v-if="isLoading" class="space-y-6">
      <USkeleton class="h-12 w-3/4 rounded-lg" />
      <UCard class="content-card">
        <div class="space-y-4">
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-5/6" />
          <USkeleton class="h-64 w-full" />
        </div>
      </UCard>
    </div>

    <UAlert
      v-else-if="!article"
      icon="i-lucide-circle-alert"
      color="error"
      variant="subtle"
      title="Article Not Found"
      description="The article you are looking for does not exist or has been removed."
    />

    <div v-else-if="article" class="flex flex-col gap-8">
      <UCard class="content-card overflow-visible!">
        <article class="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12">
          <div class="min-w-0">
            <header class="mb-10">
              <UBreadcrumb
                :items="[
                  { label: 'Home', to: '/' },
                  { label: 'Articles', to: '/articles' },
                  { label: article.title || 'Untitled' },
                ]"
                class="mb-6"
              />

              <!-- 封面图片 -->
              <img
                v-if="getArticleCover(article)"
                :src="getArticleCover(article)!"
                :alt="article.title"
                class="w-full h-64 md:h-80 object-cover rounded-xl mb-6"
              />

              <h1
                class="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-highlighted"
              >
                {{ article.title }}
              </h1>

              <div
                class="flex items-center gap-6 text-sm text-muted"
              >
                <div class="flex items-center gap-2">
                  <UAvatar
                    :src="article.author?.avatar || undefined"
                    :alt="article.author?.username || ''"
                    size="xs"
                  />
                  <span class="font-medium">{{
                    article.author?.username
                  }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-calendar" />
                  <time>{{ formatDate(article.createdAt) }}</time>
                </div>
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
          </div>

          <aside class="hidden lg:block">
            <div
              class="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pl-8 border-l border-default"
            >
              <div
                class="flex items-center gap-2 mb-4 text-highlighted"
              >
                <UIcon name="i-lucide-list-tree" class="w-4 h-4" />
                <span class="text-sm font-bold uppercase tracking-widest"
                  >Catalog</span
                >
              </div>

              <ClientOnly>
                <MdCatalog
                  editorId="article-content"
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

      <UCard class="content-card">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-message-square"
              class="w-5 h-5 text-primary"
            />
            <h3 class="text-lg font-semibold">Discussion</h3>
          </div>
        </template>

        <CommentSection
          :article-id="articleId"
          @comment-count-change="handleCommentCountChange"
        />
      </UCard>
    </div>
  </UContainer>
</template>

