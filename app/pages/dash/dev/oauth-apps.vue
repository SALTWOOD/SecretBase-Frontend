<template>
  <UContainer>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          OAuth 应用
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          管理您的 OAuth 应用程序和授权配置
        </p>
      </div>
      <UButton
        icon="i-heroicons-plus-circle"
        size="lg"
        @click="isCreating = true"
        class="shadow-md hover:shadow-lg transition-shadow duration-200"
      >
        创建新应用
      </UButton>
    </div>

    <UModal v-model:open="isCreating" :ui="{ content: 'rounded-xl shadow-2xl max-w-2xl' }">
      <template #content>
        <div class="p-8 space-y-8">
          <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              创建 OAuth 应用
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              填写以下信息来注册新的 OAuth 应用
            </p>
          </div>
          <UForm @submit="createNewApp" :state="newApp" class="space-y-6">
            <UFormGroup label="客户端 ID" name="clientId" required>
              <UInput
                v-model="newApp.clientId"
                placeholder="应用的唯一标识符"
                size="lg"
                icon="i-heroicons-identification"
                :ui="{ icon: { base: 'text-gray-400 dark:text-gray-500' } }"
              />
            </UFormGroup>
            <UFormGroup label="客户端密钥" name="clientSecret" required>
              <UInput
                v-model="newApp.clientSecret"
                type="password"
                placeholder="请妥善保管此密钥！"
                size="lg"
                icon="i-heroicons-key"
                :ui="{ icon: { base: 'text-gray-400 dark:text-gray-500' } }"
              />
            </UFormGroup>
            <UFormGroup label="显示名称" name="displayName" required>
              <UInput
                v-model="newApp.displayName"
                placeholder="我的精彩应用"
                size="lg"
                icon="i-heroicons-cube"
                :ui="{ icon: { base: 'text-gray-400 dark:text-gray-500' } }"
              />
            </UFormGroup>
            <UFormGroup label="回调地址" name="redirectUris" required>
              <div class="space-y-3">
                <div
                  v-for="(uri, index) in newApp.redirectUris"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <UInput
                    v-model="newApp.redirectUris![index]"
                    placeholder="https://app.example.com/callback"
                    size="lg"
                    icon="i-heroicons-link"
                    class="flex-1"
                    :ui="{ icon: { base: 'text-gray-400 dark:text-gray-500' } }"
                  />
                  <UButton
                    v-if="newApp.redirectUris!.length > 1"
                    icon="i-heroicons-minus-circle"
                    color="error"
                    variant="ghost"
                    size="lg"
                    @click="newApp.redirectUris?.splice(index, 1)"
                  />
                </div>
                <UButton
                  icon="i-heroicons-plus-circle"
                  variant="ghost"
                  size="md"
                  @click="newApp.redirectUris?.push('')"
                  class="text-gray-600 dark:text-gray-400"
                >
                  添加更多回调地址
                </UButton>
              </div>
            </UFormGroup>
            <div class="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <UButton
                color="primary"
                variant="ghost"
                size="lg"
                @click="isCreating = false"
              >
                取消
              </UButton>
              <UButton type="submit" size="lg" class="shadow-md">
                创建应用
              </UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UModal>

    <div v-if="pending" class="flex justify-center items-center py-16">
      <div class="text-center space-y-4">
        <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 animate-spin text-primary-500" />
        <p class="text-gray-500 dark:text-gray-400 text-lg">加载应用中...</p>
      </div>
    </div>
    <div
      v-else-if="!apps || apps.length === 0"
      class="flex flex-col items-center justify-center py-16 px-4"
    >
      <div class="text-center space-y-4 max-w-md">
        <div
          class="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center"
        >
          <UIcon name="i-heroicons-key" class="w-10 h-10 text-gray-400" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          暂无 OAuth 应用
        </h3>
        <p class="text-gray-500 dark:text-gray-400">
          点击上方"创建新应用"按钮来添加您的第一个 OAuth 应用
        </p>
      </div>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="app in apps"
        :key="app.id"
        class="hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
      >
        <template #header>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md"
              >
                <UIcon name="i-heroicons-cube" class="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {{ app.displayName }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  OAuth 应用
                </p>
              </div>
            </div>
          </div>
        </template>
        <div class="space-y-3">
          <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">客户端 ID</p>
            <code
              class="text-sm font-mono text-gray-900 dark:text-gray-100 break-all"
              >{{ app.clientId }}</code
            >
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="error"
              variant="soft"
              icon="i-heroicons-trash"
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
  </UContainer>
</template>

<script setup lang="ts">
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
const isCreating = ref(false);

const newApp = reactive<CreateAppRequest>({
  clientId: "",
  clientSecret: "",
  displayName: "",
  redirectUris: [""],
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

async function createNewApp() {
  try {
    await postOauthApps({
      body: {
        ...newApp,
        redirectUris: newApp.redirectUris?.filter((u) => u.trim()) ?? [],
      },
    });

    toast.add({
      title: "创建成功",
      description: "OAuth 应用已成功创建！",
      color: "success",
    });

    isCreating.value = false;
    Object.assign(newApp, {
      clientId: "",
      clientSecret: "",
      displayName: "",
      redirectUris: [""],
    });

    await refresh();
  } catch (error: any) {
    console.error("Failed to create app", error);
    toast.add({ title: "错误", description: error.message, color: "error" });
  }
}

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
