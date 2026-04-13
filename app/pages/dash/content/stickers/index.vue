<script setup lang="ts">
import ConfirmDialog from "~/components/ConfirmDialog.vue";
import {
  deleteAdminStickerSetsById,
  getStickerSets,
  postAdminStickerSets,
  putAdminStickerSetsById,
  type StickerSetResponse,
} from "~~/packages/api/src";

const toast = useToast();
const router = useRouter();

const isLoading = ref(false);
const isSubmitting = ref(false);

const stickerSets: Ref<StickerSetResponse[]> = ref([]);
const totalCount = ref(0);
const page = ref(1);
const pageSize = 10;

const isCreateModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);

const formData = ref({ name: "" });
const editingSet: Ref<StickerSetResponse | null> = ref(null);
const deletingSet: Ref<StickerSetResponse | null> = ref(null);

const columns = [
  { accessorKey: "name", header: "名称" },
  { accessorKey: "sticker-count", header: "贴纸数量" },
  { accessorKey: "created-at", header: "创建时间" },
  { accessorKey: "updated-at", header: "更新时间" },
  { accessorKey: "actions", header: "操作" },
];

const dropdownMenu = (row: any) => [
  [
    {
      label: "查看详情",
      icon: "i-lucide-eye",
      onSelect: () => router.push(`/dash/content/stickers/${row.original.id}`),
    },
    {
      label: "编辑",
      icon: "i-lucide-pencil",
      onSelect: () => openEditModal(row.original),
    },
  ],
  [
    {
      label: "删除",
      icon: "i-lucide-trash",
      color: "error",
      onSelect: () => openDeleteModal(row.original),
    },
  ],
];

const formatDate = (date?: Date) => {
  if (!date) return "--";
  return date.toLocaleString();
};

async function fetchStickerSets() {
  isLoading.value = true;
  try {
    const response = await getStickerSets();
    if (response.error || !response.data)
      throw new Error("Unable to fetch StickerSet");
    stickerSets.value = response.data;
    totalCount.value = parseInt(
      (response as any).$response?.headers?.get?.("x-total-count") ??
        String(stickerSets.value.length),
    );
  } catch (e: any) {
    toast.add({
      title: "获取贴纸包列表失败",
      description: e.message,
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
}

async function fetchTotalCount() {
  try {
    const response = await $fetch.raw(
      `${useRuntimeConfig().public.apiBase}/admin/sticker-sets`,
      {
        params: { page: page.value, pageSize: 1 },
        credentials: "include",
      },
    );
    totalCount.value = parseInt(
      response.headers.get("x-total-count") ?? "0",
      10,
    );
  } catch {
    totalCount.value = stickerSets.value.length;
  }
}

function openCreateModal() {
  formData.value = { name: "" };
  isCreateModalOpen.value = true;
}

function openEditModal(set: StickerSetResponse) {
  editingSet.value = set;
  formData.value = { name: set.name };
  isEditModalOpen.value = true;
}

function openDeleteModal(set: StickerSetResponse) {
  deletingSet.value = set;
  isDeleteModalOpen.value = true;
}

async function handleCreate() {
  if (!formData.value.name.trim()) {
    toast.add({ title: "请输入贴纸包名称", color: "error" });
    return;
  }
  isSubmitting.value = true;
  try {
    await postAdminStickerSets({
      body: {
        name: formData.value.name.trim(),
      },
    });
    toast.add({ title: "创建成功", color: "success" });
    isCreateModalOpen.value = false;
    await fetchStickerSets();
    await fetchTotalCount();
  } catch (e: any) {
    toast.add({
      title: "创建失败",
      description: e.message,
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}

async function handleEdit() {
  if (!editingSet.value || !formData.value.name.trim()) {
    toast.add({ title: "请输入贴纸包名称", color: "error" });
    return;
  }
  isSubmitting.value = true;
  try {
    await putAdminStickerSetsById({
      path: { id: editingSet.value.id as number },
      body: {
        name: formData.value.name.trim(),
      },
    });
    toast.add({ title: "更新成功", color: "success" });
    isEditModalOpen.value = false;
    await fetchStickerSets();
  } catch (e: any) {
    toast.add({
      title: "更新失败",
      description: e.message,
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDelete() {
  if (!deletingSet.value) return;
  isDeleting.value = true;
  try {
    await deleteAdminStickerSetsById({
      path: { id: deletingSet.value.id as number },
    });
    toast.add({ title: "删除成功", color: "success" });
    isDeleteModalOpen.value = false;
    stickerSets.value = stickerSets.value.filter(
      (s) => s.id !== deletingSet.value!.id,
    );
    totalCount.value = Math.max(0, totalCount.value - 1);
  } catch (e: any) {
    toast.add({
      title: "删除失败",
      description: e.message,
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
}

watch(page, () => {
  fetchStickerSets();
});

onMounted(() => {
  fetchStickerSets();
  fetchTotalCount();
});
</script>

<template>
  <UContainer class="py-6">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl">贴纸包管理</h2>
          <UButton
            icon="i-lucide-plus"
            label="创建贴纸包"
            @click="openCreateModal"
          />
        </div>
      </template>

      <UTable :data="stickerSets" :columns="columns" :loading="isLoading">
        <template #name-cell="{ row }">
          <UButton
            variant="ghost"
            color="primary"
            class="px-0"
            :to="`/dash/content/stickers/${row.original.id}`"
          >
            {{ row.original.name }}
          </UButton>
        </template>

        <template #sticker-count-cell="{ row }">
          <UBadge color="neutral" variant="subtle">
            {{ row.original.stickerCount }}
          </UBadge>
        </template>

        <template #created-at-cell="{ row }">
          <span class="text-sm text-muted">
            {{ formatDate(row.original.createdAt) }}
          </span>
        </template>

        <template #updated-at-cell="{ row }">
          <span class="text-sm text-muted">
            {{ formatDate(row.original.updatedAt) }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <UDropdownMenu :items="dropdownMenu(row)">
            <UButton
              icon="i-lucide-more-horizontal"
              variant="ghost"
              color="neutral"
            />
          </UDropdownMenu>
        </template>
      </UTable>

      <template #footer>
        <div class="flex justify-center">
          <UPagination
            v-model:page="page"
            :total="totalCount"
            :items-per-page="pageSize"
          />
        </div>
      </template>
    </UCard>

    <!-- Create Modal -->
    <UModal v-model:open="isCreateModalOpen">
      <template #content>
        <div
          class="p-4 border-b border-default flex justify-between items-center"
        >
          <span class="font-bold text-foreground">创建贴纸包</span>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            @click="isCreateModalOpen = false"
          />
        </div>
        <div class="p-4 space-y-4">
          <UFormField label="贴纸包名称" required>
            <UInput
              v-model="formData.name"
              icon="i-lucide-sticker"
              placeholder="请输入贴纸包名称"
              :maxlength="100"
            />
          </UFormField>
        </div>
        <div class="p-4 border-t border-default flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isCreateModalOpen = false"
          >
            取消
          </UButton>
          <UButton :loading="isSubmitting" @click="handleCreate">
            创建
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Edit Modal -->
    <UModal v-model:open="isEditModalOpen">
      <template #content>
        <div
          class="p-4 border-b border-default flex justify-between items-center"
        >
          <span class="font-bold text-foreground">编辑贴纸包</span>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            @click="isEditModalOpen = false"
          />
        </div>
        <div class="p-4 space-y-4">
          <UFormField label="贴纸包名称" required>
            <UInput
              v-model="formData.name"
              icon="i-lucide-sticker"
              placeholder="请输入贴纸包名称"
              :maxlength="100"
            />
          </UFormField>
        </div>
        <div class="p-4 border-t border-default flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isEditModalOpen = false"
          >
            取消
          </UButton>
          <UButton :loading="isSubmitting" @click="handleEdit"> 保存 </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete Sticker Set Modal -->
    <ConfirmDialog
      v-model:open="isDeleteModalOpen"
      v-model:loading="isDeleting"
      title="删除贴纸包"
      :message="`确定要删除贴纸包「${deletingSet?.name}」吗？该操作将同时删除所有贴纸且不可撤销。`"
      confirm-text="删除"
      confirm-color="error"
      @confirm="handleDelete"
    />
  </UContainer>
</template>
