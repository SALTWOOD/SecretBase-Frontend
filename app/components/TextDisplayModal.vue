<template>
  <UModal v-model:open="isOpen" prevent-close>
    <template #content>
      <UCard
        class="backdrop-blur-xl border-default shadow-2xl bg-default/50"
        :ui="{ body: 'p-6', header: 'p-4 border-b border-default' }"
      >
        <template #header>
          <div class="text-center">
            <div
              class="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
            >
              <UIcon
                name="i-lucide-check-circle"
                class="w-8 h-8 text-green-500"
              />
            </div>
            <h2 class="text-xl font-bold text-highlighted">{{ title }}</h2>
            <p v-if="description" class="text-muted text-sm mt-1">
              {{ description }}
            </p>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-muted mb-2">{{
              label
            }}</label>
            <template v-if="!withCopyButton">
              <span
                class="block w-full px-4 py-3 bg-default/50 border border-default rounded-lg font-mono text-sm text-highlighted break-all"
              >
                {{ text }}
              </span>
            </template>
            <template v-else>
              <div class="relative">
                <input
                  :value="text"
                  type="text"
                  readonly
                  class="w-full px-4 py-3 pr-12 bg-default/50 border border-default rounded-lg font-mono text-sm text-highlighted focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <UButton
                  icon="i-lucide-copy"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  class="absolute right-2 top-1/2 -translate-y-1/2"
                  @click="copyText"
                >
                  {{ copied ? "已复制" : "复制" }}
                </UButton>
              </div>
            </template>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="primary" size="lg" @click="closeModal">
              {{ buttonText }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  description?: string;
  label?: string;
  buttonText?: string;
  withCopyButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "已生成",
  description: "",
  label: "内容",
  buttonText: "关闭",
  withCopyButton: false,
});

const isOpen = ref(false);
const text = ref("");
const copied = ref(false);

const open = (newText: string) => {
  text.value = newText;
  copied.value = false;
  isOpen.value = true;
};

const copyText = async () => {
  try {
    await navigator.clipboard.writeText(text.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy text:", err);
  }
};

const closeModal = () => {
  isOpen.value = false;
};

defineExpose({ open });
</script>
