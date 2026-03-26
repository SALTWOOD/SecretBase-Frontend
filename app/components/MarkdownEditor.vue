<script setup lang="ts">
import { MdEditor, type Themes } from "md-editor-v3";
import "md-editor-v3/lib/style.css";

const props = defineProps<{
  modelValue: string;
  disabled?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "save"): void;
}>();

const colorMode = useColorMode();
const theme = computed<Themes>(() => (colorMode.value === "dark" ? "dark" : "light"));

// 内部同步内容
const content = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>

<template>
  <ClientOnly>
    <MdEditor
      v-model="content"
      :theme="theme"
      :disabled="disabled"
      :placeholder="placeholder || '请开始你的创作...'"
      class="min-h-[70vh] border-none!"
      @on-save="emit('save')"
    />
    <template #fallback>
      <div class="h-[70vh] flex items-center justify-center">
        <UIcon
          name="i-heroicons-arrow-path"
          class="animate-spin size-8 text-primary"
        />
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped>
/* 可以在此处通过深度选择器微调 md-editor-v3 的样式以适配 Nuxt UI */
:deep(.md-editor) {
  --md-bk-color: transparent;
}
</style>
