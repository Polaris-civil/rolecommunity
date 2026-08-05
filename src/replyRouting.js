const questionPattern = /[?？]|为什么|怎么|如何|能不能|是否|是不是|区别|原理|求助|请教|不懂|不明白|疑问|哪个|哪一个|何时|能否|可不可以|有没有|有什么|啥|吗(?:[。！!，,]?\s*$)|帮我/;

export function isQuestionComment(value) {
  const text = String(value || '').trim();
  return text.length >= 2 && questionPattern.test(text);
}

export function chooseReplyRole(store, post, author, random = Math.random) {
  const postTags = Array.isArray(post.tags) ? post.tags : [];
  const eligible = store.roles.filter((role) => role.id !== post.authorId && !role.requiresQa);
  const candidates = eligible.filter((role) => (role.tags || []).some((tag) => postTags.includes(tag) || tag === post.category));
  const pool = candidates.length ? candidates : (eligible.length ? eligible : store.roles.filter((role) => role.id !== post.authorId));
  if (!pool.length) return author || store.roles.find((role) => !role.requiresQa) || store.roles[0];
  const value = Math.max(0, Math.min(.999999, Number(random()) || 0));
  return pool[Math.floor(value * pool.length)];
}
