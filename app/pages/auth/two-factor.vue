<template>
  <AuthLayout>
    <template #headerExtra>
      <UButton
        v-if="step !== 'select'"
        variant="ghost"
        icon="i-lucide-arrow-left"
        class="absolute left-0 top-1/2 -translate-y-1/2"
        @click="step = 'select'"
      />
    </template>
    <template #title>
      <span :class="isSuccess ? 'text-green-500' : ''">安全验证</span>
    </template>
    <template #description>{{ stepDescriptions[step] }}</template>

      <div v-if="step === 'select'" class="space-y-3">
        <UButton
          v-for="method in availableMethods"
          :key="method.id"
          block
          variant="outline"
          class="h-16 justify-start px-4 text-base border-default"
          :icon="method.icon"
          @click="step = method.id"
        >
          {{ method.label }}
        </UButton>
      </div>

      <div v-else-if="step === 'totp'" class="space-y-8">
        <div class="flex justify-center gap-2">
          <input
            v-for="(_, index) in 6"
            :key="index"
            :ref="(el) => (inputRefs[index] = el as HTMLInputElement)"
            v-model="digits[index]"
            type="text"
            maxlength="1"
            inputmode="numeric"
            class="w-12 h-14 text-center text-2xl font-bold rounded-lg border bg-muted/20 outline-none transition-all focus:ring-2 focus:ring-primary focus:border-primary"
            :class="[
              isSuccess
                ? 'animate-jump border-green-500 text-green-500'
                : 'border-default text-gray-900 dark:text-white',
            ]"
            :style="isSuccess ? { animationDelay: `${index * 100}ms` } : {}"
            @input="handleInput(index, $event)"
            @keydown.delete="handleDelete(index)"
            :disabled="loading || isSuccess"
          />
        </div>

        <UButton
          block
          size="lg"
          :loading="loading"
          :disabled="digits.some((d) => !d) || isSuccess"
          @click="handleTotpSubmit"
        >
          验证
        </UButton>
      </div>

      <div v-else-if="step === 'passkey'" class="py-6 text-center space-y-6">
        <div class="flex justify-center">
          <UIcon
            name="i-lucide-fingerprint"
            class="w-16 h-16 text-primary"
            :class="{ 'animate-pulse': loading }"
          />
        </div>
        <UButton block size="lg" @click="handlePasskeyAuth" :loading="loading">
          使用生物识别设备
        </UButton>
      </div>

      <template #footer>
        <p class="text-center text-xs text-muted">
          遇到问题？请尝试使用备用恢复码
        </p>
      </template>
    </AuthLayout>
</template>

<script setup lang="ts">
import { startAuthentication } from "@simplewebauthn/browser";
import {
  postAuthWebauthnLoginOptions,
  postAuthWebauthnLoginVerify,
} from "~~/packages/api/src/sdk.gen";

const toast = useToast();

const handleLogin = async () => {
  const optionsResponse = await postAuthWebauthnLoginOptions();
  if (optionsResponse.error || !optionsResponse.data)
    throw new Error("Unable to fetch WebAuthn login options.");

  const assertionResponse = await startAuthentication({
    optionsJSON: optionsResponse.data as any,
  });

  await postAuthWebauthnLoginVerify({
    body: assertionResponse,
  });

  toast.add({
    title: "Login success",
    color: "success",
  });
};

type Step = "select" | "totp" | "passkey";

const step = ref<Step>("select");
const loading = ref(false);
const isSuccess = ref(false);
const digits = ref(Array(6).fill(""));
const inputRefs = ref<HTMLInputElement[]>([]);

const stepDescriptions: Record<Step, string> = {
  select: "选择二次验证方式以保障账户安全",
  totp: "输入身份验证器中的 6 位动态代码",
  passkey: "通过生物识别或硬件密钥进行验证",
};

const availableMethods = computed(() => [
  { id: "totp" as Step, label: "动态口令 (TOTP)", icon: "i-lucide-clock" },
  {
    id: "passkey" as Step,
    label: "通行密钥 (Passkey)",
    icon: "i-heroicons-key",
  },
]);

const handleInput = (index: number, event: Event) => {
  const val = (event.target as HTMLInputElement).value.replace(/\D/g, "");
  digits.value[index] = val;

  if (val && index < 5) {
    inputRefs.value[index + 1]?.focus();
  }

  if (digits.value.every((d) => d)) {
    handleTotpSubmit();
  }
};

const handleDelete = (index: number) => {
  if (!digits.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus();
  }
};

const handleTotpSubmit = async () => {
  if (loading.value || isSuccess.value) return;
  loading.value = true;

  try {
    await new Promise((resolve) => setTimeout(resolve, 600));
    isSuccess.value = true;

    setTimeout(() => {
      navigateTo("/dash");
    }, 1200);
  } catch (err) {
    digits.value = Array(6).fill("");
    inputRefs.value[0]?.focus();
  } finally {
    loading.value = false;
  }
};

const handlePasskeyAuth = async () => {
  loading.value = true;
  try {
    await handleLogin();
  } finally {
    loading.value = false;
  }
};

watch(step, async (newStep) => {
  if (newStep === "totp") {
    await nextTick();
    inputRefs.value[0]?.focus();
  }
});
</script>

<style scoped>
@keyframes jump {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-12px);
  }
}

.animate-jump {
  animation: jump 0.5s ease-in-out;
  animation-fill-mode: forwards;
}
</style>
