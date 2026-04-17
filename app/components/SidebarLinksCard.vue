<script setup lang="ts">
import type { SidebarLinksWidget } from "~/types/sidebar";

defineProps<{
  widget: SidebarLinksWidget;
}>();
</script>

<template>
  <UCard class="side-card">
    <template #header>
      <div class="flex items-center gap-2 font-bold text-highlighted">
        <UIcon name="i-lucide-link" class="text-primary" />
        {{ widget.title }}
      </div>
    </template>
    <div class="space-y-2">
      <a
        v-for="link in widget.links"
        :key="link.url"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 text-sm text-muted hover:text-highlighted transition-colors py-1"
      >
        <UIcon v-if="link.icon" :name="link.icon" class="shrink-0" />
        <UIcon v-else name="i-lucide-external-link" class="shrink-0" />
        {{ link.name }}
      </a>
    </div>
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
