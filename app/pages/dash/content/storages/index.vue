<script setup lang="ts">
// Defined interfaces based on your backend schema
import {
  type BucketResponse,
  getAdminStorageBuckets,
} from "~~/packages/api/src";

const pending = ref(true);
const buckets: Ref<BucketResponse[]> = ref([]);

// Row actions generator
const getActionItems = (row: BucketResponse) => [
  [
    {
      label: "进入",
      icon: "i-lucide-folder-open",
      onSelect: () => navigateTo(`storages/${row.name}`),
    },
    { label: "设置", icon: "i-lucide-settings" },
    { label: "删除", icon: "i-lucide-trash", color: "error" },
  ],
];

const columns = [
  { id: "name", accessorKey: "key", header: "名称" },
  { id: "creation-date", accessorKey: "creationDate", header: "创建日期" },
  { id: "actions", accessorKey: "actions", header: "操作" },
];

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

onMounted(async () => {
  const response = await getAdminStorageBuckets();
  if (response.error || !response.data) {
    pending.value = false;
    return;
  }
  buckets.value = response.data;
  pending.value = false;
});
</script>

<template>
  <UContainer class="py-6">
    <div class="flex justify-between items-center mb-13">
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <UIcon name="i-lucide-database" class="text-primary" />
        存储
      </h1>
      <div class="flex gap-2">
        <UButton icon="i-lucide-plus" disabled>创建桶</UButton>
      </div>
    </div>

    <UTable
      :data="buckets"
      :columns="columns"
      :loading="pending"
      class="border rounded-lg border-gray-200 dark:border-gray-800"
    >
      <template #name-cell="{ row }">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-database" class="text-primary-500" />
          <button
            type="button"
            class="text-sm text-left hover:text-primary transition-colors font-medium hover:underline underline-offset-4"
            @click="navigateTo(`storages/${row.original.name}`)"
          >
            {{ row.original.name }}
          </button>
        </div>
      </template>

      <template #creation-date-cell="{ row }">
        <span class="text-sm text-gray-500">
          {{ row.original.creationDate?.toLocaleString() }}
        </span>
      </template>

      <template #actions-cell="{ row }">
        <UDropdownMenu :items="getActionItems(row.original)">
          <UButton
            color="secondary"
            variant="ghost"
            icon="i-lucide-more-horizontal"
            size="sm"
          />
        </UDropdownMenu>
      </template>
    </UTable>
  </UContainer>
</template>
