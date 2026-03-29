<script setup lang="ts">
import {
  getAdminStorageBucketByBucketNameFile,
  getAdminStorageBucketByBucketNamePresignDownload,
  postAdminStorageBucketByBucketNamePresignUpload,
  type S3ObjectMetadataResponse,
} from "~~/packages/api/src";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const bucket = computed(() => route.query.bucket as string);
const fileKey = computed(() => route.query.key as string);

const MAX_FILE_SIZE = 1024 * 1024;
const WARNING_FILE_SIZE = 512 * 1024;

// 状态
const isLoading = ref(true);
const isSaving = ref(false);
const error = ref<string | null>(null);
const isTooLarge = ref(false);
const showSizeWarning = ref(false);
const content = ref("");
const originalContent = ref("");
const fileMetadata = ref<S3ObjectMetadataResponse | null>(null);

// 计算属性
const hasChanges = computed(() => content.value !== originalContent.value);
const fileName = computed(() => fileKey.value.split("/").pop() || fileKey.value);
const fileSize = computed(() => {
  if (!fileMetadata.value?.contentLength) return 0;
  return Number(fileMetadata.value.contentLength);
});

// 格式化文件大小
const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// 加载文件内容
const loadFile = async () => {
  if (!bucket.value || !fileKey.value) {
    error.value = "缺少必要参数";
    isLoading.value = false;
    return;
  }

  try {
    // 获取文件元数据
    const metaResponse = await getAdminStorageBucketByBucketNameFile({
      path: { bucketName: bucket.value },
      query: { key: fileKey.value },
    });

    if (metaResponse.error || !metaResponse.data) {
      error.value = "无法获取文件信息";
      isLoading.value = false;
      return;
    }

    fileMetadata.value = metaResponse.data;

    // 检查文件大小
    const fileSizeNum = Number(metaResponse.data.contentLength || 0);
    if (fileSizeNum > MAX_FILE_SIZE) {
      isTooLarge.value = true;
      error.value = `文件过大（${formatSize(fileSizeNum)}），最大支持 ${formatSize(MAX_FILE_SIZE)}`;
      isLoading.value = false;
      return;
    }

    if (fileSizeNum > WARNING_FILE_SIZE) {
      showSizeWarning.value = true;
    }

    // 获取预签名下载 URL
    const presignResponse = await getAdminStorageBucketByBucketNamePresignDownload({
      path: { bucketName: bucket.value },
      query: { key: fileKey.value },
    });

    if (presignResponse.error || !presignResponse.data) {
      error.value = "无法获取下载授权";
      isLoading.value = false;
      return;
    }

    // 下载文件内容
    const fileResponse = await fetch(presignResponse.data.url);
    if (!fileResponse.ok) {
      error.value = "下载文件失败";
      isLoading.value = false;
      return;
    }

    content.value = await fileResponse.text();
    originalContent.value = content.value;
  } catch (e: any) {
    error.value = e.message || "加载文件时发生错误";
  } finally {
    isLoading.value = false;
  }
};

// 保存文件
const handleSave = async () => {
  if (!bucket.value || !fileKey.value || isSaving.value) return;

  isSaving.value = true;
  const toastId = "save-file";

  try {
    toast.add({
      id: toastId,
      title: "正在保存",
      description: "获取上传授权...",
      color: "info",
      duration: 0,
    });

    // 获取预签名上传 URL
    const presignResponse = await postAdminStorageBucketByBucketNamePresignUpload({
      path: { bucketName: bucket.value },
      body: { key: fileKey.value },
    });

    if (presignResponse.error || !presignResponse.data) {
      throw new Error("无法获取上传授权");
    }

    toast.update(toastId, { description: "正在上传文件..." });

    // 上传文件内容
    const uploadResponse = await fetch(presignResponse.data.url, {
      method: "PUT",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
      body: content.value,
    });

    if (!uploadResponse.ok) {
      throw new Error("上传文件失败");
    }

    originalContent.value = content.value;
    toast.remove(toastId);
    toast.add({
      title: "保存成功",
      description: `文件 ${fileName.value} 已保存`,
      color: "success",
    });
  } catch (e: any) {
    toast.remove(toastId);
    toast.add({
      title: "保存失败",
      description: e.message,
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
};

// 返回上一页
const goBack = () => {
  if (hasChanges.value) {
    if (!confirm("有未保存的修改，确定要离开吗？")) {
      return;
    }
  }
  router.back();
};

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    handleSave();
  }
};

// 页面离开确认
onBeforeRouteLeave((to, from, next) => {
  if (hasChanges.value) {
    if (confirm("有未保存的修改，确定要离开吗？")) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});

// 加载文件
onMounted(() => {
  loadFile();
});
</script>

<template>
  <UContainer class="py-6">
    <!-- 页面头部 -->
    <header class="mb-6">
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <NuxtLink
          to="/dash/content/storages"
          class="hover:text-primary underline decoration-dotted"
        >
          存储
        </NuxtLink>
        <span class="text-gray-400">/</span>
        <NuxtLink
          :to="`/dash/content/storages/${bucket}`"
          class="hover:text-primary underline decoration-dotted"
        >
          {{ bucket }}
        </NuxtLink>
        <span class="text-gray-400">/</span>
        <span class="text-gray-600">{{ fileName }}</span>
      </div>

      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <UIcon name="i-lucide-file-edit" class="text-primary" />
            编辑文件
          </h1>
          <p v-if="fileMetadata" class="text-sm text-gray-500 mt-1">
            {{ formatSize(fileSize) }}
            <span v-if="fileMetadata.contentType" class="ml-2">
              · {{ fileMetadata.contentType }}
            </span>
          </p>
        </div>

        <div class="flex gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="goBack"
          >
            返回
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-save"
            :loading="isSaving"
            :disabled="!hasChanges"
            @click="handleSave"
          >
            保存
          </UButton>
        </div>
      </div>
    </header>

    <!-- 加载状态 -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-20"
    >
      <UIcon name="i-lucide-refresh-cw" class="animate-spin size-8 text-primary" />
    </div>

    <!-- 错误状态 -->
    <div
      v-else-if="error"
      class="space-y-4"
    >
      <UAlert
        color="error"
        icon="i-lucide-alert-circle"
        :title="isTooLarge ? '文件过大' : '加载失败'"
        :description="error"
      />
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        @click="goBack"
      >
        返回
      </UButton>
    </div>

    <!-- 文件大小警告 -->
    <div v-else-if="showSizeWarning" class="mb-4">
      <UAlert
        color="warning"
        icon="i-lucide-alert-triangle"
        title="文件较大"
        description="此文件较大，编辑可能会影响性能。建议下载后使用本地编辑器编辑。"
      />
    </div>

    <!-- 编辑器 -->
    <div v-if="!isLoading && !error" class="space-y-4">
      <div class="relative">
        <textarea
          v-model="content"
          class="w-full h-[70vh] p-4 font-mono text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="文件内容..."
          spellcheck="false"
          @keydown="handleKeydown"
        />
        <div
          class="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/80 dark:bg-gray-900/80 px-2 py-1 rounded"
        >
          {{ content.length.toLocaleString() }} 字符
          <span v-if="hasChanges" class="ml-2 text-amber-500">· 未保存</span>
        </div>
      </div>

      <div class="flex justify-between items-center text-sm text-gray-500">
        <span>提示：按 Ctrl+S 保存</span>
        <span v-if="hasChanges" class="text-amber-500">有未保存的修改</span>
      </div>
    </div>
  </UContainer>
</template>
