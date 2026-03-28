<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import {
  X, Search, Folder, ChevronRight, CornerDownLeft,
  Database, File
} from 'lucide-vue-next'

interface Props {
  selectionMode?: 'file' | 'directory' | 'both'
}

const props = withDefaults(defineProps<Props>(), {
  selectionMode: 'file'
})

const isVisible = defineModel<boolean>({ default: false })
const emit = defineEmits<{ (e: 'select', s3Url: string): void }>()

const buckets = ref([
  { name: 'media-assets', region: 'ap-east-1' },
  { name: 'user-uploads', region: 'ap-east-1' }
])

const selectedBucket = ref(buckets.value[0]?.name)
const currentPath = ref('')
const selectedFileKey = ref('')

// 地址栏逻辑
const isEditingPath = ref(false)
const pathInputRef = ref<HTMLInputElement | null>(null)
const pathInputValue = ref('')

// 数据
const allFiles = ref([
  { key: 'projects/', type: 'directory', size: '-', date: '2026-03-28 19:00' },
  { key: 'projects/secret-base/', type: 'directory', size: '-', date: '2026-03-28 19:05' },
  { key: 'projects/logo.png', type: 'file', size: '120 KB', date: '2026-03-28 19:10' },
  { key: 'logo-final.png', type: 'file', size: '512.0 KB', date: '2026-03-28 19:00' },
  { key: 'readme.md', type: 'file', size: '1.2 KB', date: '2026-03-28 20:00' }
])

const displayedItems = computed(() => {
  const prefix = currentPath.value

  return allFiles.value
    .filter(item => {
      if (!item.key.startsWith(prefix) || item.key === prefix) return false
      const relativePath = item.key.slice(prefix.length)
      const parts = relativePath.split('/')
      return parts.length === 1 || (parts.length === 2 && parts[1] === '')
    })
    .map(item => {
      let displayName = item.key.slice(prefix.length)
      if (item.type === 'directory' && displayName.endsWith('/')) {
        displayName = displayName.slice(0, -1)
      }
      return { ...item, displayName }
    })
})

const breadcrumbs = computed(() => {
  return currentPath.value.split('/').filter(Boolean)
})

const canConfirm = computed(() => {
  if (!selectedFileKey.value) return false
  const selectedItem = allFiles.value.find(f => f.key === selectedFileKey.value)
  if (!selectedItem) return false

  if (props.selectionMode === 'file') return selectedItem.type === 'file'
  if (props.selectionMode === 'directory') return selectedItem.type === 'directory'
  return true
})

// 交互
const navigateToBreadcrumb = (index: number) => {
  const parts = breadcrumbs.value.slice(0, index + 1)
  currentPath.value = parts.join('/') + '/'
  selectedFileKey.value = ''
}

const navigateToBucket = (name: string) => {
  selectedBucket.value = name
  currentPath.value = ''
  selectedFileKey.value = ''
}

const togglePathEdit = () => {
  pathInputValue.value = `s3://${selectedBucket.value}/${currentPath.value}`
  isEditingPath.value = true
  nextTick(() => pathInputRef.value?.focus())
}

const handleItemClick = (item: { key: string, type: string }) => {
  if (props.selectionMode === 'both') {
    selectedFileKey.value = item.key
  } else if (item.type === props.selectionMode) {
    selectedFileKey.value = item.key
  } else if (item.type === 'directory') {
    selectedFileKey.value = item.key
  }
}

const handleItemDbClick = (item: { key: string, type: string }) => {
  if (item.type === 'directory') {
    currentPath.value = item.key
    selectedFileKey.value = ''
  } else if (item.type === 'file') {
    if (props.selectionMode === 'file' || props.selectionMode === 'both') {
      selectedFileKey.value = item.key
      confirm()
    }
  }
}

const navigateBack = () => {
  if (!currentPath.value) return
  const parts = currentPath.value.split('/').filter(Boolean)
  parts.pop()
  currentPath.value = parts.length > 0 ? parts.join('/') + '/' : ''
  selectedFileKey.value = ''
}

const handlePathBlur = () => {
  const match = pathInputValue.value.match(/^s3:\/\/([^/]+)\/?(.*)$/)
  if (match) {
    const bucketName = match[1]
    const rawPath = match[2] || ''

    const targetBucket = buckets.value.find(x => x.name === bucketName)
    if (targetBucket) {
      selectedBucket.value = targetBucket.name
      currentPath.value = rawPath && !rawPath.endsWith('/') ? rawPath + '/' : rawPath
    }
  }
  isEditingPath.value = false
}

const confirm = () => {
  if (canConfirm.value) {
    emit('select', `s3://${selectedBucket.value}/${selectedFileKey.value}`)
    isVisible.value = false
  }
}

watch(isVisible, (val) => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = val ? 'hidden' : ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
           @click.self="isVisible = false">
        <div
          class="flex h-[600px] w-[960px] flex-col border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">

          <header
            class="flex h-10 items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300">
              <Database :size="16" class="text-primary-500"/>
              <span>S3 File Browser</span>
            </div>
            <button class="rounded-sm p-1 hover:bg-red-500 hover:text-white transition-colors"
                    @click="isVisible = false">
              <X :size="16"/>
            </button>
          </header>

          <nav class="flex h-12 items-center gap-3 border-b border-gray-100 px-3 dark:border-zinc-800">
            <button class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                    :disabled="!currentPath"
                    title="返回上级"
                    @click="navigateBack"
            >
              <CornerDownLeft :size="18"/>
            </button>

            <div
              class="group flex h-8 flex-1 items-center border border-gray-200 bg-white px-2 transition-focus focus-within:ring-2 focus-within:ring-primary-500/50 dark:border-zinc-700 dark:bg-zinc-900 select-none"
              @click.self="togglePathEdit">
              <template v-if="!isEditingPath">
                <span class="flex items-center gap-1 text-xs text-gray-400">s3://</span>
                <span
                  class="cursor-pointer text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
                  @click="currentPath = ''; selectedFileKey = ''"
                >
                  {{ selectedBucket }}
                </span>
                <template v-for="(crumb, index) in breadcrumbs" :key="index">
                  <ChevronRight :size="12" class="mx-0.5 text-gray-300"/>
                  <span
                    class="cursor-pointer text-xs text-gray-600 hover:text-primary-600 dark:text-zinc-400 dark:hover:text-primary-400"
                    @click="navigateToBreadcrumb(index)"
                  >
                  {{ crumb }}
                </span>
                </template>
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
              class="flex h-8 w-60 items-center gap-2 border border-gray-200 bg-gray-50 px-2 dark:border-zinc-700 dark:bg-zinc-900">
              <Search :size="14" class="text-gray-400"/>
              <input type="text" placeholder="搜索文件..."
                     class="w-full bg-transparent text-xs outline-none text-gray-900 dark:text-zinc-100"/>
            </div>
          </nav>

          <section class="flex flex-1 overflow-hidden">
            <aside class="w-52 border-r border-gray-100 bg-gray-50/30 dark:border-zinc-800 dark:bg-zinc-900/20">
              <div class="p-4">
                <h3 class="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Buckets</h3>
                <div
                  v-for="b in buckets" :key="b.name"
                  class="mb-1 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors select-none"
                  :class="selectedBucket === b.name ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800'"
                  @click="navigateToBucket(b.name)"
                >
                  <Database :size="16"/>
                  <span class="truncate">{{ b.name }}</span>
                </div>
              </div>
            </aside>

            <main class="flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
              <table class="w-full text-left text-xs">
                <thead
                  class="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
                <tr class="text-gray-400 uppercase tracking-tighter">
                  <th class="p-3 font-medium">名称</th>
                  <th class="p-3 font-medium">修改日期</th>
                  <th class="p-3 font-medium">类型</th>
                  <th class="p-3 font-medium text-right">大小</th>
                </tr>
                </thead>
                <tbody class="divide-y divide-gray-50 dark:divide-zinc-900">
                <tr
                  v-for="item in displayedItems" :key="item.key"
                  class="group cursor-pointer transition-colors select-none"
                  :class="selectedFileKey === item.key ? 'bg-primary-50/50 dark:bg-primary-900/10' : 'hover:bg-gray-50 dark:hover:bg-zinc-900/50'"
                  @click="handleItemClick(item)"
                  @dblclick="handleItemDbClick(item)"
                >
                  <td class="flex items-center gap-3 p-3 font-medium text-gray-700 dark:text-zinc-200">
                    <Folder v-if="item.type === 'directory'" :size="18" class="text-primary-500 fill-primary-500/20"/>
                    <File v-else :size="18" class="text-gray-400"/>
                    {{ item.displayName }}
                  </td>
                  <td class="p-3 text-gray-500 dark:text-zinc-500">{{ item.date }}</td>
                  <td class="p-3 text-gray-500 dark:text-zinc-500">{{ item.type === 'directory' ? '文件夹' : '文件' }}</td>
                  <td class="p-3 text-right text-gray-500 dark:text-zinc-500">{{ item.size }}</td>
                </tr>
                </tbody>
              </table>
            </main>
          </section>

          <footer
            class="flex h-16 items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div class="flex flex-1 items-center gap-3">
              <span class="text-xs font-medium text-gray-500">当前选择:</span>
              <input type="text" :value="selectedFileKey" readonly placeholder="未选择任何文件"
                     class="h-8 flex-1 border border-gray-200 bg-white px-3 text-xs outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"/>
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
                @click="isVisible = false">
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
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
.dark ::-webkit-scrollbar-thumb { background: #3f3f46; }

/* 防止表格内容及导航文字在双击时被选中 */
table, nav .group, aside .cursor-pointer {
  user-select: none;
  -webkit-user-select: none;
}

/* 恢复输入框的文字选择功能 */
input {
  user-select: text !important;
  -webkit-user-select: text !important;
}
</style>
