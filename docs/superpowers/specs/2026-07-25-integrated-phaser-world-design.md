# Agentopolis Phaser 世界串联设计

日期：2026-07-25  
目标项目：`D:\Desktop\monad\agentopolis`  
迁移来源：`D:\Desktop\monad\agentopolis-v2`

## 1. 目标

以 `agentopolis` 为唯一主项目，把 `agentopolis-v2` 的 Phaser 可移动世界、
连续剧情和地点互动逻辑迁入现有 Next.js 应用。玩家应能在同一张全屏像素地图中
移动、靠近地点并按 `E` 互动，通过现有 React 弹窗完成设计师、公会和 HR 的完整
贡献凭证流程。

第一阶段继续使用浏览器本地模拟签发，不调用真实 Monad Testnet 合约。
`agentopolis-v2` 保持不变，只作为迁移来源。

## 2. 当前项目职责

### 2.1 `agentopolis`

- Next.js 16 + React 19。
- 全屏像素地图和现有 Alicization Town 地图、角色、物件、音效素材。
- 设计师、公会和 HR 三种角色视角。
- 任务创建、接受、成果提交、公会签发和撤销。
- 冒险护照、公开凭证验证路由和本地持久化。
- 现有抽屉、表单、状态提示和响应式界面。

### 2.2 `agentopolis-v2`

- Vite + React + Phaser 3。
- WASD/方向键移动、互动距离检测和 `E` 键地点互动。
- 从隐形劳动到 HR 验证的连续剧情。
- V1 提交、公会反馈、V2 修改、验收和职业档案环节。
- SHA-256 成果指纹逻辑。
- Solidity 凭证登记合约原型。

## 3. 选定架构

采用原生迁移方式，不使用 iframe、独立端口或两个应用之间的 `postMessage`。

- `agentopolis` 是唯一应用、唯一开发服务器和唯一部署产物。
- Phaser 只负责地图渲染、角色移动、地点热区、距离判断和互动事件。
- React 负责 HUD、角色切换、任务表单、剧情对话、签发、护照和公开验证。
- `DemoProvider` 是唯一业务状态源。
- Phaser 不得直接修改 Quest、Credential 或 Story 状态。
- Phaser 向 React 发送稳定的地点 ID；React 根据角色和业务状态处理互动。
- 地图互动与右侧快捷入口必须调用同一组 React 动作。

## 4. 世界表现

Phaser 不直接照搬 v2 的纯色程序化城镇。它加载 `agentopolis` 已有的
`town-map.gif`、玩家、NPC、公告板和音效素材，并在地图上叠加：

- 可移动玩家角色；
- 互动地点热区；
- 发光或浮动标记；
- 最近地点提示；
- 相机与世界边界；
- 桌面键盘控制；
- 移动端虚拟方向控制；
- 可点击地点入口。

如果 Phaser 初始化或资源加载失败，界面回退到现有静态地图。顶部导航、右侧快捷
入口和 React 弹窗仍须可用，使业务流程不依赖 Canvas 成功加载。

## 5. 地点与业务能力

| 地点 ID | 地图名称 | 主要角色 | React 能力 |
|---|---|---|---|
| `home` | 设计师小屋 | 设计师 | 序章、隐形劳动说明、开始主线 |
| `guild` | 任务公会 | 公会/设计师 | 创建匿名任务、发送邀请、查看并接受任务 |
| `workshop` | 设计工作台 | 设计师 | 填写公开摘要、提交 V1 或 V2、生成成果指纹 |
| `feedback` | 反馈邮局 | 设计师 | 查看公会对 V1 的修改意见 |
| `altar` | 验收签发台 | 公会 | 驳回 V1、验收 V2、模拟 Monad 签发 |
| `archive` | 职业档案馆 | 设计师 | 将凭证加入冒险护照与求职档案 |
| `hr` | HR 招聘大厅 | HR | 无钱包读取并核验公开凭证 |
| `monument` | Monad 记忆碑 | 全部 | 查看有效/撤销状态；公会可撤销 |

地图地点触发和右侧快捷入口都调用统一的 `openWorldLocation(locationId)` 路由逻辑。

## 6. 剧情主线

```text
INTRO
→ TASK_CREATED
→ DESIGNER_INVITED
→ QUEST_ACCEPTED
→ V1_SUBMITTED
→ REVISION_REQUESTED
→ V2_SUBMITTED
→ WORK_APPROVED
→ ATTESTING
→ CREDENTIAL_ISSUED
→ PORTFOLIO_SHARED
→ HR_VERIFIED
→ CREDENTIAL_REVOKED（可选）
```

### 6.1 主线动作

1. 设计师在小屋了解“有作品但缺少可验证经历”的困境。
2. 公会创建匿名任务并邀请设计师。
3. 设计师确认公开边界并接受任务。
4. 设计师在工作台提交 V1，浏览器生成 SHA-256 指纹。
5. 公会在验收台驳回 V1，并发送具体修改意见。
6. 设计师通过反馈邮局阅读意见，在工作台提交 V2 和新指纹。
7. 公会验收 V2。
8. 公会模拟签发 Monad 贡献凭证。
9. 设计师将凭证加入冒险护照。
10. HR 无需连接钱包即可核验同一凭证。
11. 公会可在记忆碑撤销凭证，公开验证页立即显示失效。

## 7. 数据模型

`DemoSnapshot` 增加：

- `storyStage`：当前剧情阶段；
- `activeQuestId`：主线任务；
- `project`：公开摘要、当前版本、V1/V2 指纹和修改意见；
- `playerPosition`：可选的最近玩家位置，用于刷新后的地图恢复；
- `schemaVersion`：本地存储迁移版本。

Quest 状态扩展为：

```text
INVITED
ACCEPTED
V1_SUBMITTED
REVISION_REQUESTED
V2_SUBMITTED
APPROVED
ISSUED
REVOKED
```

Credential 增加：

- 是否已加入护照；
- HR 核验次数或已核验标记；
- 成果指纹；
- 当前有效/撤销状态；
- 撤销时间和原因。

剧情阶段用于引导和世界变化，Quest/Credential 状态用于业务事实。Provider 的单个
原子动作同时更新相关字段，避免两个状态源发生不一致。

## 8. Provider 动作与守卫

Provider 暴露下列高层动作：

- `startStory()`
- `createStoryQuest()`
- `inviteDesigner()`
- `acceptQuest(questId)`
- `submitVersion(questId, version, submission)`
- `requestRevision(questId, feedback)`
- `approveQuest(questId)`
- `issueCredential(questId)`
- `addCredentialToPassport(credentialId)`
- `verifyCredential(credentialId)`
- `revokeCredential(credentialId)`
- `setRole(role)`
- `savePlayerPosition(position)`
- `resetDemo()`

所有动作检查：

- 当前角色；
- 当前剧情阶段；
- Quest 当前状态；
- 必需的数据，如成果摘要、版本和指纹；
- Credential 是否存在及是否有效。

非法动作不改变状态，并返回可展示的错误结果。React 负责把错误转化为明确提示。

## 9. React 与 Phaser 接口

建立窄接口：

```ts
type WorldLocationId =
  | "home"
  | "guild"
  | "workshop"
  | "feedback"
  | "altar"
  | "archive"
  | "hr"
  | "monument";

type WorldInteractionDetail = {
  locationId: WorldLocationId;
};

type PlayerPosition = {
  x: number;
  y: number;
};
```

Phaser 组件接收：

- 当前剧情阶段；
- 当前角色；
- 初始玩家位置；
- `onInteract(locationId)`；
- `onPositionChange(position)`；
- `onReady()`；
- `onError(error)`。

React 不依赖 Phaser 内部 Scene、GameObject 或坐标实现。

## 10. 界面设计

- 主视图继续占满浏览器，无外层边距。
- 顶部保留品牌、角色切换、网络状态和钱包演示。
- 右侧保留快捷入口，名称按角色变化。
- 左下 HUD 显示章节、下一目标、移动与互动提示。
- 靠近地点显示“按 E 与「地点」互动”。
- 移动端显示小型虚拟方向控制，并允许直接点击地点。
- 所有复杂表单和凭证详情继续使用 React 抽屉。
- 弹窗延续当前黑白、金色和 Monad 紫色体系。
- Phaser Canvas 不复制 React 业务表单。

## 11. 容错与迁移

### 11.1 本地数据迁移

- 增加 `schemaVersion`。
- 老数据缺少剧情字段时，根据现有 Quest/Credential 状态推断最接近的剧情阶段。
- 老凭证缺少成果指纹、护照或核验字段时补默认值。
- 无法识别的字段不导致整个快照丢失；回退到安全的初始值。

### 11.2 运行时错误

- 角色不匹配：不推进状态，提示应切换的角色。
- 前置状态不满足：展示当前目标，不显示无效成功反馈。
- 模拟签发失败：保留 `APPROVED`，允许重试。
- Phaser 失败：回退静态地图，快捷入口保持业务可用。
- 资源失败：隐藏对应装饰，不能阻断任务流程。
- 撤销：保留原凭证和验证链接，仅更新状态和撤销信息。

## 12. Solidity 合约处理

把 `agentopolis-v2/contracts` 迁入主项目 `contracts/`，作为后续真实 Monad 集成的
独立模块。本阶段：

- 不在 Next.js 运行时导入 Hardhat；
- 不添加钱包 SDK；
- 不调用 RPC；
- 不把模拟交易描述成真实链上交易；
- README 明确标记本地模拟与真实合约的边界。

## 13. 测试与验收

### 13.1 单元测试

- 旧快照到新 schema 的迁移；
- 每个 Provider 动作的合法状态转换；
- 错误角色和错误前置状态不能推进；
- V1 必须经过修改请求才能提交 V2；
- V2 必须验收后才能签发；
- 撤销保留凭证内容和验证链接。

### 13.2 组件测试

- Phaser 地点事件打开正确抽屉；
- 右侧快捷入口打开相同内容；
- HUD 根据剧情阶段显示下一目标；
- Phaser 错误时显示静态地图回退；
- 移动端控制按钮发出方向输入。

### 13.3 浏览器测试

- 完整执行设计师 → 公会 → 设计师 → 公会 → 设计师 → HR 主线；
- 刷新后恢复剧情与业务状态；
- HR 无钱包核验；
- 公会撤销后验证页显示“已撤销”；
- 桌面、平板、390px 和 320px 无横向溢出；
- Phaser 失败回退后仍可通过快捷入口完成流程。

## 14. 完成标准

- 一个 `npm run dev` 启动完整项目。
- 玩家可在现有像素地图上移动并互动。
- 地图与快捷入口使用同一业务状态。
- 完整 V1 → 修改 → V2 → 验收 → 签发流程可运行。
- 凭证可加入护照并由 HR 无钱包核验。
- 撤销后公开验证页保留历史并显示失效。
- 刷新不会丢失进度。
- Phaser 失败不会使业务流程不可用。
- `agentopolis-v2` 未被修改。
- 第一阶段没有真实 Monad 交易。

## 15. 非目标

- 本阶段不接入真实钱包或 Monad RPC。
- 不实现支付、Token、NFT 或凭证交易。
- 不上传或公开设计源文件。
- 不进行客户、设计师或公会 KYC。
- 不实现多人在线、服务器同步或账号体系。
- 不重写现有公开验证路由。
