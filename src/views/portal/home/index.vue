<template>
  <div class="home-container">
    <el-row :gutter="30">
      <!-- ====== 左侧文章流 ====== -->
      <el-col :xs="24" :sm="24" :md="17" :lg="18">
        <div class="filter-status-bar" v-if="queryParams.categoryId || queryParams.tagId">
          <span class="filter-label">当前筛选：</span>
          <el-tag v-if="queryParams.categoryId" closable @close="clearFilter('category')" type="primary">
            {{ currentCategoryName }}
          </el-tag>
          <el-tag v-if="queryParams.tagId" closable @close="clearFilter('tag')" type="success">
            # {{ currentTagName }}
          </el-tag>
          <el-button link type="info" size="small" @click="clearAllFilters">清除全部</el-button>
        </div>

        <div class="article-stream">
          <!-- 骨架屏 -->
          <template v-if="loading">
            <div v-for="n in 3" :key="'skel'+n" class="article-card skeleton-card">
              <div class="card-cover"><el-skeleton animated><template #template><div style="width:100%;height:160px;background:#f0f2f5" /></template></el-skeleton></div>
              <div class="card-body">
                <el-skeleton animated :rows="3" />
              </div>
            </div>
          </template>

          <el-empty v-if="articles.length === 0 && !loading" description="暂无文章" />

          <article
            v-for="item in articles"
            :key="item.id"
            class="article-card"
            @click="goToDetail(item.id)"
          >
            <div class="card-cover" v-if="item.coverUrl">
              <el-image :src="item.coverUrl" fit="cover" lazy>
                <template #placeholder><div class="img-placeholder" /></template>
              </el-image>
            </div>

            <div class="card-body" :class="{ 'no-cover': !item.coverUrl }">
              <div class="card-main">
                <h2 class="card-title">{{ item.title }}</h2>
                <p class="card-summary">{{ item.summary || '作者很懒，没有写摘要...' }}</p>
              </div>

              <div class="card-footer">
                <div class="footer-left">
                  <span class="footer-item">
                    <el-icon size="14"><Calendar /></el-icon>
                    {{ formatDate(item.createdTime || item.createTime) }}
                  </span>
                  <span v-if="item.categoryName" class="footer-item" @click.stop="handleCategorySelect(item.categoryId, item.categoryName)">
                    <el-icon size="14"><Folder /></el-icon>
                    {{ item.categoryName }}
                  </span>
                </div>
                <div class="footer-right">
                  <span class="stat-badge" title="阅读量">
                    <el-icon size="16"><View /></el-icon>
                    {{ formatCount(item.viewCount || 0) }}
                  </span>
                  <span class="stat-badge" title="评论数">
                    <el-icon size="16"><ChatDotSquare /></el-icon>
                    {{ formatCount(item.commentCount || 0) }}
                  </span>
                </div>
              </div>
            </div>
          </article>

          <div class="pagination-wrapper" v-if="total > 0">
            <el-pagination
              v-model:current-page="queryParams.pageIndex"
              :page-size="queryParams.pageSize"
              :total="total"
              :page-sizes="[5, 10, 20]"
              layout="total, prev, pager, next"
              background
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </el-col>

      <!-- ====== 右侧侧边栏 ====== -->
      <el-col :xs="0" :sm="0" :md="7" :lg="6">
        <aside class="home-sidebar">
          <!-- 博主卡片 -->
          <el-card class="sidebar-card profile-card" shadow="hover">
            <div class="profile-avatar">
              <el-avatar :size="72" :src="siteStore.authorAvatar" />
            </div>
            <h3 class="profile-name">{{ siteStore.authorName }}</h3>
            <p class="profile-bio">{{ siteStore.authorBio }}</p>
            <div class="profile-stats">
              <div class="stat-box">
                <span class="stat-num">{{ total }}</span>
                <span class="stat-lbl">文章</span>
              </div>
              <div class="stat-divider" />
              <div class="stat-box">
                <span class="stat-num">{{ totalViews }}</span>
                <span class="stat-lbl">阅读</span>
              </div>
            </div>
            <div class="profile-links" v-if="siteStore.socialLinks.length > 0">
              <a
                v-for="link in siteStore.socialLinks"
                :key="link.platform"
                :href="link.url"
                target="_blank"
                class="social-link"
                :title="link.platform"
              >
                <svg v-if="link.platform === 'GitHub'" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                <svg v-else-if="link.platform === 'RSS' || link.platform === 'Feed'" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-3.83A11.73 11.73 0 0 0 4 8.27V4.44m0 7.83a7.73 7.73 0 0 1 7.73 7.73H7.95A3.95 3.95 0 0 0 4 16.05v-3.78z"/></svg>
                <span v-else>{{ link.platform }}</span>
              </a>
            </div>
          </el-card>

          <!-- 分类 -->
          <el-card class="sidebar-card" shadow="hover">
            <template #header>
              <div class="card-header"><el-icon><FolderOpened /></el-icon><span>文章分类</span></div>
            </template>
            <ul class="category-list">
              <li
                v-for="cat in categories"
                :key="cat.id"
                :class="['category-item', { active: queryParams.categoryId === cat.id }]"
                @click="handleCategorySelect(cat.id, cat.name)"
              >
                <span class="cat-name">{{ cat.name }}</span>
              </li>
            </ul>
          </el-card>

          <!-- 标签云 -->
          <el-card class="sidebar-card" shadow="hover" v-if="tags.length > 0">
            <template #header>
              <div class="card-header"><el-icon><PriceTag /></el-icon><span>标签云</span></div>
            </template>
            <div class="tag-cloud">
              <el-tag
                v-for="tag in tags"
                :key="tag.id"
                :effect="queryParams.tagId === tag.id ? 'dark' : 'plain'"
                :type="queryParams.tagId === tag.id ? '' : 'info'"
                class="cloud-tag"
                @click="handleTagSelect(tag.id, tag.name)"
              >
                {{ tag.name }}
              </el-tag>
            </div>
          </el-card>

          <!-- 随机推荐 -->
          <el-card class="sidebar-card" shadow="hover" v-if="randomArticles.length > 0">
            <template #header>
              <div class="card-header"><el-icon><MagicStick /></el-icon><span>随机推荐</span></div>
            </template>
            <ul class="widget-list">
              <li
                v-for="item in randomArticles"
                :key="item.id"
                class="widget-list-item"
                @click="goToDetail(item.id)"
              >
                <span class="widget-title">{{ item.title }}</span>
                <span class="widget-meta">{{ formatDate(item.createdTime || item.createTime) }}</span>
              </li>
            </ul>
          </el-card>

          <!-- 最新评论 -->
          <el-card class="sidebar-card" shadow="hover" v-if="latestComments.length > 0">
            <template #header>
              <div class="card-header"><el-icon><ChatDotSquare /></el-icon><span>最新评论</span></div>
            </template>
            <ul class="widget-list">
              <li
                v-for="item in latestComments"
                :key="item.id"
                class="widget-list-item comment-item-widget"
                @click="goToDetail(item.articleId!)"
              >
                <div class="comment-widget-header">
                  <el-avatar :size="22" :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${item.nickName}`" class="comment-widget-avatar" />
                  <span class="comment-widget-name">{{ item.nickName }}</span>
                </div>
                <span class="widget-title comment-widget-text">{{ item.content?.slice(0, 50) }}{{ item.content?.length > 50 ? '...' : '' }}</span>
              </li>
            </ul>
          </el-card>
        </aside>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'PortalHome' });

import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Calendar, Folder, FolderOpened, PriceTag, View, ChatDotSquare, MagicStick } from '@element-plus/icons-vue';
import { getPublicArticles, getPublicCategories, getPublicTags, getLatestComments, getRandomArticles } from '@/api/portal';
import { useSiteStore } from '@/store/modules/site';

const router = useRouter();
const siteStore = useSiteStore();

const loading = ref(false);
const articles = ref<any[]>([]);
const total = ref(0);
const categories = ref<any[]>([]);
const tags = ref<any[]>([]);
const randomArticles = ref<any[]>([]);
const latestComments = ref<any[]>([]);
const currentCategoryName = ref('');
const currentTagName = ref('');

const queryParams = reactive({
  pageIndex: 1,
  pageSize: 5,
  categoryId: null as string | null,
  tagId: null as string | null,
});

const totalViews = computed(() =>
  articles.value.reduce((sum, a) => sum + (a.viewCount || 0), 0),
);

const fetchArticles = async () => {
  loading.value = true;
  try {
    const res = await getPublicArticles(queryParams);
    articles.value = res.data?.data || res.data || [];
    total.value = res.data?.totalCount || res?.totalCount || 0;
  } catch {
    articles.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleCategorySelect = (id: string, name: string) => {
  if (queryParams.categoryId === id) { clearFilter('category'); return; }
  queryParams.categoryId = id;
  currentCategoryName.value = name;
  queryParams.pageIndex = 1;
  fetchArticles();
};

const handleTagSelect = (id: string, name: string) => {
  if (queryParams.tagId === id) { clearFilter('tag'); return; }
  queryParams.tagId = id;
  currentTagName.value = name;
  queryParams.pageIndex = 1;
  fetchArticles();
};

const clearFilter = (type: string) => {
  if (type === 'category') { queryParams.categoryId = null; currentCategoryName.value = ''; }
  if (type === 'tag') { queryParams.tagId = null; currentTagName.value = ''; }
  queryParams.pageIndex = 1;
  fetchArticles();
};

const clearAllFilters = () => { queryParams.categoryId = null; queryParams.tagId = null; currentCategoryName.value = ''; currentTagName.value = ''; queryParams.pageIndex = 1; fetchArticles(); };

const handlePageChange = () => { fetchArticles(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
const goToDetail = (id: string) => router.push(`/article/${id}`);
const formatDate = (d: string) => { if (!d) return ''; const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; };
const formatCount = (n: number) => { if (n >= 10000) return (n / 10000).toFixed(1) + 'w'; if (n >= 1000) return (n / 1000).toFixed(1) + 'k'; return String(n); };

onMounted(async () => {
  fetchArticles();
  try {
    const [catRes, tagRes] = await Promise.all([getPublicCategories(), getPublicTags()]);
    categories.value = catRes.data?.data || catRes.data || [];
    tags.value = tagRes.data?.data || tagRes.data || [];
  } catch { /* */ }
  // 随机推荐 & 最新评论
  try {
    const [randRes, commRes] = await Promise.all([getRandomArticles(5), getLatestComments(5)]);
    randomArticles.value = randRes.data?.data || randRes.data || [];
    latestComments.value = commRes.data?.data || commRes.data || [];
  } catch { /* */ }
});
</script>

<style scoped>
.home-container { width: 100%; }

/* Filter bar */
.filter-status-bar { background: #fff; padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #86909c; border: 1px solid #f0f0f0; }

/* ====== 文章卡片 — 仿 liuyuyang.net 风格 ====== */
.article-stream { display: flex; flex-direction: column; gap: 16px; }
.article-card {
  display: flex; background: #fff; border-radius: 10px; overflow: hidden;
  cursor: pointer; transition: all .25s ease;
  border: 1px solid #f0f0f0;
}
.article-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.06); }
.article-card:hover .card-title { color: #1e80ff; }

.card-cover {
  width: 240px; min-height: 160px; flex-shrink: 0; overflow: hidden; background: #f5f6f8;
}
.card-cover .el-image { width: 100%; height: 100%; transition: transform .4s; }
.article-card:hover .card-cover .el-image { transform: scale(1.04); }
.img-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #f0f2f5 25%, #e8eaed 50%, #f0f2f5 75%); }

.card-body { flex: 1; padding: 18px 20px; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
.card-body.no-cover { padding-left: 24px; }

.card-main { flex: 1; }
.card-title { font-size: 18px; font-weight: 600; color: #1d2129; margin: 0 0 8px; line-height: 1.45; transition: color .2s;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-summary { font-size: 14px; color: #86909c; line-height: 1.65; margin: 0;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }

/* 底部信息栏 */
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
.footer-left { display: flex; gap: 14px; font-size: 12px; color: #8a919f; }
.footer-item { display: flex; align-items: center; gap: 3px; cursor: default; }
.footer-item:hover { color: #1e80ff; }
.footer-right { display: flex; gap: 10px; }

.stat-badge { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #8a919f; font-weight: 500; }
.stat-badge:hover { color: #1e80ff; }

/* Pagination */
.pagination-wrapper { margin-top: 20px; display: flex; justify-content: center; }

/* ====== 侧边栏 ====== */
.home-sidebar { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 80px; }

.sidebar-card { border-radius: 10px; border: 1px solid #f0f0f0 !important; }
.card-header { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #1d2129; }

/* 博主卡片 */
.profile-card { text-align: center; padding: 10px 0; }
.profile-avatar { margin-bottom: 10px; }
.profile-name { margin: 0 0 4px; font-size: 17px; color: #1d2129; }
.profile-bio { font-size: 12px; color: #8a919f; margin: 0 0 14px; padding: 0 8px; }
.profile-stats { display: flex; justify-content: center; align-items: center; gap: 0; margin-bottom: 12px; }
.stat-box { display: flex; flex-direction: column; align-items: center; padding: 0 20px; }
.stat-num { font-size: 22px; font-weight: 700; color: #1d2129; }
.stat-lbl { font-size: 11px; color: #8a919f; margin-top: 2px; }
.stat-divider { width: 1px; height: 28px; background: #e5e6eb; }
.profile-links { display: flex; justify-content: center; gap: 8px; }
.social-link { color: #8a919f; transition: color .2s; display: flex; }
.social-link:hover { color: #1d2129; }

/* 分类列表 */
.category-list { list-style: none; padding: 0; margin: 0; }
.category-item { padding: 9px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #4e5969; transition: all .15s; }
.category-item:hover { background: #f4f5f5; color: #1e80ff; }
.category-item.active { background: #e8f3ff; color: #1e80ff; font-weight: 600; }
.cat-name { margin-left: 4px; }

/* 标签云 */
.tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; }
.cloud-tag { cursor: pointer; transition: all .15s; }
.cloud-tag:hover { transform: scale(1.04); }

/* 通用 Widget 列表 */
.widget-list { list-style: none; padding: 0; margin: 0; }
.widget-list-item { padding: 9px 4px; cursor: pointer; border-bottom: 1px solid #f5f6f8; transition: all .15s; display: flex; flex-direction: column; gap: 4px; }
.widget-list-item:last-child { border-bottom: none; }
.widget-list-item:hover { background: #f4f5f5; border-radius: 6px; padding-left: 10px; padding-right: 10px; }
.widget-title { font-size: 13px; color: #4e5969; line-height: 1.45;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.widget-list-item:hover .widget-title { color: #1e80ff; }
.widget-meta { font-size: 11px; color: #b0b5be; }

/* 最新评论 Widget */
.comment-item-widget { gap: 6px; }
.comment-widget-header { display: flex; align-items: center; gap: 6px; }
.comment-widget-avatar { flex-shrink: 0; }
.comment-widget-name { font-size: 12px; color: #1d2129; font-weight: 500; }
.comment-widget-text { color: #86909c !important; font-size: 12px !important; }
.comment-widget-text:hover { color: #1e80ff !important; }

@media (max-width: 768px) {
  .article-card { flex-direction: column; }
  .card-cover { width: 100%; height: 200px; }
  .card-body { padding: 14px 16px; }
  .card-title { font-size: 16px; }
}
</style>
