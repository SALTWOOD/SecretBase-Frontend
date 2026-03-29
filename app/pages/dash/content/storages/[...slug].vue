<script setup lang="ts">
import {
  deleteAdminStorageBucketByBucketNameFile,
  getAdminStorageBucketByBucketNameFiles,
  getAdminStorageBucketByBucketNamePresignDownload,
  getAdminStorageBucketByBucketNameThumbnail,
  postAdminStorageBucketByBucketNamePresignUpload,
  type S3ObjectResponse,
} from "~~/packages/api/src";
import ConfirmButton from "~/components/ConfirmButton.vue";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const slug = computed(() => (route.params.slug as string[]) || []);
const bucketName = computed(() => slug.value[0] || "");
const currentPath = computed(() => {
  if (slug.value.length <= 1) return "";
  return slug.value.slice(1).join("/") + "/";
});

const viewMode = ref<"list" | "grid">("list");
const allItems = ref<FileObject[]>([]);
const searchQuery = ref("");
const isRecursiveSearch = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const itemToDelete = ref<FileObject | null>(null);

let searchTimer: number | null = null;

type FileObject = S3ObjectResponse & {
  type: "directory" | "file";
  thumbnailUrl?: string;
};

const imageExtensions = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
]);

const iconMap: Record<string, string> = {
  // 文档 (Lucide)
  pdf: "i-lucide-file-text",
  doc: "i-lucide-file-text",
  docx: "i-lucide-file-text",
  txt: "i-lucide-file-text",
  md: "i-lucide-file-text",

  // 压缩包 (Lucide)
  zip: "i-lucide-file-archive",
  rar: "i-lucide-file-archive",
  "7z": "i-lucide-file-archive",
  tar: "i-lucide-file-archive",

  // 编程语言 (Simple Icons)
  py: "i-simple-icons-python",
  java: "i-simple-icons-openjdk",
  js: "i-simple-icons-javascript",
  ts: "i-simple-icons-typescript",
  c: "i-simple-icons-c",
  cpp: "i-simple-icons-cplusplus",
  cs: "i-simple-icons-dotnet",
  fs: "i-simple-icons-fsharp",
  fsx: "i-simple-icons-fsharp",

  go: "i-simple-icons-go",
  rs: "i-simple-icons-rust",
  php: "i-simple-icons-php",
  rb: "i-simple-icons-ruby",

  vue: "i-simple-icons-vuedotjs",
  html: "i-simple-icons-html5",
  json: "i-simple-icons-json",

  // 视频 (Lucide)
  mp4: "i-lucide-file-video",
  mkv: "i-lucide-file-video",
  avi: "i-lucide-file-video",

  // 音频 (Lucide)
  mp3: "i-lucide-file-audio",
  wav: "i-lucide-file-audio",
};

const getFileIcon = (key: string, type: "directory" | "file"): string => {
  if (type === "directory") return "i-lucide-folder";
  const ext = key.split(".").pop()?.toLowerCase();
  if (!ext) return "i-lucide-file-text";
  return iconMap[ext] || "i-lucide-file-text";
};

const isImage = (key: string): boolean => {
  const ext = key.split(".").pop()?.toLowerCase();
  return !!ext && imageExtensions.has(ext);
};

const preloadThumbnails = async (items: FileObject[]) => {
  const imageItems = items.filter(
    (item) => item.type === "file" && isImage(item.key) && !item.thumbnailUrl,
  );

  const limit = 5;
  for (let i = 0; i < imageItems.length; i += limit) {
    const chunk = imageItems.slice(i, i + limit);
    await Promise.all(
      chunk.map(async (item) => {
        try {
          const response = await getAdminStorageBucketByBucketNameThumbnail({
            path: { bucketName: bucketName.value },
            query: { key: item.key },
          });
          if (response.data?.url) {
            item.thumbnailUrl = response.data.url;
          }
        } catch (e) {
          console.error("获取缩略图失败", item.key, e);
        }
      }),
    );
  }
};

const fetchItems = async (isSearch: boolean = false) => {
  if (!bucketName.value) return;

  const response = await getAdminStorageBucketByBucketNameFiles({
    path: { bucketName: bucketName.value },
    query: {
      prefix: currentPath.value,
      recursive: isSearch && isRecursiveSearch.value,
    },
  });

  if (response.error || !response.data) return;

  const newItems = response.data.map((i: S3ObjectResponse) => ({
    ...i,
    type: i.key.endsWith("/") ? "directory" : "file",
  }));

  allItems.value = newItems;

  if (viewMode.value === "grid") preloadThumbnails(newItems);
};

const displayedItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) {
    return allItems.value.filter((item) => {
      const path = currentPath.value;
      if (!item.key.startsWith(path) || item.key === path) return false;
      const relativeKey = item.key.substring(path.length);
      return !relativeKey.includes("/") || relativeKey.endsWith("/");
    });
  }
  return allItems.value.filter((item) =>
    getDisplayName(item.key).toLowerCase().includes(q),
  );
});

const handleItemClick = async (item: FileObject) => {
  if (item.type === "directory") {
    const segments = [bucketName.value, ...item.key.split("/").filter(Boolean)];
    await router.push(`/dash/content/storages/${segments.join("/")}`);
  } else await handleDownload(item);
};

const handleDownload = async (item: FileObject, download: boolean = false) => {
  const url = await getPresignDownload(item, download);
  if (!url) return;
  window.open(url);
};

const getPresignDownload = async (
  item: FileObject,
  download: boolean = false,
) => {
  const response = await getAdminStorageBucketByBucketNamePresignDownload({
    path: { bucketName: bucketName.value },
    query: { key: item.key, download },
  });
  if (response.error || !response.data) return null;
  return response.data.url;
};

const handleUploadClick = () => {
  fileInput.value?.click();
};

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    handleUpload(file);
    target.value = "";
  }
};

const uploadWithProgress = (
  url: string,
  file: File,
  onProgress: (p: number) => void,
) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve(xhr.response)
        : reject(new Error(xhr.statusText));
    xhr.onerror = () => reject(new Error("Network Error"));
    xhr.send(file);
  });
};

const handleUpload = async (file: File) => {
  if (!file || !bucketName.value) return;
  const fileKey = `${currentPath.value}${file.name}`;
  const toastId = `upload-${Date.now()}`;
  toast.add({
    id: toastId,
    title: `准备上传文件`,
    description: "正在获取上传授权...",
    color: "info",
    duration: 0,
  });
  try {
    const { data } = await postAdminStorageBucketByBucketNamePresignUpload({
      path: { bucketName: bucketName.value },
      body: { key: fileKey },
    });
    if (!data?.url) throw new Error("无法获取上传授权地址");
    toast.update(toastId, { title: `正在上传文件`, color: "info" });
    await uploadWithProgress(data.url, file, (percent) => {
      toast.update(toastId, { description: `已完成 ${percent}%` });
    });
    toast.remove(toastId);
    toast.add({
      title: "上传成功",
      description: `文件 ${file.name} 已上传`,
      color: "success",
    });
    await fetchItems(false);
  } catch (error: any) {
    toast.add({
      id: toastId,
      title: "上传失败",
      description: error.message,
      color: "error",
    });
  }
};

const openDeleteConfirm = (item: FileObject) => {
  itemToDelete.value = item;
  isDeleteModalOpen.value = true;
};

const executeDelete = async () => {
  if (!itemToDelete.value) return;
  isDeleting.value = true;
  try {
    const response = await deleteAdminStorageBucketByBucketNameFile({
      path: { bucketName: bucketName.value },
      query: { key: itemToDelete.value.key },
    });
    if (response.error) throw new Error("后端服务请求失败");
    toast.add({
      title: "删除成功",
      icon: "i-lucide-check-circle",
      color: "success",
    });
    isDeleteModalOpen.value = false;
    await fetchItems(false);
  } catch (e: any) {
    toast.add({ title: "删除失败", description: e.message, color: "error" });
  } finally {
    isDeleting.value = false;
  }
};

const dropdownMenu = (row: FileObject) => [
  [
    {
      label: "下载",
      icon: "i-lucide-download",
      disabled: row.type === "directory",
      onSelect: () => handleDownload(row, true),
    },
    {
      label: "重命名",
      icon: "i-lucide-pencil",
    },
    {
      label: "删除",
      icon: "i-lucide-trash",
      color: "error",
      onSelect: () => openDeleteConfirm(row),
    },
  ],
];

const columns = [
  { id: "name", accessorKey: "key", header: "名称" },
  { id: "size", accessorKey: "size", header: "大小" },
  { id: "modified", accessorKey: "lastModified", header: "最后修改" },
  { id: "actions", accessorKey: "actions", header: "操作" },
];

const formatSize = (bytes?: bigint) => {
  if (!bytes || bytes <= 0n) return "--";
  const k = 1024n;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const numBytes = Number(bytes);
  const i = Math.floor(Math.log(numBytes) / Math.log(Number(k)));
  const value = numBytes / Math.pow(Number(k), i);
  return `${value.toFixed(2)} ${sizes[i]}`;
};

const formatModified = (row: FileObject) => {
  return row.type === "directory" || !row.lastModified
    ? "--"
    : new Date(row.lastModified).toLocaleString();
};

const getDisplayName = (
  key: string,
  truncate: boolean = false,
  maxLength: number = 16,
): string => {
  const name = key.split("/").filter(Boolean).pop() || "";

  if (!truncate || name.length <= maxLength) {
    return name;
  }

  const effectiveLength = Math.max(0, maxLength - 3);
  return `${name.slice(0, effectiveLength)}...`;
};

const triggerSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  fetchItems(!!searchQuery.value);
};

watch(searchQuery, (val) => {
  if (searchTimer) clearTimeout(searchTimer);
  if (!val) {
    triggerSearch();
    return;
  }
  searchTimer = setTimeout(() => {
    triggerSearch();
  }, 1500);
});

watch(currentPath, () => {
  searchQuery.value = "";
  fetchItems(false);
});
watch(isRecursiveSearch, () => {
  if (searchQuery.value) triggerSearch();
});
watch(viewMode, (mode) => {
  if (mode === "grid") preloadThumbnails(allItems.value);
});

onMounted(() => {
  fetchItems(false);
});
</script>

<template>
  <UContainer class="py-6">
    <header class="mb-6">
      <div class="flex justify-between items-end mb-4">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <UIcon name="i-lucide-database" class="text-primary" />
            {{ bucketName || "未知存储" }}
          </h1>
          <nav
            class="flex items-center gap-1 text-sm text-gray-500 mt-2 font-mono"
          >
            <span
              class="hover:text-primary cursor-pointer underline decoration-dotted"
              @click="router.push(`/dash/content/storages/${bucketName}`)"
              >root</span
            >
            <template v-for="(part, i) in slug.slice(1)" :key="i">
              <span class="text-gray-400">/</span>
              <span
                class="hover:text-primary cursor-pointer underline decoration-dotted"
                @click="
                  router.push(
                    `/dash/content/storages/${slug.slice(0, i + 2).join('/')}`,
                  )
                "
              >
                {{ part }}
              </span>
            </template>
          </nav>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 mr-2">
            <UCheckbox v-model="isRecursiveSearch" size="sm" />
            <span class="text-xs text-gray-500">包含子目录</span>
          </div>
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="在当前位置搜索..."
            class="w-64"
            clearable
            @keydown.enter="triggerSearch"
          />
          <UButton
            icon="i-lucide-plus"
            label="新建文件夹"
            color="secondary"
            variant="ghost"
          />
          <UButton
            icon="i-lucide-upload"
            label="上传文件"
            color="primary"
            @click="handleUploadClick"
          />
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            @change="onFileChange"
          />

          <div
            class="flex items-center border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden ml-2"
          >
            <UButton
              icon="i-lucide-list"
              square
              :color="viewMode === 'list' ? 'primary' : 'secondary'"
              :variant="viewMode === 'list' ? 'solid' : 'ghost'"
              class="rounded-none border-none"
              @click="viewMode = 'list'"
            />
            <div class="w-px h-4 bg-gray-200 dark:bg-gray-800" />
            <UButton
              icon="i-lucide-layout-grid"
              square
              :color="viewMode === 'grid' ? 'primary' : 'secondary'"
              :variant="viewMode === 'grid' ? 'solid' : 'ghost'"
              class="rounded-none border-none"
              @click="viewMode = 'grid'"
            />
          </div>
        </div>
      </div>
    </header>

    <div v-if="currentPath && !searchQuery" class="mb-4">
      <UButton
        icon="i-lucide-arrow-left"
        variant="link"
        label="返回上一级"
        @click="router.back()"
      />
    </div>

    <UTable
      v-if="viewMode === 'list'"
      :data="displayedItems"
      :columns="columns"
      class="border rounded-lg border-gray-200 dark:border-gray-800 relative"
    >
      <template #name-cell="{ row }">
        <div class="flex items-center gap-3 py-1">
          <UIcon
            :name="getFileIcon(row.original.key, row.original.type)"
            :class="[
              row.original.type === 'directory'
                ? 'text-blue-500'
                : 'text-gray-400',
              isImage(row.original.key) ? 'text-green-500' : '',
            ]"
            class="w-5 h-5 shrink-0"
          />
          <button
            type="button"
            class="text-sm text-left hover:text-primary transition-colors font-medium hover:underline underline-offset-4 truncate"
            @click="handleItemClick(row.original)"
          >
            {{ getDisplayName(row.original.key) }}
          </button>
        </div>
      </template>

      <template #size-cell="{ row }">
        <span class="text-sm font-mono text-gray-500">{{
          formatSize(row.original.size as bigint)
        }}</span>
      </template>

      <template #modified-cell="{ row }">
        <span class="text-sm text-gray-400">{{
          formatModified(row.original)
        }}</span>
      </template>

      <template #actions-cell="{ row }">
        <UDropdownMenu :items="dropdownMenu(row.original)">
          <UButton
            color="secondary"
            variant="ghost"
            icon="i-lucide-more-horizontal"
            size="sm"
          />
        </UDropdownMenu>
      </template>
    </UTable>

    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 border border-gray-100 dark:border-gray-800 rounded-lg p-5 bg-gray-50/50 dark:bg-gray-950/50 relative"
    >
      <div
        v-for="item in displayedItems"
        :key="item.key"
        class="group relative border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 p-3 flex flex-col items-center text-center transition-all hover:border-primary-300 hover:shadow-md cursor-pointer"
        @click="handleItemClick(item)"
      >
        <div
          class="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <UDropdownMenu :items="dropdownMenu(item)">
            <UButton
              color="secondary"
              variant="ghost"
              icon="i-lucide-more-vertical"
              size="xs"
              class="rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            />
          </UDropdownMenu>
        </div>

        <div
          class="w-full aspect-square flex items-center justify-center mb-3 relative overflow-hidden rounded"
        >
          <img
            v-if="
              item.type === 'file' && isImage(item.key) && item.thumbnailUrl
            "
            :src="item.thumbnailUrl"
            :alt="getDisplayName(item.key)"
            class="max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
            loading="lazy"
            @error="
              (e) => ((e.target as HTMLImageElement).style.display = 'none')
            "
          />
          <UIcon
            v-else
            :name="getFileIcon(item.key, item.type)"
            :class="[
              item.type === 'directory' ? 'text-blue-500/80' : 'text-gray-400',
              isImage(item.key) ? 'text-green-500/80' : '',
            ]"
            class="w-16 h-16 opacity-90 group-hover:opacity-100 transition-opacity"
          />
        </div>

        <span
          class="text-xs font-medium text-gray-700 dark:text-gray-200 break-all line-clamp-2 px-1 group-hover:text-primary"
          :title="getDisplayName(item.key)"
        >
          {{ getDisplayName(item.key) }}
        </span>
        <span
          v-if="item.type === 'file'"
          class="text-[10px] text-gray-400 mt-1 font-mono"
        >
          {{ formatSize(item.size as bigint) }}
        </span>
      </div>
    </div>

    <ConfirmButton
      v-model:open="isDeleteModalOpen"
      :subtitle="
        itemToDelete
          ? `删除文件 ${getDisplayName(itemToDelete.key, true, 32)}`
          : '确认删除'
      "
      :description="'此操作将永久移除该文件，无法找回。确定要继续吗？'"
      :loading="isDeleting"
      @confirm="executeDelete"
    />
  </UContainer>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
