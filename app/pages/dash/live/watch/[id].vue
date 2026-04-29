<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import Hls from 'hls.js';
import { getLiveRoomsByRoomId } from "~~/packages/api/src";

const videoRef = ref<HTMLVideoElement | null>(null);
const statusText = ref('等待初始化...');
const status = ref('idle');
const loading = ref(false);

const room = ref();

const roomId = computed(() => room.value?.roomId);
const playbackUrl = computed(() => room.value?.playbackUrl);
const unavailableReason = ref();

let hls: Hls | null = null;

const initHls = () => {
  const video = videoRef.value;
  const url = playbackUrl.value; // 获取地址

  if (!video || !url) return;

  if (Hls.isSupported()) {
    hls = new Hls({
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
    });

    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      statusText.value = '解析成功，准备播放';
      video.play().catch(e => {
        statusText.value = '自动播放受阻，请点击播放';
        console.warn('Auto-play failed:', e);
      });
      status.value = 'success';
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        status.value = 'error';
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            statusText.value = '网络错误：无法加载切片';
            hls?.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            statusText.value = '解码错误：设备可能不支持 HEVC 10-bit';
            hls?.recoverMediaError();
            break;
          default:
            statusText.value = '不可恢复的错误';
            hls?.destroy();
            break;
        }
      }
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    statusText.value = '原生模式';
    video.src = url;
    status.value = 'success';
  } else {
    statusText.value = '浏览器不支持 MSE 或 HEVC 解码';
    status.value = 'error';
  }
};

const fetchRoom = async () => {
  loading.value = true;
  unavailableReason.value = "";
  statusText.value = "正在加载直播流...";
  status.value = "idle";

  try {
    const response = await getLiveRoomsByRoomId({
      path: { roomId: roomId.value },
    });

    if (response.error) {
      const code = response.response.status;
      if (code === 403) {
        unavailableReason.value = "直播功能未开放。";
      } else if (code === 404) {
        unavailableReason.value = "直播间不存在。";
      } else {
        unavailableReason.value = `加载失败 (HTTP ${code})`;
      }
      room.value = null;
      return;
    }

    room.value = response.data;

    if (!room.value?.isLive) {
      unavailableReason.value = "主播暂未开播";
      return;
    }
  } catch (err) {
    console.error('Fetch room error:', err);
    unavailableReason.value = "网络请求失败。";
    room.value = null;
    statusText.value = "加载失败";
    status.value = "error";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchRoom();
  initHls();
});

onBeforeUnmount(() => {
  if (hls) hls.destroy();
});
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
              ref="videoRef"
              class="w-full aspect-video"
              controls
              playsinline
              muted
            />
          </div>

          <div class="text-sm flex items-center gap-2">
            <span class="text-muted">播放状态:</span>
            <span :class="status" class="font-medium">{{ statusText }}</span>
          </div>

          <p class="text-xs text-muted">
            如当前浏览器无法直接播放，可复制播放地址到 VLC 观看。
          </p>

          <UFormField label="播放地址">
            <UInput :model-value="playbackUrl" readonly icon="i-lucide-link" />
          </UFormField>
        </div>
      </UCard>
    </template>
  </div>
</template>

<style scoped>
video {
  outline: none;
  object-fit: contain;
}
.success { color: rgb(34, 197, 94); }
.error { color: rgb(239, 68, 68); }
.idle { color: rgb(156, 163, 175); }
</style>
