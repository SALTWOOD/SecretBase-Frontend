<script setup lang="ts">
import { MdEditor, NormalToolbar, DropdownToolbar, type Themes, type ToolbarNames } from "md-editor-v3";
import "md-editor-v3/lib/style.css";

interface ToolConfig {
  id: number;
  name: string;
  title: string;
  icon: string;
  dropdownVisible?: boolean;
  type: 'button' | 'dropdown';
  onClick: (payload?: string) => void;
  options?: ToolOption[];
}

interface ToolOption {
  label: string;
  value: string;
}

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

const customTools = ref<ToolConfig[]>([
  // {
  //   id: 0,
  //   name: 'ai-optimize',
  //   title: 'AI 润色',
  //   icon: 'i-lucide-sparkles',
  //   type: 'button',
  //   onClick: () => alert("你润你妈呢")
  // },
  // {
  //   id: 1,
  //   name: 'ai-rewrite',
  //   title: 'AI 深度重写',
  //   icon: 'i-lucide-refresh-cw',
  //   type: 'dropdown',
  //   onClick: (payload) => {
  //     const messages: Record<string, string> = {
  //       'complain': '别写了，这垃圾文章没救了。',
  //       'professional': '经过 AI 的深度分析，建议您转行。',
  //       'shorten': '删了吧，一个字都别留。'
  //     };
  //     alert(messages[payload!] || "你在点什么呢？");
  //   },
  //   options: [
  //     { label: '抱怨模式', value: 'complain' },
  //     { label: '专业建议', value: 'professional' },
  //     { label: '极简压缩', value: 'shorten' }
  //   ]
  // },
]);

const theme = computed<Themes>(() => (colorMode.value === "dark" ? "dark" : "light"));

const content = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const toolbars = computed<ToolbarNames[]>(() => [
  'bold', 'underline', 'italic', '-',
  'title', 'strikeThrough', 'sub', 'sup', 'quote', 'unorderedList', 'orderedList', 'task', '-',
  'codeRow', 'code', 'link', 'image', 'table', 'mermaid', 'katex', '-',
  'revoke', 'next', 'save',
  '-', // For custom tools, insert below this line
  ...customTools.value.map(i => i.id as ToolbarNames),
  '=',
  'pageFullscreen', 'fullscreen', 'preview', 'previewOnly', 'htmlPreview', 'catalog', 'github',
]);

function handleAction(tool: ToolConfig, payload?: string) {
  tool.onClick?.(payload);
}

</script>

<template>
  <ClientOnly>
    <MdEditor
      v-model="content"
      :theme="theme"
      :disabled="disabled"
      :placeholder="placeholder || '请开始你的创作...'"
      :toolbars="toolbars"
      class="min-h-[70vh] border-none!"
      @on-save="emit('save')"
    >
      <template #defToolbars>
        <template v-for="tool in customTools" :key="tool.id">
          <NormalToolbar
            v-if="tool.type === 'button'"
            :title="tool.title"
            @click="handleAction(tool)"
          >
            <div class="flex items-center justify-center size-6">
              <Icon :name="tool.icon" />
            </div>
          </NormalToolbar>

          <DropdownToolbar
            v-else-if="tool.type === 'dropdown'"
            :title="tool.title"
            :visible="tool.dropdownVisible"
            :onChange="(v) => tool.dropdownVisible = v"
          >
            <div class="flex items-center justify-center size-6">
              <Icon :name="tool.icon" />
            </div>
            <template #overlay>
              <div>
                <ul class="md-editor-menu" role="menu">
                  <li
                    v-for="opt in tool.options"
                    :key="opt.value"
                    class="md-editor-menu-item"
                    role="menuitem"
                    tabindex="0"
                    @click="handleAction(tool, opt.value)"
                  >
                    <span>{{ opt.label }}</span>
                  </li>
                </ul>
              </div>
            </template>
          </DropdownToolbar>
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
</template>
