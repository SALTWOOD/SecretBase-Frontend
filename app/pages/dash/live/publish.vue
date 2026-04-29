<script setup lang="ts">
import {
  getLiveMeChannel,
  postLiveMeChannelDisable,
  postLiveMeChannelEnable,
  postLiveMeChannelStreamKeyReset,
  putLiveMeChannel,
} from "~~/packages/api/src/sdk.gen";

const toast = useToast();

const loading = ref(false);
const saving = ref(false);
const data = ref<any>(null);
const streamKey = ref("");
const unavailableReason = ref("");

const form = reactive({
  title: "",
  coverUrl: "",
});

const pushServer = computed(() => data.value?.rtmpServer || "");

const pushCode = computed(() => {
  if (!data.value?.roomId || !streamKey.value) return "";
  return `${data.value.roomId}?key=${streamKey.value}`;
});

const loadChannel = async () => {
  loading.value = true;
  unavailableReason.value = "";
  try {
    const response = await getLiveMeChannel();
    if (response.error) {
      const status = response.response.status;
      if (status === 403) {
        unavailableReason.value = "直播功能未开启或当前账号没有推流权限。";
        return;
      }
      unavailableReason.value = "加载失败，请稍后重试。";
      return;
    }

    data.value = response.data;
    form.title = response.data?.title ?? "";
    form.coverUrl = response.data?.coverUrl ?? "";
  } catch {
    unavailableReason.value = "加载失败，请稍后重试。";
  } finally {
    loading.value = false;
  }
};

const saveProfile = async () => {
  saving.value = true;
  try {
    const response = await putLiveMeChannel({
      body: {
        title: form.title,
        coverUrl: form.coverUrl || undefined,
      },
    });

    if (!response.error && response.data) {
      data.value = response.data;
      toast.add({ title: "直播间信息已更新", color: "success" });
      return;
    }

    toast.add({ title: "保存失败", color: "error" });
  } finally {
    saving.value = false;
  }
};

const resetStreamKey = async () => {
  const response = await postLiveMeChannelStreamKeyReset();
  if (response.error || !response.data?.streamKey) {
    toast.add({ title: "重置推流密钥失败", color: "error" });
    return;
  }

  streamKey.value = response.data.streamKey;
  toast.add({ title: "已生成新推流密钥", color: "success" });
};

const toggleChannel = async (enabled: boolean) => {
  const response = enabled
    ? await postLiveMeChannelEnable()
    : await postLiveMeChannelDisable();

  if (response.error) {
    toast.add({ title: enabled ? "启用失败" : "停用失败", color: "error" });
    return;
  }

  data.value = {
    ...data.value,
    isEnabled: enabled,
  };
  toast.add({ title: enabled ? "直播间已启用" : "直播间已停用", color: "success" });
};

const copyText = async (value: string, title: string) => {
  if (!value) return;
  await navigator.clipboard.writeText(value);
  toast.add({ title: `${title}已复制`, color: "success" });
};

onMounted(loadChannel);
</script>

<template>
  <div class="py-6 space-y-6">
    <div>
      <h1 class="text-2xl font-bold">推流控制</h1>
      <p class="text-sm text-muted mt-1">管理直播间资料、推流地址和推流密钥。</p>
    </div>

    <UCard v-if="loading">
      <div class="py-8 text-center text-muted">正在加载直播配置...</div>
    </UCard>

    <UAlert
      v-else-if="unavailableReason"
      color="warning"
      variant="subtle"
      title="当前不可用"
      :description="unavailableReason"
      icon="i-lucide-alert-triangle"
    />

    <template v-else>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div class="font-semibold">直播间状态</div>
            <UBadge :color="data?.isLive ? 'success' : 'neutral'" variant="subtle">
              {{ data?.isLive ? "直播中" : "未开播" }}
            </UBadge>
          </div>
        </template>

        <div class="flex flex-wrap items-center gap-3">
          <UButton
            :color="data?.isEnabled ? 'neutral' : 'success'"
            :variant="data?.isEnabled ? 'outline' : 'solid'"
            @click="toggleChannel(!data?.isEnabled)"
          >
            {{ data?.isEnabled ? "停用直播间" : "启用直播间" }}
          </UButton>
          <span class="text-sm text-muted">
            {{ data?.isEnabled ? "观看者可看到你的直播间" : "直播间已关闭，不会出现在列表中" }}
          </span>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="font-semibold">直播间信息</div>
        </template>

        <div class="space-y-4">
          <UFormField label="标题">
            <UInput v-model="form.title" placeholder="例如：今晚开发日志" />
          </UFormField>

          <UFormField label="封面图 URL">
            <UInput v-model="form.coverUrl" placeholder="https://..." />
          </UFormField>

          <UButton :loading="saving" color="primary" @click="saveProfile">
            保存信息
          </UButton>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="font-semibold">推流配置（OBS）</div>
        </template>

        <div class="space-y-4">
          <UFormField label="服务器">
            <div class="flex gap-2">
              <UInput :model-value="pushServer" readonly class="flex-1" />
              <UButton variant="outline" :disabled="!pushServer" @click="copyText(pushServer, '服务器')">
                复制
              </UButton>
            </div>
          </UFormField>

          <UFormField label="推流码">
            <div class="flex gap-2">
              <UInput :model-value="pushCode" placeholder="点击重置后显示新推流码" readonly class="flex-1" />
              <UButton color="warning" variant="outline" @click="resetStreamKey">
                重置并刷新
              </UButton>
              <UButton variant="outline" :disabled="!pushCode" @click="copyText(pushCode, '推流码')">
                复制
              </UButton>
            </div>
            <p class="text-xs text-muted mt-1">推流码只会在重置后显示一次，请立即保存。</p>
          </UFormField>
        </div>
      </UCard>
    </template>
  </div>
</template>
