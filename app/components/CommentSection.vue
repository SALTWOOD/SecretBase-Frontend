<script setup lang="ts">
import type { CommentResponse } from "~~/packages/api/src/types.gen";
import {
  getCommentsArticleByArticleId,
  postComments,
} from "~~/packages/api/src/sdk.gen";
import "@cap.js/widget";

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

const guestNickname = ref("");
const guestEmail = ref("");
const guestWebsite = ref("");
const capToken = ref("");
const capApi = "/api/cap/";

const isGuest = computed(() => !userStore.isLoggedIn);

const canSubmitComment = computed(() => {
  if (!newComment.value.trim()) return false;
  if (isGuest.value && !guestNickname.value.trim()) return false;
  if (isGuest.value && !capToken.value) return false;
  return true;
});

const canSubmitReply = computed(() => {
  if (!replyContent.value.trim()) return false;
  if (isGuest.value && !guestNickname.value.trim()) return false;
  if (isGuest.value && !capToken.value) return false;
  return true;
});

const commentTree = computed(() => {
  return comments.value.filter((c) => !c.parentCommentId);
});

const handleCapSolve = (e: CustomEvent) => {
  capToken.value = e.detail.token;
};

const handleCapReset = () => {
  capToken.value = "";
};

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

const buildBody = (content: string, parentCommentId: number | string | null = null) => {
  const body: Record<string, unknown> = {
    content,
    parentCommentId,
  };
  if (isGuest.value) {
    body.guestNickname = guestNickname.value.trim() || undefined;
    body.guestEmail = guestEmail.value.trim() || undefined;
    body.guestWebsite = guestWebsite.value.trim() || undefined;
    body.captchaToken = capToken.value;
  }
  return body;
};

const afterSubmit = (success: boolean, action: string) => {
  if (!success) {
    toast.add({ title: `${action}失败`, color: "error" });
    return;
  }
  if (isGuest.value) {
    toast.add({ title: `${action}已提交，等待管理员审核`, color: "success" });
  } else {
    toast.add({ title: `${action}已发布`, color: "success" });
    loadComments();
  }
};

const handleSubmit = async () => {
  if (!canSubmitComment.value) return;
  isSubmitting.value = true;
  try {
    const response = await postComments({
      body: buildBody(newComment.value) as any,
      query: { articleId: String(props.articleId) },
    });
    afterSubmit(!response.error && !!response.data, "评论");
    if (!response.error) newComment.value = "";
  } catch (error) {
    console.error("Failed to submit comment:", error);
    toast.add({ title: "发布失败", color: "error" });
  } finally {
    isSubmitting.value = false;
  }
};

const handleReply = async () => {
  if (!canSubmitReply.value || !replyTo.value) return;
  isSubmitting.value = true;
  try {
    const response = await postComments({
      body: buildBody(replyContent.value, replyTo.value.id!) as any,
      query: { articleId: String(props.articleId) },
    });
    afterSubmit(!response.error && !!response.data, "回复");
    if (!response.error) {
      replyContent.value = "";
      replyTo.value = null;
    }
  } catch (error) {
    console.error("Failed to submit reply:", error);
    toast.add({ title: "回复失败", color: "error" });
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
    <div class="border-gray-200 dark:border-gray-800">
      <h2 class="text-xl font-bold mb-4">
        评论
        <span
          v-if="comments.length > 0"
          class="text-sm font-normal text-gray-500 ml-2"
        >
          ({{ comments.length }})
        </span>
      </h2>

      <!-- 已登录用户表单 -->
      <div v-if="!isGuest" class="mb-6">
        <UTextarea
          v-model="newComment"
          placeholder="写下你的评论..."
          :rows="5"
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

      <!-- 游客表单 -->
      <div v-else class="mb-6 space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <UInput
            v-model="guestNickname"
            placeholder="昵称 *"
            icon="i-lucide-user"
          />
          <UInput
            v-model="guestEmail"
            placeholder="邮箱（可选）"
            icon="i-lucide-mail"
            type="email"
          />
          <UInput
            v-model="guestWebsite"
            placeholder="网站（可选）"
            icon="i-lucide-globe"
            type="url"
          />
        </div>
        <UTextarea
          v-model="newComment"
          placeholder="写下你的评论..."
          :rows="5"
        />
        <client-only>
          <div class="cap-wrapper w-full overflow-hidden rounded-lg border border-default bg-muted/20">
            <cap-widget
              :data-cap-api-endpoint="capApi"
              @solve="handleCapSolve"
              @reset="handleCapReset"
            />
          </div>
        </client-only>
        <div class="flex items-center justify-between">
          <UButton to="/auth/login" variant="ghost" size="sm">
            登录后评论
          </UButton>
          <UButton
            :loading="isSubmitting"
            :disabled="!canSubmitComment"
            @click="handleSubmit"
          >
            发表评论
          </UButton>
        </div>
      </div>

      <!-- 回复表单 -->
      <div
        v-if="replyTo"
        class="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
      >
        <div class="flex items-center justify-between mb-3">
          <div>
            <span class="text-sm font-medium text-primary-600 dark:text-primary-400">
              回复 @{{ replyTo.authorUsername || replyTo.guestNickname || "匿名用户" }}
            </span>
            <p class="text-xs text-gray-500 mt-1 line-clamp-1">
              {{ replyTo.content }}
            </p>
          </div>
          <UButton size="xs" variant="ghost" @click="cancelReply">
            取消
          </UButton>
        </div>

        <div v-if="isGuest" class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <UInput
            v-model="guestNickname"
            placeholder="昵称 *"
            icon="i-lucide-user"
          />
          <UInput
            v-model="guestEmail"
            placeholder="邮箱（可选）"
            icon="i-lucide-mail"
            type="email"
          />
          <UInput
            v-model="guestWebsite"
            placeholder="网站（可选）"
            icon="i-lucide-globe"
            type="url"
          />
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
            :disabled="!canSubmitReply"
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
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cap-wrapper {
  --cap-widget-width: 100%;
}
</style>
