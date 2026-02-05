<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable>
      <template #default="{ collapsed }">
        <div
          class="flex items-center justify-center py-4 shrink-0 overflow-hidden transition-all"
        >
          <div class="font-black tracking-tighter text-xl whitespace-nowrap">
            <span class="text-primary">SECRET</span>
            <span v-show="!collapsed" class="text-highlighted ml-1">BASE</span>
          </div>
        </div>

        <UDashboardSearchButton :collapsed="collapsed" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="sidebarItems"
          orientation="vertical"
        />
      </template>

      <template #footer="{ collapsed }">
        <UDropdownMenu :items="userMenu">
          <UButton
            variant="ghost"
            color="neutral"
            block
            :square="collapsed"
            class="justify-start px-2"
          >
            <UAvatar :src="user?.avatar" size="sm" />
            <div
              v-if="!collapsed"
              class="text-left ml-2 overflow-hidden flex-1"
            >
              <p class="text-sm font-bold text-highlighted truncate">
                {{ user?.username }}
              </p>
              <p class="text-xs text-muted truncate">{{ user?.email }}</p>
            </div>
            <UIcon
              v-if="!collapsed"
              name="i-lucide-chevrons-up-down"
              class="ml-auto text-muted shrink-0"
            />
          </UButton>
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar>
          <template #left>
            <UDashboardSidebarCollapse />
            <UBreadcrumb :items="breadcrumbItems" class="ml-2" />
          </template>

          <template #right>
            <UColorModeButton />
            <UButton icon="i-lucide-bell" variant="ghost" color="neutral" />
            <UButton icon="i-lucide-search" variant="ghost" color="neutral" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="max-w-7xl mx-auto w-full">
          <NuxtPage />
        </div>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>

<script setup lang="ts">
import type { User } from "~/types/user";
import { postAuthLogout } from "~~/packages/api/src/sdk.gen";

interface NavigationItem {
  label: string;
  icon?: string;
  to?: string;
  exact?: boolean;
  onSelect?: () => void;
  type?: "link" | "trigger";
  defaultOpen?: boolean;
  children?: NavigationItem[];
  hidden?: boolean;
  condition?: () => boolean;
}

const route = useRoute();
const isAdmin = ref(true);
const toast = useToast();
const user: Ref<User | null> = ref(null);
const userStore = useUserStore();

const allNavigationItems = computed<NavigationItem[]>(() => [
  {
    label: "控制台概览",
    icon: "i-lucide-house",
    to: "/dash",
    exact: true,
  },
  {
    label: "我的",
    icon: "i-lucide-user",
    type: "trigger",
    defaultOpen: true,
    children: [
      {
        label: "个人资料",
        icon: "i-lucide-user-circle",
        to: "/dash/user/profile",
      },
      {
        label: "我的消息",
        icon: "i-lucide-messages-square",
        to: "/dash/user/messages",
      },
    ],
  },
  {
    label: "管理后台",
    icon: "i-lucide-shield-check",
    type: "trigger",
    condition: () => isAdmin.value,
    defaultOpen: false,
    children: [
      {
        label: "用户管理",
        icon: "i-lucide-users",
        to: "/dash/admin/users",
      },
      {
        label: "邀请码管理",
        icon: "i-lucide-ticket",
        to: "/dash/admin/invites",
      },
      {
        label: "站点设置",
        icon: "i-lucide-settings",
        to: "/dash/admin/settings",
      },
    ],
  },
  {
    label: "控制台",
    icon: "i-lucide-terminal",
    to: "/dash/console",
    exact: true,
    hidden: true,
  },
]);

const sidebarItems = computed(() => {
  return allNavigationItems.value
    .filter((item) => !item.hidden)
    .filter((item) => !item.condition || item.condition());
});

const breadcrumbItems = computed(() => {
  const flatItems: NavigationItem[] = [];

  allNavigationItems.value.forEach((item) => {
    if (item.condition && !item.condition()) return;

    if (item.children) {
      flatItems.push(...item.children);
    } else {
      flatItems.push(item);
    }
  });

  const current = flatItems.find((i) => i.to === route.path);
  return [
    { label: "控制台", to: "/dash" },
    ...(current ? [{ label: current.label }] : []),
  ];
});

const userMenu = [
  [
    {
      label: "个人设置",
      icon: "i-lucide-settings",
      to: "/dash/user/profile",
    },
  ],
  [
    {
      label: "退出登录",
      icon: "i-lucide-log-out",
      color: "error" as const,
      onSelect: async () => {
        await postAuthLogout();
        userStore.reset();
        toast.add({ title: "已退出登录", color: "success" });
        navigateTo({
          path: "/auth/login",
          query: { redirect: route.fullPath },
        });
      },
    },
  ],
];

onMounted(() => {
  if (userStore.user) {
    user.value = userStore.user;
  }
});
</script>

<style scoped>
@reference '~/assets/css/main.css';

.bg-grid-slate {
  background-image: radial-gradient(
    circle at 2px 2px,
    rgba(51, 65, 85, 0.15) 1px,
    transparent 0
  );
  background-size: 24px 24px;
}

:deep(.UDashboardSidebar) {
  @apply h-full;
}

:deep(.UNavigationMenu) {
  --ui-primary: theme("colors.blue.500");
}
</style>
