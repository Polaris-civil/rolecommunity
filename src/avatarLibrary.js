const colors = ['#4777c6', '#168d7c', '#d58a1e', '#c05a40', '#7b62ae', '#4f7d94'];

// Nicknames are generated from short, reusable fragments instead of being tied to a fixed name list.
export const AVATAR_LIBRARY_VERSION = 3;

export const nicknameMaterials = {
  leads: [
    '今天也要', '正在学习', '半夜', '下班后', '路过的', '认真生活的', '还在摸索的',
    '不想加班的', '想吃夜宵的', '刚刚上线的', '慢慢来吧', '先睡一觉', '努力不摆烂',
    '来都来了', '偶尔发疯的', '不太会的', '只会一点点', '正在充电的',
  ],
  objects: [
    '小面包', '冰美式', '橘猫', '小企鹅', '纸飞机', '月亮', '云朵', '薄荷', '海盐', '番茄',
    '旧键盘', '小水獭', '山茶', '小火车', '夜行灯', '柠檬片', '小螺丝', '风筝', '松果',
    '热可可', '糯米团', '乌龙茶', '小行星', '碎片时间', '耳机线', '窗边',
  ],
  adjectives: ['安静的', '迷路的', '不太聪明的', '会发光的', '慢半拍的', '柔软的', '失眠的', '有点困的'],
  topics: ['算法', '模型', '代码', '缓存', '面试', '向量', '参数', '链表', '显卡', '训练中'],
  tails: [
    '同学', '选手', '本人', '日记', '观察员', '研究员', '在路上', '打工中', '求交流',
    '不在线', '的碎碎念', '想上岸', '还没想好', '请多指教', '正在充电', '不急慢慢来', '来学习',
  ],
  actions: ['先把问题想明白', '今天要写完', '等一个好消息', '蹲个答案', '记得早点睡', '求一个解释'],
  actionTails: ['的人', '的同学', '中', 'ing', '的路上'],
  english: ['Momo', 'Luna', 'Kiki', 'Nana', 'Echo', 'Milo', 'Nova', 'Rin', 'Kai', 'Sora'],
  handles: ['momo', 'cloud', 'debug', 'night', 'memo', 'loop', 'vibe', 'pixel', 'north', 'small', 'chai', 'byte', 'nova', 'echo', 'rin', 'milo'],
};

const avatarSources = [
  'men/31', 'men/72', 'men/85', 'men/48', 'women/48', 'women/94', 'men/5', 'women/77',
  'women/61', 'men/42', 'men/49', 'women/68', 'men/96', 'men/84', 'men/95', 'men/66',
  'women/93', 'men/88', 'men/63', 'women/53', 'women/32', 'women/51', 'men/53', 'women/86',
  'women/56', 'women/69', 'men/94', 'men/97', 'men/74', 'men/12', 'men/93', 'women/15',
  'men/52', 'men/41', 'men/13', 'women/16', 'men/99', 'women/84', 'men/46', 'men/77',
  'women/33', 'men/18', 'men/98', 'men/33', 'women/17', 'men/21', 'women/62', 'men/38',
  'men/73', 'women/38',
];

function pick(values, random) {
  return values[Math.min(values.length - 1, Math.floor(Math.max(0, random()) * values.length))];
}

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value || 'rolecommunity')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateNickname(random = Math.random) {
  const lead = pick(nicknameMaterials.leads, random);
  const object = pick(nicknameMaterials.objects, random);
  const secondObject = pick(nicknameMaterials.objects, random);
  const adjective = pick(nicknameMaterials.adjectives, random);
  const topic = pick(nicknameMaterials.topics, random);
  const tail = pick(nicknameMaterials.tails, random);
  const roll = random();
  let nickname;

  if (roll < 0.21) nickname = `${lead}${object}`;
  else if (roll < 0.39) nickname = `${object}${tail}`;
  else if (roll < 0.54) nickname = `${adjective}${object}`;
  else if (roll < 0.68) nickname = `${lead}${object}${pick(['同学', '本人', '日记', '在路上', '求交流'], random)}`;
  else if (roll < 0.78) nickname = `${object}和${secondObject}`;
  else if (roll < 0.88) nickname = `${topic}${pick(['同学', '想上岸', '不太难', '观察员', '研究中'], random)}`;
  else if (roll < 0.95) nickname = `${pick(nicknameMaterials.english, random)}的${object}`;
  else nickname = `${pick(nicknameMaterials.actions, random)}${pick(nicknameMaterials.actionTails, random)}`;

  return nickname.slice(0, 16);
}

function makeHandle(random) {
  const first = pick(nicknameMaterials.handles, random);
  const second = pick(nicknameMaterials.handles, random);
  const suffix = String(Math.floor(random() * 90) + 10);
  return `@${first}_${second}${suffix}`;
}

function makeProfile(base, random) {
  const nickname = generateNickname(random);
  return {
    ...base,
    nickname,
    handle: makeHandle(random),
    profileVersion: AVATAR_LIBRARY_VERSION,
  };
}

export const avatarLibrary = avatarSources.map((sourcePath, index) => {
  const random = seededRandom(hashSeed(`avatar-${index + 1}`));
  const id = `profile-${String(index + 1).padStart(2, '0')}`;
  const base = {
    id,
    nickname: generateNickname(random),
    handle: makeHandle(random),
    avatar: `/avatars/${id}.jpg`,
    sourceUrl: `https://randomuser.me/api/portraits/${sourcePath}.jpg`,
    color: colors[index % colors.length],
    profileVersion: AVATAR_LIBRARY_VERSION,
  };
  return base;
});

export function randomProfile(random = Math.random) {
  const base = avatarLibrary[Math.min(avatarLibrary.length - 1, Math.floor(Math.max(0, random()) * avatarLibrary.length))];
  return makeProfile(base, random);
}

export function profileForSeed(seed) {
  const random = seededRandom(hashSeed(seed));
  const base = avatarLibrary[Math.min(avatarLibrary.length - 1, Math.floor(random() * avatarLibrary.length))];
  return makeProfile(base, random);
}
