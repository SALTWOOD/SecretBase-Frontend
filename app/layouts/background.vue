<script setup lang="ts">
/**
 * @description 带有自定义动态背景的布局
 */
import { getSettingsHome } from "@secret-base/api/src/sdk.gen";

const { data: homeSettings } = await useAsyncData(
  "home-settings-layout",
  async () => (await getSettingsHome()).data,
);

const mainStyle = computed(() => {
  const image = homeSettings.value?.backgroundUrl;
  if (!image) return {}; // 如果没图，就不应用样式

  return {
    backgroundImage: `url('${image}')`,
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundAttachment: "fixed",
    backgroundRepeat: "no-repeat",
  };
});

const backgroundStyle = computed(() => {
  const blur = homeSettings.value?.backgroundBlur || 0;
  return {
    backdropFilter: `blur(${blur}px)`,
    minHeight: '100vh'
  };
});
</script>

<template>
  <div class="min-h-screen bg-default bg-grid-slate selection:bg-(--ui-primary)/30">
    <AppHeader />
    <main :style="mainStyle" class="transition-[filter] duration-700">
      <div :style="backgroundStyle">
        <div class="pt-16">
          <slot />
        </div>
      </div>
    </main>
  </div>
</template>
