<script setup lang="ts">
import type { SidebarHtmlWidget } from "~/types/sidebar";

defineProps<{
  widget: SidebarHtmlWidget;
}>();
</script>

<template>
  <UCard class="side-card">
    <template #header>
      <div class="flex items-center gap-2 font-bold text-highlighted">
        <UIcon name="i-lucide-file-text" class="text-primary" />
        {{ widget.title }}
      </div>
    </template>
    <div
      class="text-sm text-muted leading-relaxed prose prose-sm dark:prose-invert max-w-none"
      v-html="widget.content"
    />
  </UCard>
</template>

<style scoped>
@reference 'tailwindcss';

.side-card {
  @apply border-0 ring-1 ring-white/10 backdrop-blur-md shadow-sm;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
}

.side-card :deep(*) {
  --ui-text-highlighted: #fff;
  --ui-text-muted: rgba(255, 255, 255, 0.6);
  --ui-text-dimmed: rgba(255, 255, 255, 0.4);
  --ui-bg-elevated: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.side-card :deep(hr) {
  border-color: rgba(0, 0, 0, 0.2);
}
</style>
