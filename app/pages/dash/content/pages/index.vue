<script setup lang="ts">
import { deletePagesById, getPages } from "~~/packages/api/src/sdk.gen";
import type { ArticleResponse } from "~~/packages/api/src/types.gen";

import { getArticleCover } from "~/utils/article-cover";

const pages: Ref<ArticleResponse[]> = ref([]);
const page = ref(1);
const pageSize = 20;
const totalCount = ref(0);
const searchQuery = ref("");

const refresh = async () => {
  const response = await getPages({
    query: {
      page: page.value,
      pageSize,
      ...(searchQuery.value ? { search: searchQuery.value } : {}),
    },
  });
  if (!response.error && response.data) {
    pages.value = response.data;
    totalCount.value = Number(
      response.response.headers.get("x-total-count") ?? 0,
    );
  }
};

const deletePage = async (id: string | number) => {
  try {
    await deletePagesById({ path: { id } });
    await refresh();
    if (pages.value.length === 0 && page.value > 1) {
      page.value--;
    }
  } catch (err) {
    console.error("Failed to delete page:", err);
  }
};

watch(page, refresh);
watch(searchQuery, () => {
  page.value = 1;
  refresh();
});

const formatDate = (dateStr: string | Date) => {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

onMounted(refresh);
</script>

<template>
  <UContainer class="py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">页面管理</h1>
      <div class="flex items-center gap-3">
        <UInput
          v-model="searchQuery"
          placeholder="搜索页面..."
          icon="i-lucide-search"
          class="w-64"
        />
        <UButton
          to="/dash/content/pages/create"
          icon="i-heroicons-plus"
          color="primary"
          >创建新页面</UButton
        >
      </div>
    </div>

    <div v-if="pages.length" class="grid gap-4">
      <article
        v-for="pageItem in pages"
        :key="pageItem.id"
        class="group flex gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-default hover:border-primary/50 transition-colors"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h2 class="text-lg font-semibold text-highlighted truncate">
                {{ pageItem.title }}
              </h2>
              <p class="text-sm text-muted mt-1">/{{ pageItem.slug }}</p>
            </div>
            <UBadge
              :color="pageItem.isPublished ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
              >{{ pageItem.isPublished ? "已发布" : "草稿" }}</UBadge
            >
          </div>

          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-4 text-xs text-muted">
              <span
                v-if="pageItem.author?.username"
                class="flex items-center gap-1"
              >
                <UIcon name="i-lucide-user" class="size-3" />
                {{ pageItem.author.username }}
              </span>
              <span v-if="pageItem.updatedAt" class="flex items-center gap-1">
                <UIcon name="i-lucide-calendar" class="size-3" />
                {{ formatDate(pageItem.updatedAt) }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                v-if="pageItem.slug && pageItem.isPublished"
                :to="`/pages/${pageItem.slug}`"
                variant="ghost"
                size="sm"
                icon="i-lucide-eye"
                color="neutral"
                target="_blank"
              />
              <UButton
                :to="`/dash/content/pages/${pageItem.id}`"
                variant="ghost"
                size="sm"
                icon="i-lucide-pencil"
              />
              <UButton
                color="error"
                variant="ghost"
                size="sm"
                icon="i-lucide-trash"
                @click="pageItem.id && deletePage(pageItem.id)"
              />
            </div>
          </div>
        </div>
      </article>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <UIcon
        name="i-lucide-file-x"
        class="size-16 text-muted mb-4 opacity-30"
      />
      <p class="text-muted mb-4">暂无页面</p>
      <UButton
        to="/dash/content/pages/create"
        icon="i-heroicons-plus"
        color="primary"
        >创建第一个页面</UButton
      >
    </div>

    <div v-if="totalCount > 0" class="flex justify-center mt-6">
      <UPagination
        v-model:page="page"
        :total="totalCount"
        :items-per-page="pageSize"
      />
    </div>
  </UContainer>
</template>
