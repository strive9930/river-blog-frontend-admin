<template>
  <div class="tags-view-container">
    <el-scrollbar class="tags-scrollbar" @wheel.prevent="handleWheel">
      <div class="tags-wrapper">
        <router-link
          v-for="tag in visitedViews"
          :key="tag.path"
          :to="tag.fullPath"
          class="tags-view-item"
          :class="{ active: isActive(tag), affix: tag.affix }"
          @contextmenu.prevent="openMenu($event, tag)"
        >
          <span class="tag-title">{{ tag.title }}</span>
          <el-icon
            v-if="!tag.affix"
            class="tag-close-icon"
            @click.prevent.stop="closeTag(tag)"
          >
            <Close />
          </el-icon>
        </router-link>
      </div>
    </el-scrollbar>

    <!-- 右键菜单 -->
    <ul
      v-show="menuVisible"
      class="context-menu"
      :style="{ left: menuLeft + 'px', top: menuTop + 'px' }"
    >
      <li @click="refreshTag(selectedTag!)">🔄 刷新页面</li>
      <li
        :class="{ disabled: selectedTag?.affix }"
        @click="closeTag(selectedTag!)"
      >
        ❌ 关闭当前
      </li>
      <li @click="closeOthersTags">↔️ 关闭其他</li>
      <li @click="closeLeftTags">◀ 关闭左侧</li>
      <li @click="closeRightTags">▶ 关闭右侧</li>
      <li @click="closeAllTags">🗑 关闭全部</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { Close } from '@element-plus/icons-vue';
import { useTabsStore, type TabView } from '@/store/modules/tabs';

const route = useRoute();
const tabsStore = useTabsStore();

const visitedViews = computed(() => tabsStore.visitedViews);

const isActive = (tag: TabView) => tag.path === route.path;

// --- 右键菜单状态 ---
const menuVisible = ref(false);
const menuLeft = ref(0);
const menuTop = ref(0);
const selectedTag = ref<TabView | null>(null);

const openMenu = (e: MouseEvent, tag: TabView) => {
  menuLeft.value = e.clientX;
  menuTop.value = e.clientY;
  menuVisible.value = true;
  selectedTag.value = tag;
};

const closeMenu = () => {
  menuVisible.value = false;
};

// 点击任意位置关闭菜单
onMounted(() => document.addEventListener('click', closeMenu));
onUnmounted(() => document.removeEventListener('click', closeMenu));

// --- 操作 ---
const closeTag = (tag: TabView) => {
  tabsStore.removeView(tag);
  closeMenu();
};

const refreshTag = (tag: TabView) => {
  tabsStore.refreshView(tag);
  closeMenu();
};

const closeOthersTags = () => {
  if (selectedTag.value) tabsStore.closeOthers(selectedTag.value);
  closeMenu();
};

const closeLeftTags = () => {
  if (selectedTag.value) tabsStore.closeLeft(selectedTag.value);
  closeMenu();
};

const closeRightTags = () => {
  if (selectedTag.value) tabsStore.closeRight(selectedTag.value);
  closeMenu();
};

const closeAllTags = () => {
  tabsStore.closeAll();
  closeMenu();
};

// 鼠标滚轮水平滚动
const handleWheel = (e: WheelEvent) => {
  const el = (e.currentTarget as HTMLElement).querySelector(
    '.el-scrollbar__wrap',
  ) as HTMLElement;
  if (el) {
    el.scrollLeft += e.deltaY;
  }
};
</script>

<style scoped>
.tags-view-container {
  height: 40px;
  background: #fff;
  border-bottom: 1px solid #d8dce5;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  user-select: none;
}

.tags-scrollbar {
  height: 100%;
  white-space: nowrap;
}

.tags-wrapper {
  display: inline-flex;
  height: 100%;
  align-items: center;
  padding: 0 8px;
}

.tags-view-item {
  display: inline-flex;
  align-items: center;
  height: 28px;
  line-height: 28px;
  padding: 0 10px;
  margin-right: 4px;
  font-size: 12px;
  color: #495060;
  border: 1px solid #d8dce5;
  border-radius: 3px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}

.tags-view-item:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.tags-view-item.active {
  color: #fff;
  background: #409eff;
  border-color: #409eff;
}

.tags-view-item.active .tag-close-icon {
  color: #fff;
}

.tags-view-item.active .tag-close-icon:hover {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
}

.tags-view-item.affix {
  padding-right: 10px;
}

.tag-title {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-close-icon {
  width: 14px;
  height: 14px;
  margin-left: 6px;
  border-radius: 50%;
  transition: all 0.2s;
}

.tag-close-icon:hover {
  background: #b4bccc;
  color: #fff;
}

/* --- 右键菜单 --- */
.context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 140px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  margin: 0;
  list-style: none;
  font-size: 13px;
  color: #333;
}

.context-menu li {
  padding: 8px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.context-menu li:hover {
  background: #f0f2f5;
}

.context-menu li.disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.context-menu li.disabled:hover {
  background: transparent;
}
</style>
