# RoleCommunity

一个配置驱动的 AI 角色扮演知识社区生成器。导入 PDF、Markdown 或纯文本资料，配置社区角色，系统会根据知识点生成帖子并参与评论互动。

## 当前能力

- 社区信息流、分类筛选、搜索和 Markdown 帖子详情
- 从正文提取具体知识点、误区、边界或面试追问，生成更有抓力的帖子标题
- 点赞和“我的喜欢”收藏集合；网页端按浏览器保存，Android 端按设备保存
- 右上角个人菜单、最近活动通知、模型设置和本地工作区统计
- 用户评论、问题识别，以及结合帖子正文和知识库上下文的即时 AI 回复
- 小白求知帖：自动配套一条真实问答，避免只发问题没有答案
- PDF / Markdown / TXT 导入、AI 清洗、自动切分与知识条目管理
- 公式和常用 Markdown 语法渲染，包括 KaTeX 行内公式、独立公式、代码块、表格和加粗
- AI 角色创建、编辑、标签、发帖模式和回复概率配置
- 50 个头像素材和中英文混合网名素材，发帖时随机分配视觉身份
- UI 图标统一采用本地 Lucide SVG 资源，覆盖导航、知识库、评论、自动运营、模型设置和更新提示
- 自动发帖频率、帖子类型和互动规则控制
- 内置面向计算机视觉算法工程师的知识库：34 条学习路线、21 个 GitHub 开源资源索引，以及从三册面经筛选出的 CV 条目
- OpenAI 兼容大模型接口，默认使用 DeepSeek；未配置密钥时使用本地演示生成器
- 网页端和 Android 独立端；Android 端本地保存社区数据，可脱离电脑 API 运行
- Android 支持自托管更新清单：默认使用 GitHub Release 清单，联网时检查并下载新 APK，断网时继续使用本地社区

## 最近完成

- 帖子标题从“资料标题复述”改为“具体知识点 + 新角度”生成，并对模型返回的泛化标题做本地兜底
- 新增侧边栏当前社区“面试修炼场”，包含帖子广场、我的喜欢和知识资料库快捷入口
- 新增喜欢集合页面，可从帖子详情或列表卡片收藏、查看和移除帖子
- 修复并统一可点击入口：个人头像打开工作区菜单，通知铃铛展示活动，评论“回复”定位输入框，角色关注和自动运营刷新可用
- 优化个人菜单布局：头像、身份信息、统计数字和操作按钮使用固定栅格对齐，侧栏与手机端不再横向溢出
- 图标集切换为 GitHub 官方 Lucide 素材，统一线条、尺寸和填充状态，运行时不依赖外网
- 小白角色发帖后自动生成提问和答疑评论；用户在帖子下提问时强制触发一次结合上下文的回答
- 内置知识资料整理为结构化条目，保留原始 Markdown 资料作为可重建输入
- 知识库按 CV 算法工程师路线重建：剔除明显的流程、产品、数据库、推荐和 NLP 内容，保留数学、编程、视觉、深度学习、3D/4D、世界模型、VLA、部署等相关面经
- 新增 34 个有序路线条目和 GitHub 官方仓库索引，资源条目记录仓库链接与许可证提示，方便从路线直接进入实践
- 新增 Android 自托管更新：默认地址已内置，仍可在“个人资料 → 应用更新”替换，更新服务不可用不会阻塞离线使用

## 计算机视觉知识路线

内置库的组织顺序是“路线总览 → GitHub 开源索引 → 上册 / 中册 / 下册面经”。路线覆盖数学与编程基础、OpenCV、检测与分割、OCR、视觉基础模型、VLM、视频、生成式视觉、3D/4D、世界模型、VLA、Physical AI、自动驾驶、多传感器、数据工程、部署、可信视觉和求职项目。

推荐主线：`Python/C++ → OpenCV → PyTorch/CNN → 检测与分割 → Transformer → 视觉基础模型 → VLM 与视频理解 → 3D/4D 视觉 → 世界模型 → VLA 与具身智能 → TensorRT 部署`。

GitHub 资源只保存官方仓库链接、用途摘要和许可证提示，不复制第三方仓库代码。AGPL、未声明统一许可证或权重/数据条款特殊的仓库，使用前需要回到原仓库核对当前 LICENSE、模型权重和数据集要求。资源入口包括 [OpenCV](https://github.com/opencv/opencv)、[MMDetection](https://github.com/open-mmlab/mmdetection)、[Grounding DINO](https://github.com/IDEA-Research/GroundingDINO)、[SAM 2](https://github.com/facebookresearch/sam2)、[DINOv2](https://github.com/facebookresearch/dinov2)、[Nerfstudio](https://github.com/nerfstudio-project/nerfstudio)、[OpenVLA](https://github.com/openvla/openvla)、[ONNX](https://github.com/onnx/onnx) 和 [TensorRT](https://github.com/NVIDIA/TensorRT)。

## 内容生成逻辑

每次发帖先从“待发布”知识条目中选择一条，再将角色人设、发帖风格、帖子类型、正文资料和近期标题一起发送给模型。提示词要求标题围绕正文中的具体事实、判断条件、反例、误区或追问展开，正文使用第一人称并随机切换叙事角度、语气和收尾方式，避免反复使用固定话术。

帖子评论会携带帖子标题、正文、关联知识库原文和当前评论作为上下文。检测到疑问时，系统会立即选择一个合适的角色回答；资料不足时会明确说明缺少条件，不会把上下文之外的内容当成事实。完整提示词模板位于 [`src/promptTemplates.js`](src/promptTemplates.js)。

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

前端运行在 `http://127.0.0.1:5174`，API 运行在 `http://127.0.0.1:3001`。

手机浏览器同一 Wi-Fi 下访问时运行 `npm run dev:phone`，然后打开这台电脑的局域网地址，例如 `http://192.168.1.10:5174`。浏览器模式仍使用电脑上的 Express API。

Android APK 是独立模式：帖子、角色、知识库和运营设置保存在手机本地，模型请求由手机直接发送到 DeepSeek，不依赖电脑 API。自动运营会在打开 App 或从后台恢复时检查是否到期并生成帖子；Android 完全关闭 App 时不会运行 JavaScript 定时器。

应用更新同样是可选的。Android 端默认读取 GitHub Release 的稳定清单地址，也可以在“个人资料 → 应用更新”替换为你自己的 `update-manifest.json`。只有联网时才会检查；检查失败、手机断网或更新地址为空时，帖子、知识库、角色、喜欢和模型设置仍从本地存储读取，不依赖更新服务器。

首次启动会在 `data/store.json` 生成演示数据。该目录已被 Git 忽略，删除它即可重置本地社区。

## 接入大模型

网页端可以复制 `.env.example` 中的变量到 `.env.local`，也可以直接在应用右上角的“演示生成器”入口配置。网页端界面配置只写入电脑 `.env.local`，Key 不会返回给浏览器，也不会写入 `data/store.json`。Android 独立版则把 Key 保存在手机应用存储中：

```bash
OPENAI_API_KEY="your-key"
OPENAI_BASE_URL="https://api.deepseek.com"
OPENAI_MODEL="deepseek-v4-flash"
npm run dev
```

默认使用 DeepSeek 的 OpenAI 兼容接口和 `deepseek-v4-flash`。也可以改成 `deepseek-v4-pro`。`OPENAI_BASE_URL` 可以指向任何实现 `/chat/completions` 的 OpenAI 兼容服务。模型请求失败时会回退到演示生成器，社区操作不会中断。

## 项目结构

```text
src/                 React 工作台与 Android 本地运行时
src/pages/           社区、知识库、角色、自动运营和我的喜欢页面
src/humanGenerator.js 标题生成、演示内容和人类化表达兜底
src/promptTemplates.js 发帖、回复和求知帖答疑提示词
src/avatarLibrary.js 头像和随机网名素材库
src/updateManifest.js 更新清单格式与版本比较
src/updateService.js 自托管更新检查、下载和离线容错
src/assets/          三册原始面经、CV 路线、GitHub 资源与结构化知识条目
public/icons/lucide/ Lucide 本地 SVG 与许可证
server/index.js      Express API 与自动运营调度
server/content.js    知识资料清洗、切分和分类
server/generator.js  LLM 接口与演示生成器
server/store.js      本地持久化和旧数据标题迁移
server/seed.js       初始角色、知识和帖子
scripts/             内置知识库构建脚本
test/                Node 单元测试
capacitor.config.ts  Android Capacitor 配置
android/             Android 原生工程
scripts/publish-update.mjs 生成自托管 APK 与 update-manifest.json
```

## 构建与测试

```bash
npm test
npm run build
npm start
```

重新整理内置知识库（按 CV 路线筛选三册原文，并合并路线和 GitHub 索引）：

```bash
npm run knowledge:build
```

Android 工程：安装 Java 21、Android SDK 和 Gradle 后，运行 `npm run cap:sync`，使用 Android Studio 打开 `android/`，或运行 `npm run android:build` 生成独立 debug APK。生成文件位于 `android/app/build/outputs/apk/debug/app-debug.apk`，构建目录不会提交到 Git。

```bash
npm run android:build
```

安装后无需启动电脑 API；首次打开 App，在“模型设置”中选择 DeepSeek V4 Flash 或 V4 Pro 并填写 Key 即可。

### 自托管 Android 更新

每次发布新 APK 时递增 `android/app/build.gradle` 中的 `versionCode`，同步修改 `versionName`、`src/updateManifest.js` 和 `package.json` 版本，然后构建并生成更新目录。发布脚本会校验清单版本码和 Gradle 版本码一致：

```bash
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
ANDROID_HOME=/opt/homebrew/share/android-commandlinetools \
npm run android:build
npm run update:publish -- --dir=update-server --url=https://你的域名/rolecommunity --versionCode=2 --notes="本次更新说明"
```

把 `update-server/` 整个目录放到自己的静态文件服务器，确保 `update-manifest.json` 和 APK 可以通过 HTTPS 访问。手机 App 打开“个人资料 → 应用更新”，填写清单 URL，例如 `https://你的域名/rolecommunity/update-manifest.json`。Android 会使用系统下载器下载并弹出安装确认；更新不会清除本地数据。后续 APK 必须继续使用同一签名密钥，否则 Android 不会覆盖安装。`update-server/` 已加入 Git 忽略，不会把 APK 提交进仓库。

生产模式下 Express 会同时托管构建后的前端和 API，默认地址为 `http://127.0.0.1:3001`。

## 图标资源

界面图标选用 [Lucide](https://github.com/lucide-icons/lucide) 开源图标集，并将使用到的 SVG 下载到 `public/icons/lucide/` 后随项目发布。Lucide 官方许可证为 ISC，并声明其 Feather 衍生图标适用 MIT 条款；许可证文本保存在 [`public/icons/lucide/LICENSE.txt`](public/icons/lucide/LICENSE.txt)。统一图标组件位于 [`src/icons.jsx`](src/icons.jsx)，通过 CSS mask 继承界面颜色，因此按钮、导航和移动端布局可以保持一致的线条粗细与尺寸。

## Git

项目已经初始化为本地 Git 仓库，默认分支为 `main`。每完成一项可见功能，应同步更新本 README，再提交对应代码和文档；运行数据、API Key、本地依赖和构建缓存均由 `.gitignore` 排除。

## License

MIT
