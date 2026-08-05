const OFF_TOPIC_PATTERNS = [
  /自然语言处理|\bNLP\b|词向量|分词|命名实体|文本分类|机器翻译|序列标注|情感分析/i,
  /推荐系统|广告算法|点击率|用户画像|召回排序|搜索算法|电商推荐/i,
  /JavaScript|TypeScript|React|Vue|CSS|前端|后端|MySQL|PostgreSQL|Redis|Kafka|微服务|数据库索引/i,
  /金融风控|信用评分|量化交易|供应链|营销|运营策略/i,
];

export const CV_TOPICS = [
  {
    id: 'math',
    label: '数学与优化',
    patterns: [/线性代数|矩阵|特征值|特征向量|概率|统计|贝叶斯|微积分|导数|积分|最优化|优化问题|信息论|熵|数值计算|卡尔曼|梯度下降/i],
    tags: ['数学基础', '优化'],
  },
  {
    id: 'programming',
    label: '编程与工程基础',
    patterns: [/Python|C\+\+|C语言|NumPy|Numpy|Linux|Shell|Git|CMake|CUDA|数据结构|算法复杂度|动态规划|链表|二叉树|哈希|排序|多线程|进程|内存|指针/i],
    tags: ['Python', 'C++', '工程基础'],
  },
  {
    id: 'image-processing',
    label: '图像处理与传统视觉',
    patterns: [/OpenCV|图像处理|图像滤波|卷积|边缘检测|直方图|频域|傅里叶|形态学|颜色空间|几何变换|图像增强|SIFT|SURF|ORB|HOG|特征匹配|RANSAC|光流|单应性|相机标定|PnP|双目|立体视觉|超分|去噪|去雾|HDR|图像拼接/i],
    tags: ['OpenCV', '图像处理', '传统视觉'],
  },
  {
    id: 'machine-learning',
    label: '机器学习基础',
    patterns: [/机器学习|线性回归|逻辑回归|支持向量|SVM|决策树|随机森林|聚类|K[- ]?Means|降维|正则化|过拟合|欠拟合|交叉验证|Precision|Recall|F1|AUC|评价指标/i],
    tags: ['机器学习', '评价指标'],
  },
  {
    id: 'deep-learning',
    label: '深度学习与骨干网络',
    patterns: [/深度学习|PyTorch|TensorFlow|反向传播|CNN|卷积神经网络|BatchNorm|Batch Normalization|Dropout|损失函数|优化器|学习率|数据增强|AlexNet|VGG|ResNet|DenseNet|MobileNet|EfficientNet|ConvNeXt|ViT|Vision Transformer|Swin|迁移学习|细粒度分类|多标签分类|类别不平衡|度量学习|对比学习|知识蒸馏/i],
    tags: ['PyTorch', 'CNN', 'Transformer'],
  },
  {
    id: 'detection-segmentation',
    label: '目标检测与图像分割',
    patterns: [/目标检测|YOLO|Faster R[- ]?CNN|RetinaNet|FCOS|DETR|DINO|Anchor[- ]?Free|NMS|非极大值抑制|小目标检测|旋转目标|语义分割|实例分割|全景分割|U[- ]?Net|DeepLab|Mask R[- ]?CNN|SegFormer|Mask2Former|SAM|Segment Anything/i],
    tags: ['目标检测', '图像分割'],
  },
  {
    id: 'pose-tracking-video',
    label: '关键点、跟踪与视频分析',
    patterns: [/关键点|姿态估计|人体姿态|手部关键点|人脸关键点|Heatmap|OpenPose|HRNet|6D Pose|目标跟踪|SORT|DeepSORT|ByteTrack|BoT[- ]?SORT|ReID|多目标跟踪|行为识别|视频目标|视频分析|时空建模/i],
    tags: ['姿态估计', '目标跟踪', '视频理解'],
  },
  {
    id: 'ocr-document',
    label: 'OCR 与文档视觉',
    patterns: [/OCR|文字检测|文字识别|CTC|CRNN|文本检测|文本矫正|版面分析|表格识别|Document AI|文档理解|票据识别/i],
    tags: ['OCR', 'Document AI'],
  },
  {
    id: 'generative-vision',
    label: '生成式视觉',
    patterns: [/VAE|GAN|Diffusion|扩散模型|DiT|Flow Matching|图像生成|视频生成|图像编辑|可控生成|ControlNet|一致性模型|生成式视觉/i],
    tags: ['扩散模型', '生成式视觉'],
  },
  {
    id: 'foundation-multimodal',
    label: '视觉基础模型与多模态',
    patterns: [/Foundation Model|视觉基础模型|自监督学习|MAE|DINO|DINOv2|DINOv3|JEPA|视觉预训练|Dense Feature|开放世界|Open[- ]?Vocabulary|Open[- ]?World|Visual Grounding|Referring Expression|Promptable Segmentation|Concept Segmentation|Grounding DINO|CLIP|BLIP|LLaVA|VLM|MLLM|图文对齐|视觉问答|图像描述|多模态指令|视觉推理|幻觉检测/i],
    tags: ['视觉基础模型', 'VLM', '开放世界'],
  },
  {
    id: '3d-4d',
    label: '三维、四维与空间智能',
    patterns: [/多视图几何|深度估计|点云|RGB[- ]?D|LiDAR|三维检测|三维分割|三维重建|Scene Graph|3D Visual Grounding|空间智能|Camera Pose|Point Map|Feed[- ]?Forward 3D|3D Foundation|VGGT|3D[- ]?LLM|NeRF|3D Gaussian|Gaussian Splatting|Novel View|可微渲染|Inverse Rendering|Dynamic NeRF|4DGS|Scene Flow|4D Reconstruction/i],
    tags: ['3D 视觉', '空间智能', '4D 视觉'],
  },
  {
    id: 'world-embodied',
    label: '世界模型、强化学习与具身智能',
    patterns: [/World Model|世界模型|RSSM|Latent Dynamics|V[- ]?JEPA|Genie|Cosmos|未来状态预测|Action[- ]?Conditioned|Counterfactual Rollout|Imagination|长时序一致性|物理一致性|DQN|PPO|SAC|强化学习|Model[- ]?Based RL|Dreamer|模仿学习|行为克隆|离线强化学习|MPC|轨迹优化|闭环规划|Embodied AI|Vision[- ]?Language[- ]?Action|VLA|OpenVLA|π0|机器人操作|跨本体迁移|长任务规划|Physical AI|物理推理|接触建模|碰撞预测|Affordance|抓取姿态|视觉触觉|因果推理|物理约束学习|Sim2Real|Isaac Sim|Omniverse|CARLA/i],
    tags: ['世界模型', 'VLA', '具身智能'],
  },
  {
    id: 'autonomous-driving-sensors',
    label: '自动驾驶与多传感器融合',
    patterns: [/自动驾驶|BEV|多传感器融合|Occupancy|Occupancy Forecasting|轨迹预测|HD Map|端到端驾驶|闭环仿真|感知预测规划|毫米波雷达|事件相机|热成像|音频视觉|视觉触觉|时空标定|跨模态对齐|缺失模态/i],
    tags: ['自动驾驶', '传感器融合', 'BEV'],
  },
  {
    id: 'data-deployment',
    label: '数据工程、部署与 MLOps',
    patterns: [/数据采集|标注规范|数据清洗|数据版本|困难样本|长尾样本|混合精度|分布式训练|实验管理|消融实验|ONNX|TensorRT|OpenVINO|量化|剪枝|算子融合|Token Pruning|稀疏注意力|边缘部署|流式推理|模型服务|Docker|FastAPI|REST API|单元测试|性能分析|GPU 显存|日志监控|CI\/CD|模型版本|数据漂移/i],
    tags: ['数据工程', '模型部署', 'MLOps'],
  },
  {
    id: 'project-career-trust',
    label: '项目、可信视觉与求职',
    patterns: [/论文复现|数据集构建|Baseline|基线设计|错误分析|指标设计|消融实验|作品集|开源项目|技术文档|项目经验|OOD Detection|开放集识别|不确定性估计|置信度校准|对抗鲁棒|安全关键感知|时序一致性评测|工业质检|医学影像|遥感视觉|智慧交通|安防|AR\/VR/i],
    tags: ['项目实践', '可信视觉', '求职准备'],
  },
];

const topicById = new Map(CV_TOPICS.map((topic) => [topic.id, topic]));

function countMatches(text, patterns) {
  return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

const GENERIC_SOURCE_PATTERNS = [
  /面经汇总参考资料|面试流程|招聘岗位|开放性问题|产品方面|数据库方面|运营策略/i,
  /参考资料|网页链接|点击进入查看|整理心得/i,
];

const SECTION_HINTS = [
  { topicId: 'image-processing', patterns: [/图像处理|传统视觉|OpenCV|计算机视觉/i] },
  { topicId: 'deep-learning', patterns: [/深度学习|CNN|卷积神经网络|Transformer/i] },
  { topicId: 'detection-segmentation', patterns: [/目标检测|目标分割|语义分割|实例分割/i] },
  { topicId: 'machine-learning', patterns: [/机器学习|统计学习|分类模型|聚类/i] },
  { topicId: 'programming', patterns: [/Python|C\+\+|C语言|数据结构与算法|编程高频/i] },
  { topicId: 'data-deployment', patterns: [/工程|部署|优化|服务化|数据处理/i] },
  { topicId: 'world-embodied', patterns: [/强化学习|世界模型|机器人|自动驾驶/i] },
];

export function classifyCvEntry(entry) {
  const title = String(entry?.title || '');
  const section = String(entry?.section || '');
  const group = String(entry?.group || '');
  const content = String(entry?.content || '');
  const text = `${title}\n${section}\n${group}\n${content}\n${(entry?.tags || []).join(' ')}`;
  const scores = CV_TOPICS.map((topic, index) => ({
    topic,
    score: countMatches(text, topic.patterns),
    index,
  })).sort((a, b) => b.score - a.score || a.index - b.index);
  const hint = SECTION_HINTS
    .map((item) => ({ ...item, score: countMatches(`${title} ${section}`, item.patterns) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0];
  const hintedTopic = hint ? topicById.get(hint.topicId) : null;
  const best = hintedTopic && scores.find((item) => item.topic.id === hintedTopic.id)?.score
    ? { topic: hintedTopic, score: scores.find((item) => item.topic.id === hintedTopic.id).score }
    : scores[0];
  const offTopicScore = countMatches(text, OFF_TOPIC_PATTERNS);
  const directVisualSignal = /(视觉|图像|视频|点云|三维|3D|4D|OpenCV|PyTorch|卷积|检测|分割|姿态|目标跟踪|多模态|视觉模型|神经网络|深度学习|GAN|Diffusion|NeRF|机器人|自动驾驶)/i.test(`${title}\n${section}\n${content}`);
  const genericSourceScore = countMatches(`${title}\n${section}\n${content}`, GENERIC_SOURCE_PATTERNS);
  const coreFoundation = ['math', 'programming', 'machine-learning', 'data-deployment'].includes(best?.topic.id);
  const hasSubstantiveSignal = best?.score >= 2 || directVisualSignal;
  const relevant = Boolean(best?.score)
    && hasSubstantiveSignal
    && (directVisualSignal || coreFoundation)
    && !(offTopicScore >= 1 && !directVisualSignal)
    && !(genericSourceScore >= 2 && best.score < 3);
  return {
    topic: best?.topic || topicById.get('programming'),
    score: best?.score || 0,
    offTopicScore,
    genericSourceScore,
    relevant,
  };
}

export function topicForId(id) {
  return topicById.get(id) || CV_TOPICS[0];
}
