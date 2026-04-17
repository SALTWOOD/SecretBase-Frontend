<script setup lang="ts">
/**
 * @description 带有自定义动态背景的布局
 */
import { getSettingsHomeBackground } from "@secret-base/api/src/sdk.gen";

const { data: homeSettings } = await useAsyncData(
  "home-settings-layout",
  async () => (await getSettingsHomeBackground()).data,
);

const mainStyle = computed(() => {
  const image = homeSettings.value?.url;
  if (!image) return {};

  return {
    backgroundImage: `url('${image}')`,
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundAttachment: "fixed",
    backgroundRepeat: "no-repeat",
  };
});

const backgroundStyle = computed(() => {
  const blur = homeSettings.value?.blur || 0;
  const brightness = homeSettings.value?.brightness || 0;
  return {
    backdropFilter: `blur(${blur}px) brightness(${brightness}%)`,
    minHeight: "100vh",
  };
});
</script>

<template>
  <div
    class="min-h-screen bg-default bg-grid-slate selection:bg-(--ui-primary)/30"
  >
    <AppHeader />
    <main :style="mainStyle" class="transition-[filter] duration-700">
      <div :style="backgroundStyle">
        <div class="pt-16">
          <slot />
        </div>
        <AppFooter />
      </div>
    </main>
  </div>
</template>
