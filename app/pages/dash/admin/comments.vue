<template>
  <div class="view-content">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-2xl font-bold text-highlighted tracking-tight">
          评论管理
        </h1>
        <p class="text-muted text-sm mt-1">
          审核游客评论并管理所有评论
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="subtle"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          @click="refresh"
        >
          刷新
        </UButton>
      </div>
    </div>

    <UCard class="mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <USelectMenu
          v-model="selectedStatus"
          :items="statusOptions"
          class="w-40"
        />
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-rotate-ccw"
          @click="resetFilters"
        />
      </div>
    </UCard>

    <UCard>
      <UTable :data="comments" :columns="columns" :loading="loading">
        <template #author-cell="{ row }">
          <div class="flex items-center gap-2">
            <span class="text-sm">
              {{ getDisplayName(row.original) }}
            </span>
            <UBadge
              v-if="isGuest(row.original)"
              variant="subtle"
              color="neutral"
              size="sm"
            >
              游客
            </UBadge>
          </div>
        </template>

        <template #content-cell="{ row }">
          <div class="max-w-md truncate text-sm">
            {{ row.original.content }}
          </div>
        </template>

        <template #articleId-cell="{ row }">
          <UButton
            variant="ghost"
            size="sm"
            :to="`/articles/${row.original.articleId}`"
          >
            #{{ row.original.articleId }}
          </UButton>
        </template>

        <template #reviewStatus-cell="{ row }">
          <UBadge
            :color="statusColorMap[row.original.reviewStatus ?? 0]"
            variant="subtle"
            size="md"
          >
            {{ statusLabelMap[row.original.reviewStatus ?? 0] }}
          </UBadge>
        </template>

        <template #createdAt-cell="{ row }">
          <span class="text-sm text-gray-500">
            {{ formatTime(row.original.createdAt) }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex gap-1">
            <UButton
              v-if="row.original.reviewStatus !== 1"
              icon="i-lucide-check"
              variant="ghost"
              color="success"
              size="xs"
              :loading="approvingId === row.original.id"
              @click="handleApprove(row.original)"
            >
              批准
            </UButton>
            <UButton
              v-if="row.original.reviewStatus !== 0"
              icon="i-lucide-clock"
              variant="ghost"
              color="warning"
              size="xs"
              :loading="pendingId === row.original.id"
              @click="handlePend(row.original)"
            >
              挂起
            </UButton>
            <UButton
              v-if="row.original.reviewStatus !== 2"
              icon="i-lucide-x"
              variant="ghost"
              color="error"
              size="xs"
              :loading="rejectingId === row.original.id"
              @click="handleReject(row.original)"
            >
              拒绝
            </UButton>
          </div>
        </template>
      </UTable>

      <div class="mt-4 flex justify-center">
        <UPagination
          v-model:page="page.page"
          :total="page.total"
          :items-per-page="page.size"
        />
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import type { AdminCommentResponse } from "~~/packages/api/src/types.gen";
import {
  getAdminComments,
  putAdminCommentsByIdApprove,
  putAdminCommentsByIdPend,
  putAdminCommentsByIdReject,
} from "~~/packages/api/src/sdk.gen";

enum ReviewStatusFilter {
  All = "全部状态",
  Pending = "待审核",
  Approved = "已通过",
  Rejected = "已拒绝",
}

const statusOptions = Object.values(ReviewStatusFilter)

const statusColorMap: Record<number, "warning" | "success" | "error"> = {
  0: "warning",
  1: "success",
  2: "error",
}

const statusLabelMap: Record<number, string> = {
  0: "待审核",
  1: "已通过",
  2: "已拒绝",
}

const statusToNumber: Record<string, number | undefined> = {
  "全部状态": undefined,
  "待审核": 0,
  "已通过": 1,
  "已拒绝": 2,
}

const toast = useToast()
const loading = ref(false)
const selectedStatus = ref(ReviewStatusFilter.All)
const comments = ref<AdminCommentResponse[]>([])
const approvingId = ref<number | string | null>(null)
const pendingId = ref<number | string | null>(null)
const rejectingId = ref<number | string | null>(null)

const page = ref({
  page: 1,
  size: 20,
  total: 0,
})

const columns = [
  { accessorKey: "content", header: "内容" },
  { accessorKey: "author", header: "作者" },
  { accessorKey: "articleId", header: "文章" },
  { accessorKey: "reviewStatus", header: "状态" },
  { accessorKey: "createdAt", header: "时间" },
  { accessorKey: "actions", header: "操作" },
]

const getDisplayName = (comment: AdminCommentResponse) => {
  return comment.author?.username || "匿名用户"
}

const isGuest = (comment: AdminCommentResponse) => {
  return !comment.author || comment.author.isGuest
}

const formatTime = (date: string | Date | undefined) => {
  if (!date) return ""
  const d = new Date(date)
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const resetFilters = () => {
  selectedStatus.value = ReviewStatusFilter.All
  page.value.page = 1
}

const refresh = async () => {
  loading.value = true
  try {
    const statusNum = statusToNumber[selectedStatus.value]
    const response = await getAdminComments({
      query: {
        page: page.value.page,
        pageSize: page.value.size,
        ...(statusNum !== undefined ? { status: statusNum } : {}),
      },
    })
    if (!response.error) {
      comments.value = (response.data as AdminCommentResponse[]) || []
      page.value.total = parseInt(
        response.response.headers.get("x-total-count") || "0",
        10,
      )
    }
  } catch (e) {
    toast.add({ title: "刷新失败", color: "error" })
  } finally {
    loading.value = false
  }
}

const handleApprove = async (comment: AdminCommentResponse) => {
  approvingId.value = comment.id!
  try {
    const response = await putAdminCommentsByIdApprove({
      path: { id: comment.id! },
    })
    if (!response.error) {
      toast.add({ title: "已批准该评论", color: "success" })
      await refresh()
    } else {
      toast.add({ title: "操作失败", color: "error" })
    }
  } catch {
    toast.add({ title: "操作失败", color: "error" })
  } finally {
    approvingId.value = null
  }
}

const handlePend = async (comment: AdminCommentResponse) => {
  pendingId.value = comment.id!
  try {
    const response = await putAdminCommentsByIdPend({
      path: { id: comment.id! },
    })
    if (!response.error) {
      toast.add({ title: "已挂起该评论", color: "success" }) // 真不知道这句该怎么描述
      await refresh()
    } else {
      toast.add({ title: "操作失败", color: "error" })
    }
  } catch {
    toast.add({ title: "操作失败", color: "error" })
  } finally {
    pendingId.value = null
  }
}

const handleReject = async (comment: AdminCommentResponse) => {
  rejectingId.value = comment.id!
  try {
    const response = await putAdminCommentsByIdReject({
      path: { id: comment.id! },
    })
    if (!response.error) {
      toast.add({ title: "已拒绝该评论", color: "success" })
      await refresh()
    } else {
      toast.add({ title: "操作失败", color: "error" })
    }
  } catch {
    toast.add({ title: "操作失败", color: "error" })
  } finally {
    rejectingId.value = null
  }
}

watch(() => page.value.page, () => refresh())
watch(selectedStatus, () => {
  page.value.page = 1
  refresh()
})
onMounted(refresh)
</script>

<style scoped>
@reference "~/assets/css/main.css";

:deep(table) {
  @apply text-sm;
}
</style>
