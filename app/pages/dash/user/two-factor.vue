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
          <div class="flex items-center gap-1">
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              @click="editPasskey(key.id as number)"
            />
            <UButton
              icon="i-lucide-trash"
              color="error"
              variant="ghost"
              @click="removeKey(key.id as number)"
            />
          </div>
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
        <UButton color="error" variant="ghost" @click="disableTotp"
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
          @update:model-value="onForceTwoFactorChange"
        />
      </div>
    </UCard>
  </UContainer>

  <CustomForm
    v-model:config="form"
    v-model:form-data="formState"
    v-model:open="open"
    @success="handleFormSuccess"
  />
</template>

<script setup lang="ts">
import { startRegistration } from "@simplewebauthn/browser";
import CustomForm from "~/components/CustomForm.vue";
import type { FieldConfig } from "~/types/field-config";
import {
  deleteAuthWebauthnCredentialsById,
  getAuthTwoFactorPolicy,
  getAuthWebauthnCredentials,
  postAuthTwoFactorPolicyDisable,
  postAuthTwoFactorPolicyEnable,
  postAuthTwoFactorTotpDisable,
  postAuthTwoFactorTotpEnable,
  postAuthTwoFactorTotpSetup,
  postAuthWebauthnRegisterOptions,
  postAuthWebauthnRegisterVerify,
  putAuthWebauthnCredentialsById,
} from "~~/packages/api/src/sdk.gen";
import type { UserCredential } from "~~/packages/api/src/types.gen";

const credentials = ref<UserCredential[]>([]);
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
const open = ref(false);
const form = ref<FieldConfig[]>([
  {
    key: "nickname",
    label: "设备名称",
    description: "Passkey 设备的名称",
    type: "text",
    icon: "i-lucide-smartphone",
  },
]);
const formState = ref({
  id: 0,
  nickname: "",
});

const refresh = async () => {
  const response = await getAuthWebauthnCredentials();
  if (!response.error && response.data) {
    credentials.value = response.data;
  }
  const policy = await getAuthTwoFactorPolicy();
  if (!policy.error && policy.data) {
    isTotpEnabled.value = policy.data.totp?.enabled ?? false;
    forceTwoFactor.value = policy.data.forceTwoFactor ?? false;
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
      totpCode.value = "";
      toast.add({ title: "TOTP enabled successfully." });
    }
  } finally {
    loading.value = false;
  }
};

const disableTotp = async () => {
  loading.value = true;
  try {
    await postAuthTwoFactorTotpDisable();
    isTotpEnabled.value = false;
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

const editPasskey = (id: number) => {
  open.value = true;
  formState.value.id = id;
};

const handleFormSuccess = async (data: Record<string, any>) => {
  const response = await putAuthWebauthnCredentialsById({
    path: { id: formState.value.id },
    body: formState.value,
  });
  if (!response.error) {
    refresh();
    open.value = false;
    toast.add({
      title: "Passkey information updated successfully.",
      color: "success",
    });
  }
};

onMounted(() => refresh());
</script>
