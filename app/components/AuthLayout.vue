<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <UCard
      class="w-full max-w-md backdrop-blur-xl border-default shadow-2xl bg-gray-50/50 dark:bg-gray-900/50"
    >
      <template #header>
        <div class="text-center" :class="{ relative: $slots.headerExtra }">
          <slot name="headerExtra" />
          <h2 class="text-2xl font-bold">
            <slot name="title" />
          </h2>
          <p class="text-muted text-sm mt-1">
            <slot name="description" />
          </p>
        </div>
      </template>

      <slot />

      <template v-if="$slots.footer" #footer>
        <slot name="footer" />
      </template>
    </UCard>
  </div>
</template>
