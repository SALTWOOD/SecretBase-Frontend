<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Codemirror } from "vue-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  getAdminShortcodes,
  putAdminShortcodesById,
  type ShortcodeDetail,
} from "~~/packages/api/src";

// 1. 状态定义
const route = useRoute();
const extensions = [javascript(), oneDark];
const shortcodes = ref<ShortcodeDetail[]>([]);

// 选中的状态：ID 和 编辑模式
const currentId = ref<number | string | null>(
  (route.query.id as string) || (route.params.id as string) || null,
);
const editMode = ref<"backendCode" | "frontendCode">("backendCode");

const isSaving = ref(false);
const isLoading = ref(true);

// 2. 数据获取
const fetchList = async () => {
  isLoading.value = true;
  try {
    const { data } = await getAdminShortcodes();
    shortcodes.value = data || [];
    if (shortcodes.value.length > 0 && !currentId.value) {
      currentId.value = shortcodes.value[0]!.id ?? null;
    }
  } catch (error) {
    console.error("[Error] Fetch failed:", error);
  } finally {
    isLoading.value = false;
  }
};

// 3. 计算属性
const currentShortcode = computed(() =>
  shortcodes.value.find((s) => s.id == currentId.value),
);

// 直接绑定当前选中的代码字段
const code = computed({
  get: () =>
    currentShortcode.value
      ? (currentShortcode.value[editMode.value] ?? "")
      : "",
  set: (val) => {
    if (currentShortcode.value) {
      currentShortcode.value[editMode.value] = val;
    }
  },
});

// 4. 操作方法
const selectItem = (
  id: number | string,
  mode: "backendCode" | "frontendCode",
) => {
  currentId.value = id;
  editMode.value = mode;
};

const saveCode = async () => {
  if (!currentId.value || !currentShortcode.value) return;
  isSaving.value = true;
  try {
    await putAdminShortcodesById({
      path: { id: currentId.value as number },
      body: {
        backendCode: currentShortcode.value.backendCode,
        frontendCode: currentShortcode.value.frontendCode,
        displayName: currentShortcode.value.displayName,
      },
    });
    console.info(`[Log] Sync successful for ID: ${currentId.value}`);
  } catch (error) {
    console.error("[Error] Sync failed:", error);
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => fetchList());
</script>

<template>
  <div
    class="flex h-screen flex-col overflow-hidden bg-[#282c34] text-gray-200 font-sans text-sm"
  >
    <header
      class="flex h-12 items-center justify-between border-b border-gray-700 px-4 shrink-0 bg-[#21252b]"
    >
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-code-2" class="h-5 w-5 text-primary" />
        <span class="font-bold tracking-tight">简码编辑器</span>
        <div
          v-if="currentShortcode"
          class="flex items-center gap-1 ml-4 opacity-60"
        >
          <UIcon name="i-lucide-chevron-right" class="w-3 h-3" />
          <span class="text-xs font-mono">{{ currentShortcode.name }}</span>
          <UIcon name="i-lucide-chevron-right" class="w-3 h-3" />
          <span class="text-xs text-primary">{{
            editMode === "backendCode" ? "backend.js" : "frontend.js"
          }}</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          icon="i-lucide-cloud-upload"
          label="Deploy Changes"
          variant="solid"
          :loading="isSaving"
          @click="saveCode"
        />
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside
        class="w-72 border-r border-gray-700 bg-[#21252b] flex flex-col shrink-0"
      >
        <div class="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <h3
            class="text-[10px] font-bold uppercase text-gray-500 mb-4 tracking-[0.2em]"
          >
            Project Explorer
          </h3>

          <nav class="space-y-4">
            <template v-if="isLoading">
              <USkeleton
                v-for="i in 4"
                :key="i"
                class="h-16 w-full bg-gray-800/40"
              />
            </template>

            <div v-for="item in shortcodes" :key="item.id" class="space-y-1">
              <div
                class="px-2 py-1 flex items-center gap-2 text-gray-400 group cursor-default"
              >
                <UIcon name="i-lucide-folder-code" class="w-4 h-4 opacity-50" />
                <span class="text-[11px] font-semibold truncate">{{
                  item.displayName || item.name
                }}</span>
              </div>

              <button
                @click="selectItem(item.id!, 'backendCode')"
                :class="[
                  'w-full flex items-center gap-3 px-6 py-1.5 text-xs transition-colors rounded-md',
                  currentId == item.id && editMode === 'backendCode'
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300',
                ]"
              >
                <UIcon name="i-lucide-server" class="w-3.5 h-3.5" />
                <span class="font-mono">backend.js</span>
              </button>

              <button
                @click="selectItem(item.id!, 'frontendCode')"
                :class="[
                  'w-full flex items-center gap-3 px-6 py-1.5 text-xs transition-colors rounded-md',
                  currentId == item.id && editMode === 'frontendCode'
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300',
                ]"
              >
                <UIcon name="i-lucide-layout-template" class="w-3.5 h-3.5" />
                <span class="font-mono">frontend.js</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <main class="flex-1 relative bg-[#282c34]">
        <ClientOnly>
          <Codemirror
            v-model="code"
            :placeholder="`// Start coding ${editMode}...`"
            :style="{ height: '100%', fontSize: '13px' }"
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="2"
            :extensions="extensions"
          />
        </ClientOnly>
      </main>
    </div>

    <footer
      class="h-8 border-t border-gray-700 px-4 flex items-center justify-between text-[10px] text-gray-500 bg-[#1c1f24] shrink-0 font-mono"
    >
      <div class="flex gap-4 items-center">
        <span class="flex items-center gap-1.5 text-emerald-500/80">
          <div class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
          SANDBOX_READY
        </span>
        <span>ENC: UTF-8</span>
      </div>
      <div v-if="currentShortcode" class="opacity-50">
        POS: {{ code.length }} chars | MODE: {{ editMode }}
      </div>
    </footer>
  </div>
</template>

<style scoped>
:deep(.cm-editor) {
  outline: none !important;
}
:deep(.cm-scroller) {
  font-family: "JetBrains Mono", "Fira Code", monospace;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #3e4451;
  border-radius: 10px;
}
</style>
