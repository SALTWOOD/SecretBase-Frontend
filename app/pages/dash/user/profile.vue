<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-highlighted">个人资料</h1>
      <p class="text-muted text-sm">管理你的账户信息与安全设置</p>
    </div>

    <UCard
      class="glass-card bg-(--ui-bg-elevated)/40 border border-default shadow-xl"
    >
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
        </div>

        <div class="flex justify-end">
          <UButton type="submit" color="primary" :loading="loading">
            保存更改
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { User } from "~/types/user";
import { getUserProfile, postUserProfile } from "~~/packages/api/src/sdk.gen";
import { isValidAvatarUrl } from "~/utils/url-validator";

const loading = ref(true);
const user: Ref<User | null> = ref(null);
const userStore = useUserStore();
const toast = useToast();

const form = reactive({
  username: "",
  email: "",
  avatar: "",
});

const updateProfile = async () => {
  loading.value = true;
  console.log("Update profile:", user);
  const response = await postUserProfile({
    body: {
      username: user.value?.username,
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

onMounted(async () => {
  await userStore.fetch();
  user.value = userStore.user;
  form.username = user.value?.username || "";
  form.email = user.value?.email || "";
  form.avatar = user.value?.avatar || "";
  loading.value = false;
});
</script>

<style scoped>
@reference "~/assets/css/main.css";

.glass-card {
  @apply backdrop-blur-xl transition-all duration-300;
}

:deep(.u-form-field-label) {
  @apply text-highlighted font-semibold;
}
</style>
