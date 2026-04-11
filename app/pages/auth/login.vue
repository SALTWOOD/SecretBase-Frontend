<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <UCard
      class="w-full max-w-md backdrop-blur-xl border-default shadow-2xl bg-gray-50/50 dark:bg-gray-900/50"
    >
      <template #header>
        <div class="text-center">
          <h2 class="text-2xl font-bold">欢迎回来</h2>
          <p class="text-muted-foreground text-sm mt-1">进入你的秘密基地</p>
        </div>
      </template>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <UFormField label="电子邮箱">
          <UInput
            v-model="form.email"
            type="email"
            placeholder="name@example.com"
            icon="i-lucide-mail"
            class="w-full"
          />
        </UFormField>

        <UFormField label="密码">
          <UInput
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-lock"
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
          立即登录
        </UButton>
      </form>

      <template #footer>
        <p class="text-center text-sm text-muted-foreground">
          还没有账号？
          <NuxtLink to="/auth/register" class="text-primary hover:underline"
            >立即注册</NuxtLink
          >
        </p>

        <p class="text-center text-sm text-muted-foreground">
          或者……
          <UButton
            variant="link"
            color="primary"
            class="p-0 h-auto hover:underline font-normal"
            @click="handleWebAuthn"
          >
            使用 WebAuthn
          </UButton>
        </p>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import "@cap.js/widget";
import {
  postAuthLogin,
  postAuthWebauthnLoginOptions,
  postAuthWebauthnLoginVerify,
} from "@secret-base/api/src/sdk.gen";
import { startAuthentication } from "@simplewebauthn/browser";
import { useUserStore } from "~/stores/user";
import { isValidRedirectUrl } from "~/utils/url-validator";

const form = reactive({ email: "", password: "" });
const loading = ref(false);
const capToken = ref("");
const capKey = ref(0);
const api = "/api/cap/";
const toast = useToast();
const userStore = useUserStore();
const route = useRoute();

const handleCapSolve = (e: CustomEvent) => {
  capToken.value = e.detail.token;
  console.log("CAP Solved");
};

const handleCapReset = () => {
  capToken.value = "";
  console.log("CAP Expired");
};

const handleLogin = async () => {
  loading.value = true;
  try {
    const response = await postAuthLogin({
      body: {
        email: form.email,
        password: form.password,
        captchaToken: capToken.value,
      },
    });

    if (!response.error) {
      switch (response.data.status) {
        case "pending":
          const { openChallengeModal } = useChallenge();
          if (!openChallengeModal.value)
            throw new Error(
              "Two-factor authentication component was not initialized.",
            );
          const result = await openChallengeModal.value();
          if (!result) return; // intended; fallthrough to "success" case and store user information
        /* fallthrough */
        case "success":
          userStore.$patch({
            user: response.data.data!.user,
            isLoggedIn: true,
            expires: response.data.data!.expires,
          });
          const redirectUrl = route.query.redirect as string;
          navigateTo(isValidRedirectUrl(redirectUrl) ? redirectUrl : "/dash");
          break;
        default:
          break;
      }
      toast.add({
        title: "Login success",
        color: "success",
      });
    }
  } finally {
    loading.value = false;
  }
};

const handleWebAuthn = async () => {
  const optionsResponse = await postAuthWebauthnLoginOptions();
  if (optionsResponse.error || !optionsResponse.data)
    throw new Error("Unable to fetch WebAuthn login options.");

  const assertionResponse = await startAuthentication({
    optionsJSON: optionsResponse.data as any,
  });

  await postAuthWebauthnLoginVerify({
    body: assertionResponse,
    query: {
      isLogin: true,
    },
  });
};
</script>

<style scoped>
.cap-wrapper {
  --cap-widget-width: 100%;
}
</style>
