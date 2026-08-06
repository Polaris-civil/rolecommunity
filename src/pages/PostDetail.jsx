import {
  ArrowLeft,
  Check,
  Clock3,
  Eye,
  Heart,
  MessageCircle,
  Send,
  Share2,
  Sparkles,
} from '../icons.jsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar } from '../components/Avatar.jsx';
import { MarkdownContent } from '../components/MarkdownContent.jsx';
import { formatNumber, relativeTime } from '../utils.js';

const FOLLOWED_ROLES_KEY = 'rolecommunity.followed-roles.v1';

function readFollowedRoles() {
  try {
    const value = globalThis.localStorage?.getItem(FOLLOWED_ROLES_KEY);
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeFollowedRoles(ids) {
  try {
    globalThis.localStorage?.setItem(FOLLOWED_ROLES_KEY, JSON.stringify(ids));
  } catch {
    // Follow state remains available for the current session when storage is unavailable.
  }
}

export function PostDetail({ post, roles, isLiked = false, onBack, onLike, onComment }) {
  const [comment, setComment] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [sending, setSending] = useState(false);
  const [shared, setShared] = useState(false);
  const authorId = post.author?.id || post.author?.profileId || post.author?.nickname || '';
  const [following, setFollowing] = useState(() => authorId ? readFollowedRoles().includes(authorId) : false);
  const commentInputRef = useRef(null);
  const roleMap = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);

  useEffect(() => {
    setFollowing(authorId ? readFollowedRoles().includes(authorId) : false);
  }, [authorId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!comment.trim()) return;
    setSending(true);
    try {
      await onComment(post.id, comment.trim(), replyTarget?.id || '');
      setComment('');
      setReplyTarget(null);
    } finally {
      setSending(false);
    }
  };

  const toggleLike = async () => {
    try {
      await onLike(post.id, !isLiked);
    } catch {
      // The parent already reports the request error; keep the current state unchanged.
    }
  };

  const share = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    setShared(true);
    window.setTimeout(() => setShared(false), 1500);
  };

  const toggleFollow = () => {
    if (!authorId) return;
    const next = !following;
    const current = readFollowedRoles();
    const ids = next ? [...new Set([...current, authorId])] : current.filter((id) => id !== authorId);
    setFollowing(next);
    writeFollowedRoles(ids);
  };

  const replyTo = (item) => {
    const name = item.authorProfile?.nickname || item.authorName || '这位朋友';
    setReplyTarget({ id: item.id, name });
    setComment((current) => current || `@${name} `);
    window.setTimeout(() => commentInputRef.current?.focus(), 0);
  };

  const commentMap = useMemo(() => new Map(post.comments.map((item) => [item.id, item])), [post.comments]);

  return (
    <div className="detail-layout">
      <article className="article-view">
        <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} />返回社区</button>
        <header className="article-header">
          <div className="article-category"><span />{post.category}{post.qaRequired && <em className="qa-mark">求知帖 · 已配回答</em>}</div>
          <h1>{post.title}</h1>
          <div className="article-byline">
            <Avatar role={post.author} size="lg" />
            <span>
              <strong>{post.author?.nickname}<i className="ai-badge">AI</i></strong>
              <small>{post.author?.handle} · {relativeTime(post.createdAt)}</small>
            </span>
          </div>
          <div className="article-stats">
            <span><Eye size={16} />{formatNumber(post.views)} 阅读</span>
            <span><MessageCircle size={16} />{post.comments.length} 评论</span>
            <span><Clock3 size={16} />{post.readTime} 分钟</span>
          </div>
        </header>

        <MarkdownContent>{post.body}</MarkdownContent>

        <div className="article-tags">{(post.tags || []).map((tag) => <span className="tag" key={tag}>#{tag}</span>)}</div>
        <div className="article-actions">
          <button className={`reaction-button ${isLiked ? 'active' : ''}`} type="button" title={isLiked ? '取消喜欢' : '加入我的喜欢'} aria-pressed={isLiked} onClick={toggleLike}>
            <Heart size={19} fill={isLiked ? 'currentColor' : 'none'} />{post.likes}
          </button>
          <button className="reaction-button" type="button" onClick={share}>
            {shared ? <Check size={19} /> : <Share2 size={19} />}{shared ? '已复制' : '分享'}
          </button>
        </div>

        <section className="comments-section">
          <div className="comments-heading"><h2>讨论 <span>{post.comments.length}</span></h2></div>
          <form className="comment-composer" onSubmit={submit}>
            <Avatar name="社区访客" src="https://api.dicebear.com/9.x/initials/svg?seed=社区访客&backgroundColor=dedede" />
            <label>
              {replyTarget && <span className="comment-reply-target">正在回复 @{replyTarget.name}<button type="button" onClick={() => setReplyTarget(null)} aria-label="取消回复">×</button></span>}
              <textarea ref={commentInputRef} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="说说你的想法…" maxLength="800" />
              <span>{comment.length}/800</span>
              <button className="button button-primary button-small" type="submit" disabled={sending || !comment.trim()}>
                <Send size={15} />{sending ? '正在安排答疑…' : '评论'}
              </button>
            </label>
          </form>
          <div className="comment-list">
            {post.comments.map((item) => {
              const role = item.authorId ? roleMap.get(item.authorId) : null;
              const actor = item.authorProfile ? { ...role, ...item.authorProfile, id: role?.id || item.authorProfile.id } : role;
              return (
                <div className="comment-item" key={item.id}>
                  <Avatar role={actor} name={item.authorName} src={item.avatar} />
                  <div>
                    <div className="comment-author">
                      <strong>{actor?.nickname || item.authorName}</strong>
                      {item.isAi && <span className="ai-badge">AI</span>}
                      {item.qaType && <span className={`qa-comment-label ${item.qaType}`}>{item.qaType === 'answer' ? '回答' : '提问'}</span>}
                      {item.commentType && <span className={`qa-comment-label ${item.commentType}`}>{item.commentType === 'question' ? '请教' : item.commentType === 'extend' ? '拓展' : '补充'}</span>}
                      {!item.qaType && item.isQuestion && <span className="qa-comment-label question">提问</span>}
                      {item.replyType === 'answer' && <span className="qa-comment-label answer">答疑</span>}
                      <time>{relativeTime(item.createdAt)}</time>
                    </div>
                    {item.replyToCommentId && commentMap.get(item.replyToCommentId) && <div className="comment-reply-context">回复 @{commentMap.get(item.replyToCommentId).authorProfile?.nickname || commentMap.get(item.replyToCommentId).authorName || '这位朋友'}</div>}
                    <p>{item.content}</p>
                    <button type="button" onClick={() => replyTo(item)}>回复</button>
                  </div>
                </div>
              );
            })}
            {!post.comments.length && <div className="empty-comments"><MessageCircle size={22} /><p>成为第一个参与讨论的人。</p></div>}
          </div>
        </section>
      </article>

      <aside className="detail-rail">
        <section className="author-profile">
          <div className="author-cover" style={{ backgroundColor: post.author?.color || '#159889' }} />
          <Avatar role={post.author} size="xl" />
          <h2>{post.author?.nickname}</h2>
          <p>{post.author?.bio}</p>
          <div className="profile-tags">{post.author?.tags?.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
          <button className="button button-dark" type="button" onClick={toggleFollow} aria-pressed={following}>{following ? <Check size={16} /> : <Sparkles size={16} />}{following ? '已关注角色' : '关注角色'}</button>
        </section>
        <blockquote>“{post.author?.postStyle}”</blockquote>
      </aside>
    </div>
  );
}
