<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
const userStore = useUserStore();

onMounted(async () => {
  if (userStore.isLoggedIn) await userStore.fetch();
});
</script>
