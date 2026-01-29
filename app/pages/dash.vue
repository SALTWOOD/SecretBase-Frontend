<template>
  <div class="admin-layout bg-grid-slate">
    <aside class="sidebar">
      <div class="brand-area">
        <span class="text-blue-500">SECRET</span>BASE
      </div>

      <nav class="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        <div v-for="group in navigationGroups" :key="group.label || group.path">

          <template v-if="group.type === 'single'">
            <NuxtLink
              :to="group.path"
              class="admin-sidebar-item"
              :[getMatchMode(group)]="'admin-sidebar-item-active'"
            >
              <UIcon :name="group.icon" class="w-5 h-5" />
              <span class="font-medium">{{ group.label }}</span>
            </NuxtLink>
          </template>

          <template v-else-if="group.type === 'group'">
            <p :class="[
              'sidebar-group-label transition-colors duration-200',
              isGroupActive(group) ? 'text-blue-500 font-bold' : 'text-slate-500'
            ]">
              {{ group.label }}
            </p>

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
          </template>
        </div>
      </nav>

      <div class="p-4 border-t border-slate-900 bg-slate-950/50">
        <UDropdown :items="userMenu" :ui="{ width: 'w-48' }">
          <UButton variant="ghost" color="neutral" block class="justify-start px-2">
            <UAvatar src="https://github.com/nuxt.png" size="sm" />
            <div class="text-left ml-2 overflow-hidden">
              <p class="text-sm font-bold text-white truncate">Admin User</p>
              <p class="text-xs text-slate-500 truncate">admin@secret.base</p>
            </div>
          </UButton>
        </UDropdown>
      </div>
    </aside>

    <main class="content-wrapper">
      <header class="top-nav">
        <UBreadcrumb :items="breadcrumbItems" />
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
const isAdmin = ref(true)

const navigationGroups = computed(() => [
  {
    type: 'single',
    label: '控制台概览',
    icon: 'i-heroicons-home',
    path: '/dash',
    exact: true
  },
  {
    type: 'group',
    label: '个人中心',
    items: [
      { label: '个人资料', icon: 'i-heroicons-user-circle', path: '/dash/user/profile' },
      { label: '我的消息', icon: 'i-heroicons-chat-bubble-left-right', path: '/dash/user/messages' },
    ]
  },
  ...(isAdmin.value ? [{
    type: 'group',
    label: '管理后台',
    items: [
      { label: '用户管理', icon: 'i-heroicons-user-group', path: '/dash/admin/users' },
      { label: '邀请码管理', icon: 'i-heroicons-ticket', path: '/dash/admin/invites' },
      { label: '站点设置', icon: 'i-heroicons-cog-6-tooth', path: '/dash/admin/settings' }
    ]
  }] : [])
])

const getMatchMode = (item: any) => {
  return (item.exact ?? true) ? 'exact-active-class' : 'active-class'
}

const isGroupActive = (group: any) => {
  if (group.type !== 'group') return false
  return group.items.some((item: any) => route.path.startsWith(item.path))
}

const breadcrumbItems = computed(() => {
  const flatItems = navigationGroups.value.flatMap(g => g.type === 'single' ? [g] : g.items)
  const current = flatItems.find(i => i.path === route.path)

  return [
    { label: '控制台', to: '/dash' },
    ...(current ? [{ label: current.label }] : [])
  ]
})

const userMenu = [
  [{ label: '个人设置', icon: 'i-heroicons-cog-8-tooth', to: '/dash/user/profile' }],
  [{ label: '退出登录', icon: 'i-heroicons-arrow-right-on-rectangle', color: 'red' as const, click: () => console.log('Logout') }]
]
</script>

<style scoped>
@reference "~/assets/css/main.css";

.admin-layout { @apply min-h-screen flex bg-slate-950 text-slate-300; }
.sidebar { @apply w-64 border-r border-slate-900 bg-slate-950/80 backdrop-blur-xl flex flex-col sticky top-0 h-screen; }
.brand-area { @apply p-6 text-center font-black tracking-tighter text-xl italic text-white border-b border-slate-900; }
.content-wrapper { @apply flex-1 flex flex-col min-w-0; }
.top-nav { @apply h-16 border-b border-slate-900 px-8 flex items-center justify-between bg-slate-950/50 backdrop-blur-md sticky top-0 z-10; }
</style>
