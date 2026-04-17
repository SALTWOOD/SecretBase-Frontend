<template>
  <AuthLayout>
    <template #title>欢迎回来</template>
    <template #description>进入你的秘密基地</template>

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
          立即登录
        </UButton>
      </form>

      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-default"></div>
        </div>
        <div class="relative flex justify-center text-xs">
          <span class="bg-default px-2 text-muted">或</span>
        </div>
      </div>

      <UButton
        block
        color="neutral"
        variant="subtle"
        size="lg"
        icon="i-simple-icons-github"
        @click="loginWithGitHub"
      >
        使用 GitHub 登录
      </UButton>

      <template #footer>
        <p class="text-center text-sm text-muted">
          还没有账号？
          <NuxtLink to="/auth/register" class="text-primary hover:underline"
            >立即注册</NuxtLink
          >
        </p>

        <p class="text-center text-sm text-muted">
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
    </AuthLayout>
</template>

<script setup lang="ts">
import {
  postAuthLogin,
  postAuthWebauthnLoginOptions,
  postAuthWebauthnLoginVerify,
  getUserProfile,
} from "~~/packages/api/src";

import { startAuthentication } from "@simplewebauthn/browser";
import { isValidRedirectUrl } from "~/utils/url-validator";

const form = reactive({ email: "", password: "" });
const loading = ref(false);
const capToken = ref("");
const capWidgetRef = ref<{ reset: () => void } | null>(null);
const toast = useToast();
const userStore = useUserStore();
const route = useRoute();

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
          if (!result) return;
        /* fallthrough */
        case "success":
          if (response.data.data?.user) {
            userStore.setUser(response.data.data.user as any);
          }
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
    capWidgetRef.value?.reset();
  }
};

const handleWebAuthn = async () => {
  const optionsResponse = await postAuthWebauthnLoginOptions();
  if (optionsResponse.error || !optionsResponse.data)
    throw new Error("Unable to fetch WebAuthn login options.");

  const assertionResponse = await startAuthentication({
    optionsJSON: optionsResponse.data as any,
  });

  const verifyResponse = await postAuthWebauthnLoginVerify({
    body: assertionResponse,
    query: {
      isLogin: true,
    },
  });

  if (!verifyResponse.error) {
    const profileResponse = await getUserProfile();
    if (!profileResponse.error && profileResponse.response.status === 200) {
      userStore.setUser(profileResponse.data as any);
    }
    navigateTo("/dash");
  }
};

const loginWithGitHub = () => {
  window.location.href = "/api/v1/auth/github/login";
};

onMounted(async () => {
  const state = route.query.state as string;

  switch (state) {
    case "github_callback_success":
      toast.add({ title: "GitHub 登录回调成功，正在跳转……", color: "success" });
      const response = await getUserProfile();
      if (response.error || !response.data) {
        toast.add({ title: "获取用户信息失败", color: "error" });
        return;
      }
      userStore.setUser(response.data as any);
      await navigateTo("/dash");
      break;
    case "github_callback_failed":
      toast.add({ title: "GitHub 登录回调失败", color: "error" });
      break;
    case "github_not_bound":
      toast.add({
        title: "该 GitHub 账号未绑定本站账号",
        description: "请先使用邮箱密码登录，然后在个人资料中绑定 GitHub。",
        color: "error",
      });
      break;
    case "github_state_expired":
      toast.add({ title: "GitHub 登录已过期，请重试", color: "error" });
      break;
    case "github_misconfigured":
      toast.add({ title: "GitHub OAuth 未正确配置", color: "error" });
      break;
    case "github_token_failed":
      toast.add({ title: "GitHub 令牌获取失败", color: "error" });
      break;
    case "github_user_failed":
      toast.add({ title: "获取 GitHub 用户信息失败", color: "error" });
      break;
    case "user_banned":
      toast.add({ title: "该账号已被封禁", color: "error" });
      break;
    default:
      break;
  }
});
</script>

