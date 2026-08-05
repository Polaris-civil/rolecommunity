import {
  BookOpen,
  CheckCircle2,
  Eye,
  FilePlus2,
  FileText,
  FolderOpen,
  Layers3,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Tag,
  UploadCloud,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { MarkdownContent } from '../components/MarkdownContent.jsx';
import { Modal } from '../components/Modal.jsx';
import { relativeTime } from '../utils.js';

const emptyEntry = { title: '', content: '', category: '通识', tags: '' };

function KnowledgeForm({ entry, onSubmit, onClose }) {
  const [values, setValues] = useState(entry ? { ...entry, tags: (entry.tags || []).join(', ') } : emptyEntry);
  const [working, setWorking] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setWorking(true);
    try {
      await onSubmit({
        ...values,
        tags: String(values.tags).split(/[,，]/).map((item) => item.trim()).filter(Boolean),
      });
      onClose();
    } finally {
      setWorking(false);
    }
  };

  return (
    <form className="stack-form" onSubmit={submit}>
      <label><span>知识点标题</span><input value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} required /></label>
      <label><span>知识内容</span><textarea className="large-textarea" value={values.content} onChange={(event) => setValues({ ...values, content: event.target.value })} required /></label>
      <div className="form-grid-2">
        <label><span>分类</span><input value={values.category} onChange={(event) => setValues({ ...values, category: event.target.value })} /></label>
        <label><span>标签</span><input value={values.tags} onChange={(event) => setValues({ ...values, tags: event.target.value })} placeholder="MySQL, 索引" /></label>
      </div>
      <footer className="form-actions">
        <button className="button button-ghost" type="button" onClick={onClose}>取消</button>
        <button className="button button-primary" type="submit" disabled={working}>{working ? '保存中…' : '保存条目'}</button>
      </footer>
    </form>
  );
}

function ImportForm({ onImport, onClose }) {
  const [content, setContent] = useState('');
  const [sourceName, setSourceName] = useState('手动粘贴.md');
  const [working, setWorking] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setWorking(true);
    const form = new FormData();
    form.append('content', content);
    form.append('sourceName', sourceName);
    try {
      await onImport(form);
      onClose();
    } finally {
      setWorking(false);
    }
  };
  return (
    <form className="stack-form" onSubmit={submit}>
      <label><span>资料名称</span><input value={sourceName} onChange={(event) => setSourceName(event.target.value)} required /></label>
      <label><span>Markdown / 纯文本</span><textarea className="import-textarea" value={content} onChange={(event) => setContent(event.target.value)} placeholder={'# HTTP 缓存\n\nCache-Control 用于控制…'} required /></label>
      <footer className="form-actions">
        <button className="button button-ghost" type="button" onClick={onClose}>取消</button>
        <button className="button button-primary" type="submit" disabled={working}>{working ? '解析中…' : '清洗并导入'}</button>
      </footer>
    </form>
  );
}

function EntryActions({ entry, generatingId, onView, onEdit, onDelete, onGenerate }) {
  return (
    <div className="row-actions">
      <button className="icon-button" type="button" title="查看全文" aria-label="查看全文" onClick={() => onView(entry)}><Eye size={16} /></button>
      {entry.status === 'pending' && <button className="icon-button" type="button" title="生成帖子" aria-label="生成帖子" disabled={generatingId === entry.id} onClick={() => onGenerate(entry)}><Sparkles size={17} /></button>}
      <button className="icon-button" type="button" title="编辑" aria-label="编辑" onClick={() => onEdit(entry)}><Pencil size={16} /></button>
      <button className="icon-button danger" type="button" title="删除" aria-label="删除" onClick={() => onDelete(entry)}><Trash2 size={16} /></button>
    </div>
  );
}

export function KnowledgePage({ data, query, onImport, onCreate, onUpdate, onDelete, onGenerate }) {
  const fileRef = useRef(null);
  const [status, setStatus] = useState('all');
  const [part, setPart] = useState('all');
  const [group, setGroup] = useState('all');
  const [source, setSource] = useState('all');
  const [category, setCategory] = useState('all');
  const [localSearch, setLocalSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);

  const groups = useMemo(() => [...new Set(data.knowledge.map((entry) => entry.group || '未分类'))].sort((a, b) => a.localeCompare(b, 'zh-CN')), [data.knowledge]);
  const parts = useMemo(() => [...new Set(data.knowledge.map((entry) => entry.part).filter(Boolean))], [data.knowledge]);
  const sources = useMemo(() => {
    const counts = new Map();
    data.knowledge.forEach((entry) => counts.set(entry.source || '未命名资料', (counts.get(entry.source || '未命名资料') || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [data.knowledge]);
  const categories = useMemo(() => {
    const counts = new Map();
    data.knowledge.forEach((entry) => counts.set(entry.category || '通识', (counts.get(entry.category || '通识') || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [data.knowledge]);

  const filtered = useMemo(() => data.knowledge.filter((entry) => {
    const matchesStatus = status === 'all' || entry.status === status;
    const matchesPart = part === 'all' || entry.part === part;
    const matchesGroup = group === 'all' || (entry.group || '未分类') === group;
    const matchesSource = source === 'all' || (entry.source || '未命名资料') === source;
    const matchesCategory = category === 'all' || (entry.category || '通识') === category;
    const haystack = `${entry.title} ${entry.content} ${(entry.tags || []).join(' ')} ${entry.source} ${entry.group || ''} ${entry.section || ''}`.toLowerCase();
    const globalSearch = String(query || '').trim().toLowerCase();
    const localFilter = localSearch.trim().toLowerCase();
    const matchesSearch = (!globalSearch || haystack.includes(globalSearch))
      && (!localFilter || haystack.includes(localFilter));
    return matchesStatus && matchesPart && matchesGroup && matchesSource && matchesCategory && matchesSearch;
  }), [category, data.knowledge, group, localSearch, part, query, source, status]);

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      await onImport(form);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const generate = async (entry) => {
    setGeneratingId(entry.id);
    try {
      await onGenerate({ knowledgeId: entry.id, type: 'discussion' });
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <>
      <header className="page-heading knowledge-heading">
        <div><p className="eyebrow">内容资产 · {sources.length} 个资料源</p><h1>知识资料库</h1><p className="page-subtitle">按资料源、章节和状态组织可发布知识</p></div>
        <div className="heading-actions">
          <button className="button button-ghost" type="button" onClick={() => setPasting(true)}><FilePlus2 size={17} />粘贴资料</button>
          <button className="button button-primary" type="button" onClick={() => setCreating(true)}><Plus size={17} />新建条目</button>
        </div>
      </header>

      <section className="knowledge-stats stats-strip">
        <div><span className="stat-icon ink"><BookOpen size={19} /></span><span><strong>{data.stats.knowledge}</strong><small>知识条目</small></span></div>
        <div><span className="stat-icon amber"><Sparkles size={19} /></span><span><strong>{data.stats.pending}</strong><small>待发布</small></span></div>
        <div><span className="stat-icon green"><CheckCircle2 size={19} /></span><span><strong>{data.stats.knowledge - data.stats.pending}</strong><small>已发布</small></span></div>
      </section>

      <section
        className={`upload-zone ${uploading ? 'is-uploading' : ''}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); uploadFile(event.dataTransfer.files[0]); }}
      >
        <input ref={fileRef} type="file" accept=".pdf,.md,.txt,text/plain,application/pdf" onChange={(event) => uploadFile(event.target.files[0])} hidden />
        <span className="upload-icon"><UploadCloud size={25} /></span>
        <div>
          <strong className="upload-desktop-label">{uploading ? '正在解析资料…' : '拖入或选择 PDF、Markdown、TXT'}</strong>
          <strong className="upload-mobile-label">{uploading ? '正在解析资料…' : '选择资料文件'}</strong>
          <small>手机点击“选择文件”，单个文件最大 15MB</small>
        </div>
        <button className="button button-ghost" type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>选择文件</button>
      </section>

      <section className="knowledge-layout">
        <aside className="knowledge-index">
          <div className="knowledge-index-title"><Layers3 size={16} /><strong>资料索引</strong></div>
          <button className={source === 'all' && category === 'all' && part === 'all' ? 'active' : ''} type="button" onClick={() => { setSource('all'); setCategory('all'); setPart('all'); setGroup('all'); setStatus('all'); setLocalSearch(''); }}><span><Layers3 size={15} />全部条目</span><small>{data.stats.knowledge}</small></button>
          <div className="knowledge-index-label">册次</div>
          {parts.map((item) => <button className={part === item ? 'active' : ''} type="button" key={item} onClick={() => { setPart(item); setSource('all'); }}><span><BookOpen size={15} />{item}</span><small>{data.knowledge.filter((entry) => entry.part === item).length}</small></button>)}
          <div className="knowledge-index-label">资料源</div>
          {sources.slice(0, 10).map(([item, count]) => <button className={source === item ? 'active' : ''} type="button" key={item} onClick={() => { setSource(item); setCategory('all'); }}><span><FolderOpen size={15} />{item}</span><small>{count}</small></button>)}
          <div className="knowledge-index-label">分类</div>
          {categories.map(([item, count]) => <button className={category === item ? 'active' : ''} type="button" key={item} onClick={() => { setCategory(item); setSource('all'); }}><span><Tag size={15} />{item}</span><small>{count}</small></button>)}
        </aside>

        <section className="data-panel">
          <header className="data-toolbar knowledge-toolbar">
            <div className="knowledge-toolbar-row">
              <div className="segmented-control">
                <button className={status === 'all' ? 'active' : ''} type="button" onClick={() => setStatus('all')}>全部 {data.stats.knowledge}</button>
                <button className={status === 'pending' ? 'active' : ''} type="button" onClick={() => setStatus('pending')}>待发布 {data.stats.pending}</button>
                <button className={status === 'published' ? 'active' : ''} type="button" onClick={() => setStatus('published')}>已发布</button>
              </div>
              <label className="toolbar-filter"><span>册次</span><select value={part} onChange={(event) => setPart(event.target.value)}><option value="all">全部册次</option>{parts.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label className="toolbar-filter"><span>公司</span><select value={group} onChange={(event) => setGroup(event.target.value)}><option value="all">全部公司</option>{groups.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            </div>
            <label className="knowledge-local-search"><Search size={15} /><input value={localSearch} onChange={(event) => setLocalSearch(event.target.value)} placeholder="搜索标题、正文、标签" /><small>{filtered.length} 条</small></label>
          </header>

          <div className="knowledge-table-wrap">
            <table className="knowledge-table">
              <thead><tr><th>知识条目</th><th>分类</th><th>来源 / 章节</th><th>状态</th><th>录入时间</th><th aria-label="操作" /></tr></thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id}>
                    <td className="knowledge-entry-cell"><button className="entry-preview-button" type="button" title="查看完整知识" onClick={() => setViewing(entry)}><span className="file-glyph"><FileText size={17} /></span><span className="entry-copy"><strong>{entry.title}</strong><small>{entry.content}</small></span></button></td>
                    <td><span className="table-category">{entry.category}</span></td>
                    <td><span className="source-name">{entry.source}</span><small className="entry-section">{entry.part ? `${entry.part} · ` : ''}{entry.section || entry.group || '未分类'}</small></td>
                    <td><span className={`status-label ${entry.status}`}><i />{entry.status === 'pending' ? '待发布' : '已发布'}</span></td>
                    <td>{relativeTime(entry.createdAt)}</td>
                    <td><EntryActions entry={entry} generatingId={generatingId} onView={setViewing} onEdit={setEditing} onDelete={onDelete} onGenerate={generate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="knowledge-mobile-list">
              {filtered.map((entry) => (
                <article className="knowledge-mobile-card" key={entry.id}>
                  <div className="knowledge-mobile-card-head">
                    <button className="entry-preview-button" type="button" title="查看完整知识" onClick={() => setViewing(entry)}>
                      <span className="file-glyph"><FileText size={17} /></span>
                      <span className="entry-copy"><strong>{entry.title}</strong><small>{entry.content}</small></span>
                    </button>
                    <EntryActions entry={entry} generatingId={generatingId} onView={setViewing} onEdit={setEditing} onDelete={onDelete} onGenerate={generate} />
                  </div>
                  <div className="knowledge-mobile-meta">
                    <span className="table-category">{entry.category}</span>
                    <span className={`status-label ${entry.status}`}><i />{entry.status === 'pending' ? '待发布' : '已发布'}</span>
                    <span className="mobile-source">{entry.part || '资料'} · {entry.group || '综合题库'}</span>
                  </div>
                </article>
              ))}
            </div>
            {!filtered.length && <div className="table-empty"><MoreHorizontal size={25} /><p>没有匹配的知识条目</p></div>}
          </div>
        </section>
      </section>

      {creating && <Modal title="新建知识条目" onClose={() => setCreating(false)}><KnowledgeForm onSubmit={onCreate} onClose={() => setCreating(false)} /></Modal>}
      {editing && <Modal title="编辑知识条目" onClose={() => setEditing(null)}><KnowledgeForm entry={editing} onSubmit={(values) => onUpdate(editing.id, values)} onClose={() => setEditing(null)} /></Modal>}
      {pasting && <Modal title="粘贴资料" wide onClose={() => setPasting(false)}><ImportForm onImport={onImport} onClose={() => setPasting(false)} /></Modal>}
      {viewing && <Modal title={viewing.title} wide onClose={() => setViewing(null)}><article className="knowledge-full-view"><div className="knowledge-full-meta"><span className="table-category">{viewing.category}</span><span>{viewing.part || '资料'}</span><span>{viewing.group || '未分类'}</span><span>{viewing.section || '综合'}</span><span>{viewing.source}</span><span>{viewing.status === 'pending' ? '待发布' : '已发布'}</span></div><MarkdownContent>{viewing.content}</MarkdownContent>{viewing.tags?.length > 0 && <div className="article-tags">{viewing.tags.map((tag) => <span className="tag" key={tag}>#{tag}</span>)}</div>}</article></Modal>}
    </>
  );
}
