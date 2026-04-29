<script setup lang="ts">
import Hls from "hls.js";
import { getLiveRoomsByRoomId } from "~~/packages/api/src/sdk.gen";

const route = useRoute();

const loading = ref(false);
const room = ref<any>(null);
const unavailableReason = ref("");
const videoRef = ref<HTMLVideoElement | null>(null);
const statusText = ref("等待初始化...");
const status = ref("idle");

const roomId = computed(() => Number(route.params.id));

let hls: Hls | null = null;

const destroyHls = () => {
  if (hls) {
    hls.destroy();
    hls = null;
  }
};

const initHls = () => {
  const video = videoRef.value;
  const streamUrl = room.value?.playbackUrl;

  if (!video || !streamUrl) return;

  destroyHls();

  if (Hls.isSupported()) {
    hls = new Hls({
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
    });

    hls.loadSource(streamUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      statusText.value = "解析成功，准备播放";
      video.play().catch(() => {
        statusText.value = "自动播放受阻，请点击播放";
      });
      status.value = "success";
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        status.value = "error";
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            statusText.value = "网络错误：无法加载切片";
            hls?.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            statusText.value = "解码错误：请尝试更换浏览器或播放器";
            hls?.recoverMediaError();
            break;
          default:
            statusText.value = "不可恢复的错误，请检查网络或稍后重试";
            destroyHls();
            break;
        }
      }
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    statusText.value = "原生模式";
    video.src = streamUrl;
    status.value = "success";
  } else {
    statusText.value = "浏览器不支持 MSE 或 HLS 解码";
    status.value = "error";
  }
};

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

    if (!room.value?.playbackUrl) {
      statusText.value = "当前直播间暂无可播放地址";
      status.value = "idle";
      return;
    }

    statusText.value = "等待初始化...";
    status.value = "idle";

    await nextTick();
    initHls();
  } catch {
    unavailableReason.value = "加载直播间失败，请稍后重试。";
    room.value = null;
    statusText.value = "加载失败";
    status.value = "error";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchRoom);

onBeforeUnmount(() => {
  destroyHls();
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
              />
            </div>

            <div class="text-sm">
              <span>状态: </span>
              <span :class="status">{{ statusText }}</span>
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

<style scoped>
.success {
  color: #4ade80;
}

.error {
  color: #f87171;
}

.idle {
  color: #9ca3af;
}
</style>
