<template>
  <div class="view-content">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">邀请码管理</h1>
        <p class="text-slate-400 text-sm">生成并分发注册邀请码</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" @click="openForm(false)">
        生成新邀请码
      </UButton>
    </div>

    <UCard class="glass-card">
      <UTable :data="inviteCodes" :columns="columns">
        <template #code-cell="{ row }">
          <div class="flex items-center gap-2 group">
            <UBadge
              variant="subtle"
              color="primary"
              size="lg"
              class="font-mono cursor-pointer hover:ring-1 hover:ring-primary-500 transition-all"
              @click="copyToClipboard(row.original.code!)"
            >
              {{ row.original.code }}
            </UBadge>
            <UIcon
              name="i-heroicons-clipboard-document"
              class="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              @click="copyToClipboard(row.original.code!)"
            />
          </div>
        </template>

        <template #creator-cell="{ row }">
          <UserCell
            :username="row.original.creator?.username!"
            :email="row.original.creator?.email"
            :avatar="row.original.creator?.avatar"
          />
        </template>

        <template #createdAt-cell="{ row }">
          <span class="text-slate-500 text-sm">
            {{ row.original.createdAt?.toLocaleString() }}
          </span>
        </template>

        <template #expireAt-cell="{ row }">
          <UBadge v-bind="getExpireBadgeProps(row.original.expireAt)" size="lg">
            {{ getExpireLabel(row.original.expireAt) }}
          </UBadge>
        </template>

        <template #usedCount-cell="{ row }">
          <UBadge variant="subtle" color="primary" size="lg">
            {{ row.original.usedCount }} / {{ row.original.maxUses }}
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

    <GenerateInviteForm
      v-model:open="isModalOpen"
      v-model:form-data="formState"
      :loading="isSubmitting"
      :title="isEditMode ? '编辑邀请码' : '生成邀请码'"
      @success="handleFormSubmit"
    />
  </div>
</template>

<script lang="ts" setup>
import GenerateInviteForm from "~/components/GenerateInviteForm.vue";
import {
  deleteAdminInvitationsById,
  getAdminInvitations,
  postAdminInvitations,
  putAdminInvitationsById,
} from "~~/packages/api/src/sdk.gen";
import type { InviteTable } from "~~/packages/api/src/types.gen";

const toast = useToast();

const inviteCodes = ref<InviteTable[]>([]);
const isModalOpen = ref(false);
const isEditMode = ref(false);
const isSubmitting = ref(false);
const currentEditId = ref<number | null>(null);

const page = ref({
  page: 1,
  size: 20,
  total: 0,
});

const formState = ref({
  uses: 1,
  hoursValid: 24,
});

const columns = [
  { accessorKey: "code", header: "邀请码" },
  { accessorKey: "creator", header: "创建者" },
  { accessorKey: "createdAt", header: "创建时间" },
  { accessorKey: "expireAt", header: "失效时间" },
  { accessorKey: "usedCount", header: "使用次数" },
  { accessorKey: "actions", header: "操作" },
];

const refresh = async () => {
  const response = await getAdminInvitations({
    query: {
      page: page.value.page,
      size: page.value.size,
    },
  });
  if (!response.error && response.data) {
    inviteCodes.value = response.data;
    page.value.total = parseInt(
      response.response.headers.get("x-total-count") || "0",
      10,
    );
  }
};

const openForm = (editMode: boolean, row?: any) => {
  isEditMode.value = editMode;
  if (editMode && row) {
    currentEditId.value = row.original.id;
    formState.value = {
      uses: row.original.maxUses,
      hoursValid: row.original.expireAt
        ? Math.ceil(
            (new Date(row.original.expireAt).getTime() -
              new Date(row.original.createdAt).getTime()) /
              (1000 * 60 * 60),
          )
        : 0,
    };
  } else {
    currentEditId.value = null;
    formState.value = { uses: 1, hoursValid: 24 };
  }
  isModalOpen.value = true;
};

const handleFormSubmit = async (data: { uses: number; hoursValid: number }) => {
  isSubmitting.value = true;
  try {
    const apiCall =
      isEditMode.value && currentEditId.value
        ? putAdminInvitationsById({
            path: { id: currentEditId.value },
            body: data,
          })
        : postAdminInvitations({ body: data });

    const response = await apiCall;

    if (!response.error) {
      toast.add({
        title: isEditMode.value ? "修改成功" : "生成成功",
        color: "success",
        icon: "i-heroicons-check-circle",
      });
      isModalOpen.value = false;
      refresh();
    }
  } catch (err) {
    toast.add({
      title: "操作失败",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const deleteInvite = async (id: number) => {
  const response = await deleteAdminInvitationsById({ path: { id } });
  if (!response.error) {
    toast.add({ title: "删除成功", color: "success" });
    refresh();
  }
};

const getExpireLabel = (expireAt: Date | null | undefined) => {
  if (!expireAt) return "永久有效";
  return expireAt < new Date()
    ? `已过期 (${expireAt.toLocaleDateString()})`
    : expireAt.toLocaleString();
};

const getExpireBadgeProps = (expireAt: Date | null | undefined) => {
  if (!expireAt) return { color: "success" as const, variant: "soft" as const };
  return expireAt < new Date()
    ? { color: "error" as const, variant: "solid" as const }
    : { color: "info" as const, variant: "outline" as const };
};

const copyToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text);
  toast.add({
    title: "复制成功",
    color: "success",
    icon: "i-heroicons-clipboard",
  });
};

const getActionItems = (row: any) => [
  { label: "操作菜单", type: "label" as const },
  {
    label: "编辑",
    icon: "i-heroicons-pencil-square",
    onSelect: () => openForm(true, row),
  },
  { type: "separator" as const },
  {
    label: "删除",
    icon: "i-heroicons-trash",
    color: "error" as const,
    onSelect: () => deleteInvite(row.original.id),
  },
];

watch(
  () => page.value.page,
  () => refresh(),
);
onMounted(() => refresh());
</script>
