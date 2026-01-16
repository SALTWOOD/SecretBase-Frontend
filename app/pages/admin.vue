<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="brand-area"><span class="text-blue-500">SECRET</span>BASE</div>
      <nav class="flex-1 px-4 space-y-2 py-4">
        <NuxtLink 
          v-for="item in menu" 
          :key="item.id"
          :to="item.path"
          class="nav-item-link"
        >
          <UIcon :name="item.icon" class="w-5 h-5 mr-3" />
          {{ item.label }}
        </NuxtLink>
      </nav>
    </aside>

    <main class="content-wrapper">
      <header class="top-nav">
        <h2 class="text-sm font-bold tracking-widest text-slate-400">
          {{ currentPageLabel }}
        </h2>
      </header>

      <section class="p-8 overflow-y-auto">
        <NuxtPage />
      </section>
    </main>
  </div>
</template>

<script setup>
const route = useRoute()
const menu = [
  { id: 'users', label: '用户管理', icon: 'i-heroicons-user-group', path: '/admin/users' },
  { id: 'invites', label: '邀请码', icon: 'i-heroicons-ticket', path: '/admin/invites' },
  { id: 'settings', label: '站点设置', icon: 'i-heroicons-cog', path: '/admin/settings' }
]

// 根据当前路由路径匹配 Label
const currentPageLabel = computed(() => {
  return menu.find(m => m.path === route.path)?.label || '控制台'
})
</script>

<style scoped>
@reference "../assets/css/main.css";

.admin-layout {
    /* 背景改为深蓝色调的 slate-950 */
    @apply min-h-screen flex bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30;
}

.sidebar {
    /* 侧边栏稍微透出背景色 */
    @apply w-64 border-r border-slate-900 bg-slate-950/80 backdrop-blur-xl flex flex-col;
}

.brand-area {
    @apply p-8 text-center font-black tracking-tighter text-2xl italic text-white border-b border-slate-900;
}

.nav-item {
    /* 交互态优化 */
    @apply w-full justify-start text-slate-400 hover:text-white hover:bg-slate-900 transition-all duration-200 py-2.5 px-4;
}

.nav-item.active {
    /* 亮蓝色点缀 */
    @apply text-blue-400 bg-blue-500/10 border-r-2 border-blue-500 rounded-none;
}

.content-wrapper {
    /* 渐变背景增加深度感 */
    @apply flex-1 flex flex-col overflow-hidden from-slate-900 via-slate-950 to-slate-950;
}

.top-nav {
    @apply h-16 border-b border-slate-900 px-8 flex items-center justify-between bg-slate-950/50 backdrop-blur-md sticky top-0 z-10;
}

.glass-card {
    /* 卡片玻璃拟态 */
    @apply bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-xl ring-1 ring-white/5;
}

:deep(.u-table-thead) {
    @apply bg-slate-900/50;
}

.view-content {
    animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.nav-item-link {
  @apply flex items-center w-full py-2.5 px-4 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all;
}

/* NuxtLink 自动添加的激活类 */
.router-link-active {
  @apply text-blue-400 bg-blue-500/10 border-r-2 border-blue-500 rounded-none;
}
</style>