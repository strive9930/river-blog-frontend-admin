<template>
  <div class="icon-picker" v-click-outside="closePopover">
    <div class="icon-picker-trigger" @click="togglePopover">
      <span v-if="modelValue" class="icon-preview">
        <el-icon :size="18">
          <component :is="modelValue" />
        </el-icon>
      </span>
      <span v-else class="icon-placeholder">
        <el-icon :size="18"><PictureFilled /></el-icon>
      </span>
      <span class="icon-label">{{ modelValue || '点击选择图标' }}</span>
      <el-icon class="arrow"><ArrowDown /></el-icon>
    </div>

    <div v-show="visible" class="icon-popover">
      <div class="popover-header">
        <el-input
          v-model="search"
          placeholder="搜索图标..."
          size="small"
          clearable
          @keyup.escape="visible = false"
        />
      </div>
      <div class="popover-body">
        <div
          v-for="key in filteredIcons"
          :key="key"
          class="icon-cell"
          :class="{ active: modelValue === key }"
          :title="key"
          @click="select(key)"
        >
          <el-icon :size="22">
            <component :is="key" />
          </el-icon>
          <span class="icon-cell-label">{{ key }}</span>
        </div>
      </div>
      <div v-if="filteredIcons.length === 0" class="no-result">
        无匹配图标
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ArrowDown, PictureFilled } from '@element-plus/icons-vue';

// ============================================================
// 图标库 — 纯字符串 key（图标已全局注册，无需逐个 import）
// ============================================================
const iconKeys = [
  // 基础 / 导航
  'HomeFilled', 'Menu', 'Document', 'Guide', 'Link', 'Compass', 'Connection',
  'Promotion', 'List', 'Grid', 'Tickets', 'CollectionTag', 'Collection',
  // 用户 / 权限
  'User', 'UserFilled', 'Avatar', 'Key', 'Lock', 'Unlock', 'SwitchButton',
  // 内容 / 编辑
  'Edit', 'EditPen', 'Postcard', 'Notebook', 'Tabs', 'Reading', 'DataBoard',
  // 数据
  'DataAnalysis', 'PieChart', 'TrendCharts', 'Histogram', 'Odometer', 'DataLine',
  // 系统
  'Setting', 'Tools', 'Monitor', 'Cpu', 'Operation',
  // 文件
  'Folder', 'FolderOpened', 'Files', 'Upload', 'Download', 'UploadFilled',
  // 操作
  'Search', 'Plus', 'Delete', 'Close', 'Check', 'Share', 'Refresh',
  // 提示
  'Bell', 'ChatDotSquare', 'MessageBox', 'WarningFilled', 'InfoFilled',
  // 电商 / 其他
  'ShoppingCartFull', 'Goods', 'PriceTag', 'Star', 'StarFilled', 'TrophyBase',
  // 时间 / 日历
  'Clock', 'Calendar', 'Timer', 'AlarmClock',
  // 媒体
  'Picture', 'VideoCamera', 'VideoPlay', 'Headset',
];

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', val: string): void }>();

const visible = ref(false);
const search = ref('');

const filteredIcons = computed(() => {
  const q = search.value.toLowerCase();
  if (!q) return iconKeys;
  return iconKeys.filter(k => k.toLowerCase().includes(q));
});

const togglePopover = () => {
  visible.value = !visible.value;
  if (visible.value) search.value = '';
};

const closePopover = () => {
  visible.value = false;
};

const select = (key: string) => {
  emit('update:modelValue', key);
  visible.value = false;
};

// v-click-outside 指令
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    el._clickOutside = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) binding.value();
    };
    document.addEventListener('click', el._clickOutside);
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', el._clickOutside);
  },
};
</script>

<style scoped>
.icon-picker {
  position: relative;
  width: 100%;
}

.icon-picker-trigger {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.2s;
  user-select: none;
}

.icon-picker-trigger:hover {
  border-color: #409eff;
}

.icon-preview {
  display: flex;
  align-items: center;
  color: #409eff;
  margin-right: 8px;
}

.icon-placeholder {
  display: flex;
  align-items: center;
  color: #c0c4cc;
  margin-right: 8px;
}

.icon-label {
  flex: 1;
  font-size: 13px;
  color: #606266;
}

.arrow {
  color: #c0c4cc;
  font-size: 12px;
  transition: transform 0.2s;
}

/* ---- popover ---- */
.icon-popover {
  position: absolute;
  top: 38px;
  left: 0;
  z-index: 3000;
  width: 420px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.popover-header {
  padding: 10px 12px 0;
}

.popover-body {
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
  max-height: 280px;
  overflow-y: auto;
  align-content: flex-start;
}

.icon-cell {
  width: 56px;
  height: 54px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  color: #606266;
  transition: all 0.15s;
}

.icon-cell:hover {
  color: #409eff;
  background: #ecf5ff;
}

.icon-cell.active {
  color: #fff;
  background: #409eff;
}

.icon-cell-label {
  font-size: 10px;
  margin-top: 3px;
  max-width: 52px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-result {
  text-align: center;
  padding: 24px;
  color: #909399;
  font-size: 13px;
}
</style>
