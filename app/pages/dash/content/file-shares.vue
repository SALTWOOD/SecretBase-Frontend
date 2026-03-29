<script setup lang="ts">
import {
  deleteAdminFileSharesByShortId,
  type FileShareResponse,
  getAdminFileShares,
  patchAdminFileSharesByShortId,
  postAdminFileShares,
} from "~~/packages/api/src";
import type { FieldConfig } from "~/types/field-config";

const columns = [
  { accessorKey: "short-id", header: "分享 ID" },
  { accessorKey: "file-name", header: "文件名" },
  { accessorKey: "bucket", header: "桶" },
  { accessorKey: "is-public", header: "可见性" },
  { accessorKey: "is-enabled", header: "状态" },
  { accessorKey: "expires-at", header: "失效日期" },
  { accessorKey: "created-at", header: "创建日期" },
  { accessorKey: "actions", header: "操作" },
];

const formConfig: Ref<FieldConfig[]> = ref([
  {
    key: "bucket",
    label: "存储桶 (Bucket)",
    type: "text",
    icon: "i-lucide-database",
    placeholder: "请输入 S3 Bucket 名称",
  },
  {
    key: "key",
    label: "对象键 (Key)",
    type: "text",
    icon: "i-lucide-file-key",
    placeholder: "例如: uploads/2026/03/data.zip",
  },
  {
    key: "fileName",
    label: "下载文件名",
    description: "设置 Content-Disposition 中的文件名",
    type: "text",
    icon: "i-lucide-type",
    action: {
      icon: "i-lucide-file-plus-corner",
      tooltip: "选择 S3 存储中的文件",
      onClick: () => {
        isFileSelectVisible.value = true;
      }
    }

  },
  {
    key: "isPublic",
    label: "访问权限",
    type: "select",
    icon: "i-lucide-lock",
    options: [
      { label: "公开 (匿名访问)", value: true },
      { label: "私有 (需要登录)", value: false },
    ],
  },
  {
    key: "hoursValid",
    label: "有效时长 (小时)",
    description: "过期后链接将失效 (0 为永久)",
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

const formState = ref({
  bucket: "",
  key: "",
  fileName: "",
  isPublic: true,
  hoursValid: 24,
  isEnabled: true,
});

const isOpen = ref(false);
const isLoading = ref(false);
const isEditMode = ref(false);
const isSubmitting = ref(false);
const isFileSelectVisible = ref(false);
const currentEditId = ref<string | null>(null);
const fileShares: Ref<FileShareResponse[]> = ref([]);
const totalCount = ref(0);
const page = ref(1);
const pageSize = ref(20);
const toast = useToast();

const getDisplayName = (key: string): string =>
  key.split("/").filter(Boolean).pop() || "";

const fillFileField = (s3Url: string) => {
  const url = new URL(s3Url);
  const key = decodeURI(url.pathname).substring(1);
  formState.value.bucket = url.hostname;
  formState.value.key = key;
  formState.value.fileName = getDisplayName(key);
}

const openForm = (edit: boolean, row?: FileShareResponse) => {
  isEditMode.value = edit;
  if (edit && row) {
    currentEditId.value = row.shortId;
    formState.value = {
      bucket: row.bucket ?? "",
      key: row.key ?? "",
      fileName: row.fileName ?? "",
      isPublic: row.isPublic ?? true,
      hoursValid: 0,
      isEnabled: row.isEnabled ?? true,
    };
  } else {
    currentEditId.value = null;
    formState.value = {
      bucket: "",
      key: "",
      fileName: "",
      isPublic: true,
      hoursValid: 24,
      isEnabled: true,
    };
  }
  isOpen.value = true;
};

const handleFormSubmit = async (data: Record<string, any>) => {
  isSubmitting.value = true;
  try {
    if (isEditMode.value && currentEditId.value) {
      const response = await patchAdminFileSharesByShortId({
        path: { shortId: currentEditId.value },
        body: {
          key: data.key,
          bucket: data.bucket,
          fileName: data.fileName,
          isPublic: data.isPublic,
          isEnabled: data.isEnabled,
        },
      });
      if (response.error) throw new Error(response.error.message);
      toast.add({
        title: "Success",
        description: "Changes saved.",
        color: "success",
      });
    } else {
      const response = await postAdminFileShares({
        body: {
          key: data.key,
          bucket: data.bucket,
          fileName: data.fileName,
          isPublic: data.isPublic,
          expiresAt: data.hoursValid
            ? new Date(Date.now() + data.hoursValid * 60 * 60 * 1000)
            : undefined,
        },
      });
      if (response.error) throw new Error(response.error.message);
      toast.add({
        title: "Success",
        description: "File share created.",
        color: "success",
      });
    }
    isOpen.value = false;
    await fetchData();
  } catch (e: any) {
    toast.add({
      title: "Error",
      description: e.message || "Operation failed",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const fetchData = async () => {
  isLoading.value = true;

  const response = await getAdminFileShares({
    query: {
      page: page.value,
      pageSize: pageSize.value,
    },
  });

  if (response.error || !response.data) {
    isLoading.value = false;
    return;
  }
  fileShares.value = response.data.items;
  totalCount.value = (response.data.totalCount as number) ?? 0;
  isLoading.value = false;
};

const toggleStatus = async (row: FileShareResponse) => {
  const previousState = !row.isEnabled;

  try {
    const response = await patchAdminFileSharesByShortId({
      path: { shortId: row.shortId },
      body: { isEnabled: row.isEnabled },
    });

    if (response.error) throw new Error();

    toast.add({ title: "Status Updated", color: "success" });
  } catch (e) {
    row.isEnabled = previousState;
    toast.add({
      title: "Update Failed",
      description: "Server rejected the change",
      color: "error",
    });
  }
};

const deleteShare = async (id: string) => {
  try {
    const response = await deleteAdminFileSharesByShortId({
      path: { shortId: id },
    });

    if (response.error) throw new Error();

    toast.add({ title: "Deleted", color: "success" });
    fileShares.value = fileShares.value.filter((s) => s.shortId !== id);
  } catch (e) {
    toast.add({
      title: "Error",
      description: "Failed to delete",
      color: "error",
    });
  }
};

const copyLink = (shortId: string) => {
  const url = `/shared/${shortId}`;
  navigator.clipboard.writeText(url);
  toast.add({ title: "Link copied to clipboard" });
};

watch(page, () => {
  fetchData();
});

onMounted(() => {
  fetchData();
});
</script>

<template>
  <UContainer class="py-6">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl">文件分享</h2>
          <UButton
            icon="i-lucide-plus"
            label="创建新分享"
            @click="openForm(false)"
          />
        </div>
      </template>

      <div class="flex gap-4 mb-4">
        <UInput
          placeholder="搜索分享..."
          icon="i-heroicons-magnifying-glass"
          class="w-64"
        />
        <USelectMenu
          placeholder="按 Bucket 查找"
          :options="['my-bucket']"
          class="w-48"
        />
      </div>

      <UTable :data="fileShares" :columns="columns" :loading="isLoading">
        <template #short-id-cell="{ row }">
          <span class="font-mono text-xs text-gray-500">{{
            row.original.shortId
          }}</span>
        </template>

        <template #file-name-cell="{ row }">
          <span class="text-sm">
            {{ row.original.fileName }}
          </span>
        </template>

        <template #bucket-cell="{ row }">
          <span class="text-sm">
            {{ row.original.bucket }}
          </span>
        </template>

        <template #is-public-cell="{ row }">
          <UBadge :color="row.original.isPublic ? 'success' : 'info'" size="md">
            {{ row.original.isPublic ? "公开" : "私有" }}
          </UBadge>
        </template>

        <template #is-enabled-cell="{ row }">
          <USwitch
            v-model="row.original.isEnabled"
            @update:model-value="toggleStatus(row.original)"
          />
        </template>

        <template #expires-at-cell="{ row }">
          <span v-if="row.original.expiresAt" class="text-sm">
            {{ row.original.expiresAt?.toLocaleString() }}
          </span>
          <span v-else class="text-gray-400 italic text-sm">Never</span>
        </template>

        <template #created-at-cell="{ row }">
          <span v-if="row.original.createdAt" class="text-sm">
            {{ row.original.createdAt?.toLocaleString() }}
          </span>
          <span v-else class="text-gray-400 italic text-sm">Never</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex gap-2">
            <UButton
              icon="i-lucide-clipboard"
              variant="ghost"
              color="secondary"
              @click="copyLink(row.original.shortId)"
            />
            <UButton
              icon="i-lucide-pencil"
              variant="ghost"
              color="neutral"
              @click="openForm(true, row.original)"
            />
            <ConfirmButton
              icon="i-lucide-trash"
              color="error"
              subtitle="确认删除吗？"
              @confirm="deleteShare(row.original.shortId)"
            />
          </div>
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

    <CustomForm
      v-model:open="isOpen"
      v-model:config="formConfig"
      v-model:form-data="formState"
      :loading="isSubmitting"
      :title="isEditMode ? '编辑分享链接' : '生成分享链接'"
      @success="handleFormSubmit"
    />
    <StorageFileSelect
      v-model="isFileSelectVisible"
      selectionMode="file"
      @select="fillFileField"
    />
  </UContainer>
</template>
