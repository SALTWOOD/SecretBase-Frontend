<template>
  <UModal v-model:open="open">
    <template #content>
      <div class="p-4 border-b border-default flex justify-between items-center">
        <span class="font-bold text-foreground">{{ title }}</span>
        <UButton color="neutral" variant="ghost" icon="i-lucide-x" @click="open = false" />
      </div>

      <div class="p-4 space-y-6">
        <UFormField v-for="field in config" :key="field.key" :label="field.label">
          <div class="space-y-3">
            <template v-if="field.multiple">
              <div v-for="(_, index) in (formData[field.key] as any[])" :key="index" class="flex gap-2">
                <UInput v-model="formData[field.key][index]" class="grow" />
                <UButton v-if="formData[field.key].length > 1" icon="i-lucide-minus" color="error" variant="ghost"
                  @click="removeField(field.key, index)" />
              </div>
              <UButton icon="i-lucide-plus" variant="subtle" size="xs" @click="addField(field.key)">添加项</UButton>
            </template>

            <UInput v-else v-model="formData[field.key]" class="w-full" />

            <div v-if="!field.multiple && field.presets?.length" class="flex flex-wrap gap-1.5">
              <UButton v-for="p in field.presets" :key="String(p.value)" :label="p.label"
                @click="formData[field.key] = p.value" />
            </div>
          </div>
        </UFormField>
      </div>
      <div class="p-4 border-t border-default flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="open = false">取消</UButton>
        <UButton :loading="loading" @click="onSubmit">提交</UButton>
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
    if (formData.value[field.key] === undefined) {
      if (field.multiple) {
        formData.value[field.key] = field.default ? (Array.isArray(field.default) ? [...field.default] : [field.default]) : [""];
      } else {
        formData.value[field.key] = field.default ?? "";
      }
    }
  });
});

function addField(key: string) {
  if (!Array.isArray(formData.value[key])) {
    formData.value[key] = [""];
  }
  formData.value[key].push("");
}

function removeField(key: string, index: number) {
  if (Array.isArray(formData.value[key])) {
    formData.value[key].splice(index, 1);
  }
}

function onSubmit() {
  const data = JSON.parse(JSON.stringify(formData.value));
  props.config.forEach(f => {
    if (f.multiple && Array.isArray(data[f.key])) {
      data[f.key] = data[f.key].filter((v: any) => v && String(v).trim() !== "");
    }
  });
  emit("success", data);
}
</script>
