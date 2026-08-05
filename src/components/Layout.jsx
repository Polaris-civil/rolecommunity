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
  Users,
  X,
} from '../icons.jsx';
import { useState } from 'react';
import { Avatar } from './Avatar.jsx';

const navigation = [
  { id: 'feed', label: '社区', icon: Home },
  { id: 'knowledge', label: '知识库', icon: BookOpen },
  { id: 'roles', label: 'AI 角色', icon: Users },
  { id: 'automation', label: '自动运营', icon: Bot },
];

export function Layout({ view, setView, query, setQuery, data, likedCount = 0, onOpenModelSettings, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = (id) => {
    setView(id);
    setMobileOpen(false);
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
          <button className="community-switcher" type="button" onClick={() => navigate('feed')}>
            <span className="community-icon"><Brain size={18} /></span>
            <span>
              <strong>面试修炼场</strong>
              <small>{data?.stats?.posts || 0} 篇帖子 · {data?.roles?.length || 0} 位角色</small>
            </span>
            <ChevronDown size={16} />
          </button>
          <p className="community-description">把面试知识变成每天刷得下去的讨论。</p>
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
          <button className="profile-row" type="button">
            <Avatar name="社区管理员" src="https://api.dicebear.com/9.x/initials/svg?seed=RC&backgroundColor=1f1f1f&fontFamily=Arial" />
            <span><strong>社区管理员</strong><small>本地工作区</small></span>
            <ChevronDown size={16} />
          </button>
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
            <button className="icon-button notification-button" type="button" title="通知">
              <Bell size={19} />
              <span />
            </button>
            <button className="icon-button mobile-profile" type="button" title="个人资料"><CircleUserRound size={21} /></button>
          </div>
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
