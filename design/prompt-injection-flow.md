# 提示语注入流程

> 本文档追踪每个 CLI 命令的提示语组装过程：哪些文件被读取、什么条件下注入什么内容。

---

## 总体架构

```
SDK.query({
  prompt:       ← User Prompt（每个命令不同，动态注入 hints）
  systemPrompt: ← System Prompt（coreProtocol + 会话专用协议）
  hooks:        ← PreToolUse/PostToolUse（guidance.json 驱动的运行时注入）
  settingSources: ['project']  ← 自动加载 .claude/CLAUDE.md
})
```

**三层注入：**
1. **System Prompt**（身份 + 铁律 + 工作流）— 不变的协议
2. **User Prompt**（任务上下文 + hints）— 每次 session 动态组装
3. **Hooks**（工具级 guidance）— 模型调用特定工具时按需注入

---

## 1. `run` 命令 → Coding Session

### 入口

```
cli.js → runner.run(opts) → for loop → runCodingSession(session, opts)
         → coding.js → execute(sdk, ctx)
```

### System Prompt 组装

```
buildSystemPrompt('coding')
├── assets.read('coreProtocol')     ← templates/coreProtocol.md
│   └── 4 条全局铁律 + session_result.json 格式 + 全局文件权限表
└── assets.read('codingSystem')     ← templates/codingSystem.md
    └── 编码身份 + 7 条编码铁律 + 编码文件表 + 状态机 + 6 步工作流
```

### User Prompt 组装

```
buildCodingContext(sessionNum, opts)
└── assets.render('codingUser', vars)    ← templates/codingUser.md
    │
    ├── {{sessionNum}}                   ← 当前 session 编号（固定注入）
    │
    ├── {{requirementsHint}}             ← buildRequirementsHint()
    │   条件: requirements.md 存在
    │   读取: fs.existsSync(projectRoot/requirements.md)
    │   内容: "需求文档: <path>。第一步先读取..."
    │
    ├── {{mcpHint}}                      ← buildMcpHint(config)
    │   条件: config.mcpPlaywright === true
    │   读取: .claude-coder/.env → MCP_PLAYWRIGHT=true
    │   内容: "前端/全栈任务可用 Playwright MCP..."
    │
    ├── {{docsHint}}                     ← buildDocsHint()
    │   条件: profile 存在
    │   读取: .claude-coder/project_profile.json → existing_docs, services
    │   内容: "项目文档: README.md, ..."
    │   追加: services 为空 → 提示补全；existing_docs 为空 → 提示补全
    │
    ├── {{envHint}}                      ← buildEnvHint(consecutiveFailures, sessionNum)
    │   条件: consecutiveFailures === 0 且 sessionNum > 1
    │   内容: "环境已就绪，第二步可跳过 init..."
    │
    ├── {{taskHint}}                     ← buildTaskHint(projectRoot)
    │   条件: tasks.json 存在且有未完成任务
    │   读取: .claude-coder/tasks.json → findNextTask() + getStats()
    │   内容: "任务上下文: feat-003 '用户登录' (pending), category=backend, steps=4步..."
    │
    ├── {{testEnvHint}}                  ← buildTestEnvHint(projectRoot)
    │   条件: 始终注入
    │   读取: 检查 .claude-coder/test.env 是否存在
    │   内容(有): "测试凭证文件: <path>，测试前用 source 加载"
    │   内容(无): "如需持久化凭证，写入 <path>"
    │
    ├── {{playwrightAuthHint}}           ← buildPlaywrightAuthHint(config)
    │   条件: config.mcpPlaywright === true
    │   读取: config.playwrightMode + 检查 playwright-auth.json
    │   内容: 按 persistent/isolated/extension 模式返回不同提示
    │
    ├── {{memoryHint}}                   ← buildMemoryHint()
    │   条件: session_result.json 存在且有 session_result 字段
    │   读取: .claude-coder/session_result.json
    │   内容: "上次会话 success（pending → done）。遗留: <notes前200字>"
    │
    ├── {{serviceHint}}                  ← buildServiceHint(maxSessions)
    │   条件: 始终注入
    │   内容: maxSessions===1 ? "停止服务" : "保持服务运行"
    │
    └── {{retryContext}}                 ← buildRetryHint(consecutiveFailures, lastValidateLog)
        条件: consecutiveFailures > 0
        内容: "注意：上次会话校验失败，原因：..."
```

### SDK 选项

```
buildQueryOptions(config, opts)
├── permissionMode: 'bypassPermissions'
├── cwd: projectRoot
├── env: buildEnvVars(config)    ← API Key、BaseURL、Model 等环境变量
├── settingSources: ['project']  ← 自动加载 .claude/CLAUDE.md
├── model: config.model          ← 条件: config 中有指定
└── maxTurns: config.maxTurns    ← 条件: > 0 时注入

额外设置:
├── hooks: ctx.hooks             ← createHooks('coding', ...) 产生
└── disallowedTools: ['askUserQuestion']
```

### Hooks 运行时注入

```
createHooks('coding', ...)
├── guidance     ← GuidanceInjector, 基于 guidance.json 规则
│   ├── matcher: "^mcp__playwright__" → 注入 playwright.md（仅一次）
│   │                                 + 按工具名注入 toolTips
│   └── matcher: "Bash", condition: kill/pkill → 注入 bash-process.md（仅一次）
├── editGuard    ← 60s 滑动窗口内编辑超阈值 → deny
├── completion   ← 检测 session_result.json 写入 → 标记完成
└── stall        ← 空闲超时 → abort
```

---

## 2. `plan` 命令 → Plan Session

### 入口

```
cli.js → plan.run(input, opts) → runPlanSession(instruction, opts)
         → plan.js → execute(sdk, ctx)
```

### Phase 1：计划生成（permissionMode: 'plan'）

```
System Prompt: 无（SDK plan 模式自带）
User Prompt:   buildPlanOnlyPrompt(userInput, interactive)
               └── 内联构建，不使用模板
               └── 指示模型探索代码 → 写计划到 ~/.claude/plans/*.md

SDK 选项:
├── permissionMode: 'plan'       ← 只读模式，只能读代码不能改
├── hooks: ctx.hooks             ← createHooks('plan', ...) → 仅 stall 模块
└── disallowedTools: ['askUserQuestion']  ← 非交互模式时禁用
```

### Phase 2：任务分解（permissionMode: 'bypassPermissions'）

```
buildPlanSystemPrompt()
└── 内联字符串: "你是一个任务分解专家..."

buildPlanPrompt(planPath)
└── assets.render('addUser', vars)       ← templates/addUser.md
    │
    ├── {{profileContext}}               ← profile.tech_stack
    │   读取: .claude-coder/project_profile.json
    │   内容: "项目技术栈: 后端: fastapi, 前端: react"
    │
    ├── {{taskContext}}                  ← loadTasks() + loadState()
    │   读取: .claude-coder/tasks.json + .runtime/harness_state.json
    │   内容: "已有 5 个任务...新任务 ID 从 feat-006 开始，priority 从 6 开始"
    │
    ├── {{recentExamples}}              ← tasks.features.slice(-3)
    │   内容: 最后 3 个任务的格式示例
    │
    ├── {{projectRoot}}                 ← 项目绝对路径
    │
    ├── {{planPath}}                    ← Phase 1 生成的计划文件路径
    │
    ├── {{addGuide}}                    ← assets.read('addGuide')
    │   读取: templates/addGuide.md（完整内容嵌入）
    │   内容: tasks.json 格式 + 字段规范 + 粒度规则 + 验证命令模板
    │
    └── {{testRuleHint}}               ← 条件: testRule 存在 且 .mcp.json 存在
        内容: "项目已配置 Playwright MCP，参考 test_rule.md"

SDK 选项:
├── permissionMode: 'bypassPermissions'
├── systemPrompt: buildPlanSystemPrompt()
└── hooks: ctx.hooks

后处理:
└── syncAfterPlan()                     ← 同步 harness_state.json 的 next_task_id
```

---

## 3. `init` 命令 → Scan Session

### 入口

```
cli.js → init() → scan({ projectRoot })
         → scan.js → _runScanSession(opts) → execute(sdk, ctx)
```

### System Prompt 组装

```
buildSystemPrompt('scan')
├── assets.read('coreProtocol')     ← templates/coreProtocol.md
└── assets.read('scanSystem')       ← templates/scanSystem.md
    └── 扫描身份 + 1 条扫描铁律（禁止业务代码）
      + 扫描文件表 + 扫描协议步骤 1-3 + profile.json 格式
```

### User Prompt 组装

```
buildScanPrompt(projectType)
└── assets.render('scanUser', { projectType })   ← templates/scanUser.md
    │
    └── {{projectType}}              ← hasCodeFiles() ? 'existing' : 'new'
        内容: "项目类型: existing"
        + profile 质量要求（services 不为空、existing_docs 不为空等）
```

### SDK 选项

```
buildQueryOptions(config, opts)
├── permissionMode: 'bypassPermissions'
├── settingSources: ['project']
└── hooks: createHooks('scan', ...) → 仅 stall 模块
```

---

## 4. `simplify` 命令 → Simplify Session

### 入口

```
cli.js → simplify(focus, { n }) → _runSimplifySession(n, focus, opts)
```

### Prompt 组装

```
System Prompt: 无（内联在 user prompt 中）
User Prompt:   内联构建
├── git diff HEAD~n..HEAD           ← 最近 n 个 commit 的 diff
├── focus                           ← 用户指定的审查焦点（可选）
└── 审查指令（简化代码、消除重复等）

SDK 选项:
├── permissionMode: 'bypassPermissions'
└── hooks: createHooks('simplify', ...) → 仅 stall 模块
```

---

## 数据流总览

```
harness 读取的文件              注入位置              注入条件
─────────────────────────────────────────────────────────────
.claude-coder/.env              SDK env vars          始终
.claude/CLAUDE.md               SDK settingSources    始终（SDK 自动）
templates/coreProtocol.md       systemPrompt          coding, scan
templates/codingSystem.md       systemPrompt          coding
templates/scanSystem.md         systemPrompt          scan
templates/codingUser.md         user prompt           coding
templates/scanUser.md           user prompt           scan
templates/addUser.md            user prompt           plan phase 2
templates/addGuide.md           user prompt           plan phase 2（嵌入）
templates/guidance.json         hooks                 coding（工具匹配时）
templates/playwright.md         hooks                 coding（MCP 工具首次调用）
templates/bash-process.md       hooks                 coding（kill 命令时）
.claude-coder/project_profile   docsHint, taskContext 存在时
.claude-coder/tasks.json        taskHint, taskContext 存在时
.claude-coder/session_result    memoryHint            存在时
.claude-coder/test.env          testEnvHint           始终（内容不同）
.runtime/harness_state.json     taskContext(plan)     plan phase 2
requirements.md                 requirementsHint      存在时（仅 coding）
```
