<script setup lang="ts">
import {
  getStickerSets,
  getStickerSetsByIdDetails,
  type StickerSetInfoResponse,
  type StickerUrlResponse,
} from "~~/packages/api/src";

const props = withDefaults(
  defineProps<{
    icon?: string;
    modelValue?: string;
  }>(),
  {
    icon: "i-heroicons-face-smile",
  },
);

const emit = defineEmits<{
  (
    e: "select",
    payload: { setId: number | string; stickerId: number | string },
  ): void;
  (e: "update:modelValue", value: string): void;
}>();

const stickerSets = ref<StickerSetInfoResponse[]>([]);
const activeTabId = ref<number | null>(null);
const stickerMap = ref<Record<string | number, StickerUrlResponse[]>>({});
const paginationMap = ref<
  Record<string | number, { page: number; hasMore: boolean }>
>({});
const isLoading = ref(false);

const currentEmojis = computed(() =>
  activeTabId.value ? stickerMap.value[activeTabId.value] || [] : [],
);

async function fetchStickers(setId: number, isLoadMore = false) {
  if (isLoading.value) return;

  const pageState = paginationMap.value[setId] || { page: 1, hasMore: true };
  if (!pageState.hasMore && isLoadMore) return;

  isLoading.value = true;
  const targetPage = isLoadMore ? pageState.page + 1 : 1;

  try {
    const { data, error } = await getStickerSetsByIdDetails({
      path: { id: setId },
      query: {
        page: targetPage,
        pageSize: 18,
      },
    });

    if (error || !data) return;

    const newStickers = data.map((s) => ({
      id: s.id!,
      name: s.name || "",
      url: s.url!,
      loading: false,
    }));

    if (isLoadMore) {
      stickerMap.value[setId] = [
        ...(stickerMap.value[setId] || []),
        ...newStickers,
      ];
    } else {
      stickerMap.value[setId] = newStickers;
    }

    // 更新分页状态
    paginationMap.value[setId] = {
      page: targetPage,
      hasMore: data.length === 18, // 如果返回数量小于 pageSize，说明没有更多了
    };
  } catch (err) {
    console.error("Failed to fetch stickers:", err);
  } finally {
    isLoading.value = false;
  }
}

async function handleTabChange(setId: number) {
  activeTabId.value = setId;
  if (!stickerMap.value[setId]) {
    await fetchStickers(setId);
  }
}

function handleScroll(e: Event) {
  const target = e.target as HTMLElement;
  // 阈值设置为 10px
  if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
    if (activeTabId.value) {
      fetchStickers(activeTabId.value, true);
    }
  }
}

const isOpen = ref(false);

const handleSelect = (emoji: StickerUrlResponse) => {
  if (activeTabId.value == null) return;
  emit("select", { setId: activeTabId.value, stickerId: emoji.id! });
  emit("update:modelValue", `[emoji:${activeTabId.value}:${emoji.id!}]`);
  isOpen.value = false;
};

onMounted(async () => {
  const response = await getStickerSets();
  if (response.error || !response.data) return;

  stickerSets.value = response.data as StickerSetInfoResponse[];

  if (stickerSets.value.length > 0) {
    const firstId = stickerSets.value[0]!.id as number;
    await handleTabChange(firstId);
  }
});
</script>

<template>
  <UPopover v-model:open="isOpen" :popper="{ placement: 'top-start' }">
    <UButton color="secondary" variant="ghost" :icon="props.icon" />

    <template #content>
      <div
        class="w-[28rem] flex flex-col bg-white dark:bg-gray-900 shadow-xl rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800"
      >
        <div
          class="h-80 overflow-y-auto p-3 grid grid-cols-5 gap-2 custom-scrollbar"
          @scroll="handleScroll"
        >
          <div
            v-for="emoji in currentEmojis"
            :key="emoji.id"
            :title="emoji.name"
            class="aspect-square flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            @click="handleSelect(emoji)"
          >
            <img
              :src="emoji.url"
              class="w-full h-full object-contain p-1.5"
              loading="lazy"
            />
          </div>

          <div v-if="isLoading" class="col-span-5 flex justify-center py-2">
            <UIcon
              name="i-heroicons-arrow-path"
              class="w-5 h-5 animate-spin text-gray-400"
            />
          </div>
        </div>

        <div
          class="flex items-center bg-gray-50 dark:bg-gray-800/50 p-1 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="flex-1 flex gap-1 overflow-x-auto no-scrollbar">
            <UButton
              v-for="set in stickerSets"
              variant="ghost"
              :key="set.id"
              :title="set.name"
              class="p-1.5 rounded transition-all shrink-0 flex items-center justify-center"
              :class="
                activeTabId === set.id
                  ? 'bg-blue-500/10 ring-1 ring-blue-500'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              "
              @click="handleTabChange(set.id as number)"
            >
              <img
                :src="
                  stickerMap[set.id]?.[0]?.url || '/placeholder-sticker.png'
                "
                class="w-8 h-8 object-contain"
              />
            </UButton>
          </div>

          <div class="pl-2 border-l border-gray-300 dark:border-gray-600 ml-1">
            <UButton
              icon="i-heroicons-chevron-right"
              variant="ghost"
              color="secondary"
              size="xs"
            />
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
@reference 'tailwindcss';

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded;
}
.no-scrollbar::-webkit-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
