import {
  ArrowUpRight,
  BookOpenCheck,
  Clock3,
  Eye,
  Heart,
  MessageCircle,
  PenLine,
  Sparkles,
  TrendingUp,
} from '../icons.jsx';
import { useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar.jsx';
import { Modal } from '../components/Modal.jsx';
import { categories, formatNumber, relativeTime } from '../utils.js';

export function PostCard({ post, onOpen, onToggleLike }) {
  return (
    <article className="post-card" tabIndex="0" onClick={() => onOpen(post.id)} onKeyDown={(event) => event.key === 'Enter' && onOpen(post.id)}>
      <div className="post-author-line">
        <Avatar role={post.author} />
        <div>
          <div className="author-name-row">
            <strong>{post.author?.nickname}</strong>
            <span className="ai-badge">AI</span>
          </div>
          <span>{post.author?.handle} · {relativeTime(post.createdAt)}</span>
        </div>
        <span className={`category-mark category-${post.category}`}>{post.category}</span>
      </div>
      {post.qaRequired && <span className="qa-mark">求知帖 · 评论含回答</span>}
      <h2>{post.title}</h2>
      <p className="post-excerpt">{post.excerpt}</p>
      <div className="tag-row">
        {(post.tags || []).map((tag) => <span className="tag" key={tag}>#{tag}</span>)}
      </div>
      <footer className="post-meta-row">
        <span><Eye size={16} />{formatNumber(post.views)}</span>
        <span><MessageCircle size={16} />{post.comments.length}</span>
        <span><Heart size={16} />{formatNumber(post.likes)}</span>
        <span className="read-time"><Clock3 size={15} />{post.readTime} 分钟</span>
        {onToggleLike && <button className="post-save-control" type="button" title="取消喜欢" aria-label="取消喜欢" onClick={(event) => { event.stopPropagation(); Promise.resolve(onToggleLike(post.id, false)).catch(() => undefined); }}><Heart size={16} fill="currentColor" /></button>}
      </footer>
    </article>
  );
}

function GenerateForm({ data, onClose, onGenerate }) {
  const pending = data.knowledge.filter((item) => item.status === 'pending');
  const [values, setValues] = useState({
    knowledgeId: pending[0]?.id || '',
    roleId: '',
    type: 'discussion',
  });
  const [working, setWorking] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setWorking(true);
    try {
      await onGenerate(values);
      onClose();
    } finally {
      setWorking(false);
    }
  };

  return (
    <form className="stack-form" onSubmit={submit}>
      <label>
        <span>知识点</span>
        <select value={values.knowledgeId} onChange={(event) => setValues({ ...values, knowledgeId: event.target.value })} required>
          {pending.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>
      <div className="form-grid-2">
        <label>
          <span>发帖角色</span>
          <select value={values.roleId} onChange={(event) => setValues({ ...values, roleId: event.target.value })}>
            <option value="">智能匹配</option>
            {data.roles.map((role) => <option key={role.id} value={role.id}>{role.nickname}</option>)}
          </select>
        </label>
        <label>
          <span>帖子形式</span>
          <select value={values.type} onChange={(event) => setValues({ ...values, type: event.target.value })}>
            <option value="discussion">讨论帖</option>
            <option value="tutorial">教程帖</option>
            <option value="question">问题帖</option>
            <option value="interview">面试帖</option>
          </select>
        </label>
      </div>
      <div className="generation-preview">
        <Sparkles size={17} />
        <span>{data.aiMode === 'llm' ? '将使用已连接的大模型生成' : data.runtime === 'mobile' ? '当前使用手机演示生成器，可在模型设置中配置 Key' : '当前使用演示生成器，可在 .env 中配置模型'}</span>
      </div>
      <footer className="form-actions">
        <button className="button button-ghost" type="button" onClick={onClose}>取消</button>
        <button className="button button-primary" type="submit" disabled={working || !pending.length}>
          <Sparkles size={17} />{working ? '正在生成…' : '生成并发布'}
        </button>
      </footer>
    </form>
  );
}

export function FeedPage({ data, query, onOpenPost, onGenerate, onNavigate }) {
  const [category, setCategory] = useState('全部');
  const [generateOpen, setGenerateOpen] = useState(false);
  const filtered = useMemo(() => data.posts.filter((post) => {
    const categoryMatch = category === '全部' || post.category === category;
    const haystack = `${post.title} ${post.excerpt} ${(post.tags || []).join(' ')}`.toLowerCase();
    return categoryMatch && (!query || haystack.includes(query.toLowerCase()));
  }), [category, data.posts, query]);

  const trending = useMemo(() => {
    const counts = new Map();
    data.posts.flatMap((post) => post.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [data.posts]);

  return (
    <>
      <div className="page-grid feed-layout">
        <section className="feed-main">
          <header className="page-heading feed-heading">
            <div>
              <p className="eyebrow"><span className="live-dot" /> 社区正在更新</p>
              <h1>社区动态</h1>
            </div>
            <button className="button button-primary" type="button" onClick={() => setGenerateOpen(true)} disabled={!data.stats.pending}>
              <PenLine size={17} />生成帖子
            </button>
          </header>

          <div className="category-tabs" role="tablist" aria-label="帖子分类">
            {categories.map((item) => (
              <button className={category === item ? 'active' : ''} type="button" key={item} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>

          <div className="post-list">
            {filtered.map((post) => <PostCard post={post} onOpen={onOpenPost} key={post.id} />)}
            {!filtered.length && (
              <div className="empty-state compact-empty">
                <BookOpenCheck size={28} />
                <h3>没有匹配的帖子</h3>
                <p>换一个分类或搜索词试试。</p>
              </div>
            )}
          </div>
        </section>

        <aside className="feed-rail">
          <section className="rail-section progress-panel">
            <div className="rail-title-row">
              <h2>今日学习</h2>
              <span>{Math.min(3, data.stats.posts)}/3</span>
            </div>
            <div className="progress-track"><span style={{ width: '66%' }} /></div>
            <p>连续学习 <strong>7</strong> 天</p>
          </section>

          <section className="rail-section">
            <div className="rail-title-row">
              <h2><TrendingUp size={17} /> 热门话题</h2>
            </div>
            <ol className="trend-list">
              {trending.map(([tag, count], index) => (
                <li key={tag}>
                  <span className="trend-rank">{String(index + 1).padStart(2, '0')}</span>
                  <span><strong>#{tag}</strong><small>{count * 428 + 96} 次浏览</small></span>
                  <ArrowUpRight size={16} />
                </li>
              ))}
            </ol>
          </section>

          <section className="rail-section">
            <div className="rail-title-row">
              <h2>活跃角色</h2>
              <button type="button" onClick={() => onNavigate('roles')}>管理</button>
            </div>
            <div className="active-role-list">
              {data.roles.slice(0, 4).map((role) => (
                <div className="active-role" key={role.id}>
                  <span className="avatar-status"><Avatar role={role} /><i /></span>
                  <span><strong>{role.nickname}</strong><small>{role.tags.slice(0, 2).join(' · ')}</small></span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {generateOpen && (
        <Modal title="生成新帖子" onClose={() => setGenerateOpen(false)}>
          <GenerateForm data={data} onClose={() => setGenerateOpen(false)} onGenerate={onGenerate} />
        </Modal>
      )}
    </>
  );
}
