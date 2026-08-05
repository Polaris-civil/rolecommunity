import { AlertCircle, CheckCircle2, Download, ExternalLink, LoaderCircle, RefreshCw, Save, ShieldCheck, WifiOff } from '../icons.jsx';
import { useState } from 'react';
import { Modal } from './Modal.jsx';

function formatCheckedAt(value) {
  if (!value) return '尚未检查';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '尚未检查' : `上次检查：${date.toLocaleString()}`;
}

export function UpdateSettingsModal({ currentVersion, settings, result, checking, onCheck, onSave, onInstall, onClose }) {
  const [values, setValues] = useState({
    manifestUrl: settings?.manifestUrl || '',
    autoCheck: settings?.autoCheck !== false,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(values);
    } finally {
      setSaving(false);
    }
  };

  const available = result?.status === 'available' && result.manifest;
  const current = result?.status === 'current';
  const offline = result?.status === 'offline';
  const notConfigured = result?.status === 'not-configured';

  return (
    <Modal title="应用更新" wide onClose={onClose}>
      <div className={`update-status-card ${available ? 'is-available' : ''} ${offline ? 'is-offline' : ''}`}>
        <span className="update-status-icon">
          {available ? <Download size={19} /> : offline ? <WifiOff size={19} /> : current ? <CheckCircle2 size={19} /> : <RefreshCw size={19} />}
        </span>
        <div>
          <strong>{available ? `发现新版本 v${result.manifest.version}` : offline ? '暂时无法连接更新服务' : current ? '当前已是最新版本' : notConfigured ? '尚未配置更新地址' : '准备检查更新'}</strong>
          <small>当前版本 v{currentVersion} · {formatCheckedAt(result?.checkedAt || settings?.lastCheckedAt)}</small>
        </div>
        <button className="button button-ghost button-small" type="button" onClick={() => onCheck(values.manifestUrl)} disabled={checking}>
          <RefreshCw className={checking ? 'spinner' : ''} size={14} />{checking ? '检查中…' : '立即检查'}
        </button>
      </div>

      {available && (
        <section className="update-release-card">
          <header><strong>更新内容</strong><span>版本码 {result.manifest.versionCode}</span></header>
          <p>{result.manifest.notes || '该版本没有附加更新说明。'}</p>
          {result.manifest.sha256 && <small className="update-checksum">SHA-256：{result.manifest.sha256}</small>}
          <button className="button button-primary" type="button" onClick={onInstall}><Download size={16} />下载并安装</button>
        </section>
      )}

      {offline && <div className="update-inline-note update-inline-note-warning"><AlertCircle size={15} /><span>{result.error || '请确认手机联网，或稍后再试。离线内容不会受到影响。'}</span></div>}
      {notConfigured && <div className="update-inline-note"><ShieldCheck size={15} /><span>不配置地址时完全离线运行；配置自己的清单地址后，联网时才会检查更新。</span></div>}

      <form className="stack-form update-settings-form" onSubmit={submit}>
        <label>
          <span>自托管更新清单 URL</span>
          <input type="url" value={values.manifestUrl} onChange={(event) => setValues({ ...values, manifestUrl: event.target.value })} placeholder="https://你的域名/rolecommunity/update-manifest.json" />
        </label>
        <label className="update-check-row">
          <input type="checkbox" checked={values.autoCheck} onChange={(event) => setValues({ ...values, autoCheck: event.target.checked })} />
          <span>启动和从后台恢复时自动检查</span>
        </label>
        <div className="update-inline-note"><ShieldCheck size={15} /><span>社区数据、知识库、角色和模型设置保存在本机；更新服务不可用时仍可正常浏览和运营。</span></div>
        <footer className="form-actions">
          <button className="button button-ghost" type="button" onClick={onClose}>关闭</button>
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? <LoaderCircle className="spinner" size={16} /> : <Save size={16} />}{saving ? '保存中…' : '保存并检查'}
          </button>
        </footer>
      </form>
      {available && <a className="update-direct-link" href={result.manifest.apkUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} />打开 APK 地址</a>}
    </Modal>
  );
}
