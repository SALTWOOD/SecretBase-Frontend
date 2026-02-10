<template>
  <div class="view-content">
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-6"
    >
      <div>
        <h1 class="text-3xl font-bold text-highlighted tracking-tight">
          OAuth 应用
        </h1>
        <p class="text-muted text-sm mt-1">管理您的 OAuth 应用程序和授权配置</p>
      </div>
      <div class="flex gap-2">
        <UButton
          icon="i-lucide-refresh-ccw"
          size="lg"
          @click="refresh"
          class="shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          刷新
        </UButton>
        <UButton
          icon="i-lucide-plus-circle"
          size="lg"
          @click="openForm(false)"
          class="shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          创建新应用
        </UButton>
      </div>
    </div>

    <div v-if="pending" class="flex justify-center items-center py-16">
      <div class="text-center space-y-4">
        <UIcon
          name="i-lucide-refresh-cw"
          class="w-12 h-12 animate-spin text-primary-500"
        />
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
        <h3 class="text-xl font-semibold text-highlighted">暂无 OAuth 应用</h3>
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
                class="w-12 h-12 bg-linear-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md"
              >
                <UIcon name="i-lucide-box" class="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-highlighted">
                  {{ app.displayName }}
                </h3>
                <p class="text-xs text-muted mt-0.5">OAuth 应用</p>
              </div>
            </div>
          </div>
        </template>
        <div class="space-y-3">
          <div class="p-3 bg-default/50 rounded-lg">
            <p class="text-xs text-muted mb-1">客户端 ID</p>
            <div class="flex items-center gap-2">
              <code
                class="text-sm font-mono text-highlighted break-all flex-1"
                >{{ app.clientId }}</code
              >
              <UButton
                icon="i-lucide-copy"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="copyToClipboard(app.clientId!)"
              />
            </div>
          </div>
          <div class="p-3 bg-default/50 rounded-lg">
            <p class="text-xs text-muted mb-1">应用类型</p>
            <p class="text-sm font-medium text-highlighted">
              {{ getApplicationTypeLabel(app.applicationType) }}
            </p>
          </div>
          <div class="p-3 bg-default/50 rounded-lg">
            <p class="text-xs text-muted mb-1">客户端类型</p>
            <p class="text-sm font-medium text-highlighted">
              {{ getClientTypeLabel(app.clientType) }}
            </p>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-refresh-cw"
              size="sm"
              @click="resetSecret(app.id!)"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              重置密钥
            </UButton>
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-edit"
              size="sm"
              @click="openForm(true, app.id!)"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              编辑
            </UButton>
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

    <TextDisplayModal
      ref="secretModal"
      title="客户端密钥已生成"
      description="请妥善保管您的密钥"
      label="客户端密钥"
      buttonText="我已妥善保管"
    />
  </div>
</template>

<script setup lang="ts">
import CustomForm from "~/components/CustomForm.vue";
import TextDisplayModal from "~/components/TextDisplayModal.vue";
import type { FieldConfig } from "~/types/field-config";
import {
  getOauthApps,
  postOauthApps,
  deleteOauthAppsById,
  patchOauthAppsById,
  getOauthAppsById,
  postOauthAppsByIdSecret,
} from "~~/packages/api/src/sdk.gen";
import type {
  CreateAppRequest,
  PatchAppRequest,
  OAuthAppResponse,
  OAuthAppDetailResponse,
} from "~~/packages/api/src/types.gen";

const toast = useToast();

const apps = ref<OAuthAppResponse[]>();
const pending = ref(true);
const isModalOpen = ref(false);
const isEditMode = ref(false);
const isSubmitting = ref(false);
const editingAppId = ref<string | null>(null);
const secretModal = ref<InstanceType<typeof TextDisplayModal>>();

const form: Ref<FieldConfig[]> = ref([
  {
    key: "clientId",
    label: "客户端 ID",
    description: "应用的唯一标识符",
    type: "text",
    placeholder: "应用的唯一标识符",
    icon: "i-lucide-fingerprint-pattern",
    disabled: true,
  },
  {
    key: "clientSecret",
    label: "客户端密钥",
    description: "请妥善保管",
    type: "password",
    placeholder: "••••••••",
    icon: "i-lucide-key",
    disabled: true,
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
    multiple: true,
  },
  {
    key: "clientType",
    label: "客户端类型",
    description: "客户端的安全类型，机密客户端可以安全存储密钥",
    type: "select",
    options: [
      { label: "机密客户端 (Confidential)", value: "confidential" },
      { label: "公开客户端 (Public)", value: "public" },
    ],
    icon: "i-lucide-shield",
  },
  {
    key: "applicationType",
    label: "应用类型",
    description: "应用的部署类型",
    type: "select",
    options: [
      { label: "Web 应用", value: "web" },
      { label: "原生应用 (Native)", value: "native" },
    ],
    icon: "i-lucide-laptop",
  },
  {
    key: "consentType",
    label: "同意类型",
    description: "用户授权同意的处理方式",
    type: "select",
    options: [
      { label: "显式 (Explicit) - 用户需要明确同意", value: "explicit" },
      { label: "隐式 (Implicit) - 自动同意", value: "implicit" },
      { label: "外部 (External) - 外部处理", value: "external" },
      { label: "系统 (Systematic) - 系统处理", value: "systematic" },
    ],
    icon: "i-lucide-check-circle",
  },
]);

const formState = ref({
  clientId: "",
  displayName: "",
  redirectUri: [""] as string[],
  clientType: "confidential" as string,
  applicationType: "web" as string,
  consentType: "explicit" as string,
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

const getClientTypeLabel = (type: string | undefined) => {
  if (!type) return "未知";
  const labels: Record<string, string> = {
    confidential: "机密客户端",
    public: "公开客户端",
  };
  return labels[type] || type;
};

const getApplicationTypeLabel = (type: string | undefined) => {
  if (!type) return "未知";
  const labels: Record<string, string> = {
    web: "Web 应用",
    native: "原生应用",
  };
  return labels[type] || type;
};

const openForm = async (editMode: boolean, appId?: string) => {
  isEditMode.value = editMode;
  editingAppId.value = appId || null;

  if (!editMode) {
    formState.value = {
      clientId: "",
      displayName: "",
      redirectUri: [""],
      clientType: "confidential",
      applicationType: "web",
      consentType: "explicit",
    };
  } else if (appId) {
    // 获取应用详情用于编辑
    try {
      const response = await getOauthAppsById({
        path: { id: appId },
      });
      if (!response.error && response.data) {
        const appData = response.data;
        formState.value = {
          clientId: appData.clientId || "",
          displayName: appData.displayName || "",
          redirectUri: appData.redirectUris || [""],
          clientType: appData.clientType || "confidential",
          applicationType: appData.applicationType || "web",
          consentType: appData.consentType || "explicit",
        };
      }
    } catch (error) {
      console.error("Failed to fetch app details:", error);
      toast.add({
        title: "错误",
        description: "获取应用详情失败",
        color: "error",
      });
      return;
    }
  }
  isModalOpen.value = true;
};

const handleFormSubmit = async (data: Record<string, any>) => {
  isSubmitting.value = true;
  try {
    if (!isEditMode.value) {
      // 创建新应用
      const requestBody: CreateAppRequest = {
        displayName: data.displayName,
        redirectUris:
          formState.value.redirectUri.filter((u: string) => u.trim()) || [],
        clientType: data.clientType || "confidential",
        applicationType: data.applicationType || "web",
        consentType: data.consentType || "explicit",
      };

      const response = await postOauthApps({
        body: requestBody,
      });

      if (!response.error) {
        // 显示 secret 模态框
        secretModal.value?.open(
          `ID: ${response.data.clientId}, Secret: ${response.data.clientSecret}`,
        );

        toast.add({
          title: "创建成功",
          description: "OAuth 应用已成功创建！",
          color: "success",
        });
      }
    } else {
      // 编辑现有应用
      const requestBody: PatchAppRequest = {
        displayName: data.displayName,
        redirectUris:
          formState.value.redirectUri.filter((u: string) => u.trim()) || [],
        clientType: data.clientType || undefined,
        applicationType: data.applicationType || undefined,
        consentType: data.consentType || undefined,
      };

      const response = await patchOauthAppsById({
        path: { id: editingAppId.value! },
        body: requestBody,
      });

      if (!response.error) {
        toast.add({
          title: "更新成功",
          description: "OAuth 应用已成功更新！",
          color: "success",
        });
      }
    }

    isModalOpen.value = false;
    formState.value = {
      clientId: "",
      displayName: "",
      redirectUri: [""],
      clientType: "confidential",
      applicationType: "web",
      consentType: "explicit",
    };
    editingAppId.value = null;

    await refresh();
  } catch (error: any) {
    console.error("Failed to save app", error);
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

async function resetSecret(id: string) {
  try {
    const response = await postOauthAppsByIdSecret({
      path: { id },
    });

    if (!response.error) {
      // 显示新的 secret
      secretModal.value?.open(response.data.clientSecret);

      toast.add({
        title: "密钥已重置",
        description: "客户端密钥已成功重置！",
        color: "success",
      });
    }
  } catch (error: any) {
    console.error("Failed to reset secret", error);
    toast.add({
      title: "错误",
      description: "重置密钥失败。",
      color: "error",
    });
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({
      title: "已复制",
      description: "客户端 ID 已复制到剪贴板",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to copy:", error);
    toast.add({
      title: "复制失败",
      description: "无法复制到剪贴板",
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
