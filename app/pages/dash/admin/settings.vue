<script setup lang="ts">
import {
  deleteAdminSettingsByKey,
  getAdminSettings,
  putAdminSettingsByKey,
  type SettingListItem,
} from "~~/packages/api/src";
import {
  parseDate,
  parseDateTime,
  parseTime,
} from "@internationalized/date";

const i18nMap: Record<
  string,
  { label: string; description?: string; icon?: string }
> = {
  "site.seo": { label: "SEO", icon: "i-lucide-search" },
  "site.security": { label: "安全与隐私", icon: "i-lucide-shield-check" },
  "site.user": { label: "用户管理", icon: "i-lucide-users" },
  "site.home": { label: "首页定制", icon: "i-lucide-layout-template" },
  "site.footer": { label: "页脚配置", icon: "i-lucide-panel-bottom" },
  "site.general": { label: "站点信息", icon: "i-lucide-globe" },
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
  "site.general.info": { label: "基本信息" },
  "site.general.info.site_created_at": {
    label: "建站时间",
    description: "站点创建的日期时间，用于展示运行时长",
  },
  "site.comment": { label: "评论设置" },
  "site.comment.guest": { label: "访客" },
  "site.comment.guest.enabled": {
    label: "允许访客评论",
    description: "允许访客提交评论",
  },
  "site.comment.guest.require_approval": {
    label: "访客评论需要审核",
    description: "控制访客发送的评论是否需要经过审核。如设置为是，则访客的评论需要被审核才会展出；如设置为否，则访客发送的评论会立刻可见"
  },
  "site.comment.guest.allow_reply": {
    label: "允许访客回复",
    description: "允许访客回复其他人的评论"
  }
};

const isListType = (type: string) => type.startsWith("list[");
const isDictType = (type: string) => type.startsWith("dict[");

const getListInnerType = (type: string): string | null => {
  const match = type.match(/^list\[(.+)\]$/);
  return match ? match[1].trim() : null;
};

const getDictValueType = (type: string): string | null => {
  const match = type.match(/^dict\[.+,\s*(.+)\]$/);
  return match ? match[1].trim() : null;
};

const isNumericType = (t: string | null | undefined) =>
  t === "int" || t === "double";

const getDefaultValueForType = (t: string | null) => {
  if (t === "int" || t === "double") return 0;
  if (t === "bool") return false;
  return "";
};

const toEditableValue = (value: any, type: string) => {
  if (value == null) return null;
  if (type === "datetime") {
    const str = typeof value === "string" ? value : new Date(value);
    return parseDateTime(str.length > 19 ? str.slice(0, 19) : str);
  }
  if (type === "date") {
    const str = typeof value === "string" ? value : new Date(value).toISOString().slice(0, 10);
    return parseDate(str);
  }
  if (type === "time") {
    return parseTime(typeof value === "string" ? value : String(value));
  }
  return value;
};

const toApiValue = (value: any, type: string) => {
  if (value == null) return null;
  if (type === "datetime" || type === "date" || type === "time") {
    return value.toString();
  }
  if (isListType(type)) {
    const inner = getListInnerType(type);
    const arr = value as any[];
    if (inner === "int")
      return arr.map((v: any) => {
        const n = parseInt(String(v), 10);
        return isNaN(n) ? 0 : n;
      });
    if (inner === "double")
      return arr.map((v: any) => {
        const n = parseFloat(String(v));
        return isNaN(n) ? 0 : n;
      });
    return value;
  }
  if (isDictType(type)) {
    const vt = getDictValueType(type);
    if (vt === "int" || vt === "double") {
      const result: Record<string, any> = {};
      const coerce =
        vt === "int"
          ? (v: any) => {
              const n = parseInt(String(v), 10);
              return isNaN(n) ? 0 : n;
            }
          : (v: any) => {
              const n = parseFloat(String(v));
              return isNaN(n) ? 0 : n;
            };
      for (const [k, v] of Object.entries(value as Record<string, any>)) {
        result[k] = coerce(v);
      }
      return result;
    }
    return value;
  }
  return value;
};

const rawSettings = ref<SettingListItem[]>([]);
const loading = ref(false);
const editableSettings = ref<Record<string, any>>({});
const newDictKey = ref("");

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await getAdminSettings();
    if (response.error || !response.data)
      throw new Error("Unable to fetch site settings.");
    rawSettings.value = response.data;
    response.data.forEach((item) => {
      if (isListType(item.type)) {
        editableSettings.value[item.key] = Array.isArray(item.currentValue)
          ? [...item.currentValue]
          : [];
      } else if (isDictType(item.type)) {
        editableSettings.value[item.key] = item.currentValue
          ? { ...(item.currentValue as Record<string, any>) }
          : {};
      } else {
        editableSettings.value[item.key] = toEditableValue(
          item.currentValue,
          item.type,
        );
      }
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

const isModified = (item: SettingListItem) => {
  const current = editableSettings.value[item.key];
  const original = item.currentValue;
  if (typeof current === "object" && current !== null) {
    return JSON.stringify(current) !== JSON.stringify(original);
  }
  return current !== original;
};

const handleReset = async (item: SettingListItem) => {
  const dv = item.defaultValue;
  if (isListType(item.type)) {
    editableSettings.value[item.key] = Array.isArray(dv) ? [...dv] : [];
  } else if (isDictType(item.type)) {
    editableSettings.value[item.key] = dv
      ? { ...(dv as Record<string, any>) }
      : {};
  } else {
    editableSettings.value[item.key] = toEditableValue(dv, item.type);
  }
  await deleteAdminSettingsByKey({
    path: { key: item.key! },
  });
  item.currentValue = item.defaultValue;
};

const handleSave = async (item: SettingListItem) => {
  const newValue = toApiValue(editableSettings.value[item.key], item.type);
  try {
    await putAdminSettingsByKey({
      path: { key: item.key! },
      body: {
        value: newValue,
      },
    });
    item.currentValue = JSON.parse(
      JSON.stringify(editableSettings.value[item.key]),
    );
    console.log(`[Settings]: ${item.key} updated.`);
  } catch (error) {
    console.error(`[Settings]: Save failed.`, error);
  }
};

const addDictEntry = (item: SettingListItem) => {
  if (!newDictKey.value.trim()) return;
  const dict = editableSettings.value[item.key] as Record<string, any>;
  dict[newDictKey.value.trim()] = getDefaultValueForType(
    getDictValueType(item.type),
  );
  newDictKey.value = "";
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

                  <template v-else-if="setting.type === 'datetime'">
                    <UInputDate
                      v-model="editableSettings[setting.key]"
                      granularity="second"
                      class="w-72"
                    />
                  </template>

                  <template v-else-if="setting.type === 'date'">
                    <UInputDate
                      v-model="editableSettings[setting.key]"
                      class="w-48"
                    />
                  </template>

                  <template v-else-if="setting.type === 'time'">
                    <UInputTime
                      v-model="editableSettings[setting.key]"
                      granularity="second"
                      class="w-48"
                    />
                  </template>

                  <template v-else-if="isListType(setting.type)">
                    <div class="flex flex-col gap-2">
                      <div
                        v-for="(_, index) in (
                          editableSettings[setting.key] as any[]
                        )"
                        :key="index"
                        class="flex gap-2"
                      >
                        <UInput
                          v-if="isNumericType(getListInnerType(setting.type))"
                          v-model.number="
                            (editableSettings[setting.key] as any[])[index]
                          "
                          type="number"
                          :step="
                            getListInnerType(setting.type) === 'double'
                              ? '0.1'
                              : '1'
                          "
                          class="grow"
                          align="right"
                        />
                        <UInput
                          v-else
                          v-model="
                            (editableSettings[setting.key] as any[])[index]
                          "
                          class="grow"
                        />
                        <UButton
                          v-if="
                            (editableSettings[setting.key] as any[]).length > 0
                          "
                          icon="i-lucide-minus"
                          color="error"
                          variant="ghost"
                          size="xs"
                          @click="
                            (editableSettings[setting.key] as any[]).splice(
                              index,
                              1,
                            )
                          "
                        />
                      </div>
                      <UButton
                        icon="i-lucide-plus"
                        size="xs"
                        variant="ghost"
                        @click="
                          (editableSettings[setting.key] as any[]).push(
                            getDefaultValueForType(
                              getListInnerType(setting.type),
                            ),
                          )
                        "
                      >
                        新增
                      </UButton>
                    </div>
                  </template>

                  <template v-else-if="isDictType(setting.type)">
                    <div class="flex flex-col gap-2">
                      <div
                        v-for="(_, dKey) in (
                          editableSettings[setting.key] as Record&lt;string, any&gt;
                        )"
                        :key="dKey"
                        class="flex gap-2"
                      >
                        <UInput
                          :model-value="dKey"
                          class="w-32"
                          @update:model-value="
                            (newKey: string) => {
                              const dict = editableSettings[setting.key] as Record<
                                string,
                                any
                              >;
                              const oldKey = dKey as string;
                              if (newKey === oldKey) return;
                              const entries = Object.entries(dict);
                              const idx = entries.findIndex(
                                ([k]) => k === oldKey,
                              );
                              const updated: Record<string, any> = {};
                              for (let i = 0; i < entries.length; i++) {
                                if (i === idx) updated[newKey] = entries[i][1];
                                else updated[entries[i][0]] = entries[i][1];
                              }
                              editableSettings[setting.key] = updated;
                            }
                          "
                        />
                        <UInput
                          v-if="isNumericType(getDictValueType(setting.type))"
                          :model-value.number="
                            (editableSettings[setting.key] as Record<
                              string,
                              any
                            >)[dKey]
                          "
                          type="number"
                          :step="
                            getDictValueType(setting.type) === 'double'
                              ? '0.1'
                              : '1'
                          "
                          class="grow"
                          align="right"
                          @update:model-value="
                            (v: any) => {
                              (editableSettings[setting.key] as Record<
                                string,
                                any
                              >)[dKey] = v;
                            }
                          "
                        />
                        <UInput
                          v-else
                          :model-value="
                            (editableSettings[setting.key] as Record<
                              string,
                              any
                            >)[dKey]
                          "
                          class="grow"
                          @update:model-value="
                            (v: any) => {
                              (editableSettings[setting.key] as Record<
                                string,
                                any
                              >)[dKey] = v;
                            }
                          "
                        />
                        <UButton
                          icon="i-lucide-minus"
                          color="error"
                          variant="ghost"
                          size="xs"
                          @click="
                            delete (editableSettings[setting.key] as Record<
                              string,
                              any
                            >)[dKey]
                          "
                        />
                      </div>
                      <div class="flex gap-2">
                        <UInput
                          v-model="newDictKey"
                          class="w-32"
                          placeholder="新键名"
                        />
                        <UButton
                          icon="i-lucide-plus"
                          size="xs"
                          variant="ghost"
                          @click="addDictEntry(setting)"
                        >
                          新增
                        </UButton>
                      </div>
                    </div>
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
