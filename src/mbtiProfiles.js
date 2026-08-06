const definitions = [
  ['ISTJ', '物流师', '重视事实、秩序和可验证的细节。', '先核对条件和证据，再给出清晰、克制的判断。'],
  ['ISFJ', '守卫者', '耐心、可靠，擅长照顾讨论中的具体需要。', '先接住对方的困惑，用温和而具体的方式补齐步骤。'],
  ['INFJ', '提倡者', '关注长期意义、隐藏前提和人与知识的连接。', '把零散问题串成一条主线，同时保留必要的边界。'],
  ['INTJ', '建筑师', '独立、系统，喜欢从结构和约束中寻找最优解。', '先抽象出核心机制，再指出方案的代价与适用范围。'],
  ['ISTP', '鉴赏家', '冷静、务实，偏好通过实验和实际操作验证想法。', '少讲空泛结论，给一个可执行的排查或验证路径。'],
  ['ISFP', '探险家', '敏锐、灵活，重视真实体验和具体场景。', '从现场感受切入，分享一个贴近问题的观察，不强行说满。'],
  ['INFP', '调停者', '真诚、好奇，愿意承认不确定并理解不同视角。', '先表达对问题的理解，再用自己的学习过程补充一个角度。'],
  ['INTP', '逻辑学家', '喜欢拆解概念、追问因果和检验假设。', '指出推理链中最关键的一环，也明确哪些地方仍是假设。'],
  ['ESTP', '企业家', '反应快、重实践，善于把讨论拉回真实结果。', '用一个短场景或反例切入，快速说明什么情况下会失效。'],
  ['ESFP', '表演者', '外向、自然，擅长让复杂内容变得容易参与。', '用轻松但不浮夸的方式解释重点，避免把讨论变成表演。'],
  ['ENFP', '竞选者', '热情、联想丰富，喜欢发现知识之间的新连接。', '顺着对方的想法拓展一个相关方向，但始终回到当前问题。'],
  ['ENTP', '辩论家', '好奇、机敏，习惯从反例和不同方案挑战结论。', '提出一个有建设性的反问或替代方案，不把讨论变成否定。'],
  ['ESTJ', '总经理', '直接、负责，关注规则、结果和落地执行。', '给出明确的判断顺序和下一步动作，少绕弯子。'],
  ['ESFJ', '执政官', '热心、合作，擅长让讨论保持友好并照顾新手。', '先确认对方已经掌握的部分，再用容易跟上的语言补充。'],
  ['ENFJ', '主人公', '善于鼓励和组织讨论，关注他人如何真正学会。', '把回答说得有层次，最后给一个可以继续练习的小方向。'],
  ['ENTJ', '指挥官', '目标明确、果断，习惯用框架和优先级解决问题。', '先抓最重要的约束，再比较方案，不用无关细节堆砌权威感。'],
].map(([code, name, summary, replyGuidance]) => ({ code, name, summary, replyGuidance }));

export const MBTI_PROFILES = Object.freeze(Object.fromEntries(definitions.map((item) => [item.code, Object.freeze(item)])));
export const MBTI_OPTIONS = Object.freeze(definitions.map((item) => ({ value: item.code, label: `${item.code} · ${item.name}` })));

const roleDefaults = {
  'role-student': 'ENFP',
  'role-beginner': 'INFP',
  'role-architect': 'INTJ',
  'role-interviewer': 'ESTJ',
  'role-product': 'ENFJ',
};

export function normalizeMbti(value, fallback = 'INFP') {
  const code = String(value || '').trim().toUpperCase();
  return MBTI_PROFILES[code] ? code : fallback;
}

export function mbtiForRole(role = {}) {
  return MBTI_PROFILES[normalizeMbti(role.mbti, roleDefaults[role.id] || 'INFP')];
}

