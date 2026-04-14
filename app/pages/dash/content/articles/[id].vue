<script setup lang="ts">
import MarkdownEditor from "~/components/MarkdownEditor.vue";
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
const isFileSelectVisible = ref(false);

const fillCoverUrl = (url: string) => {
  formState.coverUrl = url;
};

const formState = reactive({
  title: "",
  content: "",
  coverUrl: "",
  isPublished: false,
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
      formState.coverUrl = newData.coverUrl || "";
      formState.isPublished = newData.isPublished ?? false;
    }
  },
  { immediate: true },
);

const previewCover = computed(() => articleData.value?.coverUrl);

const isSaving = ref(false);
const handleSave = async () => {
  if (!formState.title.trim()) {
    toast.add({ title: "标题不能为空", color: "warning" });
    return;
  }

  isSaving.value = true;
  try {
    const payload = {
      body: {
        title: formState.title,
        content: formState.content,
        coverUrl: formState.coverUrl || null,
        isPublished: formState.isPublished,
      },
    };

    const response = isEdit.value
      ? await putArticlesById({ path: { id: articleId }, ...payload })
      : await postArticles(payload);

    if (!response.error) {
      toast.add({ title: "保存成功", color: "success" });
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
      class="flex flex-col gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-default shadow-sm"
    >
      <div class="flex justify-between items-center gap-4">
        <UInput
          v-model="formState.title"
          variant="none"
          placeholder="在此输入文章标题..."
          class="text-2xl font-bold flex-1"
          :disabled="isLoading"
        />
        <div class="flex gap-3 shrink-0">
          <UButton color="neutral" variant="ghost" @click="router.back()"
            >返回</UButton
          >
          <UButton :loading="isSaving" @click="handleSave">保存文章</UButton>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          icon="i-lucide-image"
          variant="ghost"
          @click="isFileSelectVisible = true"
        />
        <UInput
          v-model="formState.coverUrl"
          variant="outline"
          placeholder="输入封面图片链接（可选）"
          class="flex-1"
          :disabled="isLoading"
        />
      </div>

      <div class="flex items-center justify-between py-2">
        <div class="flex items-center gap-2">
          <UIcon
            :name="formState.isPublished ? 'i-lucide-eye' : 'i-lucide-eye-off'"
            class="size-4 text-muted"
          />
          <span class="text-sm text-muted">
            {{ formState.isPublished ? "已发布" : "草稿" }}
          </span>
        </div>
        <USwitch v-model="formState.isPublished" :disabled="isLoading" />
      </div>

      <div
        v-if="previewCover"
        class="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
      >
        <img
          :src="previewCover"
          alt="封面预览"
          class="w-full h-full object-cover"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <UButton
          color="neutral"
          variant="solid"
          size="sm"
          icon="i-lucide-x"
          class="absolute top-2 right-2"
          @click="formState.coverUrl = ''"
        />
      </div>
    </div>

    <MarkdownEditor
      v-model="formState.content"
      :disabled="isLoading"
      @save="handleSave"
    />
  </UContainer>

  <StorageFileSelect @select="fillCoverUrl" v-model="isFileSelectVisible" />
</template>
