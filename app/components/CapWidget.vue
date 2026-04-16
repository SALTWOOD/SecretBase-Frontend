<script setup lang="ts">
import "@cap.js/widget";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    apiEndpoint?: string;
  }>(),
  {
    modelValue: "",
    apiEndpoint: "/api/cap/",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const capKey = ref(0);

const handleCapSolve = (e: CustomEvent) => {
  emit("update:modelValue", e.detail.token);
};

const handleCapReset = () => {
  emit("update:modelValue", "");
};

const reset = () => {
  capKey.value++;
  emit("update:modelValue", "");
};

defineExpose({ reset });
</script>

<template>
  <client-only>
    <div
      class="cap-wrapper w-full overflow-hidden rounded-lg border border-default bg-muted/20"
    >
      <cap-widget
        :key="capKey"
        :data-cap-api-endpoint="props.apiEndpoint"
        @solve="handleCapSolve"
        @reset="handleCapReset"
      />
    </div>
  </client-only>
</template>

<style scoped>
.cap-wrapper {
  --cap-widget-width: 100%;
}
</style>
