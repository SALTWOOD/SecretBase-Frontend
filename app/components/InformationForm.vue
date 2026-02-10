<template>
  <UModal v-model:open="open" :close-button="{ icon: 'i-lucide-x' }">
    <template #content>
      <div
        class="p-4 border-b border-default flex justify-between items-center"
      >
        <span class="font-bold text-foreground">详情</span>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          @click="open = false"
        />
      </div>

      <div class="p-4">
        <UTable
          :loading="loading"
          :columns="columns"
          :data="users"
          class="w-full"
        >
          <template #username-cell="{ row }">
            <UserCell
              :username="row.original.username ?? ''"
              :email="row.original.email"
              :avatar="row.original.avatar"
            />
          </template>

          <template #createdAt-cell="{ row }">
            {{ row.original.registerTime?.toLocaleString() }}
          </template>
        </UTable>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { User } from "~~/packages/api/src/types.gen";

defineProps<{
  users: User[];
  loading: boolean;
}>();

const open = defineModel<boolean>("open", {
  default: false,
});

const columns = [
  { accessorKey: "username", header: "用户名" },
  { accessorKey: "createdAt", header: "注册时间" },
];
</script>
