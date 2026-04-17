<script setup lang="ts">
import type { SidebarLinksWidget } from "~/types/sidebar";

defineProps<{
  widget: SidebarLinksWidget;
}>();
</script>

<template>
  <UCard class="glass-card">
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

