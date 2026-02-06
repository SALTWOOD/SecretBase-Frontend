<template>
  <UContainer class="py-10 space-y-6">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-bold">管理 Passkey</h3>
          <UButton
            icon="i-heroicons-plus"
            :loading="loading"
            @click="addPasskey"
          >
            注册新设备
          </UButton>
        </div>
      </template>

      <div
        v-if="credentials.length === 0"
        class="text-center py-8 text-gray-500 text-sm"
      >
        暂无绑定的安全密钥
      </div>

      <div class="space-y-4">
        <div
          v-for="key in credentials"
          :key="key.id"
          class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        >
          <div class="flex items-center gap-4">
            <UIcon name="i-heroicons-key" class="w-6 h-6 text-primary" />
            <div>
              <div class="font-bold text-sm">
                {{ key.nickname || "Unknown Device" }}
              </div>
              <div class="text-xs text-gray-400">
                Created: {{ key.createdAt?.toLocaleDateString() }}
              </div>
            </div>
          </div>
          <UButton
            icon="i-heroicons-trash"
            color="error"
            variant="ghost"
            @click="removeKey(key.id as number)"
          />
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="text-xl font-bold">双重身份验证 (TOTP)</h3>
      </template>

      <div
        v-if="!isTotpEnabled && !showTotpSetup"
        class="flex items-center justify-between"
      >
        <span class="text-sm text-gray-500">未启用 TOTP 验证器</span>
        <UButton color="neutral" variant="subtle" @click="setupTotp"
          >启用</UButton
        >
      </div>

      <div v-else-if="showTotpSetup" class="space-y-6">
        <div class="flex flex-col items-center gap-4">
          <Qrcode
            :value="totpUri"
            class="w-48 h-48 border p-2 bg-white rounded"
          />
          <div class="text-center">
            <p class="text-xs text-gray-400 mb-1">密钥 (Secret Key)</p>
            <code
              class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono"
              >{{ totpSecret }}</code
            >
          </div>
        </div>

        <UFormField label="验证码" help="请输入 App 中的 6 位验证码以完成绑定">
          <div class="flex gap-2">
            <UInput
              v-model="totpCode"
              class="flex-1"
              placeholder="000000"
              maxlength="6"
            />
            <UButton :loading="loading" @click="verifyTotp">验证并启用</UButton>
          </div>
        </UFormField>
      </div>

      <div v-else class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <UIcon
            name="i-heroicons-check-circle"
            class="w-6 h-6 text-green-500"
          />
          <span class="text-sm">验证器已激活</span>
        </div>
        <UButton color="error" variant="ghost" @click="isTotpEnabled = false"
          >禁用</UButton
        >
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="text-xl font-bold">安全设置</h3>
      </template>
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-medium">强制启用 2FA</div>
          <div class="text-xs text-gray-500">登录时必须进行二次身份验证</div>
        </div>
        <USwitch
          v-model="forceTwoFactor"
        />
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import { startRegistration } from "@simplewebauthn/browser";
import {
  deleteAuthWebauthnCredentialsById,
  getAuthWebauthnCredentials,
  postAuthTwoFactorPolicyDisable,
  postAuthTwoFactorPolicyEnable,
  postAuthTwoFactorTotpEnable,
  postAuthTwoFactorTotpSetup,
  postAuthWebauthnRegisterOptions,
  postAuthWebauthnRegisterVerify,
} from "~~/packages/api/src/sdk.gen";
import type { UserCredentialTable } from "~~/packages/api/src/types.gen";

const credentials = ref<UserCredentialTable[]>([]);
const loading = ref(false);
const toast = useToast();

// TOTP States
const isTotpEnabled = ref(false);
const showTotpSetup = ref(false);
const totpUri = ref("");
const totpSecret = ref("");
const totpCode = ref("");

// Settings States
const forceTwoFactor = ref(false);

const refresh = async () => {
  const response = await getAuthWebauthnCredentials();
  if (!response.error && response.data) {
    credentials.value = response.data;
  }
};

const setupTotp = async () => {
  const response = await postAuthTwoFactorTotpSetup();
  if (!response.error && response.data) {
    totpSecret.value = response.data.secret!;
    totpUri.value = response.data.url!;
  }
  showTotpSetup.value = true;
};

const verifyTotp = async () => {
  loading.value = true;
  try {
    const response = await postAuthTwoFactorTotpEnable({
      body: {
        code: totpCode.value,
      },
    });
    if (!response.error && response.response.status === 200) {
      isTotpEnabled.value = true;
      showTotpSetup.value = false;
      toast.add({ title: "TOTP enabled successfully." });
    }
  } finally {
    loading.value = false;
  }
};

const onForceTwoFactorChange = async (val: boolean) => {
  if (val) {
    await postAuthTwoFactorPolicyEnable();
  } else {
    await postAuthTwoFactorPolicyDisable();
  }
};

const addPasskey = async () => {
  loading.value = true;
  try {
    const registerOptionsResponse = await postAuthWebauthnRegisterOptions();
    if (registerOptionsResponse.error || !registerOptionsResponse.data)
      throw new Error("Unable to fetch WebAuthn login options");

    const options = registerOptionsResponse.data as any;
    const registerResponse = await startRegistration({ optionsJSON: options });

    await postAuthWebauthnRegisterVerify({
      body: registerResponse as any,
    });

    toast.add({ title: "Successfully bound Passkey." });
    await refresh();
  } finally {
    loading.value = false;
  }
};

const removeKey = async (id: number) => {
  if (!confirm("Are you sure to remove this passkey?")) return;
  await deleteAuthWebauthnCredentialsById({ path: { id } });
  await refresh();
};

onMounted(() => refresh());
watch(forceTwoFactor, onForceTwoFactorChange);
</script>
