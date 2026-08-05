import { AlertCircle, CheckCircle2, Download, LoaderCircle, RefreshCw, WifiOff } from '../icons.jsx';
import { Modal } from './Modal.jsx';

function formatCheckedAt(value) {
  if (!value) return '尚未检查';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '尚未检查' : `上次检查：${date.toLocaleString()}`;
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function UpdateSettingsModal({ currentVersion, settings, result, checking, downloadProgress, onCheck, onInstall, onClose }) {
  const available = result?.status === 'available' && result.manifest;
  const current = result?.status === 'current';
  const offline = result?.status === 'offline';
  const notConfigured = result?.status === 'not-configured';
  const downloading = downloadProgress?.status === 'pending' || downloadProgress?.status === 'downloading';
  const progress = Math.max(0, Math.min(100, Number(downloadProgress?.progress || 0)));

  return (
    <Modal title="应用更新" wide onClose={onClose}>
      <div className={`update-status-card ${available ? 'is-available' : ''} ${offline ? 'is-offline' : ''}`}>
        <span className="update-status-icon">
          {available ? <Download size={19} /> : offline ? <WifiOff size={19} /> : current ? <CheckCircle2 size={19} /> : <RefreshCw size={19} />}
        </span>
        <div>
          <strong>{available ? `发现新版本 v${result.manifest.version}` : offline ? '暂时无法连接更新服务' : current ? '当前已是最新版本' : notConfigured ? '更新地址暂不可用' : '准备检查更新'}</strong>
          <small>当前版本 v{currentVersion} · {formatCheckedAt(result?.checkedAt || settings?.lastCheckedAt)}</small>
        </div>
        <button className="button button-ghost button-small" type="button" onClick={() => onCheck()} disabled={checking || downloading}>
          <RefreshCw className={checking ? 'spinner' : ''} size={14} />{checking ? '检查中…' : '检查新版本'}
        </button>
      </div>

      {available && (
        <section className="update-release-card">
          <header><strong>更新内容</strong><span>版本码 {result.manifest.versionCode}</span></header>
          <p>{result.manifest.notes || '该版本没有附加更新说明。'}</p>
          {result.manifest.sha256 && <small className="update-checksum">SHA-256：{result.manifest.sha256}</small>}
          {downloadProgress && (
            <div className="update-download-progress" aria-live="polite">
              <div className="update-progress-label"><span>{downloading ? '正在下载更新…' : progress >= 100 ? '下载完成，准备安装' : '等待下载'}</span><strong>{progress}%</strong></div>
              <div className="update-progress-track"><span style={{ width: `${progress}%` }} /></div>
              <small>{formatBytes(downloadProgress.downloadedBytes)}{formatBytes(downloadProgress.totalBytes) ? ` / ${formatBytes(downloadProgress.totalBytes)}` : ''}</small>
            </div>
          )}
          <button className="button button-primary" type="button" onClick={onInstall} disabled={downloading || progress >= 100}>
            {downloading ? <LoaderCircle className="spinner" size={16} /> : <Download size={16} />}{downloading ? '下载中…' : progress >= 100 ? '已打开安装确认' : '下载并安装'}
          </button>
        </section>
      )}

      {offline && <div className="update-inline-note update-inline-note-warning"><AlertCircle size={15} /><span>{result.error || '请确认手机联网，或稍后再试。离线内容不会受到影响。'}</span></div>}
      {notConfigured && <div className="update-inline-note update-inline-note-warning"><AlertCircle size={15} /><span>当前版本的固定更新服务暂时没有返回有效清单，稍后可以重新检查。</span></div>}
      <div className="update-inline-note"><CheckCircle2 size={15} /><span>更新地址由应用固定维护；社区数据、知识库、角色和模型设置保存在本机，更新服务不可用时仍可离线使用。</span></div>
    </Modal>
  );
}
