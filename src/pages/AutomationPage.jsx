import {
  Activity,
  Bot,
  CalendarClock,
  CheckCircle2,
  FileInput,
  MessageCircleReply,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { relativeTime } from '../utils.js';

const activityIcons = { post: Sparkles, reply: MessageCircleReply, import: FileInput };

export function AutomationPage({ data, onUpdateSettings, onRun }) {
  const [settings, setSettings] = useState(data.settings);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  const save = async (changes) => {
    const next = { ...settings, ...changes };
    setSettings(next);
    setSaving(true);
    try {
      await onUpdateSettings(changes);
    } finally {
      setSaving(false);
    }
  };

  const run = async () => {
    setRunning(true);
    try {
      await onRun();
    } finally {
      setRunning(false);
    }
  };

  const intervalHours = Math.round(24 / Math.max(1, settings.postsPerDay));
  return (
    <>
      <header className="page-heading automation-heading">
        <div><p className="eyebrow">社区引擎</p><h1>自动运营</h1></div>
        <button className="button button-primary" type="button" onClick={run} disabled={running || !data.stats.pending}>
          <Zap size={17} />{running ? '正在生成…' : '立即发帖'}
        </button>
      </header>

      <section className={`automation-status ${settings.autoPostEnabled ? 'is-running' : ''}`}>
        <span className="engine-icon"><Bot size={26} /></span>
        <div><strong>{settings.autoPostEnabled ? '运营引擎正在运行' : '运营引擎已暂停'}</strong><small>{settings.autoPostEnabled ? data.runtime === 'mobile' ? `打开 App 或恢复时检查，约每 ${intervalHours} 小时发布一篇` : `约每 ${intervalHours} 小时发布一篇新帖` : '知识库和社区数据保持不变'}</small></div>
        <button className={`button ${settings.autoPostEnabled ? 'button-ghost' : 'button-dark'}`} type="button" onClick={() => save({ autoPostEnabled: !settings.autoPostEnabled })} disabled={saving}>
          {settings.autoPostEnabled ? <Pause size={16} /> : <Play size={16} />}{settings.autoPostEnabled ? '暂停' : '启动'}
        </button>
      </section>

      <div className="automation-grid">
        <section className="settings-panel">
          <header><span><CalendarClock size={19} /></span><div><h2>发帖计划</h2><p>自动选择待发布知识点和匹配角色</p></div></header>
          <div className="setting-row">
            <span><strong>每天发布</strong><small>均匀分布在角色活跃时段</small></span>
            <div className="stepper">
              <button type="button" title="减少" onClick={() => save({ postsPerDay: Math.max(1, settings.postsPerDay - 1) })}><Minus size={15} /></button>
              <strong>{settings.postsPerDay}<small>篇</small></strong>
              <button type="button" title="增加" onClick={() => save({ postsPerDay: Math.min(12, settings.postsPerDay + 1) })}><Plus size={15} /></button>
            </div>
          </div>
          <div className="setting-row">
            <span><strong>默认帖子形式</strong><small>手动生成时仍可单独选择</small></span>
            <select value={settings.defaultPostType} onChange={(event) => save({ defaultPostType: event.target.value })}>
              <option value="discussion">讨论帖</option><option value="tutorial">教程帖</option><option value="question">问题帖</option><option value="interview">面试帖</option>
            </select>
          </div>
          <div className="schedule-preview">
            {[9, 15, 21].slice(0, Math.min(3, settings.postsPerDay)).map((hour, index) => (
              <div key={hour}><span>{String(hour).padStart(2, '0')}:00</span><i /><small>{index === 0 ? '知识帖' : index === 1 ? '讨论帖' : '晚间复盘'}</small></div>
            ))}
          </div>
        </section>

        <section className="settings-panel">
          <header><span><MessageCircleReply size={19} /></span><div><h2>互动规则</h2><p>角色根据人设参与评论讨论</p></div></header>
          <label className="slider-setting">
            <span><strong>AI 回复概率</strong><em>{Math.round(settings.replyProbability * 100)}%</em></span>
            <input type="range" min="0" max="1" step="0.05" value={settings.replyProbability} onChange={(event) => setSettings({ ...settings, replyProbability: Number(event.target.value) })} onMouseUp={(event) => save({ replyProbability: Number(event.currentTarget.value) })} onTouchEnd={(event) => save({ replyProbability: Number(event.currentTarget.value) })} />
            <small><span>安静</span><span>活跃</span></small>
          </label>
          <div className="setting-row">
            <span><strong>模拟回复延迟</strong><small>将在接入任务队列后生效</small></span>
            <select value={settings.replyDelaySeconds} onChange={(event) => save({ replyDelaySeconds: Number(event.target.value) })}>
              <option value="0">立即</option><option value="8">约 8 秒</option><option value="30">约 30 秒</option><option value="120">约 2 分钟</option>
            </select>
          </div>
          <div className="rule-checks">
            <span><CheckCircle2 size={16} />优先由帖子作者回复</span>
            <span><CheckCircle2 size={16} />保持角色人设一致</span>
            <span><CheckCircle2 size={16} />引用当前帖子上下文</span>
          </div>
        </section>

        <section className="activity-panel">
          <header><div><Activity size={18} /><h2>最近活动</h2></div><button className="icon-button" type="button" title="刷新"><RefreshCw size={16} /></button></header>
          <div className="activity-list">
            {data.activity.map((item) => {
              const Icon = activityIcons[item.type] || Sparkles;
              return <div className="activity-item" key={item.id}><span className={`activity-icon ${item.type}`}><Icon size={16} /></span><span><strong>{item.text}</strong><small>{relativeTime(item.createdAt)}</small></span></div>;
            })}
          </div>
        </section>

        <section className="queue-panel">
          <header><h2>发布队列</h2><span>{data.stats.pending} 条待处理</span></header>
          {data.knowledge.filter((item) => item.status === 'pending').slice(0, 4).map((item, index) => (
            <div className="queue-item" key={item.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><small>{item.category} · {item.source}</small></div></div>
          ))}
          {!data.stats.pending && <div className="queue-empty"><CheckCircle2 size={22} /><p>待发布知识点已清空</p></div>}
        </section>
      </div>
    </>
  );
}
