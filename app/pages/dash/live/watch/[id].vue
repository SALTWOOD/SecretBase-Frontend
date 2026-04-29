<script setup lang="ts">
import Hls from "hls.js";
import { getLiveRoomsByRoomId } from "~~/packages/api/src/sdk.gen";

const route = useRoute();
const requestUrl = useRequestURL();

const loading = ref(false);
const room = ref<any>(null);
const unavailableReason = ref("");
const videoRef = ref<HTMLVideoElement | null>(null);
const statusText = ref("等待初始化...");
const status = ref("idle");

const roomId = computed(() => Number(route.params.id));

const resolvePlaybackUrl = (rawUrl?: string) => {
  if (!rawUrl) return "";
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(rawUrl)) return rawUrl;
  if (rawUrl.startsWith("//")) return `${requestUrl.protocol}${rawUrl}`;
  const normalizedPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  return `${requestUrl.protocol}//${requestUrl.host}${normalizedPath}`;
};

const playbackUrl = computed(() => resolvePlaybackUrl(room.value?.playbackUrl));

let hls: Hls | null = null;

const destroyHls = () => {
  if (hls) {
    hls.destroy();
    hls = null;
  }
};

const initHls = () => {
  const video = videoRef.value;
  const streamUrl = playbackUrl.value;

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
        statusText.value = "已就绪，请点击播放";
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
            statusText.value = "解码错误：请尝试更换浏览器";
            hls?.recoverMediaError();
            break;
          default:
            statusText.value = "不可恢复的错误";
            destroyHls();
            break;
        }
      }
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = streamUrl;
    statusText.value = "原生播放模式";
    status.value = "success";
  } else {
    statusText.value = "浏览器不支持 HLS";
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
      const code = response.response.status;
      if (code === 403) unavailableReason.value = "直播功能未开放。";
      else if (code === 404) unavailableReason.value = "直播间不存在。";
      else unavailableReason.value = "加载失败，请重试。";
      room.value = null;
      return;
    }

    room.value = response.data;
    // 这里不需要手动调 initHls，上面的 watch 会自动发现 room 变化并执行
  } catch {
    unavailableReason.value = "网络请求失败。";
    room.value = null;
    statusText.value = "加载失败";
    status.value = "error";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchRoom();
  initHls();
});

onBeforeUnmount(() => {
  destroyHls();
});
</script>

<template>
  <div class="py-6 space-y-6">
    <!-- 头部区域保持你的样式 -->
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">直播观看</h1>
        <p class="text-sm text-muted mt-1">房间 ID: {{ roomId }}</p>
      </div>
      <UButton to="/dash/live/rooms" variant="ghost" icon="i-lucide-arrow-left">
        返回列表
      </UButton>
    </div>

    <!-- 加载中样式 -->
    <UCard v-if="loading">
      <div class="py-8 text-center text-muted">正在加载直播间...</div>
    </UCard>

    <!-- 错误/警告样式 -->
    <UAlert
      v-else-if="unavailableReason"
      color="warning"
      variant="subtle"
      title="当前不可观看"
      :description="unavailableReason"
      icon="i-lucide-alert-triangle"
    />

    <!-- 直播间内容区 -->
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
          <!-- 播放器容器 -->
          <div class="rounded-xl overflow-hidden border border-default bg-black/90">
            <!-- 建议加上 muted 以提高自动播放成功率 -->
            <video
              ref="videoRef"
              class="w-full aspect-video"
              controls
              playsinline
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
</style>
