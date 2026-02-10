<template>
  <div class="view-content">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-6">
      <div>
        <h1 class="text-3xl font-bold text-highlighted tracking-tight">
          OAuth 应用
        </h1>
        <p class="text-muted text-sm mt-1">
          管理您的 OAuth 应用程序和授权配置
        </p>
      </div>
      <UButton
        icon="i-lucide-plus-circle"
        size="lg"
        @click="openForm(false)"
        class="shadow-md hover:shadow-lg transition-shadow duration-200"
      >
        创建新应用
      </UButton>
    </div>

    <div v-if="pending" class="flex justify-center items-center py-16">
      <div class="text-center space-y-4">
        <UIcon name="i-lucide-refresh-cw" class="w-12 h-12 animate-spin text-primary-500" />
        <p class="text-muted text-lg">加载应用中...</p>
      </div>
    </div>
    <div
      v-else-if="!apps || apps.length === 0"
      class="flex flex-col items-center justify-center py-16 px-4"
    >
      <div class="text-center space-y-4 max-w-md">
        <div
          class="w-20 h-20 mx-auto bg-default/50 rounded-full flex items-center justify-center"
        >
          <UIcon name="i-lucide-key" class="w-10 h-10 text-muted" />
        </div>
        <h3 class="text-xl font-semibold text-highlighted">
          暂无 OAuth 应用
        </h3>
        <p class="text-muted">
          点击上方"创建新应用"按钮来添加您的第一个 OAuth 应用
        </p>
      </div>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="app in apps"
        :key="app.id"
        class="hover:shadow-lg transition-shadow duration-200 border border-default bg-(--ui-bg-elevated)/50"
      >
        <template #header>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md"
              >
                <UIcon name="i-lucide-box" class="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">
                  {{ app.displayName }}
                </h3>
                <p class="text-xs text-muted mt-0.5">
                  OAuth 应用
                </p>
              </div>
            </div>
          </div>
        </template>
        <div class="space-y-3">
          <div class="p-3 bg-default/50 rounded-lg">
            <p class="text-xs text-muted mb-1">客户端 ID</p>
            <code
              class="text-sm font-mono text-highlighted break-all"
              >{{ app.clientId }}</code
            >
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="error"
              variant="soft"
              icon="i-lucide-trash-2"
              size="sm"
              @click="deleteApp(app.id!)"
              class="hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              删除
            </UButton>
          </div>
        </template>
      </UCard>
    </div>

    <CustomForm
      v-model:open="isModalOpen"
      v-model:config="form"
      v-model:form-data="formState"
      v-model:loading="isSubmitting"
      :title="isEditMode ? '编辑 OAuth 应用' : '创建 OAuth 应用'"
      @success="handleFormSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import CustomForm from "~/components/CustomForm.vue";
import type { FieldConfig } from "~/types/field-config";
import {
  getOauthApps,
  postOauthApps,
  deleteOauthAppsById,
} from "~~/packages/api/src/sdk.gen";
import type {
  CreateAppRequest,
  OAuthAppResponse,
} from "~~/packages/api/src/types.gen";

const toast = useToast();

const apps = ref<OAuthAppResponse[]>();
const pending = ref(true);
const isModalOpen = ref(false);
const isEditMode = ref(false);
const isSubmitting = ref(false);

const form: Ref<FieldConfig[]> = ref([
  {
    key: "clientId",
    label: "客户端 ID",
    description: "应用的唯一标识符",
    type: "text",
    placeholder: "应用的唯一标识符",
    icon: "i-lucide-fingerprint-pattern",
  },
  {
    key: "clientSecret",
    label: "客户端密钥",
    description: "请妥善保管",
    type: "password",
    placeholder: "••••••••",
    icon: "i-lucide-key",
  },
  {
    key: "displayName",
    label: "显示名称",
    description: "应用的显示名称",
    type: "text",
    placeholder: "请输入文本",
    icon: "i-lucide-folder",
  },
  {
    key: "redirectUri",
    label: "回调地址",
    description: "OAuth 授权后的回调地址（可添加多个）",
    type: "text",
    placeholder: "https://app.example.com/callback",
    icon: "i-lucide-link",
    multiple: true
  },
]);

const formState = ref({
  clientId: "",
  clientSecret: "",
  displayName: "",
  redirectUri: "",
  redirectUris: [""] as string[],
});

const refresh = async () => {
  pending.value = true;
  try {
    const response = await getOauthApps();
    if (!response.error) {
      apps.value = response.data;
    }
  } finally {
    pending.value = false;
  }
};

const openForm = (editMode: boolean) => {
  isEditMode.value = editMode;
  if (!editMode) {
    formState.value = {
      clientId: "",
      clientSecret: "",
      displayName: "",
      redirectUri: "",
      redirectUris: [""],
    };
  }
  isModalOpen.value = true;
};

const handleFormSubmit = async (data: Record<string, any>) => {
  isSubmitting.value = true;
  try {
    // 处理 redirectUris：如果用户输入了新的 URI，添加到数组中
    if (data.redirectUri && data.redirectUri.trim()) {
      formState.value.redirectUris.push(data.redirectUri.trim());
    }

    const requestBody: CreateAppRequest = {
      clientId: data.clientId,
      clientSecret: data.clientSecret,
      displayName: data.displayName,
      redirectUris: formState.value.redirectUris.filter((u) => u.trim()) || [data.redirectUri],
    };

    await postOauthApps({
      body: requestBody,
    });

    toast.add({
      title: "创建成功",
      description: "OAuth 应用已成功创建！",
      color: "success",
    });

    isModalOpen.value = false;
    formState.value = {
      clientId: "",
      clientSecret: "",
      displayName: "",
      redirectUri: "",
      redirectUris: [""],
    };

    await refresh();
  } catch (error: any) {
    console.error("Failed to create app", error);
    toast.add({ title: "错误", description: error.message, color: "error" });
  } finally {
    isSubmitting.value = false;
  }
};

async function deleteApp(id: string) {
  try {
    await deleteOauthAppsById({
      path: { id },
    });

    toast.add({
      title: "已删除",
      description: "应用已成功删除。",
      color: "warning",
    });
    await refresh();
  } catch (error: any) {
    toast.add({
      title: "错误",
      description: "删除失败。",
      color: "error",
    });
  }
}

onMounted(async () => {
  await refresh();
});
</script>

<style scoped>
@reference "~/assets/css/main.css";
</style>
