<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from "vue";
import {
  X,
  Search,
  Folder,
  ChevronRight,
  CornerDownLeft,
  Database,
  File,
  Loader2,
} from "lucide-vue-next";
import {
  getAdminStorageBuckets,
  getAdminStorageBucketByBucketNameFiles,
  type S3ObjectResponse,
  type BucketResponse,
} from "~~/packages/api/src";

interface Props {
  selectionMode?: "file" | "directory" | "both";
}

const props = withDefaults(defineProps<Props>(), {
  selectionMode: "file",
});

const isVisible = defineModel<boolean>({ default: false });
const emit = defineEmits<{ (e: "select", s3Url: string): void }>();

const buckets = ref<BucketResponse[]>([]);
const allFiles = ref<(S3ObjectResponse & { type: "directory" | "file" })[]>([]);
const isLoading = ref(false);
const searchQuery = ref("");

const selectedBucket = ref("");
const currentPath = ref("");
const selectedFileKey = ref("");

// 地址栏逻辑
const isEditingPath = ref(false);
const pathInputRef = ref<HTMLInputElement | null>(null);
const pathInputValue = ref("");

// 获取所有存储桶
const fetchBuckets = async () => {
  const response = await getAdminStorageBuckets();
  if (response.data) {
    buckets.value = response.data;
    if (response.data.length > 0 && !selectedBucket.value) {
      selectedBucket.value = response.data[0]?.name!;
    }
  }
};

// 获取当前路径下的文件
const fetchFiles = async () => {
  if (!selectedBucket.value) return;

  isLoading.value = true;
  const response = await getAdminStorageBucketByBucketNameFiles({
    path: { bucketName: selectedBucket.value },
    query: {
      prefix: currentPath.value,
      recursive: false,
    },
  });

  if (response.data) {
    allFiles.value = response.data.map((i) => ({
      ...i,
      type: i.key.endsWith("/") ? "directory" : "file",
    }));
  }
  isLoading.value = false;
};

const displayedItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();

  // 只显示同目录的东西
  let items = allFiles.value.filter((item) => item.key !== currentPath.value);

  if (q) {
    items = items.filter((item) =>
      getDisplayName(item.key).toLowerCase().includes(q),
    );
  }
  return items;
});

const breadcrumbs = computed(() => {
  return currentPath.value.split("/").filter(Boolean);
});

const canConfirm = computed(() => {
  if (!selectedFileKey.value) return false;
  const selectedItem = allFiles.value.find(
    (f) => f.key === selectedFileKey.value,
  );
  if (!selectedItem) return false;

  if (props.selectionMode === "file") return selectedItem.type === "file";
  if (props.selectionMode === "directory")
    return selectedItem.type === "directory";
  return true;
});

const getDisplayName = (key: string) => {
  const parts = key.split("/").filter(Boolean);
  return parts.pop() || "";
};

const formatSize = (bytes?: bigint) => {
  if (!bytes || bytes <= 0n) return "--";
  const k = 1024n;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const numBytes = Number(bytes);
  const i = Math.floor(Math.log(numBytes) / Math.log(Number(k)));
  const value = numBytes / Math.pow(Number(k), i);
  return `${value.toFixed(2)} ${sizes[i]}`;
};

const navigateToBreadcrumb = (index: number) => {
  const parts = breadcrumbs.value.slice(0, index + 1);
  currentPath.value = parts.join("/") + "/";
  selectedFileKey.value = "";
};

const navigateToBucket = (name: string) => {
  selectedBucket.value = name;
  currentPath.value = "";
  selectedFileKey.value = "";
};

const togglePathEdit = () => {
  pathInputValue.value = `s3://${selectedBucket.value}/${currentPath.value}`;
  isEditingPath.value = true;
  nextTick(() => pathInputRef.value?.focus());
};

const handleItemClick = (item: { key: string; type: string }) => {
  if (
    props.selectionMode === "both" ||
    item.type === props.selectionMode ||
    item.type === "directory"
  ) {
    selectedFileKey.value = item.key;
  }
};

const handleItemDbClick = (item: { key: string; type: string }) => {
  if (item.type === "directory") {
    currentPath.value = item.key;
    selectedFileKey.value = "";
  } else {
    if (props.selectionMode === "file" || props.selectionMode === "both") {
      selectedFileKey.value = item.key;
      confirm();
    }
  }
};

const navigateBack = () => {
  if (!currentPath.value) return;
  const parts = currentPath.value.split("/").filter(Boolean);
  parts.pop();
  currentPath.value = parts.length > 0 ? parts.join("/") + "/" : "";
  selectedFileKey.value = "";
};

const handlePathBlur = () => {
  const match = pathInputValue.value.match(/^s3:\/\/([^/]+)\/?(.*)$/);
  if (match) {
    const bucketName = match[1];
    const rawPath = match[2] || "";

    const targetBucket = buckets.value.find((x) => x.name === bucketName);
    if (targetBucket) {
      selectedBucket.value = targetBucket.name;
      currentPath.value =
        rawPath && !rawPath.endsWith("/") ? rawPath + "/" : rawPath;
    }
  }
  isEditingPath.value = false;
};

const confirm = () => {
  if (canConfirm.value) {
    emit("select", `s3://${selectedBucket.value}/${selectedFileKey.value}`);
    isVisible.value = false;
  }
};

onMounted(() => {
  fetchBuckets();
});

watch([selectedBucket, currentPath], () => {
  fetchFiles();
});

watch(isVisible, (val) => {
  if (typeof window !== "undefined") {
    document.body.style.overflow = val ? "hidden" : "";
  }
  if (val && buckets.value.length === 0) {
    fetchBuckets();
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isVisible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="isVisible = false"
      >
        <div
          class="flex h-150 w-240 flex-col border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden"
        >
          <header
            class="flex h-10 items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <div
              class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300"
            >
              <Database :size="16" class="text-primary-500" />
              <span>S3 File Browser</span>
            </div>
            <button
              class="rounded-sm p-1 hover:bg-red-500 hover:text-white transition-colors"
              @click="isVisible = false"
            >
              <X :size="16" />
            </button>
          </header>

          <nav
            class="flex h-12 items-center gap-3 border-b border-gray-100 px-3 dark:border-zinc-800"
          >
            <button
              class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-zinc-800"
              :disabled="!currentPath || isLoading"
              title="返回上级"
              @click="navigateBack"
            >
              <CornerDownLeft :size="18" />
            </button>

            <div
              class="group flex h-8 flex-1 items-center border border-gray-200 bg-white px-2 transition-focus focus-within:ring-2 focus-within:ring-primary-500/50 dark:border-zinc-700 dark:bg-zinc-900 select-none"
              @click.self="togglePathEdit"
            >
              <template v-if="!isEditingPath">
                <span class="flex items-center gap-1 text-xs text-gray-400"
                  >s3://</span
                >
                <span
                  class="cursor-pointer text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
                  @click="
                    currentPath = '';
                    selectedFileKey = '';
                  "
                >
                  {{ selectedBucket || "选择存储桶" }}
                </span>
                <template v-for="(crumb, index) in breadcrumbs" :key="index">
                  <ChevronRight :size="12" class="mx-0.5 text-gray-300" />
                  <span
                    class="cursor-pointer text-xs text-gray-600 hover:text-primary-600 dark:text-zinc-400 dark:hover:text-primary-400"
                    @click="navigateToBreadcrumb(index)"
                  >
                    {{ crumb }}
                  </span>
                </template>
                <Loader2
                  v-if="isLoading"
                  :size="12"
                  class="ml-auto animate-spin text-gray-400"
                />
              </template>
              <input
                v-else
                ref="pathInputRef"
                v-model="pathInputValue"
                class="w-full bg-transparent text-xs outline-none text-gray-900 dark:text-zinc-100"
                @blur="handlePathBlur"
                @keydown.enter="handlePathBlur"
              />
            </div>

            <div
              class="flex h-8 w-60 items-center gap-2 border border-gray-200 bg-gray-50 px-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <Search :size="14" class="text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索文件..."
                class="w-full bg-transparent text-xs outline-none text-gray-900 dark:text-zinc-100"
              />
            </div>
          </nav>

          <section class="flex flex-1 overflow-hidden">
            <aside
              class="w-52 border-r border-gray-100 bg-gray-50/30 dark:border-zinc-800 dark:bg-zinc-900/20 overflow-y-auto"
            >
              <div class="p-4">
                <h3
                  class="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400"
                >
                  Buckets
                </h3>
                <div
                  v-for="b in buckets"
                  :key="b.name"
                  class="mb-1 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors select-none"
                  :class="
                    selectedBucket === b.name
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  "
                  @click="navigateToBucket(b.name)"
                >
                  <Database :size="16" />
                  <span class="truncate">{{ b.name }}</span>
                </div>
              </div>
            </aside>

            <main
              class="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 relative"
            >
              <table class="w-full text-left text-xs table-fixed">
                <thead
                  class="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80"
                >
                  <tr class="text-gray-400 uppercase tracking-tighter">
                    <th class="p-3 font-medium w-[50%]">名称</th>
                    <th class="p-3 font-medium">最后修改</th>
                    <th class="p-3 font-medium w-20">类型</th>
                    <th class="p-3 font-medium text-right w-24">大小</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50 dark:divide-zinc-900">
                  <tr
                    v-for="item in displayedItems"
                    :key="item.key"
                    class="group cursor-pointer transition-colors select-none"
                    :class="
                      selectedFileKey === item.key
                        ? 'bg-primary-50/50 dark:bg-primary-900/10'
                        : 'hover:bg-gray-50 dark:hover:bg-zinc-900/50'
                    "
                    @click="handleItemClick(item)"
                    @dblclick="handleItemDbClick(item)"
                  >
                    <td
                      class="flex items-center gap-3 p-3 font-medium text-gray-700 dark:text-zinc-200 overflow-hidden"
                    >
                      <Folder
                        v-if="item.type === 'directory'"
                        :size="18"
                        class="text-primary-500 fill-primary-500/20 shrink-0"
                      />
                      <File v-else :size="18" class="text-gray-400 shrink-0" />
                      <span class="truncate">{{
                        getDisplayName(item.key)
                      }}</span>
                    </td>
                    <td class="p-3 text-gray-500 dark:text-zinc-500 truncate">
                      {{
                        item.type === "directory"
                          ? "--"
                          : (item.lastModified?.toLocaleString() ?? "--")
                      }}
                    </td>
                    <td class="p-3 text-gray-500 dark:text-zinc-500 truncate">
                      {{ item.type === "directory" ? "文件夹" : "文件" }}
                    </td>
                    <td
                      class="p-3 text-right text-gray-500 dark:text-zinc-500 font-mono"
                    >
                      {{ formatSize(item.size as bigint) }}
                    </td>
                  </tr>
                  <tr v-if="displayedItems.length === 0 && !isLoading">
                    <td
                      colspan="4"
                      class="p-10 text-center text-gray-400 italic"
                    >
                      此目录下没有文件
                    </td>
                  </tr>
                </tbody>
              </table>

              <div
                v-if="isLoading"
                class="absolute inset-0 bg-white/50 dark:bg-zinc-950/50 flex items-center justify-center z-20"
              >
                <Loader2 :size="24" class="animate-spin text-primary-500" />
              </div>
            </main>
          </section>

          <footer
            class="flex h-16 items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <div class="flex flex-1 items-center gap-3">
              <span class="text-xs font-medium text-gray-500">当前选择:</span>
              <input
                type="text"
                :value="selectedFileKey"
                readonly
                placeholder="未选择任何文件"
                class="h-8 flex-1 border border-gray-200 bg-white px-3 text-xs outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              />
            </div>
            <div class="ml-6 flex gap-2">
              <button
                class="h-9 rounded-md bg-primary-500 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-600 disabled:opacity-50"
                :disabled="!canConfirm"
                @click="confirm"
              >
                确定选择
              </button>
              <button
                class="h-9 rounded-md border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                @click="isVisible = false"
              >
                取消
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}
.dark ::-webkit-scrollbar-thumb {
  background: #3f3f46;
}

table,
nav .group,
aside .cursor-pointer {
  user-select: none;
  -webkit-user-select: none;
}

input {
  user-select: text !important;
  -webkit-user-select: text !important;
}
</style>
