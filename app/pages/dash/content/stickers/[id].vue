<script setup lang="ts">
import ConfirmDialog from "~/components/ConfirmDialog.vue";
import {
  deleteAdminStickerSetsById,
  deleteAdminStickerSetsByIdStickersByStickerId,
  getStickerSetsById,
  getStickerSetsByIdDetails,
  getStickerSetsStickersByStickerIdImage,
  postAdminStickerSetsByIdStickers,
  putAdminStickerSetsById,
  putAdminStickerSetsByIdStickersByStickerId,
  type StickerSetInfoResponse,
  type StickerUrlResponse,
} from "~~/packages/api/src";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const stickerSetId = Number(route.params.id);

function objectUrl(file: File): string {
  return URL.createObjectURL(file);
}

const isLoading = ref(false);
const isSubmitting = ref(false);
const isDeleting = ref(false);

const currentSet: Ref<StickerSetInfoResponse | null> = ref(null);

const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleteStickerModalOpen = ref(false);
const isEditStickerModalOpen = ref(false);
const isUploadModalOpen = ref(false);

const formData = ref({ name: "" });
const deletingStickerId = ref<number | null>(null);

const editStickerForm = ref({ id: 0, name: "" });
const editStickerFile = ref<File | null>(null);
const editStickerPreview = ref("");
const isUpdatingSticker = ref(false);
const editStickerFileInput = ref<HTMLInputElement | null>(null);

const uploadFiles = ref<{ file: File; name: string }[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const uploadProgress = ref(0);

const imagePage = ref(1);
const imagePageSize = 18;
const imageTotalCount = ref(0);
const pageStickers = ref<StickerUrlResponse[]>([]);
const stickerImageUrls = ref<Record<number, string>>({});

async function fetchDetail() {
  isLoading.value = true;
  try {
    const response = await getStickerSetsById({
      path: { id: stickerSetId }
    });
    if (response.error || !response.data) throw new Error("Unable to fetch StickerSet by id");
    currentSet.value = response.data;
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
  const response = await getStickerSetsByIdDetails({
    path: { id: stickerSetId },
    query: { page: imagePage.value, pageSize: imagePageSize }
  });
  if (response.error || !response.data) return;
  pageStickers.value = response.data;
  stickerImageUrls.value = Object.fromEntries(
    response.data.filter(i => i.id != null && i.url).map(i => [Number(i.id!), i.url!])
  );
  imageTotalCount.value = parseInt(
    response.response.headers?.get?.("x-total-count") ?? "0",
    10
  );
}

function goBack() {
  router.push("/dash/content/stickers");
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

function openUploadModal() {
  uploadFiles.value = [];
  isUploadModalOpen.value = true;
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
      duration: 0,
    });

    isUploadModalOpen.value = false;
    uploadFiles.value = [];
    imagePage.value = 1;
    await fetchDetail();
  } catch (e: any) {
    toast.remove(toastId);
    toast.add({
      title: "上传失败",
      description: e.message,
      color: "error",
      duration: 0,
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
    const remaining = imageTotalCount.value - 1;
    const maxPage = Math.max(1, Math.ceil(remaining / imagePageSize));
    if (imagePage.value > maxPage) imagePage.value = maxPage;
    await fetchDetail();
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

async function handleEdit() {
  if (!formData.value.name.trim()) {
    toast.add({ title: "请输入贴纸包名称", color: "error" });
    return;
  }
  isSubmitting.value = true;
  try {
    await putAdminStickerSetsById({
      path: { id: stickerSetId },
      body: {
        name: formData.value.name.trim()
      }
    })
    toast.add({ title: "更新成功", color: "success" });
    isEditModalOpen.value = false;
    await fetchDetail();
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

function openEditStickerModal(sticker: { id: number | string; name: string }) {
  editStickerForm.value = { id: Number(sticker.id), name: sticker.name };
  editStickerFile.value = null;
  editStickerPreview.value = "";
  isEditStickerModalOpen.value = true;
}

function handleEditStickerFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast.add({ title: "仅支持图片文件", color: "error" });
    return;
  }
  editStickerFile.value = file;
  editStickerPreview.value = objectUrl(file);
  target.value = "";
}

async function handleEditSticker() {
  if (!editStickerForm.value.name.trim()) {
    toast.add({ title: "请输入贴纸名称", color: "error" });
    return;
  }
  isUpdatingSticker.value = true;
  try {
    const response = await putAdminStickerSetsByIdStickersByStickerId({
      path: { id: stickerSetId, stickerId: editStickerForm.value.id },
      body: {
        name: editStickerForm.value.name.trim(),
        contentType: editStickerFile.value?.type ?? null,
      }
    });
    if (response.error || !response.data) throw new Error("Unable to update sticker");

    if (editStickerFile.value && response.data.uploadUrl) {
      await uploadWithProgress(response.data.uploadUrl, editStickerFile.value, () => {});
    }

    toast.add({ title: "贴纸已更新", color: "success" });
    isEditStickerModalOpen.value = false;
    if (editStickerPreview.value) {
      URL.revokeObjectURL(editStickerPreview.value);
      editStickerPreview.value = "";
    }
    await fetchDetail();
  } catch (e: any) {
    toast.add({
      title: "更新贴纸失败",
      description: e.message,
      color: "error",
    });
  } finally {
    isUpdatingSticker.value = false;
  }
}

async function handleDelete() {
  isDeleting.value = true;
  try {
    await deleteAdminStickerSetsById({
      path: { id: stickerSetId }
    });
    toast.add({ title: "删除成功", color: "success" });
    isDeleteModalOpen.value = false;
    router.push("/dash/content/stickers");
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

watch(imagePage, () => {
  loadStickerImages();
});

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <UContainer class="py-6">
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
              {{ imageTotalCount ?? currentSet?.stickers?.length ?? 0 }} 个贴纸
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
                formData = { name: currentSet!.name };
                isEditModalOpen = true;
              "
            />
            <UButton
              icon="i-lucide-trash"
              label="删除贴纸包"
              color="error"
              variant="outline"
              @click="isDeleteModalOpen = true"
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
        v-else-if="pageStickers.length === 0"
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
          v-for="sticker in pageStickers"
          :key="sticker.id"
          class="group relative border border-default rounded-lg p-3 hover:border-primary transition-colors"
        >
          <div
            class="aspect-square bg-elevated rounded flex items-center justify-center mb-2 overflow-hidden"
          >
            <img
              v-if="sticker.url"
              :src="sticker.url"
              :alt="sticker.id?.toString()"
              class="w-full h-full object-contain"
              loading="lazy"
            />
            <UIcon v-else name="i-lucide-image" class="text-2xl text-muted" />
          </div>
          <p
            class="text-xs text-center text-muted truncate"
            :title="sticker.id?.toString()"
          >
            {{ sticker.name }} <code class="mono">#{{ sticker.id }}</code>
          </p>
          <div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <UButton
                icon="i-lucide-pencil"
                variant="ghost"
                color="neutral"
                size="xs"
                @click="openEditStickerModal({ id: sticker.id!, name: sticker.name! })"
              />
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                color="error"
                size="xs"
                @click="deletingStickerId = Number(sticker.id); isDeleteStickerModalOpen = true"
              />
            </div>
        </div>
      </div>

      <template #footer>
        <div v-if="imageTotalCount > imagePageSize" class="flex justify-center">
          <UPagination
            v-model:page="imagePage"
            :total="imageTotalCount"
            :items-per-page="imagePageSize"
          />
        </div>
      </template>
    </UCard>

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
      :message="`确定要删除贴纸包「${currentSet?.name}」吗？该操作将同时删除所有贴纸且不可撤销。`"
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

    <!-- Edit Sticker Modal -->
    <UModal v-model:open="isEditStickerModalOpen">
      <template #content>
        <div class="p-4 border-b border-default flex justify-between items-center">
          <span class="font-bold text-foreground">编辑贴纸</span>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" @click="isEditStickerModalOpen = false" />
        </div>
        <div class="p-4 space-y-4">
          <div class="flex gap-4">
            <div class="w-24 h-24 bg-elevated rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
              <img
                v-if="editStickerPreview || stickerImageUrls[editStickerForm.id]"
                :src="editStickerPreview || stickerImageUrls[editStickerForm.id]"
                alt="预览"
                class="w-full h-full object-contain"
              />
              <UIcon v-else name="i-lucide-image" class="text-3xl text-muted" />
            </div>
            <div class="flex-1 space-y-3">
              <UFormField label="贴纸名称" required>
                <UInput v-model="editStickerForm.name" placeholder="请输入贴纸名称" :maxlength="100" />
              </UFormField>
              <div class="flex items-center gap-2">
                <UButton
                  icon="i-lucide-upload"
                  label="替换图片"
                  variant="outline"
                  size="sm"
                  @click="editStickerFileInput?.click()"
                />
                <span v-if="editStickerFile" class="text-xs text-muted truncate">
                  {{ editStickerFile.name }}
                </span>
                <input
                  ref="editStickerFileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleEditStickerFileSelect"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-default flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" :disabled="isUpdatingSticker" @click="isEditStickerModalOpen = false">
            取消
          </UButton>
          <UButton :loading="isUpdatingSticker" @click="handleEditSticker">保存</UButton>
        </div>
      </template>
    </UModal>

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

          <div v-if="uploadFiles.length > 0" class="space-y-3 max-h-[50vh] overflow-y-auto">
            <div
              v-for="(item, index) in uploadFiles"
              :key="index"
              class="flex items-center gap-3 p-2 border border-default rounded-lg"
            >
              <div
                class="w-16 h-16 bg-elevated rounded flex items-center justify-center shrink-0 overflow-hidden"
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
