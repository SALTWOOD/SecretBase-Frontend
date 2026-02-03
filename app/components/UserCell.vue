<template>
  <div class="flex items-center gap-3">
    <UAvatar
      :src="avatar ?? undefined"
      :alt="username ?? undefined"
      size="sm"
    />

    <div class="flex flex-col">
      <span class="text-default font-medium">{{ username }}</span>
      <span class="text-xs text-muted">{{ email }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  username: string | null;
  email?: string | null;
  avatar?: string | null;
}>();
</script>
