# Proof of Quest - Monad MVP 开发规划

> 基于《设计外包职业贡献凭证项目 MVP 需求文档》与 `v.md` 的 V0.2 决策整理。  
> 规划日期：2026-07-25  
> 目标：在 Monad Testnet 上完成自由设计师职业贡献凭证的签发、公开验证与撤销闭环。

## 1. 最终技术决策

`v.md` 是最新决策，优先级高于原 Word 文档。原文档中的业务需求、隐私边界、状态机和验收标准继续保留；以下 Base/EAS 设计全部替换：

| 原 Word 文档 | Monad 版本 |
| --- | --- |
| Base Sepolia | Monad Testnet |
| EAS Schema | 自研最小 `ProofOfQuestCredential` Solidity 合约 |
| EAS attestation | `Credential` 链上记录 |
| `attestationUID` | `credentialId` (`bytes32`) |
| EAS attester / recipient | 合约中的 `issuer` / `recipient` |
| EAS revoke | 合约 `revokeCredential` |
| EAS Explorer | MonadVision / Monadscan |
| EAS SDK | wagmi + viem + 合约 ABI |

MVP 不使用 Base Sepolia、不依赖 EAS、不发行 NFT、不引入 Token、不做支付和多链。

### Monad Testnet 配置

当前官方参数如下，必须通过环境变量管理，并在正式演示前再次核对：

| 配置 | 值 |
| --- | --- |
| Chain ID | `10143` |
| 网络名 | `Monad Testnet` |
| 原生代币 | `MON` |
| 官方 RPC | `https://testnet-rpc.monad.xyz` |
| 备用 RPC | `https://rpc-testnet.monadinfra.com` |
| 浏览器 | `https://testnet.monadvision.com` |
| 备用浏览器 | `https://testnet.monadscan.com` |
| Faucet | `https://faucet.monad.xyz` |

注意：Monad Testnet 曾在 2025-12-16 重置。合约地址、部署区块和 ABI 必须版本化保存，不能硬编码到页面组件。

## 2. MVP 的产品闭环

```text
公会发布匿名委托
  -> 设计师接受任务
  -> 设计师提交文件指纹和公开摘要
  -> 公会验收并预览永久公开字段
  -> 公会钱包在 Monad 签发贡献凭证
  -> 凭证进入设计师冒险者护照
  -> HR 无钱包公开读取 Monad 并验证
  -> 公会可在 Monad 撤销错误凭证
```

MVP 只证明：某个签发钱包在某个时间，对某个设计师钱包作出了一项未被篡改、当前未撤销的职业贡献声明。

MVP 不证明：设计质量、版权归属、签发方陈述绝对真实、企业已完成法定实名认证。

## 3. “整体结合 Monad”的落地方式

不是把所有资料都写入链上，而是让 Monad 成为跨组织职业凭证的事实来源。

| 场景 | Monad 的作用 | 链下能力 |
| --- | --- | --- |
| 冒险公告板 | 展示公会钱包和目标网络；已完成任务可关联链上凭证 | 匿名任务发布、邀请和筛选 |
| 任务场景 | 生成即将写入 Monad 的 `projectRefHash`、`evidenceHash` 和 `metadataDigest` | 接受任务、私有文件上传、版本记录 |
| 公会验收室 | 模拟合约调用、估算 gas、签发交易、读取 receipt 和事件 | 验收、驳回、敏感信息检查、上链预览 |
| 冒险者护照 | 按 recipient 索引 Monad 事件，并逐条读取合约当前状态 | 像素履历展示、隐藏和分享链接 |
| HR 验证页 | 直接通过 Monad RPC 读取合约，不以数据库状态冒充链上状态 | 解释签发方身份标签和风险边界 |
| 撤销流程 | 只有原 issuer 可调用撤销；旧链接实时读取撤销状态 | 保存可公开撤销原因和操作日志 |

任务流保留在链下是明确的隐私设计。若把创建、邀请、接受和提交全部上链，会额外暴露协作关系、增加钱包步骤，并偏离最小贡献凭证合约的范围。

## 4. 系统架构

```text
Issuer / Designer Wallet                HR (no wallet required)
          |                                       |
          v                                       v
Next.js Web App + Pixel Scenes + wagmi/viem + Public Verify Page
          |                         |             |
          v                         |             v
Next.js Route Handlers              |      Monad RPC fallback pool
  |- SIWE nonce/session             |             |
  |- project state machine          |             v
  |- upload authorization           +----> ProofOfQuestCredential.sol
  |- tx receipt verification                     |
  |- verify aggregation                          v
  |                                        events + contract state
  +--> PostgreSQL
  +--> Private S3-compatible storage
  +--> lightweight event sync worker
```

### 推荐技术栈

| 层级 | 方案 | 说明 |
| --- | --- | --- |
| Web | Next.js App Router + TypeScript | 一个应用同时承载三类角色与公开验证页 |
| 像素场景 | DOM UI + 像素精灵/序列帧；必要时引入 PixiJS | 业务表单仍用可访问的 DOM，不把核心操作塞进 Canvas |
| 钱包 | wagmi + viem | 配置 Monad Testnet，完成连接、切链、读写合约 |
| 登录 | SIWE + 一次性 nonce + HttpOnly session | 登录签名不发交易；消息绑定域名、nonce、过期时间和 chain ID 10143 |
| 合约 | Solidity + Hardhat | Windows 下开发成本最低；测试网做真实集成测试 |
| 数据校验 | Zod | 前后端共享公开字段和状态迁移约束 |
| 数据库 | PostgreSQL + Prisma | 保存任务、提交版本、链上索引和审计日志 |
| 文件 | 私有 S3/R2/MinIO | 使用短期签名 URL；公开验证页永不获得下载权限 |
| 哈希 | Web Crypto + Node crypto | 文件用 SHA-256；项目引用用 keccak256；元数据用 JCS + SHA-256 |
| 链同步 | viem `getLogs` + 定时 worker | 从部署区块增量同步事件；数据库只作索引和缓存 |
| 部署 | Vercel/容器 + 托管 PostgreSQL + 私有对象存储 | RPC 至少配置主备两个端点 |

### 建议目录

```text
apps/
  web/                 Next.js 页面、API、钱包交互
packages/
  contracts/           Solidity、Hardhat、部署脚本和 ABI
  shared/              Zod schema、枚举、canonical JSON、hash 工具
  ui/                  像素风业务组件和场景外壳
prisma/
  schema.prisma
docs/
  contract-addresses/  按 chainId 和版本保存部署信息
```

## 5. Monad 最小凭证合约

合约名建议为 `ProofOfQuestCredential`。首版不使用代理升级，不赋予平台管理员替别人撤销凭证的权限。合约部署者与普通用户在凭证生命周期上没有额外权力。

### 5.1 凭证结构

```solidity
struct Credential {
    address issuer;
    address recipient;
    bytes32 projectRefHash;
    bytes32 evidenceHash;
    bytes32 metadataDigest;
    bytes32 revocationReasonDigest;
    uint64 startedAt;
    uint64 completedAt;
    uint64 issuedAt;
    uint64 revokedAt;
    uint8 confidentialityLevel;
    uint8 evidenceLevel;
    uint16 schemaVersion;
    string projectCategory;
    string role;
    string publicSummary;
}
```

`issuedAt == 0` 表示凭证不存在，`revokedAt == 0` 表示未撤销。`issuer` 取 `msg.sender`，前端不能代填。

### 5.2 合约接口

```solidity
function issueCredential(IssueCredential calldata input)
    external
    returns (bytes32 credentialId);

function revokeCredential(
    bytes32 credentialId,
    bytes32 revocationReasonDigest
) external;

function getCredential(bytes32 credentialId)
    external
    view
    returns (Credential memory);

function isValid(bytes32 credentialId)
    external
    view
    returns (bool);
```

### 5.3 事件

```solidity
event CredentialIssued(
    bytes32 indexed credentialId,
    address indexed issuer,
    address indexed recipient,
    bytes32 projectRefHash
);

event CredentialRevoked(
    bytes32 indexed credentialId,
    address indexed issuer,
    uint64 revokedAt,
    bytes32 revocationReasonDigest
);
```

`credentialId` 建议由合约生成：

```text
keccak256(abi.encode(block.chainid, address(this), issuer, recipient, projectRefHash, issuerNonce))
```

### 5.4 必须在合约中校验

- recipient 不能是零地址。
- `completedAt >= startedAt`。
- `confidentialityLevel` 只能为 0、1、2。
- 当 `confidentialityLevel == 2` 时，合约强制 `publicSummary` 为空；0、1 级摘要仍执行长度上限。
- `evidenceLevel` 在 MVP 中只能为 1、2。
- 当 `evidenceLevel == 2` 时，`evidenceHash` 不能为零；等级 1 允许无文件哈希。
- `schemaVersion == 1`。
- 类别、角色、摘要按 UTF-8 字节数设置硬上限，防止异常大存储。
- 同一 issuer 的同一 `projectRefHash` 不能重复签发。
- 只有凭证原 issuer 可以撤销。
- 已撤销凭证不能再次撤销，历史内容不能删除或修改。
- `getCredential`、撤销和有效性判断必须明确区分“不存在”与“已撤销”，不能让默认零值看起来像凭证。

合约不校验签发方是否“平台认证”。认证标签是链下信息，验证页必须明确区分“钱包签名有效”和“平台已核验资料”。

### 5.5 Monad 特有交易处理

Monad 按 gas limit 而不是实际 gas usage 计费，因此：

1. 签发和撤销前先用 `simulateContract` 做业务与 revert 检查。
2. 使用 `estimateContractGas` 获取精确估值，只留小幅安全余量，不手写过大的 gas limit。
3. 得到交易哈希不等于成功；必须等待 receipt 且检查 `status === success`。
4. 从成功 receipt 解码 `CredentialIssued` / `CredentialRevoked`，再写数据库。
5. 用户拒签或交易失败时，任务保留在 `APPROVED`，可安全重试。

## 6. 链上与链下数据边界

| 信息 | Monad 链上 | 私有链下 | 公开页 |
| --- | --- | --- | --- |
| 身份 | issuer / recipient 钱包地址 | 昵称、工作室认证资料 | 地址 + 链下身份标签 |
| 项目 | 带盐 `projectRefHash`、类别、角色、时间 | projectId、salt、任务要求 | 匿名类别、角色、时间 |
| 成果 | `evidenceHash`、证据等级 | 原文件、版本、对象键 | 哈希和证据类型，不提供文件 |
| 描述 | 按保密级别处理后的 `publicSummary` | 私有备注、驳回原因 | 只显示链上公开摘要 |
| 完整性 | `metadataDigest` | canonical JSON 快照 | 实时比对结果 |
| 撤销 | revokedAt、原因摘要 | 可公开原因文本 | 撤销状态、时间、原因完整性 |
| 商业资料 | 永不上链 | 客户名、报价、合同等必要资料也应尽量不采集 | 永不展示 |

### 哈希规范

- `projectRefHash = keccak256(abi.encode("POQ_PROJECT_V1", projectId, randomSalt))`。
- salt 使用密码学安全随机数，至少 32 bytes。
- `evidenceHash = SHA-256(file raw bytes)`，统一表示为 `0x` + 64 位小写十六进制。
- `metadataDigest = SHA-256(JCS canonical JSON UTF-8 bytes)`；使用 RFC 8785/JCS，禁止依赖普通 `JSON.stringify` 的隐式字段顺序。
- canonical payload 固定包含 `schemaVersion`、`chainId`、`contractAddress`、`issuer`、`recipient`、`projectRefHash`、`evidenceHash`、`projectCategory`、`role`、`publicSummary`、`startedAt`、`completedAt`、`confidentialityLevel`、`evidenceLevel`；地址统一校验和格式，整数用 JSON number，摘要不包含交易后才产生的 `credentialId`、`issuedAt` 和 `txHash`。
- 浏览器先算文件哈希用于反馈，服务端从私有对象重新计算后才可进入 `SUBMITTED`。
- 需要共享固定测试向量，保证浏览器、服务端和测试代码得到完全相同的摘要。

## 7. 页面与功能拆分

### 7.1 冒险公告板 `/`

- 第一屏直接是可操作的匿名任务公告板，不制作营销落地页。
- 未登录用户可看匿名任务；连接钱包后按角色显示发布或接受入口。
- 显示当前 Monad 网络、钱包地址和公会身份标签。
- 任务创建字段：类别、角色、起止时间、公开摘要模板、保密级别。
- 明确禁止输入客户名、报价、联系方式和未发布信息。

### 7.2 任务场景 `/quests/[id]`

- 展示状态机：`DRAFT -> INVITED -> ACCEPTED -> SUBMITTED -> APPROVED -> ISSUING -> ISSUED -> REVOKED`。
- 设计师接受/拒绝任务，上传单个证据文件，填写公开摘要。
- 展示 SHA-256、文件大小、版本和上传时间。
- 驳回后允许重新提交；最终凭证只引用验收版本。
- 页面明确指出哪些字段会永久公开到 Monad。

### 7.3 公会验收室 `/guild/quests/[id]/review`

- 仅任务 issuer 钱包可进入并操作。
- 查看提交版本、私有证据信息和公开摘要。
- 驳回必须填写原因；通过必须勾选贡献确认声明。
- 上链前完整预览合约字段、recipient、网络、合约地址和预计 gas。
- 签发成功后显示 credentialId、交易哈希和 MonadVision 链接。
- 已签发凭证提供撤销入口，撤销前再次确认不可删除的历史性质。

### 7.4 冒险者护照 `/passport/[address]`

- 通过 indexed events 找到 recipient 的凭证，再从合约读取当前状态。
- 用像素角色的任务履历展示类别、角色、日期、签发公会和状态。
- 允许持有人从平台公开列表隐藏，但明确“隐藏不等于链上删除”。
- 生成验证链接与二维码。

### 7.5 护照的 HR 公开验证态 `/verify/[credentialId]`

该路由复用冒险者护照的视觉场景和凭证组件，是第四个核心页面的公开只读状态，不额外扩张为第五套产品场景。

- 无需登录、无需钱包插件。
- 首屏先给出：有效、已撤销、未找到、链上暂不可验证。
- 显示 issuer、recipient、声明内容、签发/撤销时间和完整性结果。
- 技术详情折叠展示 chainId、合约、credentialId、交易和浏览器链接。
- 风险说明首屏可见：链上证明的是谁作出了声明及其当前状态，不保证项目内容或设计质量绝对真实。
- RPC 全部失败时明确报错，禁止用数据库中的旧状态显示绿色“有效”。

## 8. 后端模型与接口

### 8.1 核心实体

- `User`: walletAddress, roles, displayName。
- `IssuerProfile`: organizationName, verificationStatus, verifiedAt。
- `Project`: issuerWallet, designerWallet, status, salt, projectRefHash, confidentialityLevel。
- `Submission`: projectId, version, objectKey, evidenceHash, publicSummary, submittedBy。
- `CredentialRecord`: projectId, chainId, contractAddress, credentialId, txHash, blockNumber, metadataDigest。
- `RevocationRecord`: credentialId, reason, reasonDigest, txHash, revokedAt。
- `ChainSyncCursor`: chainId, contractAddress, lastProcessedBlock。
- `AuditLog`: actorWallet, action, entityType, entityId, createdAt。

数据库中的 `ISSUED` / `REVOKED` 只是产品索引，验证结果始终以 Monad 合约读取为准。

### 8.2 核心接口

```text
POST /api/auth/nonce
POST /api/auth/verify
POST /api/projects
POST /api/projects/:id/invite
POST /api/projects/:id/accept
POST /api/projects/:id/submissions/presign
POST /api/projects/:id/submissions/confirm
POST /api/projects/:id/approve
POST /api/projects/:id/prepare-credential
POST /api/projects/:id/confirm-credential
GET  /api/passport/:address
GET  /api/verify/:credentialId
POST /api/credentials/:id/prepare-revoke
POST /api/credentials/:id/confirm-revoke
POST /api/internal/chain-sync
```

`prepare-*` 只做权限、状态和参数校验并返回合约调用参数，不能替用户签名。`confirm-*` 必须由服务端读取 Monad receipt、校验合约地址、事件、issuer、recipient 和字段后再改变数据库状态。

## 9. 六天实施排期

以下按黑客松 2-3 人团队估算；单人开发时保持顺序并优先完成每阶段的验收门槛。

| 阶段 | 工作 | 完成标准 |
| --- | --- | --- |
| Day 1 基础与合约 | 初始化 monorepo；定义共享 schema；完成合约、单测和 Monad 部署脚本 | 合约测试通过；Testnet 可签发、读取、撤销；浏览器完成源码验证 |
| Day 2 登录与任务 | SIWE；角色；Prisma；创建、邀请、接受；状态机权限 | 两个演示钱包能完成 `DRAFT -> ACCEPTED`，越权请求被拒绝 |
| Day 3 证据与验收 | 私有上传；浏览器/服务端 SHA-256；版本；审批/驳回；JCS 摘要 | 最终提交版本哈希一致；公开字段不含文件 URL 和敏感资料 |
| Day 4 Monad 签发 | 上链预览；模拟、估 gas、写合约；receipt 校验；事件同步 | 交易失败可重试；成功后获得唯一 credentialId 且无重复签发 |
| Day 5 护照、验证、撤销 | recipient 事件索引；passport；公开验证；主备 RPC；撤销 | 无钱包浏览器可独立验证；撤销后旧链接实时显示已撤销 |
| Day 6 像素体验与演示 | 四场景视觉整合；响应式；异常状态；种子数据；E2E；彩排 | 主路径和必演示异常路径全部通过；保留一条有效和一条撤销凭证 |

### 人员并行建议

- 合约/链：合约、部署、ABI、viem、事件同步、MonadVision 验证。
- 全栈：SIWE、Prisma、状态机、上传、哈希、API 与权限。
- 前端/设计：四场景、钱包状态、签发预览、护照、HR 验证和像素资产。

## 10. 测试策略

### 合约测试

- 正常签发、读取、撤销。
- credentialId 唯一且可重复计算验证。
- 零地址、非法时间、非法等级、超长文本全部 revert。
- 同 issuer + projectRefHash 禁止重复签发。
- 非 issuer 撤销、重复撤销、未找到凭证全部 revert。
- 合约部署者不能修改或撤销其他人的凭证。
- 事件参数与 storage 完全一致。

### API 与状态机测试

- nonce 一次性使用、过期和域名/地址不匹配。
- 每个状态只允许规定角色执行规定迁移。
- 被邀请地址必须等于最终 recipient。
- 客户端提交的 txHash 不能伪造成功状态。
- 重复 confirm 具备幂等性。
- 对象存储 URL 不出现在公开接口。
- metadata JSON 被篡改时校验失败。

### E2E 与 Monad 集成测试

- 钱包 A 创建、邀请、验收并签发。
- 钱包 B 接受、提交并看到护照凭证。
- 无钱包访客通过公开链接验证。
- 用户拒签、错误网络、RPC 故障、不存在 ID、交易 revert。
- 钱包 A 撤销后，原链接自动变红并保留历史内容。
- 在 MonadVision 中核对合约、交易、事件和地址。

## 11. 演示准备

演示环境固定准备：

- 钱包 A：演示工作室，预存足量 Testnet MON。
- 钱包 B：自由设计师，预存少量 Testnet MON；接受和提交不需要链上交易。
- 无钱包/隐私窗口：模拟 HR。
- 一条预先签发的有效凭证、一条预先撤销的凭证。
- 主、备 RPC 均配置并在演示当天健康检查。
- 示例证据使用无商业机密的自制 PDF/图片。
- 录屏作为网络完全不可用时的说明材料，但现场产品不得用录像伪装实时链上验证。

现场顺序：公告板创建任务 -> 设计师提交指纹 -> 公会验收 -> Monad 签发 -> 冒险者护照 -> HR 验证 -> Monad 撤销 -> HR 页面刷新。

## 12. 暂不开发

- 其他职业、撮合、支付、托管和分账。
- NFT、Token、交易市场和多链。
- 企业 KYC、完整管理员后台和社交系统。
- EAS、W3C VC 完整实现和零知识证明。
- 多层贡献链、申诉仲裁和多人协作。
- 把设计文件、聊天记录、客户资料或加密文件放到链上/IPFS。
- 账户抽象和 gas sponsorship；可作为 MVP 跑通后的 P1。

## 13. 上线验收门槛

满足以下条件才算 MVP 完成：

1. Monad Testnet 合约已部署、源码已验证，地址与部署区块已版本化。
2. 签发方能从 `APPROVED` 发起真实 Monad 交易并生成唯一 credentialId。
3. 设计师护照能基于链上事件找到凭证，并读取实时状态。
4. HR 在未登录、无钱包情况下能直接从 Monad 验证核心字段。
5. 撤销只能由原 issuer 执行，撤销后旧链接实时失效但历史保留。
6. 数据库被清空时，凭证核心声明与撤销状态仍可从合约读取。
7. RPC 失败时不显示伪造的“有效”结果。
8. 客户名、报价、联系方式、合同和原始设计文件从未上链。
9. 哈希规范有共享测试向量，浏览器和服务端结果一致。
10. 主路径、拒签、错误网络、不存在 ID、撤销和摘要篡改均完成演示彩排。

## 14. 开工顺序

第一批代码应按以下顺序提交，避免先做大量视觉页面却没有链上闭环：

1. `packages/shared`：字段定义、枚举、哈希与 canonical JSON 测试向量。
2. `packages/contracts`：凭证合约、测试、部署与 ABI 导出。
3. `apps/web` 最小链路：连接钱包 -> Testnet 签发 -> `/verify/[id]` 直接读取。
4. Prisma 任务状态机与 SIWE。
5. 私有上传、提交、审批与 receipt 确认。
6. 护照索引、撤销和 RPC 降级。
7. 最后整合像素场景、动效、二维码、响应式和演示数据。

先跑通“签发 -> 验证 -> 撤销”这一条 Monad 纵向切片，再扩展完整任务流程，是本项目最稳妥的开发路径。

## 15. 官方参考

- Monad Testnet：<https://docs.monad.xyz/developer-essentials/testnets>
- Monad 与 Ethereum 的差异：<https://docs.monad.xyz/developer-essentials/differences>
- Monad Foundry 部署指南：<https://docs.monad.xyz/guides/deploy-smart-contract/foundry>
- Monad 区块浏览器：<https://docs.monad.xyz/tooling-and-infra/block-explorers>
