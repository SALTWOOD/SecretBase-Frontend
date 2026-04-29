<script setup lang="ts">
import { getLiveRoomsByRoomId } from "~~/packages/api/src/sdk.gen";

const route = useRoute();

const loading = ref(false);
const room = ref<any>(null);
const unavailableReason = ref("");

const roomId = computed(() => Number(route.params.id));

const fetchRoom = async () => {
  loading.value = true;
  unavailableReason.value = "";
  try {
    const response = await getLiveRoomsByRoomId({
      path: { roomId: roomId.value },
    });

    if (response.error) {
      if (response.response.status === 403) {
        unavailableReason.value = "直播功能未开放。";
        room.value = null;
        return;
      }
      if (response.response.status === 404) {
        unavailableReason.value = "直播间不存在或已关闭。";
        room.value = null;
        return;
      }
      unavailableReason.value = "加载直播间失败，请稍后重试。";
      room.value = null;
      return;
    }

    room.value = response.data;
  } catch {
    unavailableReason.value = "加载直播间失败，请稍后重试。";
    room.value = null;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchRoom);
</script>

<template>
  <div class="py-6 space-y-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">直播观看</h1>
        <p class="text-sm text-muted mt-1">房间 ID: {{ roomId }}</p>
      </div>
      <UButton to="/dash/live/rooms" variant="ghost" icon="i-lucide-arrow-left">
        返回列表
      </UButton>
    </div>

    <UCard v-if="loading">
      <div class="py-8 text-center text-muted">正在加载直播间...</div>
    </UCard>

    <UAlert
      v-else-if="unavailableReason"
      color="warning"
      variant="subtle"
      title="当前不可观看"
      :description="unavailableReason"
      icon="i-lucide-alert-triangle"
    />

    <template v-else-if="room">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="font-semibold text-lg">{{ room.title }}</div>
              <div class="text-sm text-muted">主播：{{ room.ownerUsername }}</div>
            </div>
            <UBadge :color="room.isLive ? 'success' : 'neutral'" variant="subtle">
              {{ room.isLive ? "直播中" : "未开播" }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-4">
          <div class="rounded-xl overflow-hidden border border-default bg-black/90">
            <video
              v-if="room.playbackUrl"
              class="w-full aspect-video"
              controls
              autoplay
              playsinline
              :src="room.playbackUrl"
            />
          </div>

          <p class="text-xs text-muted">
            如当前浏览器无法直接播放 HLS，可复制播放地址到 VLC 等播放器观看。
          </p>

          <UFormField label="播放地址">
            <UInput :model-value="room.playbackUrl" readonly />
          </UFormField>
        </div>
      </UCard>
    </template>
  </div>
</template>
