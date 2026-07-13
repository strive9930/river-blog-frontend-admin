<template>
  <div class="article-page">
    <!-- 阅读进度条 -->
    <div class="reading-progress" :style="{ width: progressPercent + '%' }" />

    <div class="article-detail-container" v-loading="loading">
      <div class="back-bar">
        <el-button link icon="ArrowLeft" @click="$router.push('/')">返回首页</el-button>
      </div>

      <template v-if="article">
        <header class="article-header">
          <h1 class="title">{{ article.title }}</h1>
          <div class="meta-info">
            <span class="meta-item"><el-icon><Calendar /></el-icon>{{ formatDate(article.createdTime || article.createTime) }}</span>
            <span class="meta-item" v-if="article.categoryName"><el-icon><Folder /></el-icon>{{ article.categoryName }}</span>
            <span class="meta-item"><el-icon><View /></el-icon>{{ article.viewCount || 0 }} 阅读</span>
          </div>
          <div class="tags-box" v-if="article.tags && article.tags.length">
            <el-tag v-for="tag in article.tags" :key="tag.id" size="small" type="info" class="tag-item"># {{ tag.name }}</el-tag>
          </div>
        </header>

        <div class="article-banner" v-if="article.coverUrl">
          <el-image :src="article.coverUrl" fit="cover" />
        </div>

        <div class="article-body markdown-body" v-html="parsedContent" ref="bodyRef" />
      </template>
    </div>

    <!-- ====== 评论区 ====== -->
    <CommentArea v-if="article" :article-id="article.id" />

    <!-- 上一篇 / 下一篇 -->
    <div class="adjacent-nav" v-if="article">
      <div class="adjacent-item prev" v-if="prevArticle" @click="$router.push(`/article/${prevArticle.id}`)">
        <span class="adj-label">← 上一篇</span>
        <span class="adj-title">{{ prevArticle.title }}</span>
      </div>
      <div class="adjacent-item next" v-if="nextArticle" @click="$router.push(`/article/${nextArticle.id}`)">
        <span class="adj-label">下一篇 →</span>
        <span class="adj-title">{{ nextArticle.title }}</span>
      </div>
    </div>

    <!-- 右侧 TOC 目录树 -->
    <aside class="toc-sidebar" v-if="tocItems.length > 1">
      <div class="toc-title">目录</div>
      <nav class="toc-nav">
        <a
          v-for="item in tocItems"
          :key="item.id"
          :class="['toc-link', `toc-level-${item.level}`, { active: activeTocId === item.id }]"
          :href="`#${item.id}`"
          @click.prevent="scrollToHeading(item.id)"
        >{{ item.text }}</a>
      </nav>
    </aside>

    <!-- 回到顶部 -->
    <transition name="fade">
      <div v-show="showBackTop" class="back-to-top" @click="scrollToTop">
        <el-icon :size="20"><ArrowUp /></el-icon>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'PortalArticle' });

import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Calendar, Folder, View, ArrowLeft, ArrowUp } from '@element-plus/icons-vue';
import { getPublicArticleDetail, getPublicArticles } from '@/api/portal';
import CommentArea from './components/CommentArea.vue';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

const route = useRoute();
const bodyRef = ref<HTMLElement>();

const loading = ref(false);
const article = ref<any>(null);
const prevArticle = ref<any>(null);
const nextArticle = ref<any>(null);

// === Marked ===
const marked = new Marked(markedHighlight({
  emptyLangClass: 'hljs', langPrefix: 'hljs language-',
  highlight(code: string, lang: string) {
    return hljs.highlight(code, { language: hljs.getLanguage(lang) ? lang : 'plaintext' }).value;
  },
}));
marked.setOptions({ breaks: true, gfm: true });

const parsedContent = computed(() => {
  if (!article.value?.content) return '';
  return marked.parse(article.value.content) as string;
});

// === TOC 提取 ===
interface TocItem { id: string; text: string; level: number; }
const tocItems = ref<TocItem[]>([]);
const activeTocId = ref('');

const extractTOC = (content: string) => {
  const hRegex = /^(#{1,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let m: RegExpExecArray | null;
  while ((m = hRegex.exec(content)) !== null) {
    const text = m[2].trim();
    const id = 'h-' + text.replace(/[^\w\u4e00-\u9fff]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
    items.push({ id, text, level: m[1].length });
  }
  return items;
};

// === 滚动监听 (TOC 高亮 + 进度条 + 回到顶部) ===
const progressPercent = ref(0);
const showBackTop = ref(false);
let observer: IntersectionObserver | null = null;

const setupScrollWatch = () => {
  // 进度条 + 回到顶部
  const onScroll = () => {
    const st = document.documentElement.scrollTop;
    const ch = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    progressPercent.value = ch > 0 ? Math.min((st / ch) * 100, 100) : 0;
    showBackTop.value = st > 400;
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // TOC 高亮
  nextTick(() => {
    const headings = bodyRef.value?.querySelectorAll('h1, h2, h3');
    if (!headings || headings.length === 0) return;
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { activeTocId.value = e.target.id; break; }
        }
      },
      { rootMargin: '-60px 0px -70% 0px', threshold: 0 },
    );
    headings.forEach(h => observer!.observe(h));
  });
};

const scrollToHeading = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// === 上下篇 ===
const fetchAdjacent = async () => {
  try {
    const res = await getPublicArticles({ pageSize: 100, status: 'Published' });
    const list = res.data?.data || res.data || [];
    const idx = list.findIndex((a: any) => a.id === article.value?.id);
    if (idx > 0) prevArticle.value = list[idx - 1];
    if (idx >= 0 && idx < list.length - 1) nextArticle.value = list[idx + 1];
  } catch { /* */ }
};

// === 加载 ===
onMounted(async () => {
  const id = route.params.id as string;
  if (!id) return;
  loading.value = true;
  try {
    const res = await getPublicArticleDetail(id);
    article.value = res.data?.data || res.data;
    tocItems.value = extractTOC(article.value?.content || '');
    await nextTick();
    setupScrollWatch();
    fetchAdjacent();
  } catch { /* */ } finally { loading.value = false; }
});

onUnmounted(() => observer?.disconnect());

// 监听路由参数变化（SPA 内导航到其他文章）
watch(() => route.params.id, async (newId) => {
  if (!newId) return;
  loading.value = true;
  try {
    const res = await getPublicArticleDetail(newId as string);
    article.value = res.data?.data || res.data;
    tocItems.value = extractTOC(article.value?.content || '');
    await nextTick();
    setupScrollWatch();
    fetchAdjacent();
    window.scrollTo({ top: 0 });
  } catch { /* */ } finally { loading.value = false; }
});

const formatDate = (d: string) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};
</script>

<style scoped>
/* 进度条 */
.reading-progress {
  position: fixed; top: 0; left: 0; height: 3px; background: linear-gradient(90deg, #1e80ff, #67c23a);
  z-index: 200; transition: width .15s linear;
}

.article-page { position: relative; }

/* 正文容器 */
.article-detail-container {
  max-width: 760px; margin: 0 auto; background: #fff; padding: 40px 48px;
  border-radius: 10px; border: 1px solid #f0f0f0;
}
.back-bar { margin-bottom: 24px; }
.article-header { margin-bottom: 28px; text-align: center; }
.title { font-size: 30px; font-weight: 700; color: #1d2129; line-height: 1.4; margin: 0 0 16px; }
.meta-info { display: flex; justify-content: center; gap: 18px; font-size: 13px; color: #8a919f; margin-bottom: 12px; }
.meta-item { display: flex; align-items: center; gap: 4px; }
.tags-box { display: flex; justify-content: center; gap: 6px; }
.tag-item { border: none; background: #f4f5f5; }
.article-banner { width: 100%; height: 340px; border-radius: 8px; overflow: hidden; margin-bottom: 32px; }
.article-banner .el-image { width: 100%; height: 100%; }

/* Markdown 渲染 */
.article-body { color: #2c3e50; font-size: 16px; line-height: 1.85; word-wrap: break-word; }
:deep(.markdown-body) h1, :deep(.markdown-body) h2, :deep(.markdown-body) h3 { color: #1d2129; font-weight: 600; margin-top: 32px; margin-bottom: 14px; scroll-margin-top: 70px; }
:deep(.markdown-body) h1 { font-size: 24px; border-bottom: 1px solid #eef2f5; padding-bottom: 8px; }
:deep(.markdown-body) h2 { font-size: 20px; border-bottom: 1px solid #eef2f5; padding-bottom: 6px; }
:deep(.markdown-body) h3 { font-size: 17px; }
:deep(.markdown-body) p { margin-bottom: 18px; }
:deep(.markdown-body) img { max-width: 100%; height: auto; display: block; margin: 14px auto; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
:deep(.markdown-body) pre { background: #1e1e1e; padding: 16px; overflow: auto; font-size: 14px; line-height: 1.6; border-radius: 6px; margin-bottom: 18px; }
:deep(.markdown-body) blockquote { margin: 16px 0; padding: 0 14px; color: #57606a; border-left: 4px solid #e1e4e6; background: #f8f9fa; border-radius: 0 4px 4px 0; }
:deep(.markdown-body) code:not([class]) { background: rgba(175,184,193,.2); padding: 2px 5px; font-size: 85%; border-radius: 4px; }

/* 上下篇 */
.adjacent-nav { display: flex; max-width: 760px; margin: 32px auto 0; gap: 16px; }
.adjacent-item { flex: 1; background: #fff; border: 1px solid #f0f0f0; border-radius: 8px; padding: 16px 20px; cursor: pointer; transition: all .2s; }
.adjacent-item:hover { border-color: #1e80ff; box-shadow: 0 2px 8px rgba(30,128,255,.1); }
.adjacent-item.next { text-align: right; }
.adj-label { font-size: 12px; color: #8a919f; display: block; margin-bottom: 4px; }
.adj-title { font-size: 14px; color: #1d2129; font-weight: 500; }

/* TOC 侧边栏 */
.toc-sidebar { position: fixed; left: calc(50% + 420px); top: 100px; width: 200px; max-height: calc(100vh - 140px); overflow-y: auto; padding: 0; z-index: 50; }
.toc-title { font-size: 14px; font-weight: 600; color: #1d2129; margin-bottom: 10px; }
.toc-nav { display: flex; flex-direction: column; gap: 2px; }
.toc-link { font-size: 13px; color: #8a919f; text-decoration: none; padding: 4px 8px; border-radius: 4px; transition: all .15s; border-left: 2px solid transparent; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.toc-link:hover { color: #1e80ff; background: #f4f5f5; }
.toc-link.active { color: #1e80ff; font-weight: 500; border-left-color: #1e80ff; background: #e8f3ff; }
.toc-level-2 { padding-left: 18px; font-size: 12px; }
.toc-level-3 { padding-left: 30px; font-size: 12px; }

/* 回到顶部 */
.back-to-top { position: fixed; right: 28px; bottom: 40px; width: 40px; height: 40px; background: #fff; border: 1px solid #e5e6eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.08); z-index: 100; transition: all .2s; }
.back-to-top:hover { border-color: #1e80ff; color: #1e80ff; transform: translateY(-2px); }
.fade-enter-active, .fade-leave-active { transition: opacity .3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 1200px) { .toc-sidebar { display: none; } }
@media (max-width: 768px) {
  .article-detail-container { padding: 20px 16px; }
  .title { font-size: 22px; }
  .article-banner { height: 200px; }
  .adjacent-nav { flex-direction: column; }
}
</style>
