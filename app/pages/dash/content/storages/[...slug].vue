<script setup lang="ts">
import {
  getAdminStorageBucketByBucketNameFiles,
  getAdminStorageBucketByBucketNamePresignDownload,
  type S3ObjectResponse
} from "~~/packages/api/src";

const route = useRoute()
const router = useRouter()

const slug = computed(() => (route.params.slug as string[]) || [])
const bucketName = computed(() => slug.value[0] || '')
const currentPath = computed(() => {
  if (slug.value.length <= 1) return ''
  return slug.value.slice(1).join('/') + '/'
})

const viewMode = ref<'list' | 'grid'>('list')
const allItems = ref<FileObject[]>([]);
const searchQuery = ref('')
const isRecursiveSearch = ref(false)
let searchTimer: number | null = null

type FileObject = S3ObjectResponse & {
  type: 'directory' | 'file';
  thumbnailUrl?: string;
};

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']);

const getFileIcon = (key: string, type: 'directory' | 'file'): string => {
  if (type === 'directory') return 'i-lucide-folder';

  const ext = key.split('.').pop()?.toLowerCase();
  if (!ext) return 'i-lucide-file-text';

  const iconMap: Record<string, string> = {
    // 文档
    pdf: 'i-lucide-file-text',
    doc: 'i-lucide-file-text',
    docx: 'i-lucide-file-text',
    txt: 'i-lucide-file-text',
    md: 'i-lucide-file-text',
    // 压缩包
    zip: 'i-lucide-file-archive',
    rar: 'i-lucide-file-archive',
    '7z': 'i-lucide-file-archive',
    tar: 'i-lucide-file-archive',
    // 代码
    js: 'i-lucide-file-code',
    ts: 'i-lucide-file-code',
    vue: 'i-lucide-file-code',
    html: 'i-lucide-file-code',
    json: 'i-lucide-file-code',
    // 视频
    mp4: 'i-lucide-file-video',
    mkv: 'i-lucide-file-video',
    avi: 'i-lucide-file-video',
    // 音频
    mp3: 'i-lucide-file-audio',
    wav: 'i-lucide-file-audio',
  };

  return iconMap[ext] || 'i-lucide-file-text';
}

const isImage = (key: string): boolean => {
  const ext = key.split('.').pop()?.toLowerCase();
  return !!ext && imageExtensions.has(ext);
}

const preloadThumbnails = async (items: FileObject[]) => {
  const imageItems = items.filter(item => item.type === 'file' && isImage(item.key) && !item.thumbnailUrl);

  const limit = 5;
  for (let i = 0; i < imageItems.length; i += limit) {
    const chunk = imageItems.slice(i, i + limit);
    await Promise.all(chunk.map(async (item) => {
      try {
        const response = await getAdminStorageBucketByBucketNamePresignDownload({
          path: { bucketName: bucketName.value },
          query: { key: item.key }
        });
        if (response.data?.url) {
          item.thumbnailUrl = response.data.url;
        }
      } catch (e) {
        console.error('获取缩略图失败', item.key, e);
      }
    }));
  }
}

const fetchItems = async (isSearch: boolean = false) => {
  if (!bucketName.value) return;

  const response = await getAdminStorageBucketByBucketNameFiles({
    path: { bucketName: bucketName.value },
    query: {
      prefix: currentPath.value,
      recursive: isSearch && isRecursiveSearch.value
    }
  });

  if (response.error || !response.data) return;

  const newItems = response.data.map((i: S3ObjectResponse) => ({
    ...i,
    type: i.key.endsWith('/') ? 'directory' : 'file',
  }));

  allItems.value = newItems;

  if (viewMode.value === 'grid') {
    preloadThumbnails(newItems);
  }
}

const displayedItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) {
    return allItems.value.filter(item => {
      const path = currentPath.value
      if (!item.key.startsWith(path) || item.key === path) return false
      const relativeKey = item.key.substring(path.length)
      return !relativeKey.includes('/') || relativeKey.endsWith('/')
    })
  }

  return allItems.value.filter(item =>
    getDisplayName(item.key).toLowerCase().includes(q)
  )
})

const handleItemClick = async (item: FileObject) => {
  if (item.type === 'directory') {
    const segments = [bucketName.value, ...item.key.split('/').filter(Boolean)]
    router.push(`/dash/content/storages/${segments.join('/')}`)
  } else {
    if (item.thumbnailUrl) {
      window.open(item.thumbnailUrl);
      return;
    }

    const response = await getAdminStorageBucketByBucketNamePresignDownload({
      path: { bucketName: bucketName.value },
      query: { key: item.key }
    });
    if (response.error || !response.data) return;
    window.open(response.data.url);
  }
}

const dropdownMenu = (row: FileObject) => [[
  {
    label: '下载',
    icon: 'i-lucide-download',
    disabled: row.type === 'directory',
  },
  {
    label: '重命名',
    icon: 'i-lucide-pencil',
  },
  {
    label: '删除',
    icon: 'i-lucide-trash',
    color: 'error',
  }
]];

const columns = [
  { id: 'name', accessorKey: 'key', header: '名称' },
  { id: 'size', accessorKey: 'size', header: '大小' },
  { id: 'modified', accessorKey: 'lastModified', header: '最后修改' },
  { id: 'actions', accessorKey: 'actions', header: '操作' }
]

const formatSize = (bytes?: bigint) => {
  if (!bytes || bytes <= 0n) return '--'
  const k = 1024n
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const numBytes = Number(bytes)
  const i = Math.floor(Math.log(numBytes) / Math.log(Number(k)))
  const value = numBytes / Math.pow(Number(k), i)
  return `${value.toFixed(2)} ${sizes[i]}`
}

const formatModified = (row: FileObject) => {
  return row.type === 'directory' || !row.lastModified
    ? '--'
    : new Date(row.lastModified).toLocaleString();
}

const getDisplayName = (key: string) => key.split('/').filter(Boolean).pop() || ''

const triggerSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  fetchItems(!!searchQuery.value)
}

watch(searchQuery, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  if (!val) {
    triggerSearch()
    return
  }
  searchTimer = setTimeout(() => {
    triggerSearch()
  }, 1500)
})

watch(currentPath, () => {
  searchQuery.value = ''
  fetchItems(false)
})

watch(isRecursiveSearch, () => {
  if (searchQuery.value) triggerSearch()
})

watch(viewMode, (mode) => {
  if (mode === 'grid') {
    preloadThumbnails(allItems.value);
  }
})

onMounted(() => {
  fetchItems(false)
})
</script>

<template>
  <UContainer class="py-6">
    <header class="mb-6">
      <div class="flex justify-between items-end mb-4">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <UIcon name="i-lucide-database" class="text-primary" />
            {{ bucketName || '未知存储' }}
          </h1>
          <nav class="flex items-center gap-1 text-sm text-gray-500 mt-2 font-mono">
            <span class="hover:text-primary cursor-pointer underline decoration-dotted" @click="router.push(`/dash/content/storages/${bucketName}`)">root</span>
            <template v-for="(part, i) in slug.slice(1)" :key="i">
              <span class="text-gray-400">/</span>
              <span class="hover:text-primary cursor-pointer underline decoration-dotted" @click="router.push(`/dash/content/storages/${slug.slice(0, i + 2).join('/')}`)">
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
          <UButton icon="i-lucide-plus" label="新建文件夹" color="secondary" variant="ghost" />
          <UButton icon="i-lucide-upload" label="上传文件" color="primary" />

          <div class="flex items-center border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden ml-2">
            <UButton
              icon="i-lucide-list"
              square
              :color="viewMode === 'list' ? 'primary' : 'secondary'"
              :variant="viewMode === 'list' ? 'solid' : 'ghost'"
              class="rounded-none border-none"
              @click="viewMode = 'list'"
            />
            <div class="w-px h-4 bg-gray-200 dark:bg-gray-800" /> <UButton
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
      <UButton icon="i-lucide-arrow-left" variant="link" label="返回上一级" @click="router.back()" />
    </div>

    <UTable
      v-if="viewMode === 'list'"
      :data="displayedItems"
      :columns="columns"
      class="border rounded-lg border-gray-200 dark:border-gray-800"
    >
      <template #name-cell="{ row }">
        <div class="flex items-center gap-3 py-1">
          <UIcon
            :name="getFileIcon(row.original.key, row.original.type)"
            :class="[
               row.original.type === 'directory' ? 'text-blue-500' : 'text-gray-400',
               isImage(row.original.key) ? 'text-green-500' : ''
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
        <span class="text-sm font-mono text-gray-500">{{ formatSize(row.original.size!) }}</span>
      </template>

      <template #modified-cell="{ row }">
        <span class="text-sm text-gray-400">{{ formatModified(row.original) }}</span>
      </template>

      <template #actions-cell="{ row }">
        <UDropdownMenu :items="dropdownMenu(row.original)">
          <UButton color="secondary" variant="ghost" icon="i-lucide-more-horizontal" size="sm" />
        </UDropdownMenu>
      </template>
    </UTable>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 border border-gray-100 dark:border-gray-800 rounded-lg p-5 bg-gray-50/50 dark:bg-gray-950/50">
      <div
        v-for="item in displayedItems"
        :key="item.key"
        class="group relative border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 p-3 flex flex-col items-center text-center transition-all hover:border-primary-300 hover:shadow-md cursor-pointer"
        @click="handleItemClick(item)"
      >
        <div class="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <UDropdownMenu :items="dropdownMenu(item)">
            <UButton color="secondary" variant="ghost" icon="i-lucide-more-vertical" size="xs" class="rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm" />
          </UDropdownMenu>
        </div>

        <div class="w-full aspect-square flex items-center justify-center mb-3 relative overflow-hidden rounded">
          <img
            v-if="item.type === 'file' && isImage(item.key) && item.thumbnailUrl"
            :src="item.thumbnailUrl"
            :alt="getDisplayName(item.key)"
            class="max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
            loading="lazy"
            @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
          />
          <UIcon
            v-else
            :name="getFileIcon(item.key, item.type)"
            :class="[
              item.type === 'directory' ? 'text-blue-500/80' : 'text-gray-400',
              isImage(item.key) ? 'text-green-500/80' : ''
            ]"
            class="w-16 h-16 opacity-90 group-hover:opacity-100 transition-opacity"
          />
        </div>

        <span class="text-xs font-medium text-gray-700 dark:text-gray-200 break-all line-clamp-2 px-1 group-hover:text-primary" :title="getDisplayName(item.key)">
          {{ getDisplayName(item.key) }}
        </span>
        <span v-if="item.type === 'file'" class="text-[10px] text-gray-400 mt-1 font-mono">
          {{ formatSize(item.size as bigint) }}
        </span>
      </div>
    </div>

    <div v-if="displayedItems.length === 0" class="text-center py-20 text-gray-400 italic border rounded-lg border-gray-100 dark:border-gray-800 mt-4">
      此目录下没有文件或文件夹
    </div>

  </UContainer>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  box-orient: vertical;
  overflow: hidden;
}
</style>
