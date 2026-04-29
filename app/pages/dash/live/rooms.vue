<script setup lang="ts">
import { getLiveRooms } from "~~/packages/api/src/sdk.gen";

const loading = ref(false);
const rooms = ref<any[]>([]);
const onlyOnline = ref(true);
const unavailableReason = ref("");

const fetchRooms = async () => {
  loading.value = true;
  unavailableReason.value = "";
  try {
    const response = await getLiveRooms({
      query: { onlineOnly: onlyOnline.value },
    });

    if (response.error) {
      if (response.response.status === 403) {
        unavailableReason.value = "直播功能暂未开放。";
        rooms.value = [];
        return;
      }
      unavailableReason.value = "加载直播间失败，请稍后重试。";
      rooms.value = [];
      return;
    }

    rooms.value = response.data ?? [];
  } catch {
    unavailableReason.value = "加载直播间失败，请稍后重试。";
    rooms.value = [];
  } finally {
    loading.value = false;
  }
};

const formatTime = (value?: string | Date | null) => {
  if (!value) return "暂无开播记录";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

watch(onlyOnline, fetchRooms);
onMounted(fetchRooms);
</script>

<template>
  <div class="py-6 space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">直播间列表</h1>
        <p class="text-sm text-muted mt-1">浏览当前可观看的直播间并进入观看。</p>
      </div>
      <USwitch v-model="onlyOnline" label="仅看直播中" />
    </div>

    <UCard v-if="loading">
      <div class="py-8 text-center text-muted">正在加载直播间...</div>
    </UCard>

    <UAlert
      v-else-if="unavailableReason"
      color="warning"
      variant="subtle"
      title="当前不可用"
      :description="unavailableReason"
      icon="i-lucide-alert-triangle"
    />

    <div v-else-if="rooms.length" class="grid gap-4 md:grid-cols-2">
      <UCard v-for="room in rooms" :key="room.roomId">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-semibold text-base">{{ room.title }}</div>
              <div class="text-sm text-muted">主播：{{ room.ownerUsername }}</div>
            </div>
            <UBadge :color="room.isLive ? 'success' : 'neutral'" variant="subtle">
              {{ room.isLive ? "直播中" : "未开播" }}
            </UBadge>
          </div>

          <div class="text-xs text-muted">最近开播：{{ formatTime(room.lastLiveAt) }}</div>

          <UButton :to="`/dash/live/watch/${room.roomId}`" block color="primary" icon="i-lucide-play">
            进入直播间
          </UButton>
        </div>
      </UCard>
    </div>

    <UCard v-else>
      <div class="py-12 text-center text-muted">当前没有可展示的直播间。</div>
    </UCard>
  </div>
</template>
