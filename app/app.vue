<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
  <TwoFactorChallengeModal ref="tfModal" />
</template>

<script setup lang="ts">
import { getShortcodes, postAuthRenew } from "~~/packages/api/src/sdk.gen";
const { openChallengeModal } = useChallenge();

const userStore = useUserStore();
const tfModal = ref();

async function loadShortcodes() {
  const response = await getShortcodes();
  if (response.error) throw (response.error as Error);
  if (!response.data) return;
  const list = response.data.shortcodes!;

  for (const i of list) {
    const module = await import(
      /* @vite-ignore */
      `/api/v1/shortcodes/${i.name}/frontend`
    );
    if (!module) return;
    if (module?.init) module.init();
  }
}

onMounted(async () => {
  await loadShortcodes();
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
