<template>
  <div
    class="min-h-screen bg-default bg-grid-slate selection:bg-(--ui-primary)/30"
  >
    <nav
      class="sticky top-0 z-50 border-b border-default bg-(--ui-bg)/50 backdrop-blur-md"
    >
      <UContainer class="flex items-center justify-between h-16">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-zap" class="text-primary size-6" />
          <span class="text-lg font-bold tracking-tight text-highlighted"
            >Secret Base</span
          >
        </div>

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

    <main class="relative overflow-hidden pt-20 pb-32">
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 rounded-full bg-primary/10 blur-[120px] -z-10"
      />

      <UContainer class="text-center flex flex-col items-center">
        <UBadge
          variant="soft"
          color="primary"
          class="rounded-full px-3 py-1 gap-2 mb-8"
        >
          <span class="relative flex size-2">
            <span
              class="animate-ping absolute inset-0 rounded-full bg-primary opacity-75"
            ></span>
            <span class="relative rounded-full size-2 bg-primary"></span>
          </span>
          v0.1 Beta Version / 测试版本
        </UBadge>

        <h1
          class="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 text-highlighted"
        >
          我们正在运行<br />
          <span
            class="bg-linear-to-r from-primary to-blue-400 bg-clip-text text-transparent"
          >
            秘密基地服务
          </span>
        </h1>

        <p class="max-w-2xl text-lg text-muted mb-10">
          通过 ASP.NET Core 与 Nuxt 4
          强力驱动，为您提供安全、稳定的私人服务托管与邀请管理。
        </p>

        <div class="flex flex-col sm:flex-row items-center gap-4">
          <UButton size="xl" class="px-8" to="/dash" icon="i-lucide-send">
            开始使用
          </UButton>
          <UButton
            size="xl"
            color="neutral"
            variant="outline"
            class="px-8"
            to="/docs"
            icon="i-lucide-book-open"
          >
            查看文档
          </UButton>
        </div>
      </UContainer>
    </main>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
