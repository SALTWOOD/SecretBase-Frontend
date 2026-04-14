<script setup lang="ts">
import { getSettingsFooter } from "@secret-base/api/src/sdk.gen";

const { data: footer } = await useAsyncData(
  "footer",
  async () => (await getSettingsFooter()).data,
);

const policeLink = computed(() => {
  const policeStr = footer.value?.beian?.police;
  if (!policeStr) return "https://beian.mps.gov.cn/";
  const code = policeStr.match(/\d+/)?.[0];
  return code
    ? `https://beian.mps.gov.cn/#/query/webSearch?code=${code}`
    : "https://beian.mps.gov.cn/";
});
</script>

<template>
  <footer class="footer-card">
    <UCard
      class="w-full max-w-4xl shadow-xl shadow-gray-950/20"
      :ui="{
        root: 'bg-neutral-800/80 backdrop-blur-md border-0 rounded-2xl ring-1 ring-white/10',
        body: 'flex flex-col items-center gap-3 p-8 text-center',
      }"
    >
      <div v-if="footer?.beian" class="flex flex-col items-center gap-2">
        <a
          v-if="footer?.beian?.icp"
          v-text="footer.beian.icp"
          href="https://beian.miit.gov.cn/"
          target="_blank"
        />
        <div v-if="footer?.beian?.police">
          <a v-text="footer.beian.police" :href="policeLink" target="_blank" />
        </div>
      </div>
      <a
        href="https://github.com/SALTWOOD/SecretBase-Frontend"
        class="flex items-center gap-2"
      >
        <UIcon name="i-simple-icons-github" />
        SALTWOOD/SecretBase-Frontend
      </a>
    </UCard>
  </footer>
</template>

<style scoped>
@reference 'tailwindcss';

.footer-card {
  @apply w-full flex justify-center py-10 px-4;

  & a,
  & span {
    @apply text-neutral-400 underline-offset-4 transition-all duration-300 ease-in-out;
  }

  & a:hover {
    color: var(--ui-primary);
    @apply underline;
  }
}
</style>
