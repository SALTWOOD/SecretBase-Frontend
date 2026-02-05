<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <UCard
      class="w-full max-w-md bg-white/5 dark:bg-black/20 backdrop-blur-xl border-default shadow-2xl"
    >
      <template #header>
        <div class="text-center">
          <h2 class="text-2xl font-bold">创建账号</h2>
          <p class="text-muted-foreground text-sm mt-1">
            加入秘密基地，开启你的旅程
          </p>
        </div>
      </template>

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

        <client-only>
          <UFormField label="人机验证">
            <div
              class="cap-wrapper w-full overflow-hidden rounded-lg border border-default bg-muted/20"
            >
              <cap-widget
                :data-cap-api-endpoint="api"
                @solve="handleCapSolve"
                @reset="handleCapReset"
              />
            </div>
          </UFormField>
        </client-only>

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
        <p class="text-center text-sm text-muted-foreground">
          已有账号？
          <NuxtLink to="/auth/login" class="text-primary hover:underline"
            >返回登录</NuxtLink
          >
        </p>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import "@cap.js/widget";
import { postAuthRegister } from "@secret-base/api/src/sdk.gen";

const form = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  invitationCode: "",
});

const loading = ref(false);
const capToken = ref("");
const api = "/api/cap/";
const toast = useToast();

const handleCapSolve = (e: CustomEvent) => {
  capToken.value = e.detail.token;
  console.log("CAP Solved");
};

const handleCapReset = () => {
  capToken.value = "";
  console.log("CAP Expired");
};

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
  }
};
</script>

<style scoped>
.cap-wrapper {
  --cap-widget-width: 100%;
}
</style>
