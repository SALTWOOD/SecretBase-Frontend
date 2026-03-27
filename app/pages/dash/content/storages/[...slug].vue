<script setup lang="ts">
import { getAdminStorageBucketByBucketNameFiles, type S3ObjectResponse } from "~~/packages/api/src";

const route = useRoute()
const router = useRouter()

const slug = computed(() => (route.params.slug as string[]) || [])
const bucketName = computed(() => slug.value[0] || '')
const currentPath = computed(() => {
  if (slug.value.length <= 1) return ''
  return slug.value.slice(1).join('/') + '/'
})

const dropdownMenu = (row: any) => [[
  {
    label: '下载',
    icon: 'i-lucide-download',
    disabled: row.original.type === 'directory',
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

type FileObject = S3ObjectResponse & { type: 'directory' | 'file' };

const allItems = ref<FileObject[]>([]);

const searchQuery = ref('')

const displayedItems = computed(() => {
  let filtered = allItems.value
  if (!searchQuery.value) {
    filtered = filtered.filter(item => {
      const path = currentPath.value
      if (!item.key.startsWith(path) || item.key === path) return false
      const relativeKey = item.key.substring(path.length)
      const parts = relativeKey.split('/').filter(Boolean)
      return parts.length === 1
    })
  } else {
    filtered = filtered.filter(item => item.key.toLowerCase().includes(searchQuery.value.toLowerCase()))
  }
  return filtered
})

const columns = [
  { id: 'name', accessorKey: 'key', header: '名称' },
  { id: 'size', accessorKey: 'size', header: '大小' },
  { id: 'modified', accessorKey: 'lastModified', header: '最后修改' },
  { id: 'actions', accessorKey: 'actions', header: '操作' }
]

const handleItemClick = (item: any) => {
  if (item.type === 'directory') {
    const segments = [bucketName.value, ...item.key.split('/').filter(Boolean)]
    router.push(`/dash/content/storages/${segments.join('/')}`)
  } else {
    console.log(`[Log] 🦀 下载文件: ${item.key}`)
    // TODO: 调用后端 GetPresignedUrlAsync
  }
}

const formatSize = (bytes: bigint) => {
  if (bytes <= 0n) return '--'

  const k = 1024n
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const numBytes = Number(bytes)
  const i = Math.floor(Math.log(numBytes) / Math.log(Number(k)))
  const value = numBytes / Math.pow(Number(k), i)

  return `${value.toFixed(2)} ${sizes[i]}`
}

const formatModified = (row: any) => {
  return row.type === 'directory'
    ? '--'
    : new Date(row.lastModified).toLocaleString();
}

const getDisplayName = (key: string) => key.split('/').filter(Boolean).pop() || ''

onMounted(async () => {
  const response = await getAdminStorageBucketByBucketNameFiles({
    path: { bucketName: bucketName.value },
    query: { prefix: currentPath.value }
  });
  if (response.error || !response.data) return;
  allItems.value = response.data.map((i: S3ObjectResponse) => ({
    ...i,
    type: i.key.endsWith('/') ? 'directory' : 'file',
  }));
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
          <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="搜索当前桶..." class="w-64" clearable />
          <UButton icon="i-lucide-plus" label="新建文件夹" color="secondary" variant="ghost" />
          <UButton icon="i-lucide-upload" label="上传文件" color="primary" />
        </div>
      </div>
    </header>

    <div v-if="currentPath" class="mb-4">
      <UButton icon="i-lucide-arrow-left" variant="link" label="返回上一级" @click="router.back()" />
    </div>

    <UTable :data="displayedItems" :columns="columns" class="border rounded-lg border-gray-200 dark:border-gray-800">
      <template #name-cell="{ row }">
        <div class="flex items-center gap-3 py-1">
          <UIcon
            :name="row.original.type === 'directory' ? 'i-lucide-folder' : 'i-lucide-file-text'"
            :class="row.original.type === 'directory' ? 'text-blue-500' : 'text-gray-400'"
            class="w-5 h-5 flex-shrink-0"
          />
          <button
            type="button"
            class="text-sm text-left hover:text-primary transition-colors font-medium hover:underline underline-offset-4"
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
        <UDropdownMenu :items="dropdownMenu(row)">
          <UButton color="secondary" variant="ghost" icon="i-lucide-more-horizontal" size="sm" />
        </UDropdownMenu>
      </template>
    </UTable>
  </UContainer>
</template>
