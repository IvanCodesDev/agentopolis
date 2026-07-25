# Agentopolis

Agentopolis 是 Proof of Quest 的最小 MVP 前端 Demo。项目把 `Alicization-Town-main` 的像素地图、角色和物件素材接入到一个全屏主视图中，用 Phaser 实现可移动地图体验，并通过右侧伸缩弹窗完成任务、验收、凭证和 HR 查验的演示流程。

当前版本以本地模拟为主：钱包连接、Monad Testnet 状态、交易哈希、贡献凭证和角色数据都在浏览器侧模拟，并通过 `localStorage` 保存。项目不会发起真实链上交易，也不会调用真实合约。

## 项目概述

这个 Demo 展示一个围绕“可验证贡献经历”的轻量流程：

- Designer 视角：进入像素世界，接受匿名任务，提交公开成果摘要。
- Guild 视角：创建或邀请任务，对成果进行反馈、验收并签发演示凭证。
- HR 视角：查看公开凭证，验证贡献经历是否有效。
- 地图主视图：大厅/城镇地图占据完整屏幕，功能入口以右侧按钮和弹窗形式出现。
- 本地状态：任务、角色、凭证、地图位置和钱包演示状态保存在浏览器本地。

## 安装/运行步骤

先进入项目目录：

```bash
cd D:\Desktop\monad\agentopolis
```

安装依赖：

```bash
npm install
```

启动本地开发服务：

```bash
npm run dev
```

打开浏览器访问：

```text
http://localhost:3000
```

如果需要构建生产版本：

```bash
npm run build
npm start
```

项目也提供测试脚本：

```bash
npm run test
npm run test:e2e
```

## 主要功能

- 全屏像素地图主视图，复用 Alicization Town 的地图、角色和物件素材。
- Phaser 驱动的角色移动、地图热区和交互入口。
- Designer、Guild、HR 三种角色视角切换。
- 任务公告板、当前任务、冒险护照、链上状态演示等弹窗面板。
- 最小 Proof of Quest 主流程：创建/邀请任务、接受任务、提交成果、请求修改、验收、签发凭证、公开查验。
- 本地模拟钱包状态和 Monad Testnet 网络状态。
- 凭证公开验证页面：`/verify/[credentialId]`。
- 移动端方向键控件，用于触屏设备上的地图移动和交互。

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Phaser 3
- lucide-react
- react-hook-form
- zod
- Vitest
- Playwright

## 素材说明

像素地图、角色和部分物件素材复用自 Alicization Town。相关授权和署名信息请查看：

- [ATTRIBUTION.md](ATTRIBUTION.md)
- [LICENSES/Alicization-Town-AGPL-3.0.txt](LICENSES/Alicization-Town-AGPL-3.0.txt)
