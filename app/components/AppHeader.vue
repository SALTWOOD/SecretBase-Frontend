<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 bg-default/50 backdrop-blur-md"
  >
    <UContainer class="flex items-center justify-between h-16">
      <NuxtLink to="/" class="flex items-center gap-2">
        <UIcon name="i-lucide-zap" class="text-primary size-6" />
        <span class="text-lg font-bold tracking-tight text-highlighted">
          Secret Base
        </span>
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
        <UButton
          color="primary"
          to="/dash"
          trailing-icon="i-lucide-arrow-right"
        >
          控制台
        </UButton>
      </div>
    </UContainer>
  </nav>
</template>
