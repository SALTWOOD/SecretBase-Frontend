<template>
  <div class="view-content">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">邀请码管理</h1>
        <p class="text-slate-400 text-sm">生成并分发注册邀请码</p>
      </div>
      <UButton
        color="primary"
        icon="i-heroicons-plus"
        @click="isFormOpen = true"
      >
        生成新邀请码
      </UButton>
    </div>

    <UCard class="glass-card">
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

        <template #issuer-cell="{ row }">
          <UserCell :username="row.original.issuer?.username!" :email="row.original.issuer?.email"
            :avatar="row.original.issuer?.avatar" />
        </template>

        <template #timeIssued-cell="{ row }">
          <span class="text-slate-500 text-sm">
            {{ new Date(row.original.timeIssued!).toLocaleString('zh-CN', { hour12: false }) }}
          </span>
        </template>
      </UTable>
    </UCard>

    <GenerateInviteForm v-model:open="isFormOpen" @success="handleSuccess" />
  </div>
</template>

<script lang="ts" setup>
import GenerateInviteForm from '~/components/GenerateInviteForm.vue';
import { getAdminInvitations } from '~~/packages/api/src/sdk.gen';
import type { InviteTable, PostAdminInvitationsResponse } from '~~/packages/api/src/types.gen';

const toast = useToast();

const columns = [
  { accessorKey: 'code', header: '邀请码' },
  { accessorKey: 'issuer', header: '创建者' },
  { accessorKey: 'timeIssued', header: '创建时间' }
]

const inviteCodes = ref<InviteTable[]>([])
const isFormOpen = ref(false)

const handleSuccess = (data: PostAdminInvitationsResponse) => {
  isFormOpen.value = false
  console.log(data);
  toast.add({
    title: '邀请码生成成功',
    description: data.code,
    color: 'success',
    icon: 'i-heroicons-check-circle'
  })
  refresh()
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

const refresh = async () => {
  const response = await getAdminInvitations();
  if (!response.error && response.data) {
    inviteCodes.value = response.data;
  }
}

onMounted(() => {
  refresh().then(() => console.log(inviteCodes));
})
</script>
