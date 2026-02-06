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
          icon="i-lucide-x"
          @click="open = false"
        />
      </div>

      <div class="p-4 space-y-6">
        <UFormField
          v-for="field in config"
          :key="field.key"
          :label="field.label"
          :description="field.description"
        >
          <div class="space-y-3">
            <UInput
              v-model="formData[field.key]"
              :type="field.type"
              :min="field.min"
              :max="field.max"
              :placeholder="field.placeholder"
              :icon="field.icon"
              class="w-full"
            />

            <div
              v-if="field.presets && field.presets.length"
              class="flex flex-wrap gap-1.5"
            >
              <UButton
                v-for="p in field.presets"
                :key="String(p.value)"
                :label="p.label"
                size="xs"
                variant="subtle"
                color="primary"
                @click="formData[field.key] = p.value"
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
import { onMounted } from "vue";
import type { FieldConfig } from "~/types/field-config";

const open = defineModel<boolean>("open");
const loading = defineModel<boolean>("loading");
const title = defineModel<string>("title", { default: "表单" });

const formData = defineModel<Record<string, any>>("formData", {
  default: () => ({}),
});

const props = defineProps<{
  config: FieldConfig[];
}>();

const emit = defineEmits<{
  success: [data: Record<string, any>];
}>();

onMounted(() => {
  props.config.forEach((field) => {
    if (
      formData.value[field.key] === undefined &&
      field.default !== undefined
    ) {
      formData.value[field.key] = field.default;
    }
  });
});

function onSubmit() {
  emit("success", { ...formData.value });
}
</script>
