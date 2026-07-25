# Proof of Quest 后端开发文档

> 适用范围：`server/` 后端服务、`packages/shared` 共享契约，以及与 Monad Testnet 的全部交互。  
> 上游依据：`Proof_of_Quest_Monad_MVP开发规划.md`（业务与合约）、`v.md`（V0.2 决策）。  
> 编写日期：2026-07-25  
> 目标：给出可以直接照着写代码的后端分层、数据模型、接口契约、Monad 集成协议与验收门槛。

## 0. 开工前必须知道的三件事

### 0.1 当前代码基线（实测，不是假设）

| 项目 | MVP 规划文档的假设 | 仓库实际状态 |
| --- | --- | --- |
| Web 框架 | Next.js App Router + Route Handlers | Vite + React + `react-router-dom` 的纯 SPA |
| Web3 依赖 | wagmi + viem | `package.json` 中一个都没有 |
| 上链流程 | 真实交易 | `src/pages/ReviewPage.tsx` 用两个 `setTimeout` 假装钱包签名与广播 |
| `credentialId` | 合约 keccak256 生成 | 由 `"0123456789abcdef"[(index * 7 + quest.id.length) % 16]` 拼出的假十六进制串 |
| 数据 | Prisma + PostgreSQL | `src/state.tsx` 中 4 条硬编码 mock，全部存活在 `useState` |
| 后端 | 存在 | 不存在，没有任何服务端代码 |

结论：**现有代码是一套完整度很高的前端演示壳，链上部分一次都没有真实跑过。** 本文档描述的是从零新建的后端。

### 0.2 架构决策：不迁移 Next.js

MVP 规划文档假设 Next.js，但前端已按 Vite SPA 完成四个页面的视觉与路由。两种收敛方式对比：

| 维度 | A. 迁移到 Next.js | B. 保留 SPA + 独立 Node 后端 |
| --- | --- | --- |
| 前端改造量 | 路由、构建、样式全部要动 | 零改动，只把 mock 换成 `fetch` |
| 前后端并行 | 耦合在同一应用 | 可完全并行 |
| `/verify/:id` SSR | 有 | 无，首屏等 JS + RPC |
| 黑客松风险 | 高 | 低 |

**本文档采用方案 B。** 依据：MVP 规划第 13 节的十条上线验收门槛中没有任何一条要求 SSR，因此 SSR 不是 MVP 门槛，不值得为它承担重写风险。若后续确实需要分享链接的 OG 预览，只为 `/verify/:credentialId` 单独增加一个后端直出 HTML 的极小路由，不做整体迁移。

### 0.3 三条不可让步的铁律

1. **链是唯一事实源，数据库只是索引。** 公开验证结果必须来自 Monad 合约实时读取；数据库里的 `ISSUED` 只是产品索引，任何情况下都不能冒充链上有效状态。
2. **后端永不持有用户私钥。** 采用 `prepare → 用户钱包签名 → confirm` 三段式，后端只负责准备参数与核对结果。`issuer` 必须是公会自己的钱包，不能是平台代签。
3. **客户端提交的 `txHash` 一律不可信。** `confirm` 接口必须自己拉取 receipt 并逐项校验后，才允许改变数据库状态。

---

## 1. 技术选型

| 层级 | 选型 | 理由 |
| --- | --- | --- |
| 运行时 | Node.js 20 LTS | 原生 fetch、稳定的 ESM 支持 |
| HTTP 框架 | Fastify 4 | 内置 schema 校验与序列化、pino 日志原生集成、插件边界清晰 |
| 校验 | Zod（置于 `packages/shared`） | 前端、后端、合约测试三方共用同一份字段定义与约束 |
| 链交互 | viem 2.x | 与前端 wagmi 同源；`simulateContract`、`decodeEventLog` 类型安全 |
| 数据库 | PostgreSQL 16 + Prisma 5 | 唯一索引与事务是幂等性的基础 |
| 合约 | Solidity 0.8.24 + Foundry | Monad 官方部署指南以 Foundry 为主；fuzz 测试适合验证 `credentialId` 唯一性。Windows 工具链卡住就退回 Hardhat，不在工具链上消耗时间 |
| 登录 | SIWE（EIP-4361）+ HttpOnly Cookie Session | 登录签名不发交易、不消耗 MON |
| 对象存储 | 开发用 MinIO，生产用 Cloudflare R2 | S3 兼容，presigned URL |
| 日志 | pino（结构化 JSON） | 便于按 `requestId` / `projectId` / `txHash` 关联排查 |

依赖新增原则：除上表以外的库，必须先证明现有能力不足。特别是**不要引入 ethers**，与 viem 并存会导致地址大小写、BigInt 处理两套语义。

---

## 2. 目录结构

```text
server/
  src/
    app.ts                 Fastify 实例、插件注册、统一错误处理
    server.ts              启动入口、优雅关闭
    config/
      env.ts               Zod 校验的环境变量，启动即失败
      chains.ts            Monad 链定义与 RPC 池
    routes/                HTTP 边界：解析 -> 调 service -> 序列化
      auth.route.ts
      project.route.ts
      submission.route.ts
      credential.route.ts
      passport.route.ts
      verify.route.ts
      internal.route.ts
    services/              业务规则唯一真源
      auth.service.ts      nonce 生成与一次性消费、SIWE 校验、session
      project.service.ts   状态机迁移与地址级权限
      submission.service.ts presign、服务端重算 evidenceHash、版本管理
      credential.service.ts prepare / confirm、metadataDigest 快照
      revocation.service.ts 撤销的 prepare / confirm
      verify.service.ts    链上聚合读取与降级
    chain/                 所有 Monad 交互收敛于此
      client.ts            viem publicClient + RPC fallback
      contract.ts          ABI 与地址（按 chainId 版本化载入）
      reader.ts            getCredential / isValid / getLogs
      receipt.ts           receipt 拉取、事件解码、八项校验
      sync.ts              增量事件同步 worker
    db/
      prisma.ts            PrismaClient 单例
      repositories/        查询封装，避免 service 里散落裸 SQL
    lib/
      hash.ts              keccak256 / sha256 / JCS canonical
      errors.ts            AppError 与错误码表
      logger.ts
      audit.ts             审计日志写入
  prisma/
    schema.prisma
  test/
    unit/  integration/  vectors/

packages/
  shared/                  Zod schema、枚举、canonical JSON、哈希工具、测试向量
  contracts/               Solidity、Foundry 测试、部署脚本、ABI 导出

docs/
  contract-addresses/
    10143.json             按 chainId 版本化保存地址与部署区块
```

### 2.1 分层铁律

- **`routes/` 不得直接引用 Prisma 或 viem。** 路由只做参数解析、调用 service、序列化响应。
- **所有链交互只能走 `chain/`。** service 想读链，调 `chain/reader.ts`，不得自己 new 一个 client。
- **所有状态迁移只能走 `services/`。** 任何地方都不允许裸写 `prisma.project.update({ status })`。

这样后面换 RPC 供应商、升级合约版本、加读缓存，都只动一层。

---

## 3. 配置与环境变量

`config/env.ts` 用 Zod 校验，**缺失或非法直接抛错终止启动**，不允许运行时才发现配置缺失。

```ts
export const env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  SIWE_DOMAIN: z.string(),                     // 绑定到签名消息，防跨站重放
  CHAIN_ID: z.literal(10143),
  RPC_PRIMARY: z.string().url(),
  RPC_FALLBACK: z.string().url(),
  CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  CONTRACT_DEPLOY_BLOCK: z.coerce.bigint(),
  S3_ENDPOINT: z.string().url(),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
}).parse(process.env);
```

### 3.1 Monad Testnet 参数

| 配置 | 值 |
| --- | --- |
| Chain ID | `10143` |
| 原生代币 | `MON` |
| 主 RPC | `https://testnet-rpc.monad.xyz` |
| 备 RPC | `https://rpc-testnet.monadinfra.com` |
| 浏览器 | `https://testnet.monadvision.com` |
| 备用浏览器 | `https://testnet.monadscan.com` |
| Faucet | `https://faucet.monad.xyz` |

**Monad Testnet 曾在 2025-12-16 重置。** 合约地址、部署区块、ABI 必须写入 `docs/contract-addresses/10143.json` 并版本化提交，代码从该文件读取。再次重置时只换配置文件，不改代码。

```json
{
  "chainId": 10143,
  "contractName": "ProofOfQuestCredential",
  "address": "0x...",
  "deployBlock": 123456,
  "deployedAt": "2026-07-25T00:00:00Z",
  "abiPath": "packages/contracts/out/ProofOfQuestCredential.json"
}
```

---

## 4. 数据模型

数据库中的 `ISSUED` / `REVOKED` **只是产品索引**，验证结果永远以合约读取为准。

```prisma
enum ProjectStatus {
  DRAFT
  INVITED
  ACCEPTED
  SUBMITTED
  APPROVED
  ISSUING
  ISSUED
  REVOKED
}

enum VerificationStatus {
  UNVERIFIED
  PENDING
  VERIFIED
}

model User {
  walletAddress String   @id                    // EIP-55 校验和格式，全库统一
  displayName   String?
  createdAt     DateTime @default(now())
  issuerProfile IssuerProfile?
}

model IssuerProfile {
  walletAddress      String             @id
  organizationName   String
  verificationStatus VerificationStatus @default(UNVERIFIED)
  verifiedAt         DateTime?
  user               User               @relation(fields: [walletAddress], references: [walletAddress])
}

model Project {
  id                   String        @id @default(cuid())
  issuerWallet         String
  designerWallet       String?                        // INVITED 时写入，之后不可变
  status               ProjectStatus @default(DRAFT)
  projectCategory      String        @db.VarChar(32)
  role                 String        @db.VarChar(32)
  startedAt            DateTime
  completedAt          DateTime
  publicSummary        String        @db.VarChar(120)
  confidentialityLevel Int           @db.SmallInt      // 0 / 1 / 2
  evidenceLevel        Int           @db.SmallInt      // MVP 只允许 1 / 2
  salt                 Bytes                           // 32 bytes，私有，永不出现在任何响应中
  projectRefHash       String?       @unique           // 0x + 64 hex
  metadataSnapshot     Json?                           // prepare 时的 canonical payload
  metadataDigest       String?
  version              Int           @default(0)       // 乐观锁
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  submissions      Submission[]
  credentialRecord CredentialRecord?

  @@index([issuerWallet, status])
  @@index([designerWallet, status])
}

model Submission {
  id            String   @id @default(cuid())
  projectId     String
  version       Int
  objectKey     String                             // 私有对象存储 key，永不出公开接口
  fileName      String
  fileSize      Int
  evidenceHash  String                             // 服务端从对象存储重算的结果
  publicSummary String   @db.VarChar(120)
  submittedBy   String
  createdAt     DateTime @default(now())
  project       Project  @relation(fields: [projectId], references: [id])

  @@unique([projectId, version])
}

model CredentialRecord {
  credentialId    String   @id                     // 0x + 64 hex，由合约生成
  projectId       String   @unique
  chainId         Int
  contractAddress String
  issuerWallet    String
  recipientWallet String
  txHash          String   @unique                 // 幂等的核心保障
  blockNumber     BigInt
  metadataDigest  String
  issuedAt        DateTime
  hiddenByOwner   Boolean  @default(false)         // 护照隐藏，不等于链上删除
  project         Project  @relation(fields: [projectId], references: [id])

  @@index([recipientWallet])
}

model RevocationRecord {
  credentialId String   @id
  reason       String   @db.VarChar(200)           // 可公开的撤销原因原文
  reasonDigest String
  txHash       String   @unique
  revokedAt    DateTime
}

model ChainSyncCursor {
  id                 String   @id                  // `${chainId}:${contractAddress}`
  chainId            Int
  contractAddress    String
  lastProcessedBlock BigInt
  updatedAt          DateTime @updatedAt
}

model AuthNonce {
  nonce     String    @id
  address   String
  expiresAt DateTime
  usedAt    DateTime?                              // 非空即已消费，保证一次性
}

model AuditLog {
  id          String   @id @default(cuid())
  actorWallet String
  action      String
  entityType  String
  entityId    String
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([entityType, entityId])
}
```

### 4.1 字段约定

- **地址**：全库统一 EIP-55 校验和格式。写入前统一 `getAddress()` 规范化，比较时也走同一函数，禁止裸 `===` 比较未规范化的地址。
- **哈希**：统一 `0x` + 64 位**小写**十六进制字符串。
- **`salt`**：32 字节密码学安全随机数，只存数据库，**永不出现在任何接口响应、日志或前端**。
- **`BigInt`**：`blockNumber` 跨 JSON 边界一律序列化为字符串，防止超出 JS 安全整数范围。

---

## 5. 状态机

```text
DRAFT -> INVITED -> ACCEPTED -> SUBMITTED -> APPROVED -> ISSUING -> ISSUED -> REVOKED
```

用显式转移表实现，不要写散落的 if-else：

```ts
type Actor = 'issuer' | 'designer' | 'system';

export const TRANSITIONS: Record<ProjectStatus, Partial<Record<ProjectStatus, Actor>>> = {
  DRAFT:     { INVITED:   'issuer'   },
  INVITED:   { ACCEPTED:  'designer', DRAFT:    'designer' },  // 设计师拒绝邀请，退回草稿
  ACCEPTED:  { SUBMITTED: 'designer' },
  SUBMITTED: { APPROVED:  'issuer',   ACCEPTED: 'issuer'   },  // 公会驳回，退回可重新提交
  APPROVED:  { ISSUING:   'issuer'   },
  ISSUING:   { ISSUED:    'system',   APPROVED: 'system'   },  // 交易失败退回，可安全重试
  ISSUED:    { REVOKED:   'issuer'   },
  REVOKED:   {},
};
```

### 5.1 三个必须守住的点

1. **`issuer` / `designer` 不是角色名，是"必须等于这条记录上的哪个钱包地址"。** 权限判断是 `session.address === project.issuerWallet`，不是"这个用户是不是公会角色"。只做角色判断会导致 A 公会能给 B 公会的任务签发。
2. **`ISSUING → ISSUED` 的 actor 是 `system`。** 只能由 `confirm-credential` 在拿到并校验通过成功 receipt 后触发，不接受客户端直接请求该迁移。
3. **每次迁移在单个数据库事务内完成，并带乐观锁。**

```ts
const updated = await tx.project.updateMany({
  where: { id, status: expectedStatus, version: expectedVersion },
  data:  { status: nextStatus, version: { increment: 1 } },
});
if (updated.count === 0) throw new AppError('STATE_CONFLICT', 409);
```

### 5.2 状态与前端的映射

前端 `src/types.ts` 目前的 `QuestStatus` 缺少 `DRAFT`。接入真实后端时补齐为八态，并且**前端不得自行推断状态**，一律以接口返回为准。

---

## 6. 接口契约

所有接口前缀 `/api`。除标注"公开"外均需要有效 session。

### 6.1 认证

| 接口 | 说明 |
| --- | --- |
| `POST /auth/nonce` | 入参 `{ address }`；返回 `{ nonce, expiresAt }`。nonce 单次有效，TTL 5 分钟 |
| `POST /auth/verify` | 入参 `{ message, signature }`；校验通过后种 HttpOnly Cookie，返回 `{ address, roles }` |
| `POST /auth/logout` | 清除 session |
| `GET  /auth/me` | 返回当前 session 身份 |

SIWE 消息必须绑定 `domain`（等于 `SIWE_DOMAIN`）、`nonce`、`chainId: 10143`、`expirationTime`。校验步骤：解析消息 → 比对 domain / chainId / 过期时间 → 查 `AuthNonce` 且 `usedAt IS NULL` → 验签得到地址 → 在同一事务内把 nonce 标记为已消费。

### 6.2 项目与状态机

| 接口 | 鉴权 | 前置状态 | 关键校验 |
| --- | --- | --- | --- |
| `POST /projects` | 任意登录 | — | 生成 32 字节 `salt`；字段禁止包含客户名、报价、联系方式 |
| `POST /projects/:id/invite` | `= issuerWallet` | `DRAFT` | `designerWallet` 非零地址且不等于 issuer；写入后不可变更 |
| `POST /projects/:id/accept` | `= designerWallet` | `INVITED` | 调用者必须等于被邀请地址 |
| `POST /projects/:id/reject` | `= designerWallet` | `INVITED` | 退回 `DRAFT` |
| `POST /projects/:id/approve` | `= issuerWallet` | `SUBMITTED` | 必须带贡献确认声明标记 |
| `POST /projects/:id/reject-submission` | `= issuerWallet` | `SUBMITTED` | 必须填写驳回原因；退回 `ACCEPTED` |
| `GET  /projects/:id` | 参与方 | — | 非参与方只返回匿名公开字段 |

### 6.3 证据提交

| 接口 | 说明 |
| --- | --- |
| `POST /projects/:id/submissions/presign` | 入参 `{ fileName, fileSize, contentType }`。校验大小上限与类型白名单，返回短期 presigned PUT URL 与 `objectKey` |
| `POST /projects/:id/submissions/confirm` | 入参 `{ objectKey, publicSummary }`。**服务端从对象存储拉取文件重新计算 SHA-256**，与浏览器上报值一致才允许进入 `SUBMITTED` |

**绝不信任前端上报的 `evidenceHash`。** 浏览器算的那一份（`src/utils.ts` 的 `sha256`）只用于即时反馈，服务端必须独立重算。`objectKey` 与 presigned URL 永远不出现在任何公开接口。

### 6.4 凭证签发

```text
POST /projects/:id/prepare-credential
POST /projects/:id/confirm-credential
```

详见第 7 节。

### 6.5 撤销

| 接口 | 鉴权 | 说明 |
| --- | --- | --- |
| `POST /credentials/:credentialId/prepare-revoke` | `= 原 issuer` | 入参 `{ reason }`；计算 `revocationReasonDigest`，返回合约调用参数 |
| `POST /credentials/:credentialId/confirm-revoke` | `= 原 issuer` | 入参 `{ txHash }`；校验 `CredentialRevoked` 事件后写 `RevocationRecord` |

只有凭证原 `issuer` 可以撤销，合约层与后端层双重校验。**撤销不删除历史**，原始声明内容必须保留。

### 6.6 护照与公开验证

| 接口 | 鉴权 | 说明 |
| --- | --- | --- |
| `GET /passport/:address` | 公开 | 按 `recipient` 索引事件得到 credentialId 列表，**再逐条回读合约当前状态** |
| `GET /verify/:credentialId` | 公开 | 直接从 Monad 读取，不经过数据库状态 |

`GET /verify/:credentialId` 响应：

```jsonc
{
  "result": "VALID",            // VALID | REVOKED | NOT_FOUND | CHAIN_UNAVAILABLE
  "source": "chain",            // 恒为 chain；绝不允许出现 "database"
  "credential": {
    "credentialId": "0x...",
    "issuer": "0x...",
    "recipient": "0x...",
    "projectCategory": "电商视觉设计",
    "role": "详情页执行设计师",
    "publicSummary": "...",
    "startedAt": 1751500800,
    "completedAt": 1753056000,
    "issuedAt": 1753142400,
    "revokedAt": 0,
    "confidentialityLevel": 1,
    "evidenceLevel": 2,
    "evidenceHash": "0x...",
    "metadataDigest": "0x..."
  },
  "integrity": { "metadataDigestMatch": true },
  "issuerLabel": { "organizationName": "北岸视觉公会", "verificationStatus": "UNVERIFIED" },
  "chain": { "chainId": 10143, "contractAddress": "0x...", "explorerUrl": "https://testnet.monadvision.com/..." }
}
```

**`result` 只能由链上读取决定。** RPC 主备全部失败时返回 `CHAIN_UNAVAILABLE`，前端显示明确错误，**禁止用数据库里的旧状态显示绿色"有效"**。

`issuerLabel` 是链下信息，前端必须把"钱包签名有效"与"平台已核验资料"分开展示，不能让 `UNVERIFIED` 的签发方看起来像已认证。

### 6.7 内部接口

`POST /internal/chain-sync`：触发一次增量事件同步。仅内网或带内部 token 访问，不暴露公网。

### 6.8 统一错误格式

```jsonc
{ "error": { "code": "STATE_CONFLICT", "message": "项目当前状态不允许该操作", "requestId": "..." } }
```

| 错误码 | HTTP | 场景 |
| --- | --- | --- |
| `UNAUTHENTICATED` | 401 | 无有效 session |
| `FORBIDDEN` | 403 | 调用者地址不等于记录上的 issuer / designer |
| `STATE_CONFLICT` | 409 | 状态机不允许该迁移，或乐观锁冲突 |
| `VALIDATION_FAILED` | 422 | Zod 校验失败 |
| `HASH_MISMATCH` | 422 | 服务端重算哈希与上报不一致 |
| `TX_VERIFICATION_FAILED` | 422 | receipt 八项校验任一不通过 |
| `CHAIN_UNAVAILABLE` | 503 | RPC 主备均失败 |

错误响应对外可读、可行动，**内部异常栈只进日志，绝不返回给客户端**。

---

## 7. Monad 集成

### 7.1 合约接口（来自 MVP 规划第 5 节）

```solidity
function issueCredential(IssueCredential calldata input) external returns (bytes32 credentialId);
function revokeCredential(bytes32 credentialId, bytes32 revocationReasonDigest) external;
function getCredential(bytes32 credentialId) external view returns (Credential memory);
function isValid(bytes32 credentialId) external view returns (bool);

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

`issuedAt == 0` 表示凭证不存在，`revokedAt == 0` 表示未撤销。后端必须明确区分"不存在"与"已撤销"，不能让默认零值看起来像一条有效凭证。

### 7.2 三段式签发协议

```text
[1] POST /projects/:id/prepare-credential
    后端：校验 session 地址 == issuerWallet
          校验 status == APPROVED
          校验公开字段（保密级别 2 强制空摘要、长度上限、时间顺序）
          若无 projectRefHash 则生成 salt 并计算
          构造 canonical payload -> metadataDigest
          落库 metadataSnapshot + metadataDigest（状态仍为 APPROVED）
    返回：{ chainId, contractAddress, abi, functionName: "issueCredential", args, gasHint }

[2] 前端：wagmi useSimulateContract -> useWriteContract，用户在钱包中确认
    后端此刻不做任何事，也拿不到私钥

[3] POST /projects/:id/confirm-credential  { txHash }
    后端：waitForTransactionReceipt -> 八项校验 -> 事务内写库并迁移到 ISSUED
```

`prepare` 阶段可以把项目置为 `ISSUING`，也可以保持 `APPROVED` 到 confirm 成功再迁移。**推荐保持 `APPROVED`**：用户拒签或交易失败时不需要额外回滚动作，重试成本最低。

### 7.3 confirm 的八项校验（任一不通过即拒绝）

```ts
export async function verifyIssueReceipt(txHash: Hex, project: Project) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });

  // 1. 交易本身成功
  if (receipt.status !== 'success') throw new AppError('TX_VERIFICATION_FAILED', 422);

  // 2. 目标合约是我们版本化保存的地址，防止指向山寨合约
  if (getAddress(receipt.to!) !== getAddress(env.CONTRACT_ADDRESS)) throw ...;

  // 3. 从本合约的 log 中解出 CredentialIssued
  const log = receipt.logs
    .filter((l) => getAddress(l.address) === getAddress(env.CONTRACT_ADDRESS))
    .map((l) => decodeEventLog({ abi, data: l.data, topics: l.topics }))
    .find((e) => e.eventName === 'CredentialIssued');
  if (!log) throw ...;

  // 4. 事件 issuer == 项目 issuerWallet，防他人代签
  // 5. 事件 recipient == 项目 designerWallet
  // 6. 事件 projectRefHash == prepare 时算出的值
  // 7. 回读 getCredential(credentialId)，比对 metadataDigest 与 metadataSnapshot 一致
  // 8. chainId == 10143
}
```

**`confirm` 必须幂等。** 同一 `txHash` 重复调用返回同一结果，不得插入第二条记录。`CredentialRecord.txHash` 与 `credentialId` 上的唯一索引是最后一道兜底。

撤销的 confirm 同理，校验 `CredentialRevoked` 事件的 `credentialId` 与 `issuer`，并回读 `isValid` 确认已为 false。

### 7.4 Monad 与普通 EVM 的五个差异

1. **按 gas limit 计费，不是按实际用量。** 不能随手写 `gasLimit: 3000000`，那是真烧 MON。固定流程：`simulateContract`（业务与 revert 检查）→ `estimateContractGas`（精确值）→ 上浮 10~20% 作为安全余量。
2. **拿到 `txHash` 不等于成功。** Monad 出块很快（约 0.5 秒），但仍必须 `waitForTransactionReceipt` 并检查 `status === 'success'`。前端 `ReviewPage.tsx` 里 1700ms 的 `setTimeout` 必须替换为真实等待 receipt。
3. **Testnet 重置风险。** 见第 3.1 节，地址与部署区块必须版本化到配置文件。
4. **RPC 主备池。**

```ts
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: fallback(
    [http(env.RPC_PRIMARY, { timeout: 8_000 }), http(env.RPC_FALLBACK, { timeout: 8_000 })],
    { rank: false, retryCount: 2 },
  ),
});
```

5. **事件增量同步分片拉取。** RPC 对 `getLogs` 的区块跨度有上限，必须分片：

```ts
const STEP = 2_000n;
let from = cursor.lastProcessedBlock + 1n;
const latest = await publicClient.getBlockNumber();
while (from <= latest) {
  const to = from + STEP - 1n > latest ? latest : from + STEP - 1n;
  const logs = await publicClient.getLogs({ address, fromBlock: from, toBlock: to, events });
  await persist(logs, to);   // 落库与推进 cursor 必须在同一事务内
  from = to + 1n;
}
```

### 7.5 护照的读取顺序

```text
1. 按 recipient（indexed）过滤 CredentialIssued，拿到该地址的 credentialId 列表
2. 对每个 credentialId 调用 getCredential + isValid 读取当前状态
3. 用链上结果渲染；数据库只提供 hiddenByOwner 与签发方标签等链下附加信息
```

**第 2 步不能省。** 撤销不会修改已经产生的 `CredentialIssued` 事件，只看事件会把已撤销凭证显示成有效。

`hiddenByOwner` 仅从平台列表隐藏，前端必须明确提示"隐藏不等于链上删除"。

---

## 8. 哈希与 canonical JSON 规范

这是最容易埋隐蔽 bug 的地方，前后端必须一字不差。

| 摘要 | 算法 | 说明 |
| --- | --- | --- |
| `projectRefHash` | `keccak256(abi.encode("POQ_PROJECT_V1", projectId, salt))` | salt 至少 32 字节密码学安全随机数 |
| `evidenceHash` | `SHA-256(文件原始字节)` | 表示为 `0x` + 64 位小写十六进制 |
| `metadataDigest` | `SHA-256(JCS canonical JSON 的 UTF-8 字节)` | 见下 |
| `revocationReasonDigest` | `SHA-256(撤销原因 UTF-8 字节)` | 原文存库，摘要上链 |

### 8.1 canonical payload 固定字段

按 RFC 8785（JCS）规范化，固定包含：

```text
schemaVersion, chainId, contractAddress, issuer, recipient,
projectRefHash, evidenceHash, projectCategory, role, publicSummary,
startedAt, completedAt, confidentialityLevel, evidenceLevel
```

- 地址统一 EIP-55 校验和格式，整数用 JSON number。
- **不包含**交易后才产生的 `credentialId`、`issuedAt`、`txHash`。
- **禁止依赖 `JSON.stringify`。** 它按属性插入顺序序列化，前后端构造对象的顺序不同就会算出不同摘要，这类 bug 在演示当天暴露非常难看。使用 `canonicalize` 一类实现 RFC 8785 的库，不要自己手写排序。

### 8.2 共享测试向量

在 `packages/shared/test/vectors/` 放一组固定输入与期望摘要，**前端单测、后端单测、合约测试跑同一组向量**。任何一方改动哈希实现，三方测试同时失败，问题在开发期就暴露。

---

## 9. 安全红线

| 项 | 要求 |
| --- | --- |
| 私钥 | 后端永不持有、永不代签。签发与撤销一律由用户钱包发起 |
| 授权 | 所有写操作校验 `session.address` 等于记录上的具体钱包地址，不只看角色 |
| nonce | 一次性、有 TTL、在事务内标记消费，防重放 |
| txHash | 客户端提交的一律不可信，必须自己拉 receipt 校验 |
| 对象存储 | presigned URL 短期有效；`objectKey` 与下载地址永不进入公开接口 |
| 上链内容 | 客户名、报价、联系方式、合同、原始设计文件**永不上链**。`confidentialityLevel == 2` 时强制空摘要 |
| 日志 | 结构化且脱敏，不记录 salt、session secret、presigned URL、完整签名 |
| 数据库降级 | 数据库不可用不得影响 `/verify` 的链上读取；链不可用不得用数据库伪造有效状态 |
| 幂等 | 所有 `confirm-*` 幂等；唯一索引兜底 |

---

## 10. 测试策略

### 10.1 单元测试

- 状态机转移表：每个状态 × 每个 actor 的允许与拒绝组合全覆盖。
- 哈希工具：跑共享测试向量。
- canonical JSON：字段顺序打乱后摘要必须相同；任一字段被篡改摘要必须变化。

### 10.2 集成测试

- nonce 一次性使用、过期、域名与地址不匹配全部拒绝。
- 越权：非 issuer 调 approve / prepare-credential 返回 403。
- 被邀请地址必须等于最终 recipient。
- 伪造 `txHash`（指向别的合约、别人的交易、失败交易）全部被 `confirm` 拒绝。
- 重复 `confirm` 幂等，不产生第二条 `CredentialRecord`。
- 对象存储 URL 不出现在任何公开接口响应中。
- metadata JSON 被篡改时完整性校验失败。

### 10.3 链上集成测试

在 Monad Testnet 实跑：签发 → 读取 → 撤销 → 再读取。重点验证 `credentialId` 唯一且可重复计算、同 issuer 同 `projectRefHash` 无法重复签发、非 issuer 无法撤销。

### 10.4 故障演练

必须实际演练而不是"应该没问题"：用户拒签、错误网络、主 RPC 挂掉走备用、主备都挂、不存在的 credentialId、交易 revert。

---

## 11. 开工顺序

针对"前端视觉已完成、链上从未跑通"这一现实调整后的顺序：

| # | 内容 | 工期 | 完成标准 |
| --- | --- | --- | --- |
| 1 | `packages/shared`：Zod schema、枚举、hash/JCS 工具、测试向量 | 0.5d | 三方测试向量一致 |
| 2 | `packages/contracts`：合约、Foundry 测试、部署 Testnet、导出 ABI | 1d | 测试网可签发/读取/撤销，源码已验证 |
| 3 | **纵向切片**：后端只做 `prepare-credential` / `confirm-credential` / `verify/:id`，前端 ReviewPage 接真 wagmi | 1d | 真实钱包签出一条链上凭证，公开页能读到 |
| 4 | SIWE + Prisma + 状态机 + 项目 CRUD | 1d | 两个演示钱包完成 `DRAFT -> ACCEPTED`，越权被拒 |
| 5 | 私有上传 + 服务端重算哈希 + 审批驳回 | 0.5d | 前后端哈希一致，公开字段不含文件 URL |
| 6 | 护照事件索引 + 撤销 + RPC 降级 | 0.5d | 撤销后旧链接实时变红 |
| 7 | `state.tsx` mock 逐页换真 API + 演示数据 | 0.5d | 全链路无 mock 残留 |

**第 3 步是分水岭。** 先打通一条真实的"签发 → 验证"链上纵向切片，再向两边扩展。否则很容易变成"页面全做完了，但链上一次都没成功过"——这是黑客松最常见的翻车姿势。

---

## 12. 后端侧验收门槛

对应 MVP 规划第 13 节，后端需要独立证明：

1. 合约地址与部署区块已版本化保存，代码中无硬编码。
2. `prepare-credential` 拒绝非 issuer、拒绝非 `APPROVED` 状态。
3. `confirm-credential` 能拒绝伪造 `txHash`（错误合约、错误 issuer、失败交易），且重复调用幂等。
4. `GET /verify/:credentialId` 在**清空数据库**后仍能返回正确的链上结果。
5. RPC 主备全部失败时返回 `CHAIN_UNAVAILABLE`，绝不返回 `VALID`。
6. 撤销只能由原 issuer 执行，撤销后 `/verify` 实时变为 `REVOKED` 且保留历史内容。
7. 任何公开接口响应中都不出现 `salt`、`objectKey`、presigned URL、客户名、报价、联系方式。
8. 服务端重算的 `evidenceHash` 与浏览器一致才允许进入 `SUBMITTED`。

---

## 13. 风险清单

| 级别 | 风险 | 处置 |
| --- | --- | --- |
| 高 | MVP 规划假设 Next.js，代码实为 Vite SPA，接口形态与部署方式悬空 | 本文档已定为方案 B，需团队确认后固化 |
| 高 | `ReviewPage.tsx` 中的假 `credentialId` / `txHash` 生成逻辑 | 接真链时**整段删除**那两个 `useEffect`，否则可能演示出一个链上不存在的 ID |
| 中 | Monad Testnet 再次重置或 faucet 限流 | 地址配置化；演示前一天重跑完整闭环并确认两个钱包余额 |
| 中 | JCS 摘要前后端不一致 | 共享测试向量兜底，三方跑同一组 |
| 中 | 事件同步 cursor 推进与落库不在同一事务，导致漏事件或重复 | 落库与推进 cursor 必须同事务；事件按 `credentialId` 幂等写入 |
| 低 | 仓库残留 `src/styles.css.bak`、`selectors-before.txt` | 交付前清理 |

---

## 14. 附：与 MVP 规划文档的差异说明

本文档在以下三处**修订**了 `Proof_of_Quest_Monad_MVP开发规划.md`，其余部分继续沿用该文档：

| 项 | 原规划 | 本文档 | 原因 |
| --- | --- | --- | --- |
| Web 框架 | Next.js App Router | 保留 Vite SPA，新增独立 Fastify 后端 | 前端已成型，迁移风险大于 SSR 收益；SSR 不在验收门槛内 |
| 合约工具链 | Hardhat | Foundry 优先，卡住则退回 Hardhat | Monad 官方部署指南以 Foundry 为主 |
| `prepare` 后的状态 | 进入 `ISSUING` | 保持 `APPROVED` 直到 confirm 成功 | 用户拒签或交易失败时无需额外回滚，重试成本最低 |

业务需求、隐私边界、链上链下数据边界、合约字段与校验规则、演示准备与"暂不开发"清单，全部以原 MVP 规划文档为准，本文档不重复也不修改。
