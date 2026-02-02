<template>
  <div class="view-content">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">用户管理</h1>
        <p class="text-slate-400 text-sm mt-1">
          查看系统中的所有注册用户并管理其权限
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="subtle"
          icon="i-heroicons-arrow-path"
          :loading="loading"
          @click="refresh"
          >刷新
        </UButton>
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
          :options="['全部状态', '正常', '已封禁']"
          class="w-40"
        />
      </div>
    </UCard>

    <UCard class="glass-card overflow-hidden">
      <UTable :data="filteredUsers" :columns="columns" :loading="loading">
        <template #username-cell="{ row }">
          <UserCell
            :username="row.original.username"
            :email="row.original.email"
            :avatar="row.original.avatar"
          />
        </template>

        <template #role-cell="{ row }">
          <UBadge variant="subtle" color="neutral" size="md">
            {{ getRoleText(row.original.role) }}
          </UBadge>
        </template>

        <template #isBanned-cell="{ row }">
          <UBadge
            :color="row.original.isBanned ? 'error' : 'success'"
            variant="subtle"
            size="sm"
          >
            {{ row.original.isBanned ? "已封禁" : "正常" }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <UDropdownMenu
            :items="getActionItems(row)"
            :content="{ align: 'end', sideOffset: 8 }"
          >
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-ellipsis-horizontal"
            />
          </UDropdownMenu>
        </template>
      </UTable>

      <div class="mt-4 flex justify-center">
        <UPagination
          v-model:page="page.page"
          :total="page.total"
          :items-per-page="page.size"
        />
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import type { User } from "~/types/user";
import { getAdminUsers } from "~~/packages/api/src/sdk.gen";

const toast = useToast();
const loading = ref(false);
const search = ref("");
const selectedStatus = ref("全部状态");
const users = ref<User[]>([]);

const page = ref({
  page: 1,
  size: 20,
  total: 0,
});

const columns = [
  { accessorKey: "username", header: "用户信息" },
  { accessorKey: "role", header: "权限" },
  { accessorKey: "isBanned", header: "状态" },
  { accessorKey: "actions", header: "" },
];

// 核心修复：筛选逻辑 (字符串选项 -> 匹配布尔值)
const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    const searchStr = search.value.toLowerCase();
    const matchesSearch =
      u.username.toLowerCase().includes(searchStr) ||
      u.email.toLowerCase().includes(searchStr);

    let matchesStatus = true;
    if (selectedStatus.value === "已封禁") matchesStatus = u.isBanned === true;
    if (selectedStatus.value === "正常") matchesStatus = u.isBanned === false;

    return matchesSearch && matchesStatus;
  });
});

const getRoleText = (role: number) => {
  const roles: Record<number, string> = { 2: "管理", 1: "用户", 0: "访客" };
  return roles[role] || "未知";
};

// 菜单项定义
const getActionItems = (row: any) => [
  {
    type: "label" as const,
    label: "操作菜单",
  },
  {
    label: "编辑资料",
    icon: "i-heroicons-pencil-square",
    onSelect: () => console.log("编辑", row.original),
  },
  {
    label: "重置密码",
    icon: "i-heroicons-key",
    onSelect: () => console.log("重置密码", row.original),
  },
  {
    type: "separator" as const,
  },
  {
    label: row.original.isBanned ? "解除封禁" : "封禁账户",
    icon: "i-heroicons-no-symbol",
    color: "error" as const,
    onSelect: () => handleToggleBan(row.original),
  },
];

const handleToggleBan = async (user: User) => {
  // 这里调用你之前的 API 逻辑
  console.log("Toggle Ban for:", user.username);
  toast.add({ title: "操作发送成功", color: "primary" });
};

const refresh = async () => {
  loading.value = true;
  try {
    const response = await getAdminUsers({
      query: {
        page: page.value.page,
        size: page.value.size,
      },
    });
    if (!response.error) {
      users.value = response.data as User[];
      page.value.total = parseInt(
        response.response.headers.get("x-total-count") || "0",
        10,
      );
    }
  } catch (e) {
    toast.add({ title: "刷新失败", color: "error" });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  refresh();
});
</script>

<style scoped>
@reference "~/assets/css/main.css";

.glass-card {
  @apply bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-xl;
}

:deep(table) {
  @apply text-sm;
}
</style>
