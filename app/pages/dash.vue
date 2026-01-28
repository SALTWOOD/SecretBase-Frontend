<template>
  <div class="admin-layout bg-grid-slate">
    <aside class="sidebar">
      <div class="brand-area">
        <span class="text-blue-500">SECRET</span>BASE
      </div>

      <nav class="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
        <div v-for="group in navigationGroups" :key="group.label">
          <p class="sidebar-group-label">{{ group.label }}</p>
          <div class="mt-2 space-y-1">
            <NuxtLink 
              v-for="item in group.items" 
              :key="item.path"
              :to="item.path"
              class="admin-sidebar-item"
              active-class="admin-sidebar-item-active"
            >
              <UIcon :name="item.icon" class="w-5 h-5" />
              {{ item.label }}
            </NuxtLink>
          </div>
        </div>
      </nav>

      <div class="p-4 border-t border-slate-900 bg-slate-950/50">
        <UButton variant="ghost" color="neutral" block class="justify-start">
          <UAvatar src="https://github.com/nuxt.png" size="sm" />
          <div class="text-left ml-2 overflow-hidden">
            <p class="text-sm font-bold text-white truncate">Admin User</p>
            <p class="text-xs text-slate-500 truncate">admin@secret.base</p>
          </div>
        </UButton>
      </div>
    </aside>

    <main class="content-wrapper">
      <header class="top-nav">
        <div class="flex items-center gap-4">
          <UBreadcrumb :items="breadcrumbItems" />
        </div>
        <div class="flex items-center gap-3">
          <UButton icon="i-heroicons-bell" variant="ghost" color="neutral" />
          <UButton icon="i-heroicons-magnifying-glass" variant="ghost" color="neutral" />
        </div>
      </header>

      <section class="p-8 overflow-y-auto view-content">
        <NuxtPage />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

// 模拟权限控制：是否显示“管理后台”分组
const isAdmin = computed(() => true) 

const navigationGroups = computed(() => {
  const groups = [
    {
      label: '个人中心',
      items: [
        { label: '个人资料', icon: 'i-heroicons-user-circle', path: '/dash/user/profile' },
        { label: '我的消息', icon: 'i-heroicons-chat-bubble-left-right', path: '/dash/user/messages' },
      ]
    }
  ]

  // 如果是管理员，则插入管理后台项
  if (isAdmin.value) {
    groups.push({
      label: '管理后台',
      items: [
        { label: '用户管理', icon: 'i-heroicons-user-group', path: '/dash/admin/users' },
        { label: '邀请码管理', icon: 'i-heroicons-ticket', path: '/dash/admin/invites' },
        { label: '站点设置', icon: 'i-heroicons-cog-6-tooth', path: '/dash/admin/settings' }
      ]
    })
  }

  return groups
})

// 面包屑导航自动生成
const breadcrumbItems = computed(() => {
  const allItems = navigationGroups.value.flatMap(g => g.items)
  const current = allItems.find(i => i.path === route.path)
  return [
    { label: '后台', to: '/dash' },
    { label: current?.label || '控制台' }
  ]
})
</script>

<style scoped>
@reference "~/assets/css/main.css";

.admin-layout {
  @apply min-h-screen flex bg-slate-950 text-slate-300;
}

.sidebar {
  @apply w-64 border-r border-slate-900 bg-slate-950/80 backdrop-blur-xl flex flex-col sticky top-0 h-screen;
}

.brand-area {
  @apply p-6 text-center font-black tracking-tighter text-xl italic text-white border-b border-slate-900;
}

.content-wrapper {
  @apply flex-1 flex flex-col min-w-0;
}

.top-nav {
  @apply h-16 border-b border-slate-900 px-8 flex items-center justify-between bg-slate-950/50 backdrop-blur-md sticky top-0 z-10;
}

.view-content {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>