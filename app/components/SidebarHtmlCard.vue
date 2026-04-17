<script setup lang="ts">
import type { SidebarHtmlWidget } from "~/types/sidebar";

defineProps<{
  widget: SidebarHtmlWidget;
}>();
</script>

<template>
  <UCard class="glass-card">
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

