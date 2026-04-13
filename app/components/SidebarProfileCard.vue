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
  @apply border-0 ring-1 ring-white/5 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md shadow-sm;
}
</style>
