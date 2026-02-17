<template>
  <div class="view-content">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-2xl font-bold text-highlighted tracking-tight">
          用户管理
        </h1>
        <p class="text-muted text-sm mt-1">
          查看系统中的所有注册用户并管理其权限
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="subtle"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          @click="refresh"
          >刷新
        </UButton>
        <UButton color="primary" icon="i-lucide-user-plus">新增用户</UButton>
      </div>
    </div>

    <UCard class="mb-6 bg-(--ui-bg-elevated)/50 border border-default">
      <div class="flex flex-wrap items-center gap-4">
        <UInput
          v-model="search"
          placeholder="搜索用户名、邮箱..."
          icon="i-lucide-search"
          class="w-full max-w-xs"
        />
        <USelectMenu
          v-model="selectedStatus"
          :items="Object.values(UserStatusFilter)"
          class="w-40"
        />
        <USelectMenu
          v-model="selectedRole"
          :items="Object.values(UserRoleFilter)"
          class="w-40"
        />
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-rotate-ccw"
          @click="resetFilters"
        />
      </div>
    </UCard>

    <UCard
      class="glass-card overflow-hidden bg-(--ui-bg-elevated)/40 border border-default backdrop-blur-xl shadow-xl"
    >
      <UTable :data="filteredUsers" :columns="columns" :loading="loading">
        <template #username-cell="{ row }">
          <UserCell
            :username="row.original.username"
            :email="row.original.email"
            :avatar="row.original.avatar"
          />
        </template>

        <template #role-cell="{ row }">
          <RoleBadge :role="row.original.role" />
        </template>

        <template #isBanned-cell="{ row }">
          <UBadge
            :color="row.original.isBanned ? 'error' : 'success'"
            variant="subtle"
            size="md"
          >
            {{ row.original.isBanned ? "已封禁" : "正常" }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <UDropdownMenu
            :items="getActionItems(row)"
            :content="{ align: 'end', sideOffset: 8 }"
          >
            <UButton color="neutral" variant="ghost" icon="i-lucide-ellipsis" />
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
import {
  getAdminUsers,
  putAdminUsersByIdStatus,
} from "~~/packages/api/src/sdk.gen";

enum UserStatusFilter {
  All = "全部状态",
  Active = "正常",
  Banned = "已封禁",
}

enum UserRoleFilter {
  All = "全部等级",
  Admin = "管理",
  User = "用户",
  Guest = "访客",
}

const toast = useToast();
const loading = ref(false);
const search = ref("");
const selectedStatus = ref(UserStatusFilter.All);
const selectedRole = ref(UserRoleFilter.All);
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

const resetFilters = () => {
  search.value = "";
  selectedStatus.value = UserStatusFilter.All;
  selectedRole.value = UserRoleFilter.All;
  page.value.page = 1;
};

const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    // Search keywords
    const searchStr = search.value.toLowerCase();
    const matchesSearch =
      u.username.toLowerCase().includes(searchStr) ||
      u.email.toLowerCase().includes(searchStr);

    // Status
    const matchesStatus =
      selectedStatus.value === "全部状态" ||
      (selectedStatus.value === "已封禁" && u.isBanned) ||
      (selectedStatus.value === "正常" && !u.isBanned);

    // Permission (Role)
    const roleMap: Record<string, number[]> = {
      管理: [2, 3],
      用户: [1],
      访客: [0],
    };
    const matchesRole =
      selectedRole.value === "全部等级" ||
      roleMap[selectedRole.value]?.includes(u.role);

    return matchesSearch && matchesStatus && matchesRole;
  });
});

// 菜单项定义
const getActionItems = (row: any) => [
  {
    type: "label" as const,
    label: "操作菜单",
  },
  {
    label: "编辑资料",
    icon: "i-lucide-pencil",
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
    icon: "i-lucide-ban",
    color: "error" as const,
    onSelect: () => handleToggleBan(row.original),
  },
];

const handleToggleBan = async (user: User) => {
  // 这里调用你之前的 API 逻辑
  const response = await putAdminUsersByIdStatus({
    path: { id: user.id as number },
    body: {
      isBanned: !user.isBanned,
    },
  });
  if (!response.error) {
    toast.add({ title: "操作发送成功", color: "primary" });
  }
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

watch(
  () => page.value.page,
  () => refresh(),
);
onMounted(refresh);
</script>

<style scoped>
@reference "~/assets/css/main.css";

.glass-card {
  @apply backdrop-blur-xl border border-default shadow-xl;
}

:deep(table) {
  @apply text-sm;
}
</style>
