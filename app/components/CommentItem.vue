<script setup lang="ts">
import type {
  CommentResponse,
  UrlResponse,
} from "~~/packages/api/src/types.gen";
import {
  deleteCommentsById,
  getCommentsByCommentIdReplies,
  getStickerSetsStickersByStickerIdImage,
  putCommentsById,
} from "~~/packages/api/src/sdk.gen";

const props = defineProps<{
  comment: CommentResponse;
  articleId: string | number;
  depth?: number;
}>();

const emit = defineEmits<{
  refresh: [];
  reply: [commentId: string | number];
}>();

const userStore = useUserStore();
const toast = useToast();

const isDeleting = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const editContent = ref("");
const showReplies = ref(false);
const replies = ref<CommentResponse[]>([]);
const isLoadingReplies = ref(false);
const regex = /^\[emoji:(\d+):(\d+)]$/;
const sticker = ref<{
  src: string;
  name: string;
} | null>(null);

const displayName = computed(() => {
  const author = props.comment.author;
  if (author && !author.isGuest) return author.username || "用户";
  return author?.username || "匿名用户";
});

const isGuest = computed(() => {
  const author = props.comment.author;
  return !author || author.isGuest;
});

const isOwner = computed(() => {
  if (!userStore.user || isGuest.value) return false;
  return String(userStore.user.id) === String(props.comment.author?.id);
});

// 格式化时间
const timeAgo = (date: string | Date | undefined) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return d.toLocaleDateString("zh-CN");
  } else if (days > 0) {
    return `${days} 天前`;
  } else if (hours > 0) {
    return `${hours} 小时前`;
  } else if (minutes > 0) {
    return `${minutes} 分钟前`;
  } else {
    return "刚刚";
  }
};

// 删除评论
const handleDelete = async () => {
  if (!confirm("确定要删除这条评论吗？")) return;

  isDeleting.value = true;
  try {
    const response = await deleteCommentsById({
      path: { id: String(props.comment.id!) },
    });

    if (!response.error) {
      toast.add({
        title: "评论已删除",
        color: "success",
      });
      emit("refresh");
    } else {
      toast.add({
        title: "删除失败",
        description: "您只能删除自己的评论",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Failed to delete comment:", error);
    toast.add({
      title: "删除失败",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
};

const startEdit = () => {
  editContent.value = props.comment.content || "";
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  editContent.value = "";
};

const handleSaveEdit = async () => {
  if (!editContent.value.trim()) return;
  isSaving.value = true;
  try {
    const response = await putCommentsById({
      path: { id: String(props.comment.id!) },
      body: { content: editContent.value.trim() },
    });
    if (!response.error && response.data) {
      props.comment.content = response.data.content;
      sticker.value = null;
      const match = response.data.content?.match(regex);
      if (match) {
        const imgRes = await getStickerSetsStickersByStickerIdImage({
          path: { stickerId: Number(match[2]) },
        });
        if (!imgRes.error && imgRes.data) {
          sticker.value = { name: "test", src: imgRes.data.url! };
        }
      }
      isEditing.value = false;
      toast.add({ title: "评论已更新", color: "success" });
    } else {
      toast.add({
        title: "修改失败",
        description: "您只能修改自己的评论",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Failed to update comment:", error);
    toast.add({ title: "修改失败", color: "error" });
  } finally {
    isSaving.value = false;
  }
};

// 加载回复
const loadReplies = async () => {
  if (showReplies.value) {
    showReplies.value = false;
    return;
  }

  isLoadingReplies.value = true;
  showReplies.value = true;
  try {
    const response = await getCommentsByCommentIdReplies({
      path: { commentId: String(props.comment.id!) },
    });
    if (!response.error && response.data) {
      replies.value = response.data;
    }
  } catch (error) {
    console.error("Failed to load replies:", error);
  } finally {
    isLoadingReplies.value = false;
  }
};

// 下拉菜单选项
const menuItems = computed(() => {
  const items = [];
  if (isOwner.value) {
    items.push({
      label: "编辑",
      icon: "i-lucide-pencil",
      onSelect: startEdit,
    });
    items.push({
      label: "删除",
      icon: "i-lucide-trash-2",
      onSelect: handleDelete,
    });
  }
  items.push({
    label: "举报",
    icon: "i-lucide-flag",
    onSelect: () => {
      toast.add({ title: "举报功能暂未开放", color: "info" });
    },
  });
  return [items];
});

onMounted(async () => {
  const match = props.comment.content?.match(regex);
  if (match) {
    const response = await getStickerSetsStickersByStickerIdImage({
      path: { stickerId: Number(match[2]) },
    });
    if (response.error || !response.data) return;
    sticker.value = {
      name: "test",
      src: response.data.url!,
    };
  }
});
</script>

<template>
  <div class="comment-item">
    <div class="flex gap-4 py-4 group">
      <UAvatar
        :src="comment.author?.avatar || undefined"
        :alt="displayName"
        size="md"
        class="flex-shrink-0"
      />

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2">
            <span class="font-medium text-sm text-gray-900 dark:text-white">
              {{ displayName }}
            </span>
            <UBadge v-if="isGuest" variant="subtle" color="neutral" size="sm"
              >游客</UBadge
            >
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ timeAgo(comment.createdAt) }}
            </span>
          </div>

          <UDropdownMenu :items="menuItems">
            <UButton
              icon="i-lucide-ellipsis"
              variant="ghost"
              color="neutral"
              size="xs"
              class="opacity-0 group-hover:opacity-100 transition-opacity"
              :loading="isDeleting"
            />
          </UDropdownMenu>
        </div>

        <div v-if="isEditing" class="mb-3 space-y-3">
          <UTextarea v-model="editContent" :rows="3" />
          <div class="flex items-center justify-between">
            <EmojiSelect icon="i-lucide-smile" v-model="editContent" />
            <div class="flex items-center gap-2">
              <UButton
                variant="ghost"
                size="sm"
                @click="cancelEdit"
                :disabled="isSaving"
              >
                取消
              </UButton>
              <UButton
                size="sm"
                :loading="isSaving"
                :disabled="!editContent.trim()"
                @click="handleSaveEdit"
              >
                保存
              </UButton>
            </div>
          </div>
        </div>

        <div
          class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3"
          v-else-if="!sticker"
        >
          {{ comment.content }}
        </div>

        <img :src="sticker?.src" :alt="sticker?.name" v-else-if="!isEditing" />

        <div class="flex items-center gap-4">
          <UButton
            icon="i-lucide-message-circle"
            variant="ghost"
            color="neutral"
            size="xs"
            label="回复"
            @click="emit('reply', comment.id!)"
          />
          <UButton
            v-if="comment.replyCount && Number(comment.replyCount) > 0"
            :icon="
              showReplies ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
            "
            variant="ghost"
            color="neutral"
            size="xs"
            :label="`${comment.replyCount} 条回复`"
            @click="loadReplies"
          />
        </div>

        <!-- 回复列表 -->
        <div
          v-if="showReplies"
          class="mt-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700"
        >
          <div v-if="isLoadingReplies" class="py-4 text-center text-gray-500">
            <UIcon
              name="i-lucide-loader-2"
              class="w-5 h-5 animate-spin inline"
            />
          </div>
          <template v-else-if="replies.length > 0">
            <CommentItem
              v-for="reply in replies"
              :key="reply.id"
              :comment="reply"
              :article-id="articleId"
              :depth="(depth || 0) + 1"
              @refresh="loadReplies"
              @reply="(id) => emit('reply', id)"
            />
          </template>
          <div v-else class="py-4 text-center text-muted text-sm">
            暂无回复
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-item {
  position: relative;
}
</style>
