<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
  <TwoFactorChallengeModal ref="tfModal" />
</template>

<script setup lang="ts">
import { postAuthRenew } from "~~/packages/api/src/sdk.gen";
const { openChallengeModal } = useChallenge();

const userStore = useUserStore();
const tfModal = ref();

onMounted(async () => {
  openChallengeModal.value = () => tfModal.value?.open();
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

<style>
html {
  scroll-behavior: smooth;
}
</style>
