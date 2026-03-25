<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getAdminShortcodes,
  deleteAdminShortcodesById,
  patchAdminShortcodesById,
  type ShortcodeDetail, postAdminShortcodes
} from "~~/packages/api/src";

// --- 状态管理 ---
const shortcodes = ref<ShortcodeDetail[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const isDeleting = ref<string | number | null>(null)

// --- 数据获取 ---
const fetchList = async () => {
  isLoading.value = true
  try {
    const { data } = await getAdminShortcodes()
    shortcodes.value = data || []
    console.log("[Log] Shortcodes fetched successfully.")
  } catch (error) {
    console.error("[Error] Failed to fetch shortcodes:", error)
  } finally {
    isLoading.value = false
  }
}

// --- 搜索过滤 ---
const filteredShortcodes = computed(() => {
  if (!searchQuery.value) return shortcodes.value
  const q = searchQuery.value.toLowerCase()
  return shortcodes.value.filter(s =>
    s.name?.toLowerCase().includes(q) ||
    s.displayName?.toLowerCase().includes(q)
  )
})

// --- 动作逻辑 (待实现) ---
const handleToggleStatus = async (item: ShortcodeDetail) => {
  // TODO: 调用 patchAdminShortcodesById 修改 isEnabled
  console.log("[Log] Toggle status for:", item.id)
}

const handleDelete = async (id: string | number) => {
  // TODO: 调用 deleteAdminShortcodesById
  isDeleting.value = id
  console.log("[Log] Deleting shortcode:", id)
}

const handleEdit = (id: string | number) => {
  navigateTo(`shortcode/editor?id=${id}`)
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <UContainer class="py-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <UIcon name="i-heroicons-cpu-chip" class="text-primary" />
          管理简码
        </h1>
        <p class="text-sm text-gray-500 mt-1">简码由前端浏览器直接执行的客户端代码和后端通过 Jint 引擎执行的后端代码组成。</p>
      </div>

      <div class="flex items-center gap-3">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Search shortcodes..."
          class="w-64"
        />
        <UButton
          icon="i-heroicons-plus"
          label="创建简码"
          to="/admin/shortcodes/new"
        />
      </div>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <USkeleton v-for="i in 6" :key="i" class="h-40 w-full bg-gray-800/50" />
    </div>

    <div v-else-if="filteredShortcodes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard
        v-for="item in filteredShortcodes"
        :key="item.id"
        class="group hover:ring-1 hover:ring-primary/50 transition-all bg-[#21252b] border-gray-700"
      >
        <template #header>
          <div class="flex items-start justify-between">
            <div class="overflow-hidden">
              <h3 class="font-bold text-gray-200 truncate">{{ item.displayName || item.name }}</h3>
              <p class="text-[10px] font-mono text-gray-500 truncate">{{ item.name }}</p>
            </div>
            <UBadge :color="item.isEnabled ? 'success' : 'primary'" variant="subtle" size="sm">
              {{ item.isEnabled ? 'Active' : 'Disabled' }}
            </UBadge>
          </div>
        </template>

        <p class="text-sm text-gray-400 line-clamp-2 min-h-[40px]">
          {{ item.description || 'No description provided.' }}
        </p>

        <template #footer>
          <div class="flex items-center justify-between">
            <div class="text-[10px] text-gray-500 italic">
              最后更改: {{ new Date(item.updatedAt!).toLocaleDateString() }}
            </div>
            <div class="flex gap-2">
              <UButton
                variant="ghost"
                color="gray"
                icon="i-lucide-pencil"
                size="sm"
                @click="handleEdit(item.id!)"
              />
              <UButton
                variant="ghost"
                color="primary"
                icon="i-lucide-power"
                size="sm"
                @click="handleToggleStatus(item)"
              />
              <UPopover>
                <UButton
                  variant="ghost"
                  color="error"
                  icon="i-lucide-trash"
                  size="sm"
                />
                <template #panel>
                  <div class="p-4 w-48 text-center">
                    <p class="text-xs mb-3 text-gray-200">Are you sure?</p>
                    <UButton
                      label="Confirm Delete"
                      color="error"
                      size="xs"
                      block
                      :loading="isDeleting === item.id"
                      @click="handleDelete(item.id!)"
                    />
                  </div>
                </template>
              </UPopover>
            </div>
          </div>
        </template>
      </UCard>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-24 bg-[#21252b] rounded-xl border-2 border-dashed border-gray-700">
      <UIcon name="i-heroicons-inbox" class="h-12 w-12 text-gray-600 mb-4" />
      <p class="text-gray-400">没有任何简码</p>
      <UButton variant="link" label="Clear search" @click="searchQuery = ''" />
    </div>
  </UContainer>
</template>

<style scoped>
/* 保持与编辑器一致的 JetBrains Mono 风格 */
.font-mono {
  font-family: 'JetBrains Mono', monospace;
}
</style>
