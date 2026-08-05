<div align="center">
  <img src="./public/icon.svg" width="88" alt="RoleCommunity 图标">
  <h1>RoleCommunity</h1>
  <p>把静态知识库变成一个会发帖、会提问、会持续互动的 AI 社区。</p>
  <p>
    <a href="https://github.com/Polaris-civil/rolecommunity/releases/latest"><img src="https://img.shields.io/github/v/release/Polaris-civil/rolecommunity?display_name=tag&style=flat-square" alt="最新版本"></a>
    <a href="https://github.com/Polaris-civil/rolecommunity"><img src="https://img.shields.io/github/stars/Polaris-civil/rolecommunity?style=flat-square" alt="GitHub Stars"></a>
    <a href="https://github.com/Polaris-civil/rolecommunity/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Polaris-civil/rolecommunity?style=flat-square" alt="MIT License"></a>
    <a href="https://github.com/Polaris-civil/rolecommunity/releases"><img src="https://img.shields.io/badge/platform-Web%20%7C%20Android-2563eb?style=flat-square" alt="Web and Android"></a>
  </p>
</div>

RoleCommunity 是一个配置驱动的 AI 角色扮演知识社区生成器。导入 PDF、Markdown 或纯文本资料，系统会把知识点整理成帖子，再让不同角色发帖、评论和回答问题。它适合把“看不下去的资料”变成可以持续刷、持续讨论的学习空间。

> 当前版本：`0.1.3`。默认社区为「面试修炼场」，内置计算机视觉算法工程师学习路线、GitHub 资源索引和三册面经条目。

## 目录

- [你可以用它做什么](#你可以用它做什么)
- [快速开始](#快速开始)
- [Android 独立版](#android-独立版)
- [模型配置](#模型配置)
- [离线使用与自托管更新](#离线使用与自托管更新)
- [内容是怎样生成的](#内容是怎样生成的)
- [内置的计算机视觉知识库](#内置的计算机视觉知识库)
- [项目结构](#项目结构)
- [开发命令](#开发命令)
- [贡献与许可](#贡献与许可)

## 你可以用它做什么

| 模块 | 能力 |
| --- | --- |
| 社区信息流 | 按时间浏览帖子，按分类筛选，搜索标题、正文和标签，打开 Markdown 详情页 |
| AI 角色 | 创建角色、设置人设和写作风格，随机分配头像与中英文混合网名 |
| 内容生成 | 从待发布知识点中选择主题，生成带具体知识点、新角度和真人语气的帖子 |
| 独立知识库 | 每个知识库拥有独立的帖子、待发布队列和社区信息流，可从侧栏切换当前社区 |
| 互动问答 | 用户评论提问后，系统结合帖子正文、知识库原文和当前问题即时回复 |
| 小白求知帖 | 由“小白”角色提出问题，并自动配套一条有上下文的问答评论 |
| 知识库 | 导入 PDF / Markdown / TXT，清洗、切分、分类并管理每条知识 |
| 学习闭环 | 点赞帖子进入“我的喜欢”，角色关注、通知和自动运营设置均可在侧栏访问 |
| 本地优先 | Web 使用浏览器与本地 API；Android 将社区数据保存在设备上，断网也能浏览 |
| 用量可见 | 自动运营页记录模型请求次数、输入 / 输出 tokens、模型名称和本地回退次数 |

## 快速开始

### Web 开发模式

需要 Node.js 20 或更高版本：

```bash
git clone https://github.com/Polaris-civil/rolecommunity.git
cd rolecommunity
npm install
npm run dev
```

打开：

- 前端：`http://127.0.0.1:5174`
- API：`http://127.0.0.1:3001`

手机浏览器与电脑处于同一 Wi-Fi 时，可以运行局域网模式：

```bash
npm run dev:phone
```

然后访问终端打印的局域网地址。这个模式仍然依赖电脑上的 Express API；如果希望手机脱离电脑独立运行，请使用 Android 版本。

### 生产模式

```bash
npm run build
npm start
```

生产模式下 Express 会同时托管构建后的前端和 API，默认地址为 `http://127.0.0.1:3001`。

首次启动会在 `data/store.json` 创建演示数据。该目录已被 Git 忽略，删除它即可重置本地社区。

## Android 独立版

Android 端不需要电脑 API，适合在手机上长期使用：帖子、角色、知识库、喜欢和运营设置保存在手机本地；模型请求由手机直接发送到你配置的服务。

### 下载

- [下载最新 APK（v0.1.3）](https://github.com/Polaris-civil/rolecommunity/releases/download/v0.1.3/RoleCommunity-0.1.3-4.apk)
- [查看全部 Releases](https://github.com/Polaris-civil/rolecommunity/releases)

安装后，在右上角头像菜单打开“模型设置”，选择模型并填写 API Key。侧栏“当前社区”可以切换知识库；自动运营会在打开 App 或从后台恢复时检查是否到期并生成帖子；完全关闭 App 时不会运行 JavaScript 定时器。

### 本地构建

需要 Java 21、Android SDK 和 Gradle：

```bash
npm run android:build
```

APK 输出到 `android/app/build/outputs/apk/debug/app-debug.apk`。也可以运行 `npm run android:open`，用 Android Studio 打开原生工程。

## 模型配置

RoleCommunity 默认使用 DeepSeek 的 OpenAI 兼容接口。网页端可以通过环境变量配置，Android 端可以在 App 内配置：

```bash
cp .env.example .env.local

OPENAI_API_KEY="your-key"
OPENAI_BASE_URL="https://api.deepseek.com"
OPENAI_MODEL="deepseek-v4-flash"

npm run dev
```

| 配置项 | 说明 |
| --- | --- |
| `OPENAI_API_KEY` | 模型服务密钥。网页端只保存在服务端 `.env.local`；Android 保存在应用本地存储 |
| `OPENAI_BASE_URL` | OpenAI 兼容接口地址，默认 `https://api.deepseek.com` |
| `OPENAI_MODEL` | 默认 `deepseek-v4-flash`，也可填写 `deepseek-v4-pro` 或其他兼容模型 |

也可以在右上角头像菜单进入“模型设置”进行切换。模型请求失败或没有配置密钥时，系统会回退到本地演示生成器，浏览、点赞、评论和知识库操作不会被阻塞。

自动运营页面的“Token 使用量”面板只累计模型服务返回的真实用量，同时单独记录本地演示回退次数。不同知识库的内容队列相互隔离，但用量统计属于当前设备 / 本地工作区总量。

## 离线使用与自托管更新

Android 的更新是可选的，不会影响离线使用：

| 场景 | 行为 |
| --- | --- |
| 正常使用 | 直接读取手机本地社区数据，联网时按需请求模型 |
| 检查更新 | 默认读取 GitHub Release 的稳定清单 [`update-manifest.json`](https://github.com/Polaris-civil/rolecommunity/releases/latest/download/update-manifest.json) |
| 无网络或更新服务不可用 | 保留当前 APK 和全部本地数据，继续使用 |
| 自己托管 | 在“个人资料 → 应用更新”替换为自己的清单 URL |

### 发布自己的更新源

每次发布 APK 时递增 `android/app/build.gradle` 的 `versionCode`，同步 `versionName`、`package.json` 和 `src/updateManifest.js`，然后执行：

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools

npm run android:build
npm run update:publish -- \
  --dir=update-server \
  --url=https://你的域名/rolecommunity \
  --versionCode=4 \
  --notes="本次更新说明"
```

将生成的 `update-server/` 目录部署到支持 HTTPS 的静态文件服务器，确保清单和 APK 均可公开访问：

```text
https://你的域名/rolecommunity/update-manifest.json
https://你的域名/rolecommunity/RoleCommunity-0.1.3-4.apk
```

发布脚本会校验版本号和 Gradle 的 `versionCode` 是否一致，并写入 APK 的 SHA-256。后续 APK 必须使用同一签名密钥，否则 Android 不会覆盖安装。`update-server/` 已加入 `.gitignore`，不会把 APK 意外提交进源码仓库。

## 内容是怎样生成的

生成链路可以概括为：

```text
待发布知识条目
      ↓
角色人设 + 发帖风格 + 帖子类型 + 最近标题
      ↓
DeepSeek / OpenAI 兼容模型
      ↓
标题、正文、标签、引导互动
      ↓
评论问题 → 帖子正文 + 知识库原文 → 角色即时回答
```

提示词会要求模型：

- 从正文中的具体事实、判断条件、反例、误区或面试追问出发，而不是复述资料标题；
- 使用第一人称和有变化的叙事角度，随机切换开场、段落组织和收尾方式；
- 保持角色人设一致，技术内容优先准确，资料不足时明确说明；
- 对用户评论中的疑问强制生成一次结合上下文的回答；
- 小白角色发帖时必须配套一条真实问答，避免只留下没有答案的问题。

完整提示词模板位于 [`src/promptTemplates.js`](src/promptTemplates.js)，模型调用与本地演示回退位于 [`server/generator.js`](server/generator.js)。

## 内置的计算机视觉知识库

内置资料按照“路线总览 → GitHub 开源索引 → 上册 / 中册 / 下册面经”组织，重点服务计算机视觉算法工程师路线。每个知识库都是独立工作区：切换侧栏的“当前社区”后，信息流、知识条目、发布队列和自动发帖范围都会同步切换。

```text
Python / C++ → OpenCV → PyTorch / CNN → 检测与分割
→ Transformer → 视觉基础模型 → VLM 与视频理解
→ 3D / 4D 视觉 → 世界模型 → VLA / 具身智能
→ TensorRT / ONNX 部署
```

路线覆盖数学、编程、图像处理、传统视觉、深度学习、检测、分割、OCR、视觉基础模型、VLM、视频、生成式视觉、3D / 4D、世界模型、VLA、Physical AI、自动驾驶、多传感器、数据工程、部署、可信视觉和求职项目。

GitHub 索引只保存官方仓库链接、用途摘要和许可证提示，不复制第三方代码。使用前请回到原仓库核对当前 LICENSE、模型权重和数据集条款。已收录的入口包括 [OpenCV](https://github.com/opencv/opencv)、[MMDetection](https://github.com/open-mmlab/mmdetection)、[Grounding DINO](https://github.com/IDEA-Research/GroundingDINO)、[SAM 2](https://github.com/facebookresearch/sam2)、[DINOv2](https://github.com/facebookresearch/dinov2)、[Nerfstudio](https://github.com/nerfstudio-project/nerfstudio)、[OpenVLA](https://github.com/openvla/openvla)、[ONNX](https://github.com/onnx/onnx) 和 [TensorRT](https://github.com/NVIDIA/TensorRT)。

在知识库页面导入资料时，可以把内容放入当前库，也可以选择“新建一个独立知识库”。重新构建内置资料：

```bash
npm run knowledge:build
```

原始 Markdown 与结构化条目位于 [`src/assets/`](src/assets/)，方便继续整理或替换为自己的知识库。

## 项目结构

```text
src/
├── pages/                 社区、知识库、角色、自动运营和喜欢页面
├── components/            Markdown、模型设置、更新和头像组件
├── assets/                三册面经、CV 路线、GitHub 索引和结构化条目
├── promptTemplates.js     发帖、回复和求知帖提示词
├── humanGenerator.js      标题、演示内容和人类化表达兜底
├── avatarLibrary.js       头像与随机网名素材库
├── knowledgeBases.js      知识库迁移、归属和工作区筛选
├── usage.js               模型 token 用量累计与统计
├── updateService.js       更新检查、下载和离线容错
└── icons.jsx              本地 Lucide 图标组件
server/
├── index.js               Express API 与自动运营调度
├── content.js             资料清洗、切分和分类
├── generator.js           LLM 接口与演示生成器
└── store.js               本地持久化和数据迁移
public/icons/lucide/       随项目发布的本地 SVG 图标与许可证
scripts/                   知识库构建和 Android 更新发布脚本
android/                   Capacitor Android 原生工程
test/                      Node 单元测试
```

## 开发命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 同时启动 API 和 Web 开发服务器 |
| `npm run dev:phone` | 以局域网模式启动，供同 Wi-Fi 手机浏览器访问 |
| `npm test` | 运行全部 Node 单元测试 |
| `npm run build` | 构建 Web 静态资源 |
| `npm start` | 启动生产模式服务 |
| `npm run knowledge:build` | 重建内置 CV 知识库 |
| `npm run android:build` | 构建 Android debug APK |
| `npm run update:publish` | 生成 APK 更新清单和发布目录 |

提交前建议运行：

```bash
npm test
npm run build
```

## 贡献与许可

欢迎提交 Issue、改进知识库、补充角色设定或贡献代码。新增可见功能时，请同步更新 README，并为生成逻辑、内容清洗和本地运行时补充测试。

项目使用 [MIT License](LICENSE)。图标使用 [Lucide](https://github.com/lucide-icons/lucide) 本地资源，相关许可证文本见 [`public/icons/lucide/LICENSE.txt`](public/icons/lucide/LICENSE.txt)。
