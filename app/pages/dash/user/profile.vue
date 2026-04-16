<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-highlighted">个人资料</h1>
      <p class="text-muted text-sm">管理你的账户信息与安全设置</p>
    </div>

    <UCard>
      <template #header>
        <h3 class="font-bold text-highlighted">基本信息</h3>
      </template>

      <form @submit.prevent="updateProfile" class="space-y-4">
        <div class="flex items-center gap-6 mb-6">
          <UAvatar
            :src="isValidAvatarUrl(form.avatar) ? form.avatar : undefined"
            size="xl"
          />
          <UButton color="neutral" variant="ghost" icon="i-lucide-camera">
            更换头像
          </UButton>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="用户名">
            <UInput
              v-model="form.username"
              :disabled="loading"
              placeholder="你的名字"
              variant="subtle"
            />
          </UFormField>
          <UFormField label="电子邮箱">
            <UInput v-model="form.email" disabled variant="subtle" />
          </UFormField>
          <UFormField label="个人网站">
            <UInput
              v-model="form.website"
              :disabled="loading"
              placeholder="https://example.com"
              variant="subtle"
              icon="i-lucide-globe"
            />
          </UFormField>
        </div>

        <div class="flex justify-end">
          <UButton type="submit" color="primary" :loading="loading">
            保存更改
          </UButton>
        </div>
      </form>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="font-bold text-highlighted">账号绑定</h3>
      </template>

      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <UIcon name="i-simple-icons-github" class="w-6 h-6" />
          <div>
            <div class="font-medium text-sm">GitHub</div>
            <div v-if="githubBinding" class="text-xs text-muted">
              {{ githubBinding.providerUsername }}
            </div>
            <div v-else class="text-xs text-muted">尚未绑定 GitHub 账号</div>
          </div>
          <UAvatar
            v-if="githubBinding?.providerAvatarUrl"
            :src="githubBinding.providerAvatarUrl"
            size="sm"
          />
        </div>
        <div class="flex items-center gap-2">
          <UButton
            v-if="!githubBinding"
            color="neutral"
            variant="subtle"
            icon="i-simple-icons-github"
            @click="bindGitHub"
          >
            绑定 GitHub
          </UButton>
          <UButton
            v-else
            color="error"
            variant="ghost"
            icon="i-lucide-unlink"
            @click="unbindGitHub"
          >
            解绑
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { User } from "~/types/user";
import type { ThirdPartyBindingDto } from "~~/packages/api/src/types.gen";
import {
  getUserProfile,
  postUserProfile,
  getUserBindings,
  deleteUserBindingsByProvider,
} from "~~/packages/api/src/sdk.gen";
import { isValidAvatarUrl } from "~/utils/url-validator";

const loading = ref(true);
const user: Ref<User | null> = ref(null);
const userStore = useUserStore();
const toast = useToast();
const route = useRoute();

const githubBinding = ref<ThirdPartyBindingDto | null>(null);

const form = reactive({
  username: "",
  email: "",
  avatar: "",
  website: "",
});

const updateProfile = async () => {
  loading.value = true;
  console.log("Update profile:", user);
  const response = await postUserProfile({
    body: {
      username: user.value?.username,
      website: form.website || null,
    },
  });
  loading.value = false;
  if (response.error) {
    console.error(response.error);
    toast.add({ title: "Failed to update profile", color: "error" });
    return;
  }
  toast.add({ title: response.data.message, color: "success" });
};

const fetchBindings = async () => {
  const response = await getUserBindings();
  if (!response.error && response.data) {
    githubBinding.value =
      response.data.find((b) => b.provider === "GitHub") ?? null;
  }
};

const bindGitHub = () => {
  window.location.href = "/api/v1/auth/github/bind";
};

const unbindGitHub = async () => {
  const response = await deleteUserBindingsByProvider({
    path: { provider: "GitHub" },
  });
  if (response.error) {
    toast.add({ title: "解绑失败", color: "error" });
    return;
  }
  githubBinding.value = null;
  toast.add({ title: "已解绑 GitHub 账号", color: "success" });
};

onMounted(async () => {
  const profileResponse = await getUserProfile();
  if (!profileResponse.error && profileResponse.response.status === 200) {
    userStore.setUser(profileResponse.data as any);
  }
  user.value = userStore.user;
  form.username = user.value?.username || "";
  form.email = user.value?.email || "";
  form.avatar = user.value?.avatar || "";
  form.website = user.value?.website || "";

  await fetchBindings();

  const status = route.query.github_status as string;
  if (status === "bound") {
    toast.add({ title: "GitHub 账号绑定成功", color: "success" });
    await fetchBindings();
  } else if (status === "already_bound") {
    toast.add({ title: "该 GitHub 账号已绑定", color: "warning" });
  } else if (status === "bound_by_other") {
    toast.add({ title: "该 GitHub 账号已被其他用户绑定", color: "error" });
  }

  loading.value = false;
});
</script>

<style scoped>
@reference "~/assets/css/main.css";

:deep(.u-form-field-label) {
  @apply text-highlighted font-semibold;
}
</style>
