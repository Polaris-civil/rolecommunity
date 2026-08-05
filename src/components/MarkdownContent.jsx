import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

function normalizeMarkdown(value) {
  return String(value || '')
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, expression) => `$${expression}$`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, expression) => `$$\n${expression}\n$$`)
    .replace(/\\(\*{1,3}|_|~)/g, '$1');
}

export function MarkdownContent({ children, className = '' }) {
  return (
    <div className={`markdown-body ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalizeMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
}
