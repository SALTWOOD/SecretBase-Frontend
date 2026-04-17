<template>
  <AuthLayout>
    <template #title>创建账号</template>
    <template #description>加入秘密基地，开启你的旅程</template>

    <form @submit.prevent="handleRegister" class="space-y-4">
        <UFormField label="用户名">
          <UInput
            v-model="form.username"
            placeholder="如何称呼你？"
            icon="i-lucide-user"
            class="w-full"
          />
        </UFormField>

        <UFormField label="电子邮箱">
          <UInput
            v-model="form.email"
            type="email"
            placeholder="name@example.com"
            icon="i-lucide-mail"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="密码">
            <UInput
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              class="w-full"
            />
          </UFormField>

          <UFormField label="确认密码">
            <UInput
              v-model="form.confirmPassword"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-shield-check"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="邀请码 (可选)">
          <UInput
            v-model="form.invitationCode"
            placeholder="如果你有邀请码..."
            icon="i-lucide-ticket"
            class="w-full"
          />
        </UFormField>

        <UFormField label="人机验证">
          <CapWidget ref="capWidgetRef" v-model="capToken" />
        </UFormField>

        <UButton
          type="submit"
          block
          color="primary"
          size="lg"
          :loading="loading"
          :disabled="!capToken || loading"
        >
          立即注册
        </UButton>
      </form>

      <template #footer>
        <p class="text-center text-sm text-muted">
          已有账号？
          <NuxtLink to="/auth/login" class="text-primary hover:underline"
            >返回登录</NuxtLink
          >
        </p>
      </template>
    </AuthLayout>
</template>

<script setup lang="ts">
import { postAuthRegister, getUserProfile } from "@secret-base/api/src/sdk.gen";

const form = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  invitationCode: "",
});

const loading = ref(false);
const capToken = ref("");
const capWidgetRef = ref<{ reset: () => void } | null>(null);
const toast = useToast();
const userStore = useUserStore();

const handleRegister = async () => {
  if (form.password !== form.confirmPassword) {
    toast.add({ title: "Passwords do not match", color: "error" });
    return;
  }

  loading.value = true;
  try {
    const response = await postAuthRegister({
      body: {
        username: form.username,
        email: form.email,
        password: form.password,
        inviteCode: form.invitationCode,
        captchaToken: capToken.value,
      },
    });

    if (!response.error) {
      const profileResponse = await getUserProfile();
      if (!profileResponse.error && profileResponse.response.status === 200) {
        userStore.setUser(profileResponse.data as any);
      }
      toast.add({
        title: "Registration successful",
        color: "success",
      });
      navigateTo("/dash");
    } else {
      toast.add({
        title: "Registration failed",
        description: (response.error as any).message,
        color: "error",
      });
    }
  } finally {
    loading.value = false;
    capWidgetRef.value?.reset();
  }
};
</script>

