<script setup lang="ts">
import MarkdownEditor from "~/components/MarkdownEditor.vue";
import {
  getPagesById,
  postPages,
  putPagesById,
} from "~~/packages/api/src/sdk.gen";

const route = useRoute();
const router = useRouter();
const pageId = route.params.id as string;
const isEdit = computed(() => pageId !== "create");
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
  slug: "",
});

const { data: pageData, pending: isLoading } = await useAsyncData(
  `page-${pageId}`,
  async () => {
    if (!isEdit.value) return null;
    const response = await getPagesById({ path: { id: pageId } });
    return response.data;
  },
);

watch(
  pageData,
  (newData) => {
    if (newData) {
      formState.title = newData.title || "";
      formState.content = newData.content || "";
      formState.coverUrl = newData.coverUrl || "";
      formState.isPublished = newData.isPublished ?? false;
      formState.slug = newData.slug || "";
    }
  },
  { immediate: true },
);

const isSaving = ref(false);
const handleSave = async () => {
  if (!formState.title.trim()) {
    toast.add({ title: "标题不能为空", color: "warning" });
    return;
  }
  if (!formState.slug.trim()) {
    toast.add({ title: "Slug 不能为空", color: "warning" });
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
        slug: formState.slug,
      },
    };

    const response = isEdit.value
      ? await putPagesById({ path: { id: pageId }, ...payload })
      : await postPages(payload);

    if (!response.error) {
      toast.add({ title: "保存成功", color: "success" });
      router.push("/dash/content/pages");
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
          placeholder="在此输入页面标题..."
          class="text-2xl font-bold flex-1"
          :disabled="isLoading"
        />
        <div class="flex gap-3 shrink-0">
          <UButton color="neutral" variant="ghost" @click="router.back()"
            >返回</UButton
          >
          <UButton :loading="isSaving" @click="handleSave">保存页面</UButton>
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

      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-link" class="size-4 text-muted shrink-0" />
        <UInput
          v-model="formState.slug"
          variant="outline"
          placeholder="页面 Slug（必填，如 about、contact）"
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
    </div>

    <MarkdownEditor
      v-model="formState.content"
      :disabled="isLoading"
      @save="handleSave"
    />
  </UContainer>

  <StorageFileSelect @select="fillCoverUrl" v-model="isFileSelectVisible" />
</template>
