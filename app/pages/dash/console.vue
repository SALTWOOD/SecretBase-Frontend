<template>
  <div
    class="flex flex-col h-150 bg-elevated rounded-xl border border-default font-mono shadow-2xl overflow-hidden"
  >
    <div
      ref="outputRef"
      class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar"
    >
      <div v-if="logs.length === 0" class="text-muted italic text-sm">
        Terminal ready. Context: [api, console, ref, reactive]
      </div>

      <!-- 安全警告：控制台可以执行任意JavaScript代码 -->
      <div class="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4">
        <div class="flex items-start gap-2">
          <UIcon name="i-lucide-alert-triangle" class="text-warning w-5 h-5 mt-0.5" />
          <div class="text-xs text-warning">
            <p class="font-bold mb-1">安全警告</p>
            <p>此控制台可以执行任意 JavaScript 代码。仅限开发人员使用，不要在输入框中粘贴来自不受信任来源的代码。</p>
          </div>
        </div>
      </div>

      <div
        v-for="(log, index) in logs"
        :key="index"
        :class="getLogClass(log.type)"
        class="text-sm border-l-2 pl-3 bg-primary/5 py-1"
      >
        <div class="flex justify-between opacity-50 text-[10px] mb-1">
          <span class="font-bold">{{ log.type.toUpperCase() }}</span>
          <span>{{ log.time }}</span>
        </div>
        <pre class="whitespace-pre-wrap break-all leading-relaxed">{{
          log.content
        }}</pre>
      </div>
    </div>

    <div class="p-4 bg-(--ui-bg)/80 border-t border-default backdrop-blur-md">
      <div class="flex gap-2 items-center">
        <span class="text-primary font-bold">$</span>
        <UInput
          v-model="input"
          class="flex-1"
          variant="none"
          placeholder="Execute JS..."
          autocomplete="off"
          @keydown.up.prevent="navigateHistory('up')"
          @keydown.down.prevent="navigateHistory('down')"
          @keyup.enter="executeCode"
        />
        <div class="flex gap-1">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-trash-2"
            @click="logs = []"
          />
          <UButton color="primary" variant="subtle" @click="executeCode"
            >RUN</UButton
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import * as api from "~~/packages/api/src/sdk.gen";

interface Log {
  type: "in" | "out" | "err";
  content: string;
  time: string;
}

const input: Ref<string | undefined> = ref("");
const logs = ref<Log[]>([]);
const outputRef = ref<HTMLElement | null>(null);

const history = ref<string[]>([]);
const historyIndex = ref(-1);

const navigateHistory = (direction: "up" | "down") => {
  if (history.value.length === 0) return;

  if (direction === "up") {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      input.value =
        history.value[history.value.length - 1 - historyIndex.value];
    }
  } else {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      input.value =
        history.value[history.value.length - 1 - historyIndex.value];
    } else {
      historyIndex.value = -1;
      input.value = "";
    }
  }
};

const context = { api, console, ref, reactive };

const executeCode = async () => {
  const code = input.value?.trim();
  if (!code) return;

  history.value.push(code);
  historyIndex.value = -1;

  addLog("in", code);
  input.value = "";

  try {
    const keys = Object.keys(context);
    const values = Object.values(context);

    const fn = new Function(
      ...keys,
      `return (async () => { return ${code} })()`,
    );
    const result = await fn(...values);

    addLog(
      "out",
      typeof result === "object"
        ? JSON.stringify(result, null, 2)
        : String(result),
    );
  } catch (err: any) {
    addLog("err", err.message || String(err));
    console.error(err);
  }

  nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTo({
        top: outputRef.value.scrollHeight,
        behavior: "smooth",
      });
    }
  });
};

const addLog = (type: Log["type"], content: string) => {
  logs.value.push({ type, content, time: new Date().toLocaleTimeString() });
};

const getLogClass = (type: Log["type"]) => {
  return {
    "border-primary/50 text-highlighted": type === "in",
    "border-success/50 text-success": type === "out",
    "border-error/50 text-error": type === "err",
  };
};
</script>

<style scoped>
@reference '~/assets/css/main.css';

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-border rounded;
}
pre {
  font-family: "Fira Code", "Cascadia Code", ui-monospace, monospace;
}
</style>
