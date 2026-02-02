<template>
  <UModal v-model:open="open" @update:open="(val) => emit('update:open', val)">
    <template #content>
      <div
        class="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center"
      >
        <span class="font-bold">邀请码</span>
        <UButton
          color="primary"
          variant="ghost"
          icon="i-heroicons-x-mark"
          @click="emit('update:open', false)"
        />
      </div>

      <div class="p-4 space-y-6">
        <UFormField
          label="使用次数限制"
          description="该邀请码可以被激活的总次数"
        >
          <UInput
            v-model="formData.usageLimit"
            type="number"
            min="1"
            class="w-full"
            icon="i-heroicons-user-group"
          />
        </UFormField>

        <UFormField label="有效时间 (小时)" description="过期后邀请码将失效">
          <div class="space-y-3">
            <UInput
              v-model="formData.expiresIn"
              type="number"
              min="1"
              class="w-full"
              icon="i-heroicons-clock"
            />
            <div class="flex gap-2">
              <UButton
                v-for="p in timePresets"
                :key="p.value"
                :label="p.label"
                size="xs"
                variant="outline"
                color="primary"
                @click="formData.expiresIn = p.value"
              />
            </div>
          </div>
        </UFormField>
      </div>

      <div
        class="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2"
      >
        <UButton
          color="primary"
          variant="ghost"
          @click="emit('update:open', false)"
        >
          取消
        </UButton>
        <UButton :loading="loading" @click="onSubmit"> 保存 </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const open = ref(false);
const loading = ref(false);

const emit = defineEmits<{
  "update:open": [value: boolean];
  "update:loading": [value: boolean];
  success: [data: any];
}>();

// Form state
const formData = reactive({
  usageLimit: 1,
  expiresIn: 24,
});

// Quick time presets (Hours)
const timePresets = [
  { label: "1 小时", value: 1 },
  { label: "1 天", value: 24 },
  { label: "7 天", value: 168 },
  { label: "1 个月", value: 720 },
  { label: "3 个月", value: 2160 },
  { label: "1 年", value: 8760 },
  { label: "永久有效", value: 0 },
];

async function onSubmit() {
  emit("success", {
    uses: formData.usageLimit,
    hoursValid: formData.expiresIn,
  });
  emit("update:open", false);
}
</script>
