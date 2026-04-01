<script setup lang="ts">
import {
  deleteAdminSettingsByKey,
  getAdminSettings,
  putAdminSettingsByKey,
  type SettingListItem,
} from "~~/packages/api/src";

const i18nMap: Record<
  string,
  { label: string; description?: string; icon?: string }
> = {
  "site.seo": { label: "SEO", icon: "i-lucide-search" },
  "site.security": { label: "安全与隐私", icon: "i-lucide-shield-check" },
  "site.user": { label: "用户管理", icon: "i-lucide-users" },
  "site.home": { label: "首页定制", icon: "i-lucide-layout-template" },
  "site.footer": { label: "页脚配置", icon: "i-lucide-panel-bottom" },
  "site.seo.general": { label: "常规 SEO" },
  "site.seo.general.title": {
    label: "站点标题",
    description: "浏览器标签页显示的文字",
  },
  "site.seo.general.description": {
    label: "站点描述",
    description: "用于搜索引擎检索的简短介绍",
  },
  "site.seo.general.keywords": {
    label: "关键词",
    description: "多个关键词请使用英文逗号分隔",
  },
  "site.seo.general.robots": {
    label: "Robots 协议",
    description: "控制搜索引擎爬虫的抓取行为 (index, follow)",
  },
  "site.seo.og": { label: "社交分享 (OpenGraph)" },
  "site.seo.og.title": {
    label: "分享标题",
    description: "社交媒体分享时显示的标题",
  },
  "site.seo.og.description": {
    label: "分享描述",
    description: "社交媒体分享时显示的详情文字",
  },
  "site.seo.og.image": {
    label: "分享预览图",
    description: "社交媒体分享时显示的图片 URL",
  },
  "site.seo.social": { label: "社交媒体卡片" },
  "site.seo.social.twitter_card": {
    label: "Twitter 卡片类型",
    description: "定义推文分享时的展示布局",
  },
  "site.security.cookie": { label: "Cookie 安全" },
  "site.security.cookie.auto_renew": {
    label: "自动续期",
    description: "用户活跃时自动延长登录状态",
  },
  "site.security.cookie.expire_hours": {
    label: "有效期 (小时)",
    description: "登录状态保持的时长",
  },
  "site.user.registration": { label: "注册设置" },
  "site.user.registration.enabled": {
    label: "开放注册",
    description: "是否允许新用户注册账号",
  },
  "site.user.registration.force_invitation": {
    label: "强制邀请码",
    description: "注册时是否必须填写邀请码",
  },
  "site.home.background": { label: "背景展示" },
  "site.home.background.url": {
    label: "图片地址",
    description: "背景图的远程或本地链接",
  },
  "site.home.background.blur": {
    label: "模糊度 (px)",
    description: "背景图的高斯模糊程度",
  },
  "site.home.background.opacity": {
    label: "不透明度",
    description: "范围 0.0 到 1.0",
  },
  "site.home.banner": { label: "横幅通告" },
  "site.home.banner.content": {
    label: "内容文本",
    description: "首页醒目位置显示的文字",
  },
  "site.home.banner.display_mode": {
    label: "显示模式",
    description: "控制横幅的视觉覆盖范围 (full/screen)",
  },
  "site.footer.beian": { label: "备案与合规" },
  "site.footer.beian.icp": {
    label: "ICP 备案号",
    description: "例如：京ICP备XXXXXXXX号",
  },
  "site.footer.beian.police": {
    label: "公安备案号",
    description: "网站底部的公安联网备案信息",
  },
};

const rawSettings = ref<SettingListItem[]>([]);
const loading = ref(false);
const editableSettings = ref<Record<string, any>>({});

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await getAdminSettings();
    if (response.error || !response.data)
      throw new Error("Unable to fetch site settings.");
    rawSettings.value = response.data;
    response.data.forEach((item) => {
      editableSettings.value[item.key] = item.currentValue;
    });
  } catch (error) {
    console.error("[Settings]: Failed to fetch settings", error);
  } finally {
    loading.value = false;
  }
};

const groupedSettings = computed(() => {
  const groups: Record<string, any> = {};
  rawSettings.value.forEach((item) => {
    const parts = item.key.split(".");
    const tabKey = parts.slice(0, 2).join(".");
    const cardKey = parts[2] || "general";

    if (!groups[tabKey]) groups[tabKey] = {};
    if (!groups[tabKey][cardKey]) groups[tabKey][cardKey] = [];
    groups[tabKey][cardKey].push(item);
  });
  return groups;
});

const tabs = computed(() => {
  return Object.keys(groupedSettings.value).map((key) => ({
    label: i18nMap[key]?.label || key,
    icon: i18nMap[key]?.icon || "i-lucide-settings",
    slot: key.replace(/\./g, "_"),
  }));
});

const getSubKeyLabel = (key: string) => {
  if (i18nMap[key]?.label) return i18nMap[key].label;
  const parts = key.split(".");
  if (parts.length > 3) return parts.slice(3).join(" > ");
  return parts[parts.length - 1];
};

const getCardLabel = (tabKey: string, cardKey: string) => {
  const fullCardKey = `${tabKey}.${cardKey}`;
  return i18nMap[fullCardKey]?.label || cardKey.toUpperCase();
};

const isModified = (item: SettingListItem) =>
  editableSettings.value[item.key] !== item.currentValue;

const handleReset = async (item: SettingListItem) => {
  editableSettings.value[item.key] = item.defaultValue;
  await deleteAdminSettingsByKey({
    path: { key: item.key! },
  });
  item.currentValue = item.defaultValue;
};

const handleSave = async (item: SettingListItem) => {
  const newValue = editableSettings.value[item.key];
  try {
    await putAdminSettingsByKey({
      path: { key: item.key! },
      body: {
        value: newValue,
      },
    });
    item.currentValue = newValue;
    console.log(`[Settings]: ${item.key} updated.`);
  } catch (error) {
    console.error(`[Settings]: Save failed.`, error);
  }
};

onMounted(() => fetchData());
</script>

<template>
  <UContainer class="py-8">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-bold">站点设置</h1>
      <UBadge v-if="loading" color="secondary" variant="soft"
        >Loading...</UBadge
      >
    </div>

    <UTabs :items="tabs" class="w-full">
      <template v-for="tabItem in tabs" #[tabItem.slot]="{ item }">
        <div class="space-y-6 mt-4">
          <UCard
            v-for="(items, cardKey) in groupedSettings[
              item.slot.replace(/_/g, '.')
            ]"
            :key="cardKey"
          >
            <template #header>
              <h3
                class="font-semibold uppercase tracking-wider text-sm text-gray-600 dark:text-gray-400"
              >
                {{ getCardLabel(item.slot.replace(/_/g, "."), cardKey) }}
              </h3>
            </template>

            <div class="divide-y divide-gray-200 dark:divide-gray-800">
              <div
                v-for="setting in items"
                :key="setting.key"
                class="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">{{
                      getSubKeyLabel(setting.key)
                    }}</span>
                    <UTooltip
                      v-if="i18nMap[setting.key]?.description"
                      :text="i18nMap[setting.key]?.description"
                    >
                      <UIcon
                        name="i-lucide-info"
                        class="size-4 text-gray-400 cursor-help"
                      />
                    </UTooltip>
                  </div>
                  <div class="text-xs text-gray-400 font-mono mt-0.5">
                    {{ setting.key }}
                  </div>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  <template v-if="setting.type === 'bool'">
                    <UCheckbox v-model="editableSettings[setting.key]" />
                  </template>

                  <template
                    v-else-if="
                      setting.type === 'int' || setting.type === 'double'
                    "
                  >
                    <UInput
                      v-model.number="editableSettings[setting.key]"
                      type="number"
                      :step="setting.type === 'double' ? '0.1' : '1'"
                      class="w-32"
                      align="right"
                    />
                  </template>

                  <template v-else>
                    <UInput
                      v-model="editableSettings[setting.key]"
                      class="min-w-[280px]"
                    />
                  </template>

                  <div
                    class="flex items-center gap-1 min-w-[100px] justify-end"
                  >
                    <UButton
                      v-if="isModified(setting)"
                      icon="i-lucide-check"
                      size="xs"
                      color="primary"
                      @click="handleSave(setting)"
                    >
                      Save
                    </UButton>
                    <UButton
                      icon="i-lucide-rotate-ccw"
                      size="xs"
                      color="secondary"
                      variant="ghost"
                      @click="handleReset(setting)"
                    >
                      Reset
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </template>
    </UTabs>
  </UContainer>
</template>
