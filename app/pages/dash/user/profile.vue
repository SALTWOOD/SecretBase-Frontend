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
          <UAvatar src="https://github.com/nuxt.png" size="xl" />
          <UButton color="neutral" variant="ghost" icon="i-heroicons-camera">
            更换头像
          </UButton>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="用户名">
            <UInput
              v-model="user.name"
              :disabled="loading"
              placeholder="你的名字"
              variant="subtle"
            />
          </UFormField>
          <UFormField label="电子邮箱">
            <UInput v-model="user.email" disabled variant="subtle" />
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
import { getUserProfile, postUserProfile } from "~~/packages/api/src/sdk.gen";

const loading = ref(true);
const user = reactive({
  name: "Akarin",
  email: "akarin@secret.base",
});
const userStore = useUserStore();
const toast = useToast();

const updateProfile = async () => {
  loading.value = true;
  console.log("Update profile:", user);
  const response = await postUserProfile({
    body: {
      username: user.name,
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
  const response = await getUserProfile();
  if (!response.error && response.data) {
    userStore.$patch({
      user: response.data,
    });
    user.name = response.data.username!;
    user.email = response.data.email!;
    loading.value = false;
    return;
  }
  console.error(response.error);
  toast.add({ title: "Failed to load profile", color: "error" });
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
