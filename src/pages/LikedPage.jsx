import { ArrowLeft, Heart, Sparkles } from '../icons.jsx';
import { PostCard } from './FeedPage.jsx';

export function LikedPage({ data, likedPostIds, onOpenPost, onRemoveLike, onBackToFeed }) {
  const liked = data.posts.filter((post) => likedPostIds.includes(post.id));

  return (
    <div className="liked-page">
      <header className="page-heading liked-heading">
        <div>
          <p className="eyebrow"><Heart size={13} /> 面试修炼场 · 个人收藏</p>
          <h1>我的喜欢</h1>
          <p className="page-subtitle">把值得回看的面试讨论集中在这里</p>
        </div>
        <button className="button button-ghost" type="button" onClick={onBackToFeed}><ArrowLeft size={16} />回到社区</button>
      </header>

      <div className="liked-summary">
        <span className="liked-summary-icon"><Sparkles size={18} /></span>
        <span><strong>{liked.length}</strong><small>篇已喜欢的帖子</small></span>
        <span className="liked-summary-note">按最近喜欢的内容浏览</span>
      </div>

      <section className="liked-list" aria-label="我喜欢的帖子">
        {liked.map((post) => <PostCard key={post.id} post={post} onOpen={onOpenPost} onToggleLike={onRemoveLike} />)}
        {!liked.length && (
          <div className="empty-state compact-empty liked-empty">
            <Heart size={28} />
            <h3>还没有喜欢的帖子</h3>
            <p>在帖子详情里点亮心形，这里会收好它。</p>
            <button className="button button-ghost button-small" type="button" onClick={onBackToFeed}><ArrowLeft size={15} />去看看社区</button>
          </div>
        )}
      </section>
    </div>
  );
}
