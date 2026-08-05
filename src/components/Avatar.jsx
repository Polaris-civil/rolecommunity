import { useEffect, useState } from 'react';

export function Avatar({ role, name, src, size = 'md', className = '' }) {
  const image = role?.avatar || src;
  const label = role?.nickname || name || '用户';
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [image]);
  return image && !failed ? (
    <img className={`avatar avatar-${size} ${className}`} src={image} alt={label} loading="lazy" onError={() => setFailed(true)} />
  ) : (
    <span className={`avatar avatar-${size} avatar-fallback ${className}`}>{label.slice(0, 1)}</span>
  );
}
