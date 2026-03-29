<script setup lang="ts">
const open = defineModel<boolean>("open");

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    description?: string;
    icon?: string;
    color?: "primary" | "error" | "warning" | "neutral";
    loading?: boolean;
    confirmText?: string;
    cancelText?: string;
  }>(),
  {
    title: "确认操作",
    subtitle: "确认操作",
    description: "此操作无法撤销，确定要继续吗？",
    icon: "i-lucide-alert-triangle",
    color: "error",
    confirmText: "确定",
    cancelText: "取消",
  },
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const onConfirm = () => {
  open.value = false;
  emit("confirm");
};

const onCancel = () => {
  open.value = false;
  emit("cancel");
};
</script>

<template>
  <UModal v-model:open="open">
    <template #content>
      <div
        class="p-3 border-b border-default flex justify-between items-center"
      >
        <span class="font-bold text-foreground">{{ title }}</span>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          @click="open = false"
        />
      </div>
      <div class="flex items-start gap-4 p-4">
        <div
          v-if="icon"
          :class="[
            'p-2 rounded-full flex-shrink-0',
            color === 'error'
              ? 'bg-error-50 text-error'
              : 'bg-primary-50 text-primary',
          ]"
        >
          <UIcon :name="icon" class="w-6 h-6" />
        </div>

        <div class="flex-1">
          <h3
            class="text-lg font-semibold text-gray-900 dark:text-white leading-6"
          >
            {{ subtitle }}
          </h3>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            <slot>{{ description }}</slot>
          </p>
        </div>
      </div>

      <div class="p-4 border-t border-default flex justify-end gap-2">
        <UButton
          :label="cancelText"
          color="neutral"
          variant="ghost"
          @click="onCancel"
        />
        <UButton
          :label="confirmText"
          :color="color"
          :loading="loading"
          @click="onConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
