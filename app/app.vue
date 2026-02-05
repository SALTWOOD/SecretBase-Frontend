<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
import { postAuthRenew } from "~~/packages/api/src/sdk.gen";

const userStore = useUserStore();

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await userStore.fetch();
    if (
      userStore.expires &&
      userStore.expires.getTime() - 12 * 60 * 60 * 1000 > Date.now()
    ) {
      await postAuthRenew();
      await userStore.fetch();
    }
  }
});
</script>
