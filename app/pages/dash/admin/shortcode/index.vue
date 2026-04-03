<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import CustomForm from "~/components/CustomForm.vue";
import ConfirmButton from "~/components/ConfirmButton.vue";
import type { FieldConfig } from "~/types/field-config";
import {
  getAdminShortcodes,
  postAdminShortcodes,
  patchAdminShortcodesByIdStatus,
  deleteAdminShortcodesById,
  type ShortcodeDetail,
} from "~~/packages/api/src";

const toast = useToast();

const shortcodes = ref<ShortcodeDetail[]>([]);
const isLoading = ref(true);
const searchQuery = ref("");
const isDeleting = ref<string | number | null>(null);

const isModalOpen = ref(false);
const isSubmitting = ref(false);

const formConfig = ref<FieldConfig[]>([
  {
    key: "name",
    label: "标识符",
    description: "简码的唯一内部标识符",
    type: "text",
    icon: "i-lucide-code",
    placeholder: "my-shortcode",
  },
  {
    key: "displayName",
    label: "显示名称",
    type: "text",
    icon: "i-lucide-tag",
    placeholder: "请输入显示名称",
  },
  {
    key: "description",
    label: "描述",
    type: "text",
    icon: "i-lucide-align-left",
    placeholder: "请输入描述（可选）",
  },
]);

const formState = ref<Record<string, any>>({});

const fetchList = async () => {
  isLoading.value = true;
  try {
    const { data } = await getAdminShortcodes();
    shortcodes.value = data || [];
  } catch (error) {
    console.error("[Error] Failed to fetch shortcodes:", error);
  } finally {
    isLoading.value = false;
  }
};

const filteredShortcodes = computed(() => {
  if (!searchQuery.value) return shortcodes.value;
  const q = searchQuery.value.toLowerCase();
  return shortcodes.value.filter(
    (s) =>
      s.name?.toLowerCase().includes(q) ||
      s.displayName?.toLowerCase().includes(q),
  );
});

const handleToggleStatus = async (item: ShortcodeDetail) => {
  try {
    const { data } = await patchAdminShortcodesByIdStatus({
      path: { id: item.id as number },
      body: { isEnabled: !item.isEnabled },
    });
    if (data) {
      const target = shortcodes.value.find((s) => s.id === item.id);
      if (target) target.isEnabled = data.isEnabled;
      toast.add({
        title: data.isEnabled ? "已启用" : "已禁用",
        color: "success",
        icon: "i-lucide-circle-check",
      });
    }
  } catch (error) {
    toast.add({ title: "操作失败", color: "error" });
  }
};

const handleDelete = async (id: string | number) => {
  isDeleting.value = id;
  try {
    await deleteAdminShortcodesById({ path: { id: id as number } });
    shortcodes.value = shortcodes.value.filter((s) => s.id !== id);
    toast.add({
      title: "已删除",
      color: "success",
      icon: "i-lucide-circle-check",
    });
  } catch (error) {
    toast.add({ title: "删除失败", color: "error" });
  } finally {
    isDeleting.value = null;
  }
};

const handleEdit = (id: string | number) => {
  navigateTo(`shortcode/editor?id=${id}`);
};

const openCreateModal = () => {
  formState.value = {};
  isModalOpen.value = true;
};

const handleFormSubmit = async (data: Record<string, any>) => {
  isSubmitting.value = true;
  try {
    const { error } = await postAdminShortcodes({
      body: {
        name: data.name,
        displayName: data.displayName,
        description: data.description || null,
        backendCode: "",
        frontendCode: "",
      },
    });
    if (!error) {
      toast.add({
        title: "创建成功",
        color: "success",
        icon: "i-lucide-circle-check",
      });
      isModalOpen.value = false;
      await fetchList();
    }
  } catch (error) {
    toast.add({ title: "创建失败", color: "error" });
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchList();
});
</script>

<template>
  <UContainer class="py-8">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <UIcon name="i-heroicons-cpu-chip" class="text-primary" />
          管理简码
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          简码由前端浏览器直接执行的客户端代码和后端通过 Jint
          引擎执行的后端代码组成。
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Search shortcodes..."
          class="w-64"
        />
        <UButton
          icon="i-heroicons-plus"
          label="创建简码"
          @click="openCreateModal"
        />
      </div>
    </div>

    <div
      v-if="isLoading"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <USkeleton v-for="i in 6" :key="i" class="h-40 w-full bg-gray-800/50" />
    </div>

    <div
      v-else-if="filteredShortcodes.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <UCard
        v-for="item in filteredShortcodes"
        :key="item.id"
        class="group hover:ring-1 hover:ring-primary/50 transition-all"
      >
        <template #header>
          <div class="flex items-start justify-between">
            <div class="overflow-hidden">
              <h3 class="font-bold text-gray-200 truncate">
                {{ item.displayName || item.name }}
              </h3>
              <p class="text-[10px] font-mono text-gray-500 truncate">
                {{ item.name }}
              </p>
            </div>
            <UBadge
              :color="item.isEnabled ? 'success' : 'primary'"
              variant="subtle"
              size="sm"
            >
              {{ item.isEnabled ? "Active" : "Disabled" }}
            </UBadge>
          </div>
        </template>

        <p class="text-sm text-gray-400 line-clamp-2 min-h-[40px]">
          {{ item.description || "No description provided." }}
        </p>

        <template #footer>
          <div class="flex items-center justify-between">
            <div class="text-[10px] text-gray-500 italic">
              最后更改: {{ new Date(item.updatedAt!).toLocaleDateString() }}
            </div>
            <div class="flex gap-2">
              <UButton
                variant="ghost"
                color="secondary"
                icon="i-lucide-pencil"
                @click="handleEdit(item.id!)"
              />
              <UButton
                variant="ghost"
                color="primary"
                icon="i-lucide-power"
                @click="handleToggleStatus(item)"
              />
              <ConfirmButton
                icon="i-lucide-trash"
                title="确认删除此简码？"
                @confirm="(confirmed: boolean) => confirmed && handleDelete(item.id!)"
              />
            </div>
          </div>
        </template>
      </UCard>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center py-24 bg-[#21252b] rounded-xl border-2 border-dashed border-gray-700"
    >
      <UIcon name="i-heroicons-inbox" class="h-12 w-12 text-gray-600 mb-4" />
      <p class="text-gray-400">没有任何简码</p>
      <UButton variant="link" label="Clear search" @click="searchQuery = ''" />
    </div>
    <CustomForm
      v-model:open="isModalOpen"
      v-model:form-data="formState"
      v-model:loading="isSubmitting"
      :config="formConfig"
      title="创建简码"
      @success="handleFormSubmit"
    />
  </UContainer>
</template>

<style scoped>
/* 保持与编辑器一致的 JetBrains Mono 风格 */
.font-mono {
  font-family: "JetBrains Mono", monospace;
}
</style>
