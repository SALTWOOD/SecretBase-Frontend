<template>
  <div class="view-content">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">用户管理</h1>
        <p class="text-slate-400 text-sm mt-1">查看系统中的所有注册用户并管理其权限</p>
      </div>
      <div class="flex gap-2">
        <UButton color="neutral" variant="subtle" icon="i-heroicons-arrow-path" @click="refresh">刷新</UButton>
        <UButton color="primary" icon="i-heroicons-user-plus">新增用户</UButton>
      </div>
    </div>

    <UCard class="mb-6 bg-slate-900/20 border-slate-800">
      <div class="flex flex-wrap items-center gap-4">
        <UInput 
          v-model="search" 
          placeholder="搜索用户名、邮箱..." 
          icon="i-heroicons-magnifying-glass" 
          class="w-full max-w-xs"
        />
        <USelectMenu 
          v-model="selectedStatus" 
          :options="['全部状态', 'Active', 'Inactive', 'Banned']" 
          class="w-40" 
        />
      </div>
    </UCard>

    <UCard class="glass-card overflow-hidden" :ui="{ body: { padding: 'p-0' } }">
      <UTable :rows="filteredUsers" :columns="columns">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar :src="row.getValue('avatar')" size="sm" />
            <div class="flex flex-col">
              <span class="text-white font-medium">{{ row.getValue('name') }}</span>
              <span class="text-xs text-slate-500">{{ row.original.email }}</span>
            </div>
          </div>
        </template>

        <template #status-cell="{ row }">
          <UBadge 
            :color="getStatusColor(row.getValue('status'))" 
            variant="subtle" 
            size="sm"
            class="capitalize"
          >
            {{ row.getValue('status') }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <UDropdown :items="getActionItems(row.original)">
            <UButton color="neutral" variant="ghost" icon="i-heroicons-ellipsis-horizontal" />
          </UDropdown>
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script setup>
// 定义表格列 (符合 Nuxt UI v3 / TanStack 规范)
const columns = [
  { accessorKey: 'name', header: '用户信息' },
  { accessorKey: 'role', header: '角色' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'lastLogin', header: '最后登录' },
  { accessorKey: 'actions', header: '' }
]

// 模拟数据
const search = ref('')
const selectedStatus = ref('全部状态')
const users = ref([
  { id: 1, name: 'Gemini', email: 'ai@google.com', role: 'Admin', status: 'Active', lastLogin: '2026-01-15', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gemini' },
  { id: 2, name: 'SaltWood', email: 'user@example.com', role: 'User', status: 'Active', lastLogin: '2026-01-14', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Salt' },
  { id: 3, name: 'OldRobot', email: 'bot@legacy.com', role: 'User', status: 'Banned', lastLogin: '2025-12-01', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robot' }
])

// 过滤逻辑
const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.value.toLowerCase()) || u.email.includes(search.value)
    const matchesStatus = selectedStatus.value === '全部状态' || u.status === selectedStatus.value
    return matchesSearch && matchesStatus
  })
})

// 状态颜色映射
const getStatusColor = (status) => {
  switch (status) {
    case 'Active': return 'success'
    case 'Banned': return 'error'
    case 'Inactive': return 'neutral'
    default: return 'primary'
  }
}

// 操作菜单定义
const getActionItems = (user) => [[
  { label: '编辑资料', icon: 'i-heroicons-pencil-square' },
  { label: '重置密码', icon: 'i-heroicons-key' }
], [
  { label: user.status === 'Banned' ? '解除封禁' : '封禁账户', icon: 'i-heroicons-no-symbol', color: 'error' }
]]

const refresh = () => {
  // 这里以后可以写你的 API 调用逻辑
  console.log('Refreshing user list...')
}
</script>

<style scoped>
@reference "~/assets/css/main.css";

.glass-card {
  @apply bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-xl;
}

/* 即使使用了 Nuxt UI，一些细节仍可微调 */
:deep(table) {
  @apply text-sm;
}
</style>