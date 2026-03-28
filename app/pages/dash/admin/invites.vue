<template>
  <div class="view-content">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="text-2xl font-bold text-highlighted tracking-tight">
          邀请码管理
        </h1>
        <p class="text-muted text-sm">生成并分发注册邀请码</p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="openForm(false)">
        生成新邀请码
      </UButton>
    </div>

    <UCard
      class="glass-card bg-(--ui-bg-elevated)/40 border border-default shadow-xl overflow-hidden"
    >
      <UTable :data="inviteCodes" :columns="columns">
        <template #code-cell="{ row }">
          <div class="flex items-center gap-2 group">
            <UBadge
              variant="subtle"
              color="primary"
              size="lg"
              class="font-mono cursor-pointer hover:ring-1 hover:ring-primary transition-all"
              @click="copyToClipboard(row.original.code!)"
            >
              {{ row.original.code }}
            </UBadge>
            <UIcon
              name="i-lucide-clipboard-document"
              class="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
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
          <span class="text-muted text-sm">
            {{ row.original.createdAt?.toLocaleString() }}
          </span>
        </template>

        <template #expireAt-cell="{ row }">
          <UBadge v-bind="getExpireBadgeProps(row.original.expireAt)" size="lg">
            {{ getExpireLabel(row.original.expireAt) }}
          </UBadge>
        </template>

        <template #usedCount-cell="{ row }">
          <UTooltip text="点击查看使用详情">
            <UBadge
              class="cursor-pointer select-none"
              variant="subtle"
              color="primary"
              size="lg"
              @click.stop="handleCountClick(row.original)"
            >
              {{ row.original.usedCount }} / {{ row.original.maxUses }}
            </UBadge>
          </UTooltip>
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
          v-model:page="page"
          :total="totalCount"
          :items-per-page="pageSize"
        />
      </div>
    </UCard>

    <CustomForm
      v-model:open="isModalOpen"
      v-model:config="form"
      v-model:form-data="formState"
      :loading="isSubmitting"
      :title="isEditMode ? '编辑邀请码' : '生成邀请码'"
      @success="handleFormSubmit"
    />

    <InformationForm
      :loading="invitationUsers.loading"
      v-model:open="invitationUsers.open"
      :users="invitationUsers.users"
    />
  </div>
</template>

<script lang="ts" setup>
import CustomForm from "~/components/CustomForm.vue";
import type { CreateInviteFormData } from "~/types/create-invite-form";
import type { FieldConfig } from "~/types/field-config";
import type { UpdateInviteFormData } from "~/types/update-invite-form";
import {
  deleteAdminInvitationsById,
  getAdminInvitations,
  getAdminInvitationsByIdUsers,
  postAdminInvitations,
  putAdminInvitationsById,
} from "~~/packages/api/src/sdk.gen";
import type { Invite, User } from "~~/packages/api/src/types.gen";

const toast = useToast();

const inviteCodes = ref<Invite[]>([]);
const isModalOpen = ref(false);
const isEditMode = ref(false);
const isSubmitting = ref(false);
const currentEditId = ref<number | null>(null);
const invitationUsers = ref({
  users: [] as User[],
  loading: true,
  open: false,
  page: {
    page: 1,
    size: 20,
    total: 0,
  },
});

const page = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);

const form: Ref<FieldConfig[]> = ref([
  {
    key: "uses",
    label: "使用次数限制",
    description: "该邀请码可以被激活的总次数",
    type: "number",
    min: 1,
    icon: "i-lucide-users",
  },
  {
    key: "hoursValid",
    label: "有效时间 (小时)",
    description: "表示该邀请码在创建时间后多久过期 (0 为永久)",
    type: "number",
    min: 0,
    icon: "i-lucide-clock",
    presets: [
      { label: "1h", value: 1 },
      { label: "1d", value: 24 },
      { label: "7d", value: 168 },
      { label: "30d", value: 720 },
      { label: "永久", value: 0 },
    ],
  },
]);
const formState: Ref<UpdateInviteFormData> = ref({
  uses: 1,
  hoursValid: 24,
  isDisabled: false,
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
      page: page.value,
      size: pageSize.value,
    },
  });
  if (!response.error && response.data) {
    inviteCodes.value = response.data;
    totalCount.value = parseInt(
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
      isDisabled: row.original.isDisabled,
    };
  } else {
    currentEditId.value = null;
    formState.value = { uses: 1, hoursValid: 24, isDisabled: false };
  }
  isModalOpen.value = true;
};

const handleCountClick = async (invite: Invite) => {
  console.log(invite);
  invitationUsers.value.loading = true;
  invitationUsers.value.open = true;
  try {
    const response = await getAdminInvitationsByIdUsers({
      path: { id: invite.id as number },
      query: {
        page: invitationUsers.value.page.page,
        size: invitationUsers.value.page.size,
      },
    });
    if (!response.error && response.data) {
      invitationUsers.value.page.total = parseInt(
        response.response.headers.get("x-total-count") || "0",
        10,
      );
      invitationUsers.value.users = response.data;
    }
  } finally {
    invitationUsers.value.loading = false;
  }
};

const handleFormSubmit = async (data: Record<string, any>) => {
  isSubmitting.value = true;
  try {
    const apiCall =
      isEditMode.value && currentEditId.value
        ? putAdminInvitationsById({
            path: { id: currentEditId.value },
            body: data as UpdateInviteFormData,
          })
        : postAdminInvitations({ body: data as CreateInviteFormData });

    const response = await apiCall;

    if (!response.error) {
      toast.add({
        title: isEditMode.value ? "修改成功" : "生成成功",
        color: "success",
        icon: "i-lucide-circle-check",
      });
      isModalOpen.value = false;
      refresh();
    }
  } catch (err) {
    toast.add({
      title: "操作失败",
      color: "error",
      icon: "i-lucide-circle-x",
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
    icon: "i-lucide-clipboard",
  });
};

const getActionItems = (row: any) => [
  { label: "操作菜单", type: "label" as const },
  {
    label: "编辑",
    icon: "i-lucide-pencil",
    onSelect: () => openForm(true, row),
  },
  { type: "separator" as const },
  {
    label: "删除",
    icon: "i-lucide-trash-2",
    color: "error" as const,
    onSelect: () => deleteInvite(row.original.id),
  },
];

watch(() => page, refresh);
onMounted(refresh);
</script>

<style scoped>
@reference "~/assets/css/main.css";

.glass-card {
  @apply backdrop-blur-xl transition-all duration-300;
}
</style>
