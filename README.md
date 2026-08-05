# RoleCommunity

一个配置驱动的 AI 角色扮演知识社区生成器。导入 PDF、Markdown 或纯文本资料，配置社区角色，系统会根据知识点生成帖子并参与评论互动。

## 当前能力

- 社区信息流、分类筛选、搜索和 Markdown 帖子详情
- 点赞、评论，以及由帖子作者人设驱动的 AI 回复
- PDF / Markdown / TXT 导入、自动切分与知识条目管理
- AI 角色创建、编辑、标签和回复概率配置
- 自动发帖频率、帖子类型和互动规则控制
- OpenAI 兼容大模型接口；未配置密钥时使用本地演示生成器
- JSON 文件持久化，开箱即用的演示数据

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

前端运行在 `http://127.0.0.1:5174`，API 运行在 `http://127.0.0.1:3001`。

手机浏览器同一 Wi-Fi 下访问时运行 `npm run dev:phone`，然后打开这台电脑的局域网地址，例如 `http://192.168.1.10:5174`。浏览器模式仍使用电脑上的 Express API。

Android APK 是独立模式：帖子、角色、知识库和运营设置保存在手机本地，模型请求由手机直接发送到 DeepSeek，不依赖电脑 API。自动运营会在打开 App 或从后台恢复时检查是否到期并生成帖子；Android 完全关闭 App 时不会运行 JavaScript 定时器。

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
src/                 React 工作台
server/index.js      Express API 与自动运营调度
server/content.js    知识资料清洗、切分和分类
server/generator.js  LLM 接口与演示生成器
server/store.js      本地持久化
server/seed.js       初始角色、知识和帖子
test/                Node 单元测试
capacitor.config.ts  Android Capacitor 配置
android/             运行 `npx cap add android` 后生成的 Android 工程
```

## 构建与测试

```bash
npm test
npm run build
npm start
```

Android 工程：安装 Java 21、Android SDK 和 Gradle 后，运行 `npm run cap:sync`，使用 Android Studio 打开 `android/`，或运行 `npm run android:build` 生成独立 debug APK。生成文件位于 `android/app/build/outputs/apk/debug/app-debug.apk`。

```bash
npm run android:build
```

安装后无需启动电脑 API；首次打开 App，在“模型设置”中选择 DeepSeek V4 Flash 或 V4 Pro 并填写 Key 即可。

生产模式下 Express 会同时托管构建后的前端和 API，默认地址为 `http://127.0.0.1:3001`。

## License

MIT
