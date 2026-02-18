<script setup lang="ts">
import type { CommentResponse } from "~~/packages/api/src/types.gen";
import { getCommentsArticleByArticleId, postComments } from "~~/packages/api/src/sdk.gen";

const props = defineProps<{
  articleId: string | number;
}>();

const emit = defineEmits<{
  commentCountChange: [count: number];
}>();

const userStore = useUserStore();
const toast = useToast();

const comments = ref<CommentResponse[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const newComment = ref("");
const replyTo = ref<string | number | null>(null);
const replyContent = ref("");

const loadComments = async () => {
  isLoading.value = true;
  try {
    const response = await getCommentsArticleByArticleId({
      path: { articleId: props.articleId },
    });
    if (!response.error && response.data) {
      comments.value = response.data;
      emit("commentCountChange", response.data.length);
    }
  } catch (error) {
    console.error("Failed to load comments:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleSubmit = async () => {
  if (!newComment.value.trim()) return;
  if (!userStore.isLoggedIn) {
    toast.add({
      title: "请先登录",
      description: "登录后才能发表评论",
      color: "warning",
    });
    return;
  }

  isSubmitting.value = true;
  try {
    const response = await postComments({
      body: {
        content: newComment.value,
        parentCommentId: null,
      },
      query: {
        articleId: props.articleId,
      },
    });

    if (!response.error && response.data) {
      toast.add({
        title: "评论已发布",
        color: "success",
      });
      newComment.value = "";
      await loadComments();
    }
  } catch (error) {
    console.error("Failed to submit comment:", error);
    toast.add({
      title: "发布失败",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleReply = async (commentId: string | number) => {
  if (!replyContent.value.trim()) return;
  if (!userStore.isLoggedIn) {
    toast.add({
      title: "请先登录",
      description: "登录后才能回复评论",
      color: "warning",
    });
    return;
  }

  isSubmitting.value = true;
  try {
    const response = await postComments({
      body: {
        content: replyContent.value,
        parentCommentId: commentId,
      },
      query: {
        articleId: props.articleId,
      },
    });

    if (!response.error && response.data) {
      toast.add({
        title: "回复已发布",
        color: "success",
      });
      replyContent.value = "";
      replyTo.value = null;
      await loadComments();
    }
  } catch (error) {
    console.error("Failed to submit reply:", error);
    toast.add({
      title: "回复失败",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleReplyClick = (commentId: string | number) => {
  replyTo.value = commentId;
};

const cancelReply = () => {
  replyTo.value = null;
  replyContent.value = "";
};

onMounted(loadComments);
</script>

<template>
  <div class="comment-section">
    <div class="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
      <h2 class="text-xl font-bold mb-4">
        评论
        <span v-if="comments.length > 0" class="text-sm font-normal text-gray-500 ml-2">
          ({{ comments.length }})
        </span>
      </h2>

      <!-- 新评论表单 -->
      <div v-if="userStore.isLoggedIn" class="mb-6">
        <UTextarea
          v-model="newComment"
          placeholder="写下你的评论..."
          :rows="3"
          class="mb-3"
        />
        <div class="flex justify-end">
          <UButton
            :loading="isSubmitting"
            :disabled="!newComment.trim()"
            @click="handleSubmit"
          >
            发表评论
          </UButton>
        </div>
      </div>

      <div v-else class="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
        <p class="text-gray-600 dark:text-gray-400 mb-3">
          登录后参与讨论
        </p>
        <UButton to="/auth/login" variant="ghost">
          前往登录
        </UButton>
      </div>

      <!-- 回复表单 -->
      <div v-if="replyTo" class="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-primary-600 dark:text-primary-400">
            回复评论
          </span>
          <UButton size="xs" variant="ghost" @click="cancelReply">
            取消
          </UButton>
        </div>
        <UTextarea
          v-model="replyContent"
          placeholder="写下你的回复..."
          :rows="3"
          class="mb-3"
        />
        <div class="flex justify-end">
          <UButton
            :loading="isSubmitting"
            :disabled="!replyContent.trim()"
            @click="handleReply(replyTo)"
          >
            发表回复
          </UButton>
        </div>
      </div>

      <!-- 评论列表 -->
      <div v-if="isLoading" class="text-center py-8 text-gray-500">
        加载评论中...
      </div>

      <div v-else-if="comments.length === 0" class="text-center py-8 text-gray-500">
        <UIcon name="i-heroicons-chat-bubble-left-right" class="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>暂无评论，快来抢沙发吧！</p>
      </div>

      <div v-else class="space-y-0">
        <CommentItem
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          :article-id="articleId"
          @refresh="loadComments"
          @reply="handleReplyClick"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-section {
  max-width: 768px;
}
</style>
