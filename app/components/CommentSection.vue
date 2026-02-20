<script setup lang="ts">
import type { CommentResponse } from "~~/packages/api/src/types.gen";
import {
  getCommentsArticleByArticleId,
  postComments,
} from "~~/packages/api/src/sdk.gen";

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
const replyTo = ref<CommentResponse | null>(null);
const replyContent = ref("");

// 构建评论树结构
const commentTree = computed(() => {
  const rootComments = comments.value.filter((c) => !c.parentCommentId);
  return rootComments;
});

const loadComments = async () => {
  isLoading.value = true;
  try {
    const response = await getCommentsArticleByArticleId({
      path: { articleId: String(props.articleId) },
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
        articleId: String(props.articleId),
      },
    });

    if (!response.error && response.data) {
      toast.add({
        title: "评论已发布",
        color: "success",
      });
      newComment.value = "";
      await loadComments();
    } else {
      toast.add({
        title: "发布失败",
        color: "error",
      });
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

const handleReply = async () => {
  if (!replyContent.value.trim()) return;
  if (!userStore.isLoggedIn) {
    toast.add({
      title: "请先登录",
      description: "登录后才能回复评论",
      color: "warning",
    });
    return;
  }

  if (!replyTo.value) return;

  isSubmitting.value = true;
  try {
    const response = await postComments({
      body: {
        content: replyContent.value,
        parentCommentId: replyTo.value.id!,
      },
      query: {
        articleId: String(props.articleId),
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
    } else {
      toast.add({
        title: "回复失败",
        color: "error",
      });
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
  const comment = comments.value.find((c) => c.id === commentId);
  if (comment) {
    replyTo.value = comment;
    replyContent.value = "";
  }
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
        <span
          v-if="comments.length > 0"
          class="text-sm font-normal text-gray-500 ml-2"
        >
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

      <div
        v-else
        class="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center"
      >
        <p class="text-gray-600 dark:text-gray-400 mb-3">登录后参与讨论</p>
        <UButton to="/auth/login" variant="ghost"> 前往登录 </UButton>
      </div>

      <!-- 回复表单 -->
      <div
        v-if="replyTo"
        class="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
      >
        <div class="flex items-center justify-between mb-3">
          <div>
            <span
              class="text-sm font-medium text-primary-600 dark:text-primary-400"
            >
              回复 @{{ replyTo.authorUsername || "匿名用户" }}
            </span>
            <p class="text-xs text-gray-500 mt-1 line-clamp-1">
              {{ replyTo.content }}
            </p>
          </div>
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
            @click="handleReply"
          >
            发表回复
          </UButton>
        </div>
      </div>

      <!-- 评论列表 -->
      <div v-if="isLoading" class="text-center py-8 text-gray-500">
        <UIcon
          name="i-lucide-loader-2"
          class="w-6 h-6 animate-spin inline mb-2"
        />
        <p>加载评论中...</p>
      </div>

      <div
        v-else-if="comments.length === 0"
        class="text-center py-8 text-gray-500"
      >
        <UIcon
          name="i-lucide-message-square"
          class="w-12 h-12 mx-auto mb-2 opacity-50"
        />
        <p>暂无评论，快来抢沙发吧！</p>
      </div>

      <div
        v-else
        class="space-y-0 divide-y divide-gray-100 dark:divide-gray-800"
      >
        <CommentItem
          v-for="comment in commentTree"
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

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
