<script setup lang="ts">
import ConfirmDialog from "~/components/ConfirmDialog.vue";
import {
  deleteAdminStickerSetsById, deleteAdminStickerSetsByIdStickersByStickerId,
  getStickerSets,
  getStickerSetsById, getStickerSetsStickersByStickerIdImage, postAdminStickerSets, postAdminStickerSetsByIdStickers,
  putAdminStickerSetsById,
  type StickerSetDetailResponse,
  type StickerSetResponse
} from "~~/packages/api/src";

const toast = useToast();

function objectUrl(file: File): string {
  return URL.createObjectURL(file);
}

type ViewMode = "list" | "detail";

const viewMode = ref<ViewMode>("list");
const isLoading = ref(false);
const isSubmitting = ref(false);

const stickerSets: Ref<StickerSetResponse[]> = ref([]);
const currentSet: Ref<StickerSetDetailResponse | null> = ref(null);
const totalCount = ref(0);
const page = ref(1);
const pageSize = ref(20);

const isCreateModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleteStickerModalOpen = ref(false);
const isUploadModalOpen = ref(false);
const isDeleting = ref(false);

const formData = ref({ name: "" });
const editingSet: Ref<StickerSetResponse | null> = ref(null);
const deletingSet: Ref<StickerSetResponse | null> = ref(null);
const deletingStickerId = ref<number | null>(null);

const uploadFiles = ref<{ file: File; name: string }[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const uploadProgress = ref(0);

const stickerImageUrls = ref<Record<number, string>>({});

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
      onSelect: () => openDetail(row.original.id),
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
    if (response.error || !response.data) throw new Error("Unable to fetch StickerSet");
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

async function openDetail(id: number) {
  isLoading.value = true;
  try {
    const response = await getStickerSetsById({
      path: { id }
    });
    if (response.error || !response.data) throw new Error("Unable to fetch StickerSet by id");
    currentSet.value = response.data;
    viewMode.value = "detail";
    stickerImageUrls.value = {};
    await loadStickerImages();
  } catch (e: any) {
    toast.add({
      title: "获取贴纸包详情失败",
      description: e.message,
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
}

async function loadStickerImages() {
  if (!currentSet.value) return;
  const promises = currentSet.value.stickers.map(async (sticker) => {
    try {
      const response = await getStickerSetsStickersByStickerIdImage({
        path: { stickerId: sticker.id as number }
      });
      if (response.error || !response.data) throw new Error("Unable to fetch StickerSets");
      stickerImageUrls.value[sticker.id as number] = response.data.url!;
    } catch {
      stickerImageUrls.value[sticker.id as number] = "";
    }
  });
  await Promise.all(promises);
}

function goBack() {
  viewMode.value = "list";
  currentSet.value = null;
  stickerImageUrls.value = {};
  fetchStickerSets();
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
        name: formData.value.name.trim()
      }
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
        name: formData.value.name.trim()
      }
    })
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
      path: { id: deletingSet.value.id as number }
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

function openUploadModal() {
  uploadFiles.value = [];
  isUploadModalOpen.value = true;
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (!files) return;

  for (const file of Array.from(files)) {
    if (!file.type.startsWith("image/")) {
      toast.add({
        title: "仅支持图片文件",
        description: file.name,
        color: "error",
      });
      continue;
    }
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    uploadFiles.value.push({ file, name: nameWithoutExt });
  }
  target.value = "";
}

function removeUploadFile(index: number) {
  uploadFiles.value.splice(index, 1);
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (p: number) => void,
) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve(xhr.response)
        : reject(new Error(xhr.statusText));
    xhr.onerror = () => reject(new Error("网络错误"));
    xhr.send(file);
  });
}

async function handleUpload() {
  if (!currentSet.value || uploadFiles.value.length === 0) return;
  isUploading.value = true;
  uploadProgress.value = 0;

  const toastId = `upload-stickers-${Date.now()}`;

  try {
    toast.add({
      id: toastId,
      title: "正在准备上传",
      description: "创建贴纸记录...",
      color: "info",
      duration: 0,
    });

    const response = await postAdminStickerSetsByIdStickers({
      path: { id: currentSet.value.id as number },
      body: {
        items: uploadFiles.value.map((f) => ({
          name: f.name,
          contentType: f.file.type,
        }))
      }
    });
    if (response.error || !response.data) throw new Error("Unable to upload");
    const uploadedStickers = response.data;

    toast.update(toastId, { title: "正在上传图片", color: "info" });

    for (let i = 0; i < uploadedStickers.length; i++) {
      const sticker = uploadedStickers[i]!;
      const uploadFile = uploadFiles.value[i]!;
      await uploadWithProgress(sticker.uploadUrl!, uploadFile.file, (percent) => {
        const overall = Math.round(
          ((i + percent / 100) / uploadedStickers.length) * 100,
        );
        uploadProgress.value = overall;
        toast.update(toastId, {
          description: `已上传 ${i + 1}/${uploadedStickers.length} (${percent}%)`,
        });
      });
    }

    toast.remove(toastId);
    toast.add({
      title: "上传成功",
      description: `已添加 ${uploadedStickers.length} 个贴纸`,
      color: "success",
    });

    isUploadModalOpen.value = false;
    uploadFiles.value = [];
    await openDetail(currentSet.value.id as number);
  } catch (e: any) {
    toast.remove(toastId);
    toast.add({
      title: "上传失败",
      description: e.message,
      color: "error",
    });
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
  }
}

function openDeleteStickerModal(stickerId: number) {
  deletingStickerId.value = stickerId;
  isDeleteStickerModalOpen.value = true;
}

async function handleDeleteSticker() {
  if (!currentSet.value || !deletingStickerId.value) return;
  isDeleting.value = true;
  try {
    await deleteAdminStickerSetsByIdStickersByStickerId({
      path: {
        id: currentSet.value.id as number,
        stickerId: deletingStickerId.value
      }
    })
    toast.add({ title: "贴纸已删除", color: "success" });
    isDeleteStickerModalOpen.value = false;
    await openDetail(currentSet.value.id as number);
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
    <!-- List View -->
    <template v-if="viewMode === 'list'">
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
              @click="openDetail(row.original.id as number)"
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
    </template>

    <!-- Detail View -->
    <template v-else>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UButton
                icon="i-lucide-arrow-left"
                variant="ghost"
                color="neutral"
                @click="goBack"
              />
              <h2 class="text-xl">
                {{ currentSet?.name ?? "加载中..." }}
              </h2>
              <UBadge color="neutral" variant="subtle">
                {{ currentSet?.stickers?.length ?? 0 }} 个贴纸
              </UBadge>
            </div>
            <div class="flex gap-2">
              <UButton
                icon="i-lucide-upload"
                label="添加贴纸"
                @click="openUploadModal"
              />
              <UButton
                icon="i-lucide-pencil"
                label="编辑"
                variant="outline"
                @click="
                  editingSet = {
                    id: currentSet!.id,
                    name: currentSet!.name,
                    stickerCount: currentSet!.stickers.length,
                    createdAt: currentSet!.createdAt,
                    updatedAt: currentSet!.updatedAt,
                  } as any;
                  formData = { name: currentSet!.name };
                  isEditModalOpen = true;
                "
              />
              <UButton
                icon="i-lucide-trash"
                label="删除贴纸包"
                color="error"
                variant="outline"
                @click="
                  deletingSet = {
                    id: currentSet!.id,
                    name: currentSet!.name,
                    stickerCount: currentSet!.stickers.length,
                    createdAt: currentSet!.createdAt,
                    updatedAt: currentSet!.updatedAt,
                  } as any;
                  isDeleteModalOpen = true;
                "
              />
            </div>
          </div>
        </template>

        <div
          v-if="isLoading"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          <USkeleton v-for="i in 6" :key="i" class="h-32 w-full rounded-lg" />
        </div>

        <div
          v-else-if="currentSet?.stickers?.length === 0"
          class="text-center py-16"
        >
          <UIcon name="i-lucide-image-off" class="text-4xl text-muted mb-3" />
          <p class="text-muted">暂无贴纸，点击"添加贴纸"上传</p>
        </div>

        <div
          v-else
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          <div
            v-for="sticker in currentSet?.stickers"
            :key="sticker.id"
            class="group relative border border-default rounded-lg p-3 hover:border-primary transition-colors"
          >
            <div
              class="aspect-square bg-elevated rounded flex items-center justify-center mb-2 overflow-hidden"
            >
              <img
                v-if="stickerImageUrls[sticker.id as number]"
                :src="stickerImageUrls[sticker.id as number]"
                :alt="sticker.name"
                class="w-full h-full object-contain"
                loading="lazy"
              />
              <UIcon v-else name="i-lucide-image" class="text-2xl text-muted" />
            </div>
            <p
              class="text-xs text-center text-muted truncate"
              :title="sticker.name"
            >
              {{ sticker.name }}
            </p>
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="xs"
              class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              @click="openDeleteStickerModal(sticker.id as number)"
            />
          </div>
        </div>
      </UCard>
    </template>

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

    <!-- Delete Sticker Modal -->
    <ConfirmDialog
      v-model:open="isDeleteStickerModalOpen"
      v-model:loading="isDeleting"
      title="删除贴纸"
      message="确定要删除此贴纸吗？此操作不可撤销。"
      confirm-text="删除"
      confirm-color="error"
      @confirm="handleDeleteSticker"
    />

    <!-- Upload Modal -->
    <UModal v-model:open="isUploadModalOpen">
      <template #content>
        <div
          class="p-4 border-b border-default flex justify-between items-center"
        >
          <span class="font-bold text-foreground">添加贴纸</span>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            @click="isUploadModalOpen = false"
          />
        </div>
        <div class="p-4 space-y-4">
          <div class="flex gap-2">
            <UButton
              icon="i-lucide-file-plus"
              label="选择图片"
              @click="fileInput?.click()"
            />
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="handleFileSelect"
            />
            <span class="text-sm text-muted self-center">
              已选择 {{ uploadFiles.length }} 个文件
            </span>
          </div>

          <div v-if="uploadFiles.length > 0" class="space-y-3">
            <div
              v-for="(item, index) in uploadFiles"
              :key="index"
              class="flex items-center gap-3 p-2 border border-default rounded-lg"
            >
              <div
                class="w-10 h-10 bg-elevated rounded flex items-center justify-center shrink-0 overflow-hidden"
              >
                <img
                  :src="objectUrl(item.file)"
                  class="w-full h-full object-contain"
                  alt=""
                />
              </div>
              <UInput
                v-model="item.name"
                class="grow"
                placeholder="贴纸名称"
                :maxlength="100"
              />
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                color="error"
                size="xs"
                @click="removeUploadFile(index)"
              />
            </div>
          </div>

          <div v-if="isUploading" class="space-y-2">
            <div class="text-sm text-muted">
              上传进度: {{ uploadProgress }}%
            </div>
            <div class="w-full bg-elevated rounded-full h-2">
              <div
                class="h-2 rounded-full bg-primary transition-all duration-300"
                :style="{ width: `${uploadProgress}%` }"
              />
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-default flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isUploading"
            @click="isUploadModalOpen = false"
          >
            取消
          </UButton>
          <UButton
            :loading="isUploading"
            :disabled="uploadFiles.length === 0"
            @click="handleUpload"
          >
            上传
          </UButton>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
