<script setup lang="ts">
import { MdEditor } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import {
  getArticlesById,
  postArticles,
  putArticlesById,
} from "~~/packages/api/src/sdk.gen";

const route = useRoute();
const router = useRouter();
const articleId = route.params.id as string;
const isEdit = computed(() => articleId !== "create");
const toast = useToast();
const colorMode = useColorMode();

const formState = reactive({
  title: "",
  content: "",
});

const { data: articleData, pending: isLoading } = await useAsyncData(
  `article-${articleId}`,
  async () => {
    if (!isEdit.value) return null;
    const response = await getArticlesById({ path: { id: articleId } });
    return response.data;
  },
);

watch(
  articleData,
  (newData) => {
    if (newData) {
      formState.title = newData.title || "";
      formState.content = newData.content || "";
    }
  },
  { immediate: true },
);

const isSaving = ref(false);
const handleSave = async () => {
  if (!formState.title.trim()) {
    toast.add({ title: "Title is required", color: "warning" });
    return;
  }

  isSaving.value = true;
  try {
    const payload = {
      body: { title: formState.title, content: formState.content },
    };

    const response = isEdit.value
      ? await putArticlesById({ path: { id: articleId }, ...payload })
      : await postArticles(payload);

    if (!response.error) {
      toast.add({ title: "Success", color: "success" });
      router.push("/dash/content/articles");
    }
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <UContainer class="max-w-7xl py-6 space-y-4">
    <div
      class="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-default shadow-sm"
    >
      <div class="flex-1 mr-4">
        <UInput
          v-model="formState.title"
          variant="none"
          placeholder="在此输入文章标题..."
          class="text-2xl font-bold w-full"
          :disabled="isLoading"
        />
      </div>
      <div class="flex gap-3">
        <UButton color="neutral" variant="ghost" @click="router.back()"
          >返回</UButton
        >
        <UButton
          :loading="isSaving"
          :disabled="isLoading"
          icon="i-heroicons-cloud-arrow-up"
          @click="handleSave"
        >
          发布文章
        </UButton>
      </div>
    </div>

    <UCard class="overflow-hidden">
      <ClientOnly>
        <MdEditor
          v-model="formState.content"
          :theme="colorMode.value === 'dark' ? 'dark' : 'light'"
          :disabled="isLoading"
          @onSave="handleSave"
          placeholder="请开始你的创作..."
          class="min-h-[70vh]"
        />
        <template #fallback>
          <div class="h-[70vh] flex items-center justify-center">
            <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin size-8 text-primary"
            />
          </div>
        </template>
      </ClientOnly>
    </UCard>
  </UContainer>
</template>
