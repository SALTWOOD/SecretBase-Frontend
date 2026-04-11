<script setup lang="ts">
import { getSettingsHomeHeader } from "~~/packages/api/src/sdk.gen";

interface HeaderLink {
  name: string;
  url: string;
  icon?: string;
}

interface HeaderSettings {
  icon?: string;
  icon_type?: string;
  title?: string;
  links?: HeaderLink[];
  show_color_mode?: boolean;
  show_github?: boolean;
  github_url?: string;
}

const { data: headerSettings } = await useAsyncData(
  "header-settings",
  async () => {
    const res = await getSettingsHomeHeader();
    return res.data as HeaderSettings | undefined;
  },
);

const settings = computed(
  () => headerSettings.value ?? ({} as HeaderSettings),
);
</script>

<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-default/50 backdrop-blur-md">
    <UContainer class="flex items-center justify-between h-16">
      <NuxtLink to="/" class="flex items-center gap-2">
        <img
          v-if="settings.icon_type === 'image' && settings.icon"
          :src="settings.icon"
          alt="Logo"
          class="size-6 object-contain"
        />
        <UIcon
          v-else
          :name="settings.icon || 'i-lucide-zap'"
          class="text-primary size-6"
        />
        <span
          class="text-lg font-bold tracking-tight text-highlighted"
        >
          {{ settings.title || "Secret Base" }}
        </span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <template v-if="settings.links?.length">
          <UButton
            v-for="link in settings.links"
            :key="link.url"
            :to="link.url"
            :icon="link.icon"
            variant="ghost"
            color="neutral"
            target="_blank"
          >
            {{ link.name }}
          </UButton>
        </template>

        <UColorModeButton v-if="settings.show_color_mode !== false" />

        <UButton
          v-if="settings.show_github !== false"
          variant="ghost"
          color="neutral"
          icon="i-simple-icons-github"
          :to="settings.github_url || 'https://github.com'"
          target="_blank"
        />

        <UButton
          color="primary"
          to="/dash"
          trailing-icon="i-lucide-arrow-right"
        >
          控制台
        </UButton>
      </div>
    </UContainer>
  </nav>
</template>
