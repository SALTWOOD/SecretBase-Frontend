<script setup lang="ts">
defineProps<{
  siteTitle?: string;
  avatarUrl?: string;
}>();
</script>

<template>
  <UCard class="side-card">
    <div class="flex flex-col items-center text-center">
      <UAvatar
        :src="avatarUrl"
        alt="Avatar"
        size="xl"
        class="mb-4 ring-2 ring-primary"
      />
      <h3 class="font-bold text-lg text-highlighted">{{ siteTitle }}</h3>
      <p class="text-xs text-muted mt-1 italic">Maintainer of SecretBase</p>
      <div class="flex gap-4 mt-6">
        <UButton
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          to="https://github.com/SALTWOOD"
        />
        <UButton icon="i-lucide-rss" color="neutral" variant="ghost" />
      </div>
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
