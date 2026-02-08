<template>
  <UModal v-model:open="isOpen" prevent-close>
    <template #content>
      <UCard
        class="backdrop-blur-xl border-default shadow-2xl bg-gray-50/50 dark:bg-gray-900/50"
        :ui="{ body: 'p-6', header: 'p-4 border-b border-default' }"
      >
        <template #header>
          <div class="text-center relative">
            <UButton
              v-if="step !== 'select' && !isSuccess"
              variant="ghost"
              color="neutral"
              icon="i-lucide-arrow-left"
              class="absolute left-0 top-1/2 -translate-y-1/2"
              @click="step = 'select'"
            />
            <h2 class="text-xl font-bold text-highlighted">安全验证</h2>
            <p class="text-muted text-sm mt-1">
              {{ stepDescriptions[step] }}
            </p>
          </div>
        </template>

        <div v-if="step === 'select'" class="flex flex-col gap-3">
          <UButton
            v-for="method in availableMethods"
            :key="method.id"
            block
            variant="outline"
            color="neutral"
            class="h-16 justify-start px-4 text-base"
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
              class="size-12 md:size-14 text-center text-2xl font-bold rounded-lg border bg-muted/20 outline-none transition-all focus:ring-2 focus:ring-primary focus:border-primary"
              :class="[
                isSuccess
                  ? 'animate-jump border-green-500 text-green-500'
                  : 'border-default'
              ]"
              :disabled="loading || isSuccess"
              @input="handleInput(index, $event)"
              @keydown.delete="handleDelete(index)"
            />
          </div>
          <UButton
            block
            size="lg"
            :loading="loading"
            :color="isSuccess ? 'success' : 'primary'"
            @click="handleTotpSubmit"
          >
            {{ isSuccess ? '验证成功' : '验证' }}
          </UButton>
        </div>

        <div v-else-if="step === 'passkey'" class="py-6 text-center space-y-6">
          <UIcon
            name="i-lucide-fingerprint"
            class="size-16 transition-colors duration-500"
            :class="[
              isSuccess ? 'text-green-500' : 'text-primary',
              loading ? 'animate-pulse' : ''
            ]"
          />
          <UButton
            block
            size="lg"
            :loading="loading"
            :color="isSuccess ? 'success' : 'primary'"
            @click="handlePasskeyAuth"
          >
            {{ isSuccess ? '验证成功' : '使用 Passkey' }}
          </UButton>
        </div>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { startAuthentication } from "@simplewebauthn/browser";
import {
  postAuthTwoFactorTotpVerify,
  postAuthWebauthnLoginOptions,
  postAuthWebauthnLoginVerify,
} from "~~/packages/api/src/sdk.gen";

type Step = "select" | "totp" | "passkey";

const isOpen = ref(false);
const step = ref<Step>("select");
const loading = ref(false);
const isSuccess = ref(false);
const digits = ref(Array(6).fill(""));
const inputRefs = ref<HTMLInputElement[]>([]);
const code = computed(() => digits.value.join(""));

let _resolve: (value: boolean) => void;

const stepDescriptions: Record<Step, string> = {
  select: "选择二次验证方式以保障账户安全",
  totp: "输入身份验证器中的 6 位动态代码",
  passkey: "通过生物识别或硬件密钥进行验证",
};

const availableMethods = [
  { id: "totp" as const, label: "动态口令 (TOTP)", icon: "i-lucide-clock" },
  { id: "passkey" as const, label: "通行密钥 (Passkey)", icon: "i-lucide-fingerprint" },
];

const performWebAuthn = async () => {
  const options = await postAuthWebauthnLoginOptions();
  if (options.error || !options.data) throw new Error("Fetch WebAuthn options failed");

  const assertion = await startAuthentication({
    optionsJSON: options.data as any,
  });

  const verify = await postAuthWebauthnLoginVerify({ body: assertion });
  if (verify.error) throw new Error("WebAuthn verification failed");

  return true;
};

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
  if (loading.value || isSuccess.value || code.value.length < 6) return;
  loading.value = true;

  try {
    const response = await postAuthTwoFactorTotpVerify({
      body: { code: code.value },
    });

    if (!response.error) {
      isSuccess.value = true;
      setTimeout(() => finish(true), 1000);
    } else {
      digits.value = Array(6).fill("");
      inputRefs.value[0]?.focus();
      useToast().add({ title: "验证失败", color: "error" });
    }
  } catch (err) {
    console.error("TOTP verification failed:", err);
  } finally {
    loading.value = false;
  }
};

const handlePasskeyAuth = async () => {
  if (loading.value || isSuccess.value) return;
  loading.value = true;
  try {
    await performWebAuthn();
    isSuccess.value = true;
    setTimeout(() => finish(true), 800);
  } catch (err) {
    console.error("Passkey auth failed:", err);
    useToast().add({ title: "Passkey 验证取消或失败", color: "warning" });
  } finally {
    loading.value = false;
  }
};

const open = () => {
  step.value = "select";
  isSuccess.value = false;
  loading.value = false;
  digits.value = Array(6).fill("");
  isOpen.value = true;

  return new Promise<boolean>((resolve) => {
    _resolve = resolve;
  });
};

const finish = (success: boolean) => {
  isOpen.value = false;
  _resolve?.(success);
};

watch(step, async (newStep) => {
  if (newStep === "totp") {
    await nextTick();
    inputRefs.value[0]?.focus();
  }
});

watch(isOpen, (val) => {
  if (!val) {
    _resolve?.(false);
  }
});

defineExpose({ open });
</script>
