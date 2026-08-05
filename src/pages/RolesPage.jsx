import { Clock3, MessageCircleReply, MoreHorizontal, Pencil, Plus, Sparkles, Trash2 } from '../icons.jsx';
import { useState } from 'react';
import { Avatar } from '../components/Avatar.jsx';
import { Modal } from '../components/Modal.jsx';

const blankRole = {
  nickname: '', handle: '', bio: '', persona: '', postStyle: '', replyStyle: '', tags: '', activeHours: '09:00-22:00', replyProbability: 0.75,
};

function RoleForm({ role, onSubmit, onClose }) {
  const [values, setValues] = useState(role ? { ...role, tags: (role.tags || []).join(', ') } : blankRole);
  const [working, setWorking] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setWorking(true);
    try {
      await onSubmit({ ...values, tags: String(values.tags).split(/[,，]/).map((item) => item.trim()).filter(Boolean) });
      onClose();
    } finally {
      setWorking(false);
    }
  };
  return (
    <form className="stack-form" onSubmit={submit}>
      <div className="form-grid-2">
        <label><span>昵称</span><input value={values.nickname} onChange={(event) => setValues({ ...values, nickname: event.target.value })} required /></label>
        <label><span>账号名</span><input value={values.handle} onChange={(event) => setValues({ ...values, handle: event.target.value })} placeholder="@role_name" /></label>
      </div>
      <label><span>一句话介绍</span><input value={values.bio} onChange={(event) => setValues({ ...values, bio: event.target.value })} /></label>
      <label><span>角色人设 Prompt</span><textarea value={values.persona} onChange={(event) => setValues({ ...values, persona: event.target.value })} required /></label>
      <div className="form-grid-2">
        <label><span>发帖风格</span><textarea value={values.postStyle} onChange={(event) => setValues({ ...values, postStyle: event.target.value })} /></label>
        <label><span>回复风格</span><textarea value={values.replyStyle} onChange={(event) => setValues({ ...values, replyStyle: event.target.value })} /></label>
      </div>
      <div className="form-grid-2">
        <label><span>擅长标签</span><input value={values.tags} onChange={(event) => setValues({ ...values, tags: event.target.value })} placeholder="前端, 面试" /></label>
        <label><span>活跃时段</span><input value={values.activeHours} onChange={(event) => setValues({ ...values, activeHours: event.target.value })} /></label>
      </div>
      <label className="range-field">
        <span>回复概率 <strong>{Math.round(Number(values.replyProbability) * 100)}%</strong></span>
        <input type="range" min="0" max="1" step="0.05" value={values.replyProbability} onChange={(event) => setValues({ ...values, replyProbability: Number(event.target.value) })} />
      </label>
      <footer className="form-actions">
        <button className="button button-ghost" type="button" onClick={onClose}>取消</button>
        <button className="button button-primary" type="submit" disabled={working}>{working ? '保存中…' : '保存角色'}</button>
      </footer>
    </form>
  );
}

export function RolesPage({ data, onCreate, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  return (
    <>
      <header className="page-heading roles-heading">
        <div><p className="eyebrow">虚拟用户群</p><h1>AI 角色</h1></div>
        <button className="button button-primary" type="button" onClick={() => setCreating(true)}><Plus size={17} />创建角色</button>
      </header>

      <div className="role-grid">
        {data.roles.map((role) => {
          const postCount = data.posts.filter((post) => post.authorId === role.id).length;
          return (
            <article className="role-card" key={role.id}>
              <div className="role-accent" style={{ backgroundColor: role.color }} />
              <header>
                <Avatar role={role} size="xl" />
                <div className="role-actions">
                  <button className="icon-button" type="button" title="编辑角色" onClick={() => setEditing(role)}><Pencil size={16} /></button>
                  <button className="icon-button danger" type="button" title="删除角色" onClick={() => onDelete(role)}><Trash2 size={16} /></button>
                </div>
              </header>
              <h2>{role.nickname}<span className="ai-badge">AI</span></h2>
              <span className="role-handle">{role.handle}</span>
              <p>{role.bio}</p>
              <div className="role-tags">{role.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <dl>
                <div><dt><Clock3 size={16} />活跃时间</dt><dd>{role.activeHours}</dd></div>
                <div><dt><MessageCircleReply size={16} />回复概率</dt><dd>{Math.round(role.replyProbability * 100)}%</dd></div>
                <div><dt><Sparkles size={16} />已发布</dt><dd>{postCount} 篇</dd></div>
              </dl>
              <div className="persona-quote">{role.persona}</div>
            </article>
          );
        })}
        <button className="add-role-card" type="button" onClick={() => setCreating(true)}>
          <span><Plus size={22} /></span><strong>创建新角色</strong><small>扩充社区虚拟用户群</small>
        </button>
      </div>

      {creating && <Modal title="创建 AI 角色" wide onClose={() => setCreating(false)}><RoleForm onSubmit={onCreate} onClose={() => setCreating(false)} /></Modal>}
      {editing && <Modal title="编辑 AI 角色" wide onClose={() => setEditing(null)}><RoleForm role={editing} onSubmit={(values) => onUpdate(editing.id, values)} onClose={() => setEditing(null)} /></Modal>}
    </>
  );
}
