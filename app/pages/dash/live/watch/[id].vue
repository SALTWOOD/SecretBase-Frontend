<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import Hls from 'hls.js';
import * as signalR from '@microsoft/signalr';
import { getLiveRoomsByRoomId } from "~~/packages/api/src";

const videoRef = ref<HTMLVideoElement | null>(null);
const statusText = ref('等待初始化...');
const status = ref('idle');
const loading = ref(false);
const room = ref();
const unavailableReason = ref("");
const route = useRoute();
const runtimeConfig = useRuntimeConfig();

type DanmakuMode = 'scroll' | 'top' | 'bottom';

type DanmakuMessage = {
  roomId: number;
  username: string;
  content: string;
  mode: DanmakuMode;
  createdAt: string;
};

type ScrollOverlayItem = {
  id: number;
  content: string;
  lane: number;
  duration: number;
};

type StaticOverlayItem = {
  id: number;
  content: string;
};

const danmakuInput = ref('');
const sending = ref(false);
const danmakuMode = ref<DanmakuMode>('scroll');
const danmakuConnected = ref(false);
const danmakuError = ref('');
const danmakuMessages = ref<DanmakuMessage[]>([]);
const scrollOverlayItems = ref<ScrollOverlayItem[]>([]);
const topOverlayItems = ref<StaticOverlayItem[]>([]);
const bottomOverlayItems = ref<StaticOverlayItem[]>([]);

const MAX_SCROLL_LANES = 8;
const MAX_LIST_ITEMS = 80;
const MAX_STATIC_ITEMS = 2;

let scrollId = 0;
let staticId = 0;
let laneCursor = 0;
let hubConnection: signalR.HubConnection | null = null;

const roomId = computed(() => {
  const raw = route.params.id;
  const parsed = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
});
const playbackUrl = computed(() => room.value?.playbackUrl);

const resolveHubUrl = () => {
  const baseApi = runtimeConfig.public.apiBase as string | undefined;
  if (baseApi) {
    const apiUrl = new URL(baseApi, window.location.origin);
    return `${apiUrl.origin}/api/v1/live/danmaku/hub`;
  }
  return `${window.location.origin}/api/v1/live/danmaku/hub`;
};

const resolvePlaybackUrl = (url?: string) => {
  if (!url || typeof window === 'undefined') return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `${window.location.protocol}${url}`;
  if (url.startsWith('/')) return `${window.location.origin}${url}`;
  return `${window.location.origin}/${url}`;
};

const playbackResolvedUrl = computed(() => resolvePlaybackUrl(playbackUrl.value));

let hls: Hls | null = null;

const initHls = () => {
  if (hls) {
    hls.destroy();
    hls = null;
  }

  const video = videoRef.value;
  const url = playbackResolvedUrl.value;

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
        console.warn(e);
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

  if (!roomId.value) {
    unavailableReason.value = '房间 ID 无效。';
    loading.value = false;
    return;
  }

  try {
    const response = await getLiveRoomsByRoomId({
      path: { roomId: roomId.value },
    });

    if (response.error) {
      const code = response.response.status;
      if (code === 403) unavailableReason.value = "直播功能未开放。";
      else if (code === 404) unavailableReason.value = "直播间不存在。";
      else unavailableReason.value = `加载失败 (HTTP ${code})`;
      room.value = null;
      return;
    }

    room.value = response.data;

    if (!room.value?.isLive) {
      unavailableReason.value = "主播暂未开播";
      return;
    }
  } catch (err) {
    unavailableReason.value = "网络请求失败。";
    room.value = null;
    statusText.value = "加载失败";
    status.value = "error";
  } finally {
    loading.value = false;
  }
};

const appendMessage = (message: DanmakuMessage) => {
  danmakuMessages.value.unshift(message);
  if (danmakuMessages.value.length > MAX_LIST_ITEMS) {
    danmakuMessages.value.length = MAX_LIST_ITEMS;
  }
};

const spawnScrollOverlay = (content: string) => {
  const lane = laneCursor % MAX_SCROLL_LANES;
  laneCursor += 1;
  const item: ScrollOverlayItem = {
    id: ++scrollId,
    content,
    lane,
    duration: 8 + Math.random() * 3,
  };
  scrollOverlayItems.value.push(item);
  window.setTimeout(() => {
    scrollOverlayItems.value = scrollOverlayItems.value.filter((x) => x.id !== item.id);
  }, item.duration * 1000 + 300);
};

const spawnStaticOverlay = (content: string, mode: Extract<DanmakuMode, 'top' | 'bottom'>) => {
  const item: StaticOverlayItem = { id: ++staticId, content };
  const target = mode === 'top' ? topOverlayItems : bottomOverlayItems;
  target.value = [item, ...target.value].slice(0, MAX_STATIC_ITEMS);
  window.setTimeout(() => {
    target.value = target.value.filter((x) => x.id !== item.id);
  }, 3500);
};

const handleIncomingDanmaku = (message: DanmakuMessage) => {
  if (message.roomId !== roomId.value) return;
  appendMessage(message);

  if (message.mode === 'scroll') {
    spawnScrollOverlay(message.content);
    return;
  }

  if (message.mode === 'top' || message.mode === 'bottom') {
    spawnStaticOverlay(message.content, message.mode);
  }
};

const connectDanmaku = async () => {
  if (!roomId.value || unavailableReason.value || !room.value?.isLive) return;

  if (hubConnection) {
    await hubConnection.stop();
    hubConnection = null;
  }

  hubConnection = new signalR.HubConnectionBuilder()
    .withUrl(resolveHubUrl(), { withCredentials: true })
    .withAutomaticReconnect()
    .build();

  hubConnection.on('danmaku', handleIncomingDanmaku);

  hubConnection.onclose((error) => {
    danmakuConnected.value = false;
    danmakuError.value = error ? '弹幕连接已断开' : '';
  });

  hubConnection.onreconnected(async () => {
    danmakuConnected.value = true;
    danmakuError.value = '';
    if (roomId.value) {
      await hubConnection?.invoke('JoinRoom', roomId.value);
    }
  });

  try {
    await hubConnection.start();
    await hubConnection.invoke('JoinRoom', roomId.value);
    danmakuConnected.value = true;
    danmakuError.value = '';
  } catch {
    danmakuConnected.value = false;
    danmakuError.value = '弹幕服务连接失败';
  }
};

const sendDanmaku = async () => {
  const content = danmakuInput.value.trim();
  if (!content || !hubConnection || !danmakuConnected.value || !roomId.value) return;

  sending.value = true;
  try {
    await hubConnection.invoke('SendDanmaku', roomId.value, content, danmakuMode.value);
    danmakuInput.value = '';
  } catch {
    danmakuError.value = '发送失败，请稍后重试';
  } finally {
    sending.value = false;
  }
};

onMounted(async () => {
  await fetchRoom();
  await nextTick();
  initHls();
  await connectDanmaku();
});

onBeforeUnmount(async () => {
  if (hls) hls.destroy();
  if (hubConnection) {
    await hubConnection.stop();
    hubConnection = null;
  }
});
</script>

<template>
  <div class="py-6 space-y-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">直播观看</h1>
        <p class="text-sm text-muted mt-1">房间 ID: {{ roomId || '-' }}</p>
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
      <div class="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <UCard>
          <template #header>
            <div class="font-semibold">实时弹幕列表</div>
          </template>

          <div class="space-y-4">
            <div class="danmaku-list border border-default rounded-lg p-3 bg-muted/20">
              <div v-if="!danmakuMessages.length" class="text-xs text-muted">当前暂无弹幕</div>
              <div v-for="item in danmakuMessages" :key="`${item.createdAt}-${item.username}-${item.content}`" class="text-sm leading-6">
                <span class="font-semibold text-primary">{{ item.username }}</span>
                <span class="text-muted mx-1">:</span>
                <span>{{ item.content }}</span>
              </div>
            </div>

            <div class="space-y-2">
              <UFormField label="发送弹幕">
                <UInput
                  v-model="danmakuInput"
                  :disabled="!danmakuConnected"
                  placeholder="输入弹幕内容"
                  maxlength="120"
                  @keydown.enter="sendDanmaku"
                />
              </UFormField>

              <div class="flex gap-2 items-center">
                <select v-model="danmakuMode" class="danmaku-mode-select">
                  <option value="scroll">滚动</option>
                  <option value="top">上置顶</option>
                  <option value="bottom">下置底</option>
                </select>
                <UButton :loading="sending" :disabled="!danmakuConnected || !danmakuInput.trim()" color="primary" @click="sendDanmaku">
                  发送
                </UButton>
              </div>

              <div class="text-xs" :class="danmakuConnected ? 'text-green-500' : 'text-muted'">
                {{ danmakuConnected ? '弹幕已连接' : '弹幕未连接' }}
              </div>
              <div v-if="danmakuError" class="text-xs text-red-500">{{ danmakuError }}</div>
            </div>
          </div>
        </UCard>

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
          <div class="relative rounded-xl overflow-hidden border border-default bg-black/90">
            <video
              ref="videoRef"
              class="w-full aspect-video"
              controls
              playsinline
              muted
            />

            <div class="danmaku-overlay pointer-events-none">
              <div
                v-for="item in scrollOverlayItems"
                :key="item.id"
                class="danmaku-scroll-item"
                :style="{
                  top: `${16 + item.lane * 30}px`,
                  animationDuration: `${item.duration}s`
                }"
              >
                {{ item.content }}
              </div>

              <div class="danmaku-static-layer top">
                <div v-for="item in topOverlayItems" :key="item.id" class="danmaku-static-item">
                  {{ item.content }}
                </div>
              </div>

              <div class="danmaku-static-layer bottom">
                <div v-for="item in bottomOverlayItems" :key="item.id" class="danmaku-static-item">
                  {{ item.content }}
                </div>
              </div>
            </div>
          </div>

          <div class="text-sm flex items-center gap-2">
            <span class="text-muted">播放状态:</span>
            <span
              :class="{
                'text-green-500': status === 'success',
                'text-red-500': status === 'error',
                'text-gray-400': status === 'idle'
              }"
              class="font-medium"
            >
              {{ statusText }}
            </span>
          </div>

          <p class="text-xs text-muted">
            如当前浏览器无法直接播放，可复制播放地址到 VLC 观看。
          </p>

          <UFormField label="播放地址">
            <UInput :model-value="playbackResolvedUrl" readonly icon="i-lucide-link" class="w-full" />
          </UFormField>
        </div>
        </UCard>
      </div>
    </template>
  </div>
</template>

<style scoped>
video {
  outline: none;
  object-fit: contain;
}

.danmaku-list {
  height: 20rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.danmaku-mode-select {
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
  padding: 0.45rem 0.6rem;
  font-size: 0.875rem;
}

.danmaku-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.danmaku-scroll-item {
  position: absolute;
  right: -10%;
  color: #fff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  animation-name: danmaku-scroll;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

.danmaku-static-layer {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
}

.danmaku-static-layer.top {
  top: 0;
}

.danmaku-static-layer.bottom {
  bottom: 0;
}

.danmaku-static-item {
  color: #fff;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
}

@keyframes danmaku-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-130vw);
  }
}
</style>
