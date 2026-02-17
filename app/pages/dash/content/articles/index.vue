<script setup lang="ts">
import { deleteArticlesById, getArticles } from "~~/packages/api/src/sdk.gen";
import type { ArticleResponse } from "~~/packages/api/src/types.gen";

// Fetch article list using the auto-generated client from OpenAPI if available
const articles: Ref<ArticleResponse[]> = ref([]);
const refresh = async () => {
  const response = await getArticles();
  if (!response.error && response.data) {
    articles.value = response.data;
  }
};

const columns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "title", header: "标题" },
  { accessorKey: "authorUsername", header: "作者" },
  { accessorKey: "status", header: "状态" },
  { accessorKey: "actions", header: "操作" },
];

const deleteArticle = async (id: string | number) => {
  try {
    await deleteArticlesById({
      path: { id },
    });
    refresh();
  } catch (err) {
    console.error("Failed to delete article:", err);
  }
};

onMounted(async () => {
  await refresh();
});
</script>

<template>
  <UContainer class="py-6">
    <div class="flex justify-between mb-4">
      <h1 class="text-2xl font-bold">文章管理</h1>
      <UButton
        to="/dash/content/articles/create"
        icon="i-heroicons-plus"
        color="primary"
        >发布新文章</UButton
      >
    </div>

    <UTable :data="articles || []" :columns="columns">
      <template #actions-cell="{ row }">
        <div class="flex gap-2">
          <UButton
            :to="`/dash/content/articles/${row.original.id}`"
            variant="ghost"
            icon="i-heroicons-pencil-square"
          />
          <UButton
            color="error"
            variant="ghost"
            icon="i-heroicons-trash"
            @click="deleteArticle(row.id)"
          />
        </div>
      </template>
    </UTable>
  </UContainer>
</template>
