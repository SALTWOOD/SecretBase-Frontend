<script setup lang="ts">

</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-default bg-default/50 backdrop-blur-md">
    <UContainer class="flex items-center justify-between h-16">
      <NuxtLink to="/" class="flex items-center gap-2">
        <UIcon name="i-lucide-zap" class="text-primary size-6" />
        <span class="text-lg font-bold tracking-tight text-highlighted">Secret Base</span>
      </NuxtLink>
      <div class="flex items-center gap-4">
        <UColorModeButton />
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-simple-icons-github"
          to="https://github.com/SALTWOOD/SecretBase-Frontend"
          target="_blank"
        />
        <UButton color="primary" to="/dash" trailing-icon="i-lucide-arrow-right">
          控制台
        </UButton>
      </div>
    </UContainer>
  </nav>
</template>
