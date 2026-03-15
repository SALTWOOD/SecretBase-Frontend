<template>
  <div
    class="min-h-screen bg-default bg-grid-slate selection:bg-(--ui-primary)/30"
  >
    <AppHeader />
    <main class="pt-16">
      <slot />
    </main>
  </div>
</template>
