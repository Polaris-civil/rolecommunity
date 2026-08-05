import {
  Bell,
  BookOpen,
  Brain,
  Bot,
  ChevronDown,
  CircleUserRound,
  Heart,
  Home,
  Menu,
  Search,
  Settings2,
  Sparkles,
  RefreshCw,
  Users,
  X,
} from '../icons.jsx';
import { useEffect, useState } from 'react';
import { Avatar } from './Avatar.jsx';
import { relativeTime } from '../utils.js';

const navigation = [
  { id: 'feed', label: '社区', icon: Home },
  { id: 'knowledge', label: '知识库', icon: BookOpen },
  { id: 'roles', label: 'AI 角色', icon: Users },
  { id: 'automation', label: '自动运营', icon: Bot },
];

function ProfileMenu({ data, likedCount, updateInfo, className, onNavigate, onOpenModelSettings, onOpenUpdates, onClose }) {
  return (
    <section className={`profile-popover ${className || ''}`.trim()} role="dialog" aria-label="个人资料">
      <header className="profile-popover-head">
        <Avatar name="社区管理员" src="https://api.dicebear.com/9.x/initials/svg?seed=RC&backgroundColor=1f1f1f&fontFamily=Arial" size="lg" />
        <span><strong>社区管理员</strong><small>本地工作区</small></span>
        <button className="icon-button" type="button" onClick={onClose} title="关闭个人资料"><X size={16} /></button>
      </header>
      <div className="profile-stats">
        <span><strong>{data?.stats?.posts || 0}</strong><small>帖子</small></span>
        <span><strong>{likedCount}</strong><small>喜欢</small></span>
        <span><strong>{data?.stats?.knowledge || 0}</strong><small>知识条目</small></span>
      </div>
      <div className="profile-actions">
        <button type="button" onClick={() => onNavigate('liked')}><Heart size={16} /><span>我的喜欢</span><small>{likedCount}</small></button>
        <button type="button" onClick={onOpenModelSettings}><Settings2 size={16} /><span>模型设置</span></button>
        <button type="button" onClick={onOpenUpdates}><RefreshCw size={16} /><span>应用更新</span><small>{updateInfo?.status === 'available' ? `v${updateInfo.manifest.version}` : ''}</small></button>
      </div>
      <p className="profile-note">这是当前设备上的本地工作区，无需注册登录。</p>
    </section>
  );
}

function KnowledgeBaseMenu({ knowledgeBases = [], activeId, onSelect }) {
  return (
    <div className="knowledge-base-menu" role="menu" aria-label="切换知识库">
      <div className="knowledge-base-menu-heading"><span>当前社区</span><small>{knowledgeBases.length} 个知识库</small></div>
      {knowledgeBases.map((base) => (
        <button className={base.id === activeId ? 'active' : ''} type="button" role="menuitem" key={base.id} onClick={() => onSelect(base.id)}>
          <span className="knowledge-base-dot" style={{ background: base.color || '#4777c6' }} />
          <span><strong>{base.name}</strong><small>{base.description || '独立知识社区'}</small></span>
          <small>{base.id === activeId ? '当前' : ''}</small>
        </button>
      ))}
    </div>
  );
}

function NotificationPanel({ data, onNavigate, onClose }) {
  const activity = (data?.activity || []).slice(0, 4);
  return (
    <section className="notification-panel" role="dialog" aria-label="最近活动">
      <header><strong>最近活动</strong><button className="icon-button" type="button" onClick={onClose} title="关闭通知"><X size={16} /></button></header>
      {activity.length ? activity.map((item) => (
        <div className="notification-item" key={item.id}>
          <span className="notification-item-dot" />
          <span><strong>{item.text}</strong><small>{relativeTime(item.createdAt)}</small></span>
        </div>
      )) : <p className="notification-empty">暂时没有新的社区活动。</p>}
      <button className="notification-footer" type="button" onClick={() => onNavigate('automation')}>查看自动运营活动</button>
    </section>
  );
}

export function Layout({ view, setView, query, setQuery, data, knowledgeBases = [], activeKnowledgeBaseId, onSwitchKnowledgeBase, likedCount = 0, updateInfo, onOpenModelSettings, onOpenUpdates, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [knowledgeBaseOpen, setKnowledgeBaseOpen] = useState(false);
  const navigate = (id) => {
    setView(id);
    setMobileOpen(false);
    setProfileAnchor(null);
    setNotificationOpen(false);
    setKnowledgeBaseOpen(false);
  };

  useEffect(() => {
    if (!profileAnchor && !notificationOpen && !knowledgeBaseOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (event.target.closest('.profile-trigger, .profile-popover, .notification-trigger, .notification-panel, .community-switcher, .knowledge-base-menu')) return;
      setProfileAnchor(null);
      setNotificationOpen(false);
      setKnowledgeBaseOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileAnchor(null);
        setNotificationOpen(false);
        setKnowledgeBaseOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [knowledgeBaseOpen, notificationOpen, profileAnchor]);

  const toggleProfile = (anchor) => {
    setNotificationOpen(false);
    setKnowledgeBaseOpen(false);
    setProfileAnchor((current) => (current === anchor ? null : anchor));
  };

  const toggleNotifications = () => {
    setProfileAnchor(null);
    setKnowledgeBaseOpen(false);
    setNotificationOpen((current) => !current);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <button className="brand" type="button" onClick={() => navigate('feed')}>
            <span className="brand-mark"><Brain size={19} /></span>
            <span>RoleCommunity</span>
          </button>
          <button className="icon-button sidebar-close" type="button" onClick={() => setMobileOpen(false)} title="关闭菜单">
            <X size={20} />
          </button>
        </div>

        <nav className="primary-nav" aria-label="主导航">
          <p className="nav-label">工作台</p>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={`nav-item ${view === item.id ? 'active' : ''}`}
                type="button"
                key={item.id}
                onClick={() => navigate(item.id)}
              >
                <Icon size={19} strokeWidth={1.9} />
                <span>{item.label}</span>
                {item.id === 'knowledge' && <span className="nav-count">{data?.stats?.pending || 0}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-community">
          <p className="nav-label">当前社区</p>
          <button className="community-switcher" type="button" aria-expanded={knowledgeBaseOpen} onClick={() => { setProfileAnchor(null); setNotificationOpen(false); setKnowledgeBaseOpen((current) => !current); }}>
            <span className="community-icon"><Brain size={18} /></span>
            <span>
              <strong>{data?.currentKnowledgeBase?.name || '当前知识库'}</strong>
              <small>{data?.stats?.posts || 0} 篇帖子 · {data?.roles?.length || 0} 位角色</small>
            </span>
            <ChevronDown className={knowledgeBaseOpen ? 'chevron-open' : ''} size={16} />
          </button>
          {knowledgeBaseOpen && <KnowledgeBaseMenu knowledgeBases={knowledgeBases} activeId={activeKnowledgeBaseId} onSelect={(id) => { setKnowledgeBaseOpen(false); setMobileOpen(false); onSwitchKnowledgeBase?.(id); }} />}
          <p className="community-description">{data?.currentKnowledgeBase?.description || '把知识变成每天刷得下去的讨论。'}</p>
          <div className="community-links">
            <button className={`community-link ${view === 'feed' ? 'active' : ''}`} type="button" onClick={() => navigate('feed')}>
              <Home size={16} /><span>帖子广场</span>
            </button>
            <button className={`community-link ${view === 'liked' ? 'active' : ''}`} type="button" onClick={() => navigate('liked')}>
              <Heart size={16} /><span>我的喜欢</span><small>{likedCount}</small>
            </button>
            <button className={`community-link ${view === 'knowledge' ? 'active' : ''}`} type="button" onClick={() => navigate('knowledge')}>
              <BookOpen size={16} /><span>知识资料库</span><small>{data?.stats?.knowledge || 0}</small>
            </button>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="ai-status-row">
            <span className={`status-dot ${data?.settings?.autoPostEnabled ? 'is-live' : ''}`} />
            <span>{data?.settings?.autoPostEnabled ? '自动运营中' : '自动运营已暂停'}</span>
          </div>
          <button className="profile-row profile-trigger" type="button" onClick={() => toggleProfile('sidebar')} aria-expanded={profileAnchor === 'sidebar'}>
            <Avatar name="社区管理员" src="https://api.dicebear.com/9.x/initials/svg?seed=RC&backgroundColor=1f1f1f&fontFamily=Arial" />
            <span><strong>社区管理员</strong><small>本地工作区</small></span>
            <ChevronDown size={16} />
          </button>
          {profileAnchor === 'sidebar' && <ProfileMenu className="profile-popover-sidebar" data={data} likedCount={likedCount} updateInfo={updateInfo} onNavigate={navigate} onOpenModelSettings={() => { setProfileAnchor(null); onOpenModelSettings(); }} onOpenUpdates={() => { setProfileAnchor(null); onOpenUpdates(); }} onClose={() => setProfileAnchor(null)} />}
        </div>
      </aside>

      {mobileOpen && <button className="sidebar-scrim" type="button" onClick={() => setMobileOpen(false)} aria-label="关闭菜单" />}

      <div className="workspace">
        <header className="topbar">
          <button className="icon-button menu-button" type="button" onClick={() => setMobileOpen(true)} title="打开菜单">
            <Menu size={21} />
          </button>
          <label className="global-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索帖子、标签或知识点" />
            <kbd>⌘ K</kbd>
          </label>
          <div className="topbar-actions">
            <button className="ai-mode ai-mode-button" type="button" onClick={onOpenModelSettings} title="打开模型设置"><Sparkles size={14} /> {data?.runtime === 'mobile' ? data?.aiMode === 'llm' ? '手机 LLM 已配置' : '手机演示生成器' : data?.aiMode === 'llm' ? 'LLM 已配置' : '演示生成器'}</button>
            <button className="icon-button model-settings-button" type="button" onClick={onOpenModelSettings} title="模型设置"><Settings2 size={19} /></button>
            <button className="icon-button notification-button notification-trigger" type="button" title="通知" aria-expanded={notificationOpen} onClick={toggleNotifications}>
              <Bell size={19} />
              <span />
            </button>
            <button className="icon-button mobile-profile profile-trigger" type="button" title="个人资料" aria-expanded={profileAnchor === 'topbar'} onClick={() => toggleProfile('topbar')}><CircleUserRound size={21} /></button>
          </div>
          {notificationOpen && <NotificationPanel data={data} onNavigate={navigate} onClose={() => setNotificationOpen(false)} />}
          {profileAnchor === 'topbar' && <ProfileMenu className="profile-popover-topbar" data={data} likedCount={likedCount} updateInfo={updateInfo} onNavigate={navigate} onOpenModelSettings={() => { setProfileAnchor(null); onOpenModelSettings(); }} onOpenUpdates={() => { setProfileAnchor(null); onOpenUpdates(); }} onClose={() => setProfileAnchor(null)} />}
        </header>
        <main className="page-content">{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="移动端导航">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button className={view === item.id ? 'active' : ''} type="button" key={item.id} onClick={() => navigate(item.id)}>
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
