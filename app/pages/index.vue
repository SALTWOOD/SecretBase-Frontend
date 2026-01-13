<template>
    <div class="min-h-screen bg-slate-950 text-white selection:bg-pink-500/30">

        <nav class="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
            <UContainer class="flex items-center justify-between h-16">
                <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-bolt-20-solid" class="w-6 h-6 text-pink-500" />
                    <span class="text-lg font-bold tracking-tight">Secret Base</span>
                </div>

                <div class="flex items-center gap-4">
                    <UButton variant="ghost" color="neutral" icon="i-simple-icons-github" to="https://github.com"
                        target="_blank" />
                    <UButton color="primary" variant="solid" class="font-bold shadow-lg shadow-pink-500/20"
                        to="/dashboard">
                        控制台
                        <UIcon name="i-heroicons-arrow-right-20-solid" />
                    </UButton>
                </div>
            </UContainer>
        </nav>

        <main class="relative overflow-hidden pt-20 pb-32">
            <div
                class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-pink-500/10 blur-[120px] rounded-full -z-10">
            </div>

            <UContainer class="text-center">
                <div
                    class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-medium mb-8">
                    <span class="relative flex h-2 w-2">
                        <span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                    </span>
                    v0.1 Beta Version / 测试版本
                </div>

                <h1 class="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">
                    我们正在运行<br />
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                        秘密基地服务
                    </span>
                </h1>

                <p class="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl mb-10 leading-relaxed">
                    通过 ASP.NET Core 与 Nuxt 4 强力驱动，为您提供安全、稳定的私人服务托管与邀请管理。
                </p>

                <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <UButton size="xl" color="primary" class="px-8 font-bold" to="/register">
                        开始使用
                        <UIcon name="i-heroicons-paper-airplane" />
                    </UButton>
                    <UButton size="xl" color="neutral" variant="ghost"
                        class="px-8 border border-slate-700 hover:bg-slate-800" to="/docs">
                        查看文档
                        <UIcon name="i-heroicons-book-open" />
                    </UButton>
                </div>
            </UContainer>
        </main>

    </div>
</template>

<style scoped>
/* 模拟图片中的深色网格背景效果 */
.bg-slate-950 {
    background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 40px 40px;
}
</style>