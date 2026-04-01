<script setup lang="ts">
import {
  MdEditor,
  NormalToolbar,
  type Themes,
  type ToolbarNames,
  type ExposeParam,
} from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import type { EditorPlugin } from "~/types/editor-plugins/base";
import { StorageSelectPlugin } from "~/types/editor-plugins/storage-select";
import { postAdminFileShares } from "~~/packages/api/src";

const props = defineProps<{
  modelValue: string;
  disabled?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "save"): void;
}>();

const colorMode = useColorMode();
const editorRef = ref<ExposeParam | null>(null);
const fileSelectState = ref(false);

const plugins = ref<EditorPlugin[]>([
  new StorageSelectPlugin(() => {
    fileSelectState.value = true;
  }),
]);

const handleFileSelected = async (url: string) => {
  if (!url || !editorRef.value) return;

  const urlObject = new URL(url);
  const key = decodeURI(urlObject.pathname).substring(1);
  const bucket = urlObject.hostname;
  const fileName = key.split("/").filter(Boolean).pop() || "";

  const response = await postAdminFileShares({
    body: {
      bucket,
      key,
      fileName,
      remarks: `Auto-shared by MarkdownEditor at ${new Date().toLocaleString()}`,
    },
  });

  if (response.error || !response.data) return;
  const file = `/api/v1/shared/${response.data.shortId}`;

  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(urlObject);
  const insertText = isImage ? `![image](${file})` : `[文件](${file})`;

  editorRef.value.insert(() => ({
    targetValue: insertText,
    select: true,
    deviationStart: 0,
    deviationEnd: 0,
  }));

  fileSelectState.value = false;
};

const theme = computed<Themes>(() =>
  colorMode.value === "dark" ? "dark" : "light",
);

const content = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const toolbars = computed<ToolbarNames[]>(() => [
  "bold",
  "underline",
  "italic",
  "-",
  "title",
  "strikeThrough",
  "sub",
  "sup",
  "quote",
  "unorderedList",
  "orderedList",
  "task",
  "-",
  "codeRow",
  "code",
  "link",
  "image",
  "table",
  "mermaid",
  "katex",
  "-",
  "revoke",
  "next",
  "save",
  "-",
  ...Array.from({ length: plugins.value.length }, (_, i) => i as ToolbarNames),
  "=",
  "pageFullscreen",
  "fullscreen",
  "preview",
  "previewOnly",
  "htmlPreview",
  "catalog",
  "github",
]);
</script>

<template>
  <ClientOnly>
    <MdEditor
      ref="editorRef"
      v-model="content"
      :theme="theme"
      :disabled="disabled"
      :placeholder="placeholder || '请开始你的创作...'"
      :toolbars="toolbars"
      class="min-h-[70vh] border-none!"
      @on-save="emit('save')"
    >
      <template #defToolbars>
        <template v-for="(plugin, index) in plugins" :key="index">
          <NormalToolbar
            :title="plugin.title"
            @click="plugin.execute(editorRef)"
          >
            <div class="flex items-center justify-center size-6">
              <UIcon :name="plugin.icon" class="size-4" />
            </div>
          </NormalToolbar>
        </template>
      </template>
    </MdEditor>

    <template #fallback>
      <div class="h-[70vh] flex items-center justify-center">
        <UIcon
          name="i-lucide-refresh-cw"
          class="animate-spin size-8 text-primary"
        />
      </div>
    </template>
  </ClientOnly>

  <StorageFileSelect
    v-model="fileSelectState"
    selectionMode="file"
    @select="handleFileSelected"
  />
</template>
