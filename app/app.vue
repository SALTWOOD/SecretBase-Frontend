<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
const userStore = useUserStore();

onMounted(async () => {
  await userStore.fetch();
});
</script>
