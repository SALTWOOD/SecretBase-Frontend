<script setup lang="ts">
import {
  getAdminStorageBucketByBucketNameFile,
  getAdminStorageBucketByBucketNamePresignDownload,
  postAdminStorageBucketByBucketNamePresignUpload,
  type S3ObjectMetadataResponse,
} from "~~/packages/api/src";

// Constants
const ROW_HEIGHT = 32;
const VISIBLE_ROWS = 22;
const BUFFER_ROWS = 5;

const route = useRoute();
const router = useRouter();
const toast = useToast();
const containerRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);

const bucket = computed(() => route.query.bucket as string);
const fileKey = computed(() => route.query.key as string);
const slug = computed(() => fileKey.value.split("/"));

// UI States
const viewMode = ref<'text' | 'markdown' | 'hex'>('text');
const isLoading = ref(true);
const isSaving = ref(false);
const error = ref<string | null>(null);
const editLock = ref<'none' | 'text' | 'hex'>('none');

// Data
const rawBytes = ref<Uint8Array>(new Uint8Array(0));
const content = ref("");
const fileMetadata = ref<S3ObjectMetadataResponse | null>(null);

const fileName = computed(() => fileKey.value.split("/").pop() || fileKey.value);
const hasChanges = computed(() => editLock.value !== 'none');

// Hex Virtual Scroll Logic
const totalRows = computed(() => Math.ceil(rawBytes.value.length / 16));
const scrollHeight = computed(() => totalRows.value * ROW_HEIGHT);

// Start index calculation
const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - BUFFER_ROWS);
});

// Visible rows slice
const visibleHexRows = computed(() => {
  if (viewMode.value !== 'hex' || rawBytes.value.length === 0) return [];

  const start = startIndex.value;
  const end = Math.min(totalRows.value, start + VISIBLE_ROWS + BUFFER_ROWS * 2);
  const rows = [];

  for (let i = start; i < end; i++) {
    const offset = i * 16;
    const chunk = rawBytes.value.slice(offset, offset + 16);
    rows.push({
      index: i,
      address: offset.toString(16).padStart(8, "0").toUpperCase(),
      bytes: Array.from(chunk).map((b, j) => ({
        globalIndex: offset + j,
        hex: b.toString(16).padStart(2, "0").toUpperCase(),
        value: b
      }))
    });
  }
  return rows;
});

// Vertical offset for the table
const offsetY = computed(() => startIndex.value * ROW_HEIGHT);

// Handlers
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  if (target) {
    scrollTop.value = target.scrollTop;
  }
};

watch(viewMode, async (newMode) => {
  if (newMode === 'hex') {
    await nextTick();
    if (containerRef.value) {
      // Manually trigger a scroll calculation to wake up the virtual list
      scrollTop.value = containerRef.value.scrollTop;
    }
  }
});

const updateByte = (index: number, event: Event) => {
  if (editLock.value === 'text') return;
  const el = event.target as HTMLSpanElement;
  let val = el.innerText.trim().replace(/[^0-9a-fA-F]/g, "");
  if (val.length > 2) val = val.substring(0, 2);

  if (val) {
    const byteValue = parseInt(val, 16);
    if (rawBytes.value[index] !== byteValue) {
      rawBytes.value[index] = byteValue;
      if (editLock.value === 'none') editLock.value = 'hex';
    }
  }
  // Force reset text to current value
  el.innerText = rawBytes.value[index]?.toString(16).padStart(2, "0").toUpperCase()!;
};

const handleHexKeyDown = (index: number, event: KeyboardEvent) => {
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  if (!keys.includes(event.key)) return;

  event.preventDefault();
  let nextIndex = index;
  if (event.key === 'ArrowUp') nextIndex -= 16;
  else if (event.key === 'ArrowDown') nextIndex += 16;
  else if (event.key === 'ArrowLeft') nextIndex -= 1;
  else if (event.key === 'ArrowRight') nextIndex += 1;

  if (nextIndex >= 0 && nextIndex < rawBytes.value.length) {
    nextTick(() => {
      const target = document.querySelector(`[data-byte-index="${nextIndex}"]`) as HTMLElement;
      target?.focus();
    });
  }
};

const onTextUpdate = () => {
  if (editLock.value === 'none') editLock.value = 'text';
};

// Lifecycle & API
const loadFile = async () => {
  isLoading.value = true;
  editLock.value = 'none';
  try {
    const meta = await getAdminStorageBucketByBucketNameFile({
      path: { bucketName: bucket.value },
      query: { key: fileKey.value },
    });
    fileMetadata.value = meta.data!;

    const presign = await getAdminStorageBucketByBucketNamePresignDownload({
      path: { bucketName: bucket.value },
      query: { key: fileKey.value },
    });

    const res = await fetch(presign.data!.url);
    const buffer = await res.arrayBuffer();
    rawBytes.value = new Uint8Array(buffer);
    content.value = new TextDecoder().decode(rawBytes.value);

    // Auto-detect binary
    if (rawBytes.value.slice(0, 4096).some(b => b === 0)) {
      viewMode.value = 'hex';
    }
  } catch (e: any) {
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
};

const handleSave = async () => {
  isSaving.value = true;
  try {
    const payload = editLock.value === 'text'
      ? new TextEncoder().encode(content.value)
      : rawBytes.value;

    const presign = await postAdminStorageBucketByBucketNamePresignUpload({
      path: { bucketName: bucket.value },
      body: { key: fileKey.value },
    });

    await fetch(presign.data!.url, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: payload,
    });

    // Refresh baselines
    rawBytes.value = new Uint8Array(payload);
    content.value = new TextDecoder().decode(payload);
    editLock.value = 'none';
    toast.add({ title: "Saved successfully", color: "success" });
  } catch (e: any) {
    toast.add({ title: "Save failed", description: e.message, color: "error" });
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => loadFile());

// Helpers
const toAscii = (bytes: any[]) => {
  return bytes.map(b => (b.value >= 32 && b.value <= 126 ? String.fromCharCode(b.value) : ".")).join('');
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<template>
  <UContainer class="py-6">
    <header class="mb-6">
      <div class="flex justify-between items-end mb-4">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <UIcon name="i-lucide-database" class="text-primary" />
            {{ fileName }}
          </h1>
          <nav class="flex items-center gap-1 text-sm text-gray-500 mt-2 font-mono">
            <NuxtLink
              to="/dash/content/storages"
              class="hover:text-primary underline decoration-dotted"
            >
              存储
            </NuxtLink>
            <span class="text-gray-400">/</span>
            <span
              class="hover:text-primary cursor-pointer underline decoration-dotted"
              @click="router.push(`/dash/content/storages/${bucket}`)"
            >
              {{ bucket }}
            </span>
            <template v-for="(part, i) in slug.slice(1)" :key="i">
              <span class="text-gray-400">/</span>
              <span
                class="hover:text-primary cursor-pointer underline decoration-dotted"
                @click="router.push(`/dash/content/storages/${slug.slice(0, i + 2).join('/')}`)"
              >
                {{ part }}
              </span>
            </template>
          </nav>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md border border-zinc-200 dark:border-zinc-700">
            <UButton :variant="viewMode === 'text' ? 'solid' : 'ghost'" size="xs" color="neutral" icon="i-lucide-type" @click="viewMode = 'text'" />
            <UButton :variant="viewMode === 'markdown' ? 'solid' : 'ghost'" size="xs" color="neutral" icon="i-lucide-hash" @click="viewMode = 'markdown'" />
            <UButton :variant="viewMode === 'hex' ? 'solid' : 'ghost'" size="xs" color="neutral" icon="i-lucide-binary" @click="viewMode = 'hex'" />
          </div>
          <UButton
            color="primary"
            size="sm"
            label="Save"
            :loading="isSaving"
            :disabled="!hasChanges"
            @click="handleSave"
          />
        </div>
      </div>
    </header>

    <div v-if="isLoading" class="flex flex-col items-center justify-center py-24">
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8 text-primary/50" />
    </div>

    <div v-else class="space-y-4">
      <UAlert
        v-if="editLock !== 'none'"
        :color="editLock === 'hex' ? 'warning' : 'primary'"
        variant="subtle"
        icon="i-lucide-lock"
        :title="editLock === 'hex' ? 'HEX Mode Locked' : 'Text Mode Locked'"
        :description="editLock === 'hex' ? 'Changes made in HEX mode. Text editing is disabled.' : 'Changes made in Text mode. HEX editing is disabled.'"
      />

      <div class="relative border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
        <textarea
          v-if="viewMode === 'text'"
          v-model="content"
          :readonly="editLock === 'hex'"
          class="w-full h-[70vh] p-4 font-mono text-[13px] bg-transparent outline-none resize-none dark:text-zinc-300"
          spellcheck="false"
          @input="onTextUpdate"
        />

        <div v-else-if="viewMode === 'markdown'" class="w-full h-[70vh] p-4 overflow-auto prose dark:prose-invert max-w-none">
          <MarkdownEditor v-model="content" :disabled="editLock === 'hex'" @input="onTextUpdate" />
        </div>

        <div
          v-else-if="viewMode === 'hex'"
          ref="containerRef"
          class="w-full h-[70vh] overflow-auto font-mono text-[12px] bg-zinc-50 dark:bg-zinc-900/20"
          style="will-change: transform;"
          @scroll="handleScroll"
        >
          <div :style="{ height: `${scrollHeight}px` }" class="relative w-full">
            <table
              class="w-full border-collapse absolute top-0 left-0"
              :style="{ transform: `translate3d(0, ${offsetY}px, 0)` }"
            >
              <tbody>
              <tr v-for="row in visibleHexRows" :key="row.index" :style="{ height: `${ROW_HEIGHT}px` }" class="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-primary-500/5 transition-colors">
                <td class="px-4 text-zinc-400 select-none w-24 text-right pr-6">{{ row.address }}</td>
                <td class="px-2 flex gap-x-2 leading-[32px]">
                    <span
                      v-for="byte in row.bytes"
                      :key="byte.globalIndex"
                      :data-byte-index="byte.globalIndex"
                      :contenteditable="editLock !== 'text'"
                      class="px-0.5 rounded outline-none min-w-[1.2rem] text-center uppercase focus:bg-primary-500 focus:text-white"
                      :class="editLock === 'text' ? 'opacity-50 pointer-events-none' : 'hover:bg-primary-500/20 cursor-text'"
                      @blur="updateByte(byte.globalIndex, $event)"
                      @keydown="handleHexKeyDown(byte.globalIndex, $event)"
                    >{{ byte.hex }}</span>
                </td>
                <td class="px-6 text-zinc-500 border-l border-zinc-100 dark:border-zinc-800 whitespace-pre">
                  {{ toAscii(row.bytes) }}
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="px-3 py-1.5 flex justify-between items-center text-[10px] text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
          <div class="flex gap-4">
            <span class="flex items-center gap-1"><UIcon name="i-lucide-hard-drive" /> {{ formatSize(Number(fileMetadata?.contentLength || 0)) }}</span>
            <span class="uppercase">Mode: {{ viewMode }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span v-if="hasChanges" class="text-amber-500 font-bold italic">UNSAVED CHANGES</span>
            <span>ENCODING: UTF-8</span>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
