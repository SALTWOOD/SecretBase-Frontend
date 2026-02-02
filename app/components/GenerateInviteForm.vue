<template>
  <UModal v-model:open="open" @update:open="(val) => (open = val)">
    <template #content>
      <div
        class="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center"
      >
        <span class="font-bold">{{ title }}</span>
        <UButton
          color="primary"
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
          description="表示该邀请码在创建时间后多久过期"
        >
          <div class="space-y-3">
            <UInput
              v-model="formData.hoursValid"
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
                @click="formData.hoursValid = p.value"
              />
            </div>
          </div>
        </UFormField>
      </div>

      <div
        class="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2"
      >
        <UButton color="primary" variant="ghost" @click="open = false">
          取消
        </UButton>
        <UButton :loading="loading" @click="onSubmit"> 保存 </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const open = defineModel<boolean>("open");
const loading = defineModel<boolean>("loading");
const title = defineModel<string>("title", {
  default: "生成邀请码",
});
const formData = defineModel<{
  uses: number;
  hoursValid: number;
}>("formData", {
  default: () => ({
    uses: 1,
    hoursValid: 24,
  }),
});

const emit = defineEmits<{
  success: [data: { uses: number; hoursValid: number }];
}>();

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
    ...formData.value,
  });
}
</script>
