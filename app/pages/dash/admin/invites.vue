<template>
  <div class="view-content">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">邀请码管理</h1>
        <p class="text-slate-400 text-sm">生成并分发注册邀请码</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus">生成新券码</UButton>
    </div>

    <UCard class="glass-card">
      <UTable :rows="inviteCodes" :columns="columns" />
    </UCard>
  </div>
</template>

<script setup>
const columns = [
  { accessorKey: 'code', header: '券码' },
  { accessorKey: 'usedBy', header: '使用者' },
  { accessorKey: 'createdAt', header: '创建时间' }
]

const inviteCodes = [
  { code: 'BASE-X7Y2-99B', usedBy: 'None', createdAt: '2026-01-15' }
]
</script>