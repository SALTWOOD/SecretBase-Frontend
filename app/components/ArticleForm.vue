<script setup lang="ts">
interface ArticleData {
  title: string;
  content: string;
  status: "draft" | "published";
}

const props = defineProps<{
  initialData?: ArticleData;
  isSubmitting?: boolean;
}>();

const emit = defineEmits(["submit"]);

// Initialize form state
const state = reactive<ArticleData>({
  title: props.initialData?.title || "",
  content: props.initialData?.content || "",
  status: props.initialData?.status || "draft",
});

const handleSubmit = () => {
  console.log("Submitting form data:", toRaw(state));
  emit("submit", state);
};
</script>

<template>
  <UForm :state="state" class="space-y-4" @submit="handleSubmit">
    <UFormGroup label="Title" name="title" required>
      <UInput v-model="state.title" placeholder="Enter article title..." />
    </UFormGroup>

    <UFormGroup label="Status" name="status">
      <USelect v-model="state.status" :options="['draft', 'published']" />
    </UFormGroup>

    <UFormGroup label="Content" name="content">
      <UTextarea
        v-model="state.content"
        :rows="10"
        placeholder="Write your story..."
      />
    </UFormGroup>

    <div class="flex justify-end gap-3">
      <UButton variant="outline" to="/articles">Cancel</UButton>
      <UButton type="submit" :loading="isSubmitting" color="primary"
        >Save Article</UButton
      >
    </div>
  </UForm>
</template>
