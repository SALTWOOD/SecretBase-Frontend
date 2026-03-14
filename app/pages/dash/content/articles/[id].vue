<script setup lang="ts">
import {
  getArticlesById,
  postArticles,
  putArticlesById,
} from "~~/packages/api/src/sdk.gen";

// 路由与状态管理
const route = useRoute();
const router = useRouter();
const articleId = route.params.id as string;
const isEdit = computed(() => articleId !== "create");
const toast = useToast();

// 1. 获取初始数据
const articleData = ref();

const refresh = async () => {
  if (articleId === "create") return;
  const response = await getArticlesById({ path: { id: articleId } });
  if (!response.error && response.data) {
    articleData.value = response.data;
  }
};

// 2. 表单响应式数据
const formState = reactive({
  title: articleData.value?.title || "",
  content: articleData.value?.content || "",
});

// 3. 提交逻辑
const isSaving = ref(false);
const handleSave = async () => {
  isSaving.value = true;

  try {
    let response;
    if (isEdit) {
      response = await putArticlesById({
        path: { id: articleId },
        body: {
          title: formState.title,
          content: formState.content,
        },
      });
    } else {
      response = await postArticles({
        body: {
          title: formState.title,
          content: formState.content,
        },
      });
    }
    const success = !response.error && response.data;
    if (success) {
      toast.add({
        title: "Article saved",
        color: "success",
      });
      router.push("/dash/content/articles");
    }
  } finally {
    isSaving.value = false;
  }
};

watch(articleData, (newData) => {
  if (newData) {
    formState.title = newData.title || "";
    formState.content = newData.content || "";
  }
}, { immediate: true });

onMounted(refresh);
</script>

<template>
  <UContainer class="max-w-360 py-8">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ isEdit ? "编辑文章" : "新建文章" }}
        </h1>
        <p class="text-sm text-gray-500">使用 Markdown 编写您的内容</p>
      </div>
      <div class="flex gap-3">
        <UButton color="primary" variant="ghost" @click="router.back()"
          >返回</UButton
        >
        <UButton
          :loading="isSaving"
          icon="i-heroicons-cloud-arrow-up"
          @click="handleSave"
        >
          发布文章
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
      <UCard>
        <div
          class="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50"
        >
          <UInput
            v-model="formState.title"
            variant="none"
            placeholder="输入文章标题..."
            class="text-lg font-bold w-full"
          />
        </div>
        <div class="flex-1 overflow-auto p-4">
          <UTextarea
            v-model="formState.content"
            variant="none"
            placeholder="开始编写 Markdown..."
            :rows="30"
            autoresize
            class="w-full font-mono text-[14px] leading-relaxed"
          />
        </div>
      </UCard>

      <UCard class="overflow-hidden flex flex-col">
        <template #header>
          <div class="flex items-center gap-2 text-primary font-medium">
            <UIcon name="i-heroicons-eye-20-solid" />
            <span>实时预览</span>
          </div>
        </template>

        <div class="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-950">
          <h1
            v-if="formState.title"
            class="text-3xl font-extrabold mb-8 border-b pb-4 dark:border-gray-800"
          >
            {{ formState.title }}
          </h1>

          <article class="prose prose-primary dark:prose-invert max-w-none">
            <MDC
              v-if="formState.content"
              :value="formState.content"
              tag="div"
            />
            <div
              v-else
              class="flex flex-col items-center justify-center py-20 text-gray-400"
            >
              <UIcon
                name="i-heroicons-document-text"
                class="w-12 h-12 mb-2 opacity-20"
              />
              <p>等待内容输入...</p>
            </div>
          </article>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>

<style scoped>
/* 深度绑定优化 Textarea 样式 */
:deep(textarea) {
  @apply focus:ring-0 resize-none;
}
</style>
