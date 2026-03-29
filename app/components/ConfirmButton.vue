<script setup lang="ts">
// Define props
const props = defineProps<{
  label?: string;
  icon?: string;
  color?: string;
  title?: string;
}>();

// Define emits: returns true for confirm, false for cancel
const emit = defineEmits<{
  (e: "confirm", value: boolean): void;
}>();

const open = ref(false);

const handleAction = (result: boolean) => {
  open.value = false;
  emit("confirm", result);
};
</script>

<template>
  <UPopover v-model:open="open">
    <UButton
      :icon="icon"
      :label="label"
      :color="(color as any) || 'primary'"
      variant="ghost"
    />

    <template #content>
      <div
        class="p-3 w-48 shadow-xl border border-default bg-(--ui-bg-elevated)"
      >
        <p class="text-sm font-medium mb-3">
          {{ title || "Confirm this action?" }}
        </p>
        <div class="flex justify-end gap-2">
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="handleAction(false)"
          />
          <UButton
            size="xs"
            :color="(color as any) || 'primary'"
            label="Confirm"
            @click="handleAction(true)"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
