import { AlertCircle, CheckCircle2, LoaderCircle, X } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, isMobileApp } from './api.js';
import { Layout } from './components/Layout.jsx';
import { ModelSettingsModal } from './components/ModelSettingsModal.jsx';
import { AutomationPage } from './pages/AutomationPage.jsx';
import { FeedPage } from './pages/FeedPage.jsx';
import { KnowledgePage } from './pages/KnowledgePage.jsx';
import { LikedPage } from './pages/LikedPage.jsx';
import { PostDetail } from './pages/PostDetail.jsx';
import { RolesPage } from './pages/RolesPage.jsx';

const LIKED_POSTS_KEY = 'rolecommunity.liked-posts.v1';

function readLikedPostIds() {
  try {
    const value = globalThis.localStorage?.getItem(LIKED_POSTS_KEY);
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeLikedPostIds(ids) {
  try {
    globalThis.localStorage?.setItem(LIKED_POSTS_KEY, JSON.stringify(ids));
  } catch {
    // Likes remain available for the current session when storage is unavailable.
  }
}

export default function App() {
  const [data, setData] = useState(null);
  const [view, setViewState] = useState('feed');
  const [query, setQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [likedPostIds, setLikedPostIds] = useState(readLikedPostIds);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [modelSettingsOpen, setModelSettingsOpen] = useState(false);
  const navigationRef = useRef({ view: 'feed', selectedPost: null, modelSettingsOpen: false });

  const refresh = useCallback(async () => {
    const next = await api.bootstrap();
    setData(next);
    return next;
  }, []);

  useEffect(() => {
    refresh().catch((loadError) => setError(loadError.message));
  }, [refresh]);

  useEffect(() => {
    if (!isMobileApp) return undefined;
    const refreshOnResume = () => refresh().catch((loadError) => setError(loadError.message));
    const handleVisibility = () => {
      if (!document.hidden) refreshOnResume();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', refreshOnResume);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', refreshOnResume);
    };
  }, [refresh]);

  useEffect(() => {
    navigationRef.current = { view, selectedPost, modelSettingsOpen };
  }, [modelSettingsOpen, selectedPost, view]);

  useEffect(() => {
    if (!isMobileApp) return undefined;
    let active = true;
    let listener;
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const navigation = navigationRef.current;
      const modalCloseButton = document.querySelector('.modal-backdrop .modal-header .icon-button');
      if (modalCloseButton) {
        modalCloseButton.click();
        return;
      }
      if (navigation.modelSettingsOpen) {
        setModelSettingsOpen(false);
        return;
      }
      if (navigation.selectedPost) {
        setSelectedPost(null);
        return;
      }
      if (navigation.view !== 'feed') {
        setViewState('feed');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (canGoBack && window.history.length > 1) {
        window.history.back();
        return;
      }
      CapacitorApp.exitApp();
    }).then((handle) => {
      if (active) listener = handle;
      else handle.remove();
    });
    return () => {
      active = false;
      listener?.remove();
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    const available = new Set(data.posts.map((post) => post.id));
    setLikedPostIds((current) => {
      const next = current.filter((id) => available.has(id));
      if (next.length !== current.length) writeLikedPostIds(next);
      return next;
    });
  }, [data]);

  useEffect(() => {
    const shortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector('.global-search input')?.focus();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const notify = (message, type = 'success') => setToast({ message, type });

  const run = async (action, successMessage) => {
    try {
      const result = await action();
      if (successMessage) notify(successMessage);
      return result;
    } catch (actionError) {
      notify(actionError.message, 'error');
      throw actionError;
    }
  };

  const setView = (nextView) => {
    setSelectedPost(null);
    setViewState(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openPost = async (id) => {
    await run(async () => {
      const post = await api.post(id);
      setSelectedPost(post);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const generatePost = async (values) => run(async () => {
    const result = await api.generate(values);
    await refresh();
    setSelectedPost(result.post);
    setViewState('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return result;
  }, '新帖子已发布');

  const updateSelectedPost = async (postId) => {
    const [post] = await Promise.all([api.post(postId), refresh()]);
    setSelectedPost(post);
  };

  const toggleLikedPost = async (postId, active) => {
    const previous = likedPostIds;
    const next = active
      ? [...new Set([...previous, postId])]
      : previous.filter((id) => id !== postId);
    setLikedPostIds(next);
    writeLikedPostIds(next);
    try {
      await api.like(postId, active);
      if (selectedPost?.id === postId) await updateSelectedPost(postId);
      else await refresh();
    } catch (actionError) {
      setLikedPostIds(previous);
      writeLikedPostIds(previous);
      throw actionError;
    }
  };

  if (error) {
    return (
      <main className="fatal-state">
        <span><AlertCircle size={28} /></span>
        <h1>{isMobileApp ? '手机本地数据加载失败' : '无法连接本地服务'}</h1>
        <p>{error}</p>
        <button className="button button-dark" type="button" onClick={() => window.location.reload()}>重新加载</button>
      </main>
    );
  }

  if (!data) {
    return <main className="loading-state"><span className="brand-mark"><LoaderCircle className="spinner" size={21} /></span><strong>正在载入社区</strong></main>;
  }

  let page;
  if (selectedPost) {
    page = (
      <PostDetail
        post={selectedPost}
        roles={data.roles}
        isLiked={likedPostIds.includes(selectedPost.id)}
        onBack={() => setSelectedPost(null)}
        onLike={(id, active) => run(() => toggleLikedPost(id, active))}
        onComment={(id, content) => run(async () => {
          const result = await api.comment(id, { authorName: '社区访客', content });
          await updateSelectedPost(id);
          notify(result.aiReply
            ? (result.isQuestion ? `${result.author.nickname} 已结合正文回答了你的问题` : `${result.author.nickname} 回复了你的评论`)
            : '评论已发布');
        })}
      />
    );
  } else if (view === 'liked') {
    page = (
      <LikedPage
        data={data}
        likedPostIds={likedPostIds}
        onOpenPost={openPost}
        onRemoveLike={(id, active) => run(() => toggleLikedPost(id, active), '已从我的喜欢移除')}
        onBackToFeed={() => setView('feed')}
      />
    );
  } else if (view === 'knowledge') {
    page = (
      <KnowledgePage
        data={data}
        query={query}
        onImport={(form) => run(async () => {
          const result = await api.importKnowledge(form);
          await refresh();
          notify(`已导入 ${result.count} 条知识`);
        })}
        onCreate={(values) => run(async () => { await api.createKnowledge(values); await refresh(); }, '知识条目已创建')}
        onUpdate={(id, values) => run(async () => { await api.updateKnowledge(id, values); await refresh(); }, '知识条目已更新')}
        onDelete={(entry) => {
          if (!window.confirm(`确定删除“${entry.title}”吗？`)) return;
          run(async () => { await api.deleteKnowledge(entry.id); await refresh(); }, '知识条目已删除');
        }}
        onGenerate={generatePost}
      />
    );
  } else if (view === 'roles') {
    page = (
      <RolesPage
        data={data}
        onCreate={(values) => run(async () => { await api.createRole(values); await refresh(); }, 'AI 角色已创建')}
        onUpdate={(id, values) => run(async () => { await api.updateRole(id, values); await refresh(); }, '角色设定已更新')}
        onDelete={(role) => {
          if (!window.confirm(`确定删除“${role.nickname}”吗？`)) return;
          run(async () => { await api.deleteRole(role.id); await refresh(); }, 'AI 角色已删除');
        }}
      />
    );
  } else if (view === 'automation') {
    page = (
      <AutomationPage
        data={data}
        onUpdateSettings={(changes) => run(async () => { await api.updateSettings(changes); await refresh(); })}
        onRun={() => run(async () => {
          const result = await api.runAutomation({});
          await refresh();
          setSelectedPost(result.post);
          setViewState('feed');
        }, '自动发帖完成')}
      />
    );
  } else {
    page = <FeedPage data={data} query={query} onOpenPost={openPost} onGenerate={generatePost} onNavigate={setView} />;
  }

  return (
    <>
      <Layout view={view} setView={setView} query={query} setQuery={setQuery} data={data} likedCount={likedPostIds.length} onOpenModelSettings={() => setModelSettingsOpen(true)}>{page}</Layout>
      {modelSettingsOpen && (
        <ModelSettingsModal
          config={data.llm}
          onClose={() => setModelSettingsOpen(false)}
          onSave={(values) => run(async () => {
            await api.updateLlmConfig(values);
            await refresh();
            notify(values.clearKey ? '已清除本机模型 Key，回到演示生成器' : '模型设置已保存');
          })}
        />
      )}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} title="关闭"><X size={16} /></button>
        </div>
      )}
    </>
  );
}
