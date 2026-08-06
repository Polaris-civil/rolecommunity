import { Code2, Eye, EyeOff, KeyRound, RotateCcw, Save, ShieldCheck, Sparkles } from '../icons.jsx';
import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { SelectMenu } from './SelectMenu.jsx';
import { promptPreview } from '../promptTemplates.js';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_MODELS = [
  { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash（快速）' },
  { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro（高质量）' },
];

export function ModelSettingsModal({ config, onClose, onSave }) {
  const isMobileStorage = config?.storage === 'device';
  const configBaseUrl = config?.baseUrl?.replace(/\/$/, '');
  const isDeepSeekConfig = configBaseUrl === DEEPSEEK_BASE_URL;
  const [values, setValues] = useState({
    apiKey: '',
    baseUrl: configBaseUrl || DEEPSEEK_BASE_URL,
    model: isDeepSeekConfig && !DEEPSEEK_MODELS.some((item) => item.value === config?.model) ? 'deepseek-v4-flash' : (config?.model || 'deepseek-v4-flash'),
  });
  const [provider, setProvider] = useState(isDeepSeekConfig ? 'deepseek' : 'custom');
  const [showKey, setShowKey] = useState(false);
  const [clearKey, setClearKey] = useState(false);
  const [working, setWorking] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setWorking(true);
    try {
      await onSave({ ...values, clearKey });
      onClose();
    } finally {
      setWorking(false);
    }
  };

  const setProviderMode = (nextProvider) => {
    setProvider(nextProvider);
    if (nextProvider === 'deepseek') {
      setValues((current) => ({ ...current, baseUrl: DEEPSEEK_BASE_URL, model: DEEPSEEK_MODELS.some((item) => item.value === current.model) ? current.model : 'deepseek-v4-flash' }));
    }
  };

  return (
    <Modal title="模型设置" wide onClose={onClose}>
      <form className="stack-form model-settings-form" onSubmit={submit}>
        <div className={`model-mode-banner ${config?.configured ? 'is-configured' : ''}`}>
          <span>{config?.configured ? <Sparkles size={18} /> : <KeyRound size={18} />}</span>
          <div>
            <strong>{config?.configured ? '真实模型已配置' : '当前使用演示生成器'}</strong>
            <small>{config?.configured ? `当前 Key：${config.maskedKey}` : '配置 API Key 后，发帖和回复会调用真实模型'}</small>
          </div>
        </div>

        <label>
          <span>API Key</span>
          <div className="secret-input">
            <input
              type={showKey ? 'text' : 'password'}
              value={values.apiKey}
              onChange={(event) => { setValues({ ...values, apiKey: event.target.value }); setClearKey(false); }}
              placeholder={config?.configured ? `留空以保留 ${config.maskedKey}` : '粘贴你的 API Key'}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowKey(!showKey)} title={showKey ? '隐藏 Key' : '显示 Key'}>
              {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {config?.configured && (
            <button className="clear-key-button" type="button" onClick={() => { setClearKey(!clearKey); setValues({ ...values, apiKey: '' }); }}>
              <RotateCcw size={13} />{clearKey ? '取消清除' : '清除本机已保存的 Key'}
            </button>
          )}
        </label>

        <div className="field-control">
          <span>模型服务</span>
          <SelectMenu value={provider} onChange={setProviderMode} ariaLabel="模型服务" options={[{ value: 'deepseek', label: 'DeepSeek 官方 API' }, { value: 'custom', label: '自定义 OpenAI 兼容服务' }]} />
        </div>
        <div className="form-grid-2">
          <label><span>Base URL</span><input type="url" value={values.baseUrl} readOnly={provider === 'deepseek'} onChange={(event) => setValues({ ...values, baseUrl: event.target.value })} placeholder={DEEPSEEK_BASE_URL} required /></label>
          <div className="field-control">
            <span>模型名称</span>
            {provider === 'deepseek' ? (
              <SelectMenu value={values.model} onChange={(value) => setValues({ ...values, model: value })} ariaLabel="模型名称" options={DEEPSEEK_MODELS} />
            ) : (
              <input value={values.model} onChange={(event) => setValues({ ...values, model: event.target.value })} placeholder="模型名称" required />
            )}
          </div>
        </div>

        <div className="security-note"><ShieldCheck size={17} /><span>{isMobileStorage ? 'Key 只保存在这台手机的应用存储中，不会上传到电脑后端或写入帖子。更换 Key 时直接粘贴新值即可。' : 'Key 只写入本机 `.env.local`，不会进入知识库、帖子或浏览器响应。更换 Key 时直接粘贴新值即可。'}</span></div>
        <div className="provider-note"><KeyRound size={15} /><span>{isMobileStorage ? '手机通过 HTTPS 直连 DeepSeek，也支持其他 OpenAI 兼容服务。' : '支持 OpenAI 以及兼容 `/chat/completions` 的模型服务。'}</span></div>
        <details className="prompt-inspector">
          <summary><Code2 size={15} />查看生成提示词模板</summary>
          <div className="prompt-block"><small>发帖 · system</small><pre>{promptPreview.postSystem}</pre></div>
          <div className="prompt-block"><small>发帖 · user</small><pre>{promptPreview.postUser}</pre></div>
          <div className="prompt-block"><small>评论回复 · system</small><pre>{promptPreview.replySystem}</pre></div>
          <div className="prompt-block"><small>评论回复 · user</small><pre>{promptPreview.replyUser}</pre></div>
          <div className="prompt-block"><small>求知帖回答 · system</small><pre>{promptPreview.answerSystem}</pre></div>
          <div className="prompt-block"><small>求知帖回答 · user</small><pre>{promptPreview.answerUser}</pre></div>
        </details>

        <footer className="form-actions">
          <button className="button button-ghost" type="button" onClick={onClose}>取消</button>
          <button className="button button-primary" type="submit" disabled={working || (clearKey === false && !values.apiKey && !config?.configured)}>
            <Save size={16} />{working ? '保存中…' : '保存模型设置'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
