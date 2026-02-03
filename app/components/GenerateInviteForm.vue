<template>
  <UModal v-model:open="open">
    <template #content>
      <div
        class="p-4 border-b border-default flex justify-between items-center"
      >
        <span class="font-bold text-foreground">{{ title }}</span>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-x-mark"
          @click="open = false"
        />
      </div>

      <div class="p-4 space-y-6">
        <UFormField
          label="使用次数限制"
          description="该邀请码可以被激活的总次数"
        >
          <UInput
            v-model="formData.uses"
            type="number"
            min="1"
            class="w-full"
            icon="i-heroicons-user-group"
          />
        </UFormField>

        <UFormField
          label="有效时间 (小时)"
          description="表示该邀请码在创建时间后多久过期 (0 为永久)"
        >
          <div class="space-y-3">
            <UInput
              v-model="formData.hoursValid"
              type="number"
              min="0"
              class="w-full"
              icon="i-heroicons-clock"
            />
            <div class="flex flex-wrap gap-1.5">
              <UButton
                v-for="p in timePresets"
                :key="p.value"
                :label="p.label"
                size="xs"
                variant="subtle"
                color="primary"
                @click="formData.hoursValid = p.value"
              />
            </div>
          </div>
        </UFormField>
      </div>

      <div class="p-4 border-t border-default flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="open = false">
          取消
        </UButton>
        <UButton :loading="loading" @click="onSubmit"> 提交 </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { UpdateInviteFormData } from "~/types/update-invite-form";

const open = defineModel<boolean>("open");
const loading = defineModel<boolean>("loading");
const title = defineModel<string>("title", {
  default: "生成邀请码",
});

const formData = defineModel<UpdateInviteFormData>("formData", {
  default: () => ({
    isDisabled: false,
    uses: 1,
    hoursValid: 24,
  }),
});

const emit = defineEmits<{
  success: [data: UpdateInviteFormData];
}>();

const timePresets = [
  { label: "1h", value: 1 },
  { label: "1d", value: 24 },
  { label: "7d", value: 168 },
  { label: "30d", value: 720 },
  { label: "永久", value: 0 },
];

function onSubmit() {
  if (formData.value.uses && formData.value.uses < 1) return;

  emit("success", { ...formData.value });
}
</script>
