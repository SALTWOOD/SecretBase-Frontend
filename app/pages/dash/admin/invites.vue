<template>
  <div class="view-content">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">邀请码管理</h1>
        <p class="text-slate-400 text-sm">生成并分发注册邀请码</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" @click="openGenerateForm = true">
        生成新邀请码
      </UButton>
    </div>

    <UCard class="glass-card">
      <UPagination v-model:page="page.page" :total="page.total" :items-per-page="page.size" />
      <UTable :data="inviteCodes" :columns="columns">
        <template #code-cell="{ row }">
          <div class="flex items-center gap-2 group">
            <UBadge variant="subtle" color="primary" size="lg"
              class="font-mono cursor-pointer hover:ring-1 hover:ring-primary-500 transition-all"
              @click="copyToClipboard(row.original.code!)">
              {{ row.original.code }}
            </UBadge>
            <UIcon name="i-heroicons-clipboard-document"
              class="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              @click="copyToClipboard(row.original.code!)" />
          </div>
        </template>

        <template #creator-cell="{ row }">
          <UserCell :username="row.original.creator?.username!" :email="row.original.creator?.email"
            :avatar="row.original.creator?.avatar" />
        </template>

        <template #createdAt-cell="{ row }">
          <span class="text-slate-500 text-sm">
            {{ row.original.createdAt?.toLocaleString() }}
          </span>
        </template>

        <template #expireAt-cell="{ row }">
          <UBadge v-if="!row.original.expireAt" color="success" variant="soft" size="lg">
            永久有效
          </UBadge>

          <UBadge v-else-if="new Date(row.original.expireAt) < new Date()" color="error" variant="solid" size="lg">
            已过期 ({{ new Date(row.original.expireAt).toLocaleDateString() }})
          </UBadge>

          <UBadge v-else color="info" variant="outline" size="lg" class="font-mono">
            {{ new Date(row.original.expireAt).toLocaleString() }}
          </UBadge>
        </template>

        <template #usedCount-cell="{ row }">
          <UBadge variant="subtle" color="primary" size="lg">
            {{ row.original.usedCount }} / {{ row.original.maxUses }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <UDropdownMenu :items="getActionItems(row)" :content="{ align: 'end', sideOffset: 8 }">
            <UButton color="neutral" variant="ghost" icon="i-heroicons-ellipsis-horizontal" />
          </UDropdownMenu>
        </template>
      </UTable>
    </UCard>

    <GenerateInviteForm v-model:loading="loadingGenerateForm" v-model:open="openGenerateForm"
      @success="handleGenerate" />
    <GenerateInviteForm v-model:loading="loadingEditForm" v-model:open="openEditForm" @success="handleEdit" />
  </div>
</template>

<script lang="ts" setup>
import GenerateInviteForm from '~/components/GenerateInviteForm.vue';
import { deleteAdminInvitationsById, getAdminInvitations, postAdminInvitations, putAdminInvitationsById } from '~~/packages/api/src/sdk.gen';
import type { InviteTable } from '~~/packages/api/src/types.gen';

const toast = useToast();

const columns = [
  { accessorKey: 'code', header: '邀请码' },
  { accessorKey: 'creator', header: '创建者' },
  { accessorKey: 'createdAt', header: '创建时间' },
  { accessorKey: 'expireAt', header: '失效时间' },
  { accessorKey: 'usedCount', header: '使用次数' },
  { accessorKey: 'actions', header: '操作' }
]

const page = ref({
  page: 1,
  size: 20,
  total: 20
});
const inviteCodes = ref<InviteTable[]>([]);
const openGenerateForm = ref(false);
const openEditForm = ref(false);
const loadingGenerateForm = ref(false);
const loadingEditForm = ref(false);
const currentEditId = ref<number | null>(null);

const handleGenerate = async (data: { uses: number, hoursValid: number }) => {
  loadingGenerateForm.value = true
  try {
    const response = await postAdminInvitations({
      body: {
        uses: data.uses,
        hoursValid: data.hoursValid
      }
    });
    openGenerateForm.value = false;
    toast.add({
      title: '邀请码生成成功',
      description: response.data?.code,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });
  }
  finally {
    loadingGenerateForm.value = false;
    refresh();
  }
}

const handleEdit = async (data: { uses: number, hoursValid: number }) => {
  loadingEditForm.value = true;
  try {
    if (currentEditId.value === null) throw new Error('Invalid ID');
    const response = await putAdminInvitationsById({
      path: { id: currentEditId.value },
      body: {
        uses: data.uses,
        hoursValid: data.hoursValid
      }
    });
    if (!response.error) {
      openEditForm.value = false
      toast.add({
        title: '修改成功',
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    }
  }
  finally {
    loadingGenerateForm.value = false;
    refresh();
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({
      title: '复制成功',
      description: `邀请码 ${text} 已存入剪贴板`,
      color: 'success',
      icon: 'i-heroicons-check-circle',
    });
  } catch (err) {
    toast.add({
      title: '复制失败',
      color: 'error',
      icon: 'i-heroicons-x-circle'
    });
  }
}

const getActionItems = (row: any) => [
  {
    type: 'label' as const,
    label: '操作菜单'
  },
  {
    label: '编辑',
    icon: 'i-heroicons-pencil-square',
    onSelect: () => {
      currentEditId.value = row.original.id;
      openEditForm.value = true;
    }
  },
  {
    type: 'separator' as const
  },
  {
    label: '删除',
    icon: 'i-heroicons-trash',
    color: 'error' as const,
    onSelect: () => deleteInvite(row.original.id)
  }
]

const refresh = async () => {
  const response = await getAdminInvitations({
    query: {
      page: page.value.page,
      size: page.value.size
    }
  });
  if (!response.error && response.data) {
    inviteCodes.value = response.data;
    page.value.total = parseInt(response.response.headers.get('x-total-count') || '0', 10);
  }
}

const updateInvite = async (id: number, uses?: number, hoursValid?: number) => {
  const response = await putAdminInvitationsById({
    path: { id },
    body: {
      uses: uses ?? null,
      hoursValid: hoursValid ?? null
    }
  });
  if (!response.error) {
    toast.add({
      title: '更新成功',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });
    refresh();
  }
}

const deleteInvite = async (id: number) => {
  const response = await deleteAdminInvitationsById({
    path: { id }
  });
  if (!response.error) {
    toast.add({
      title: '删除成功',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });
    refresh();
  }
}

onMounted(() => {
  refresh();
})
</script>
