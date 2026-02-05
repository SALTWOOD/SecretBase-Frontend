<template>
  <UBadge
    v-if="role === 3"
    variant="solid"
    class="bg-linear-to-r from-amber-400 to-yellow-600 text-black font-bold shadow-sm"
  >
    站长
  </UBadge>

  <UBadge
    v-else-if="role === 2"
    color="info"
    variant="subtle"
  >
    管理
  </UBadge>

  <UBadge
    v-else-if="role === 1"
    color="success"
    variant="soft"
  >
    用户
  </UBadge>

  <UBadge
    v-else
    color="neutral"
    variant="outline"
    class="opacity-60"
  >
    访客
  </UBadge>
</template>

<script setup lang="ts">
/**
 * Role levels:
 * 3: Owner (站长)
 * 2: Admin (管理)
 * 1: User  (用户)
 * 0: Guest (访客)
 */
defineProps<{
  role: number
}>()
</script>
