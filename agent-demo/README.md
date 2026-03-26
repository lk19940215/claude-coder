# Agent Demo

最小 AI Coding Agent 示例。学习 Agent Loop、Tool Calling、Context Management 的底层实现。

## 运行

```bash
cd agent-demo
npm install
```

在 `.env` 中配置：

```
ANTHROPIC_API_KEY=你的key
BASE_URL=https://api.anthropic.com    # 或兼容服务
DEFAULT_MODEL=claude-sonnet-4-20250514
AGENT_DEBUG=true                      # 启用日志
```

启动交互模式：

```bash
npm start
```

运行评估：

```bash
node src/eval.mjs              # 跑全部 16 个用例
node src/eval.mjs read_basic   # 跑单个用例
node src/eval.mjs fix_bug --log  # 开启详细日志（输出到 logs/eval-*.log）
node src/eval.mjs --list       # 列出所有可用用例
```

```
场景 A — 代码分析委派

用 task 工具分析 src/tools 目录下每个工具文件的功能和参数

场景 B — 搜索汇总委派

用 task 委派一个子任务：在项目中搜索所有 export 的函数，按文件分类汇总

场景 C — 模型自主判断是否用 task（不显式要求）

我想了解 test-example 下三个子项目的代码质量，哪些函数缺少错误处理

场景 D — task + edit 组合（task 调研 → 父 Agent 修改）

先用 task 分析 test-example/shopping-cart 所有文件，找出潜在 bug，然后帮我修复
```

## 项目结构

```
src/
  agent.mjs              # 交互模式入口（Ink UI + AgentCore）
  eval.mjs               # 评估模式入口
  eval/                  # 评估框架
    cases.mjs            # 16 个测试用例定义（含多轮 + 上下文 + SubAgent）
    runner.mjs           # 运行器 + 评分 + 沙盒管理
    report.mjs           # Markdown 报告生成
  config.mjs             # 配置 + SYSTEM_PROMPT
  core/                  # 运行时基础设施
    agent-core.mjs       # Agent 引擎（纯逻辑，支持自定义工具集）
    ink.mjs              # 终端 UI（Ink / React for CLI）
    logger.mjs           # 文件日志（结构化格式）
    messages.mjs         # 对话历史存储（异步 + 防抖保存）
  tools/                 # 工具系统
    registry.mjs         # define() + 注册表
    index.mjs            # 聚合 + 导出 toolSchemas / executeTool
    file.mjs             # read / write / edit / multi_edit
    search.mjs           # grep + ls（@vscode/ripgrep）
    glob.mjs             # glob — 按文件名模式查找（@vscode/ripgrep）
    ast.mjs              # symbols（web-tree-sitter AST 分析）
    bash.mjs             # bash
    task.mjs             # task — SubAgent 委派（独立上下文 + 只读工具集）
test-example/            # 评估用测试项目（已知 bug + 已知结构）
eval-reports/            # 评估报告输出
docs/                    # 学习文档
  core.md                # Agent Loop + 消息协议 + SDK
  tools.md               # 工具设计原理
  advanced.md            # 上下文管理 + 显示层
  semantic-search.md     # AST 分析 + 语义搜索
  eval.md                # 评估体系（SWE-bench + Eval Harness）
```

## 架构

```
                ┌─────────────────┐
                │   AgentCore     │  纯逻辑引擎
                │  (agent-core)   │  batch / stream 调用
                └────────┬────────┘
          ┌──────────────┤──────────────┐
          ▼              ▼              ▼
  ┌─────────────┐  ┌──────────┐  ┌───────────┐
  │  agent.mjs  │  │ eval.mjs │  │  task 工具 │
  │  交互模式   │  │ 评估模式 │  │  SubAgent │
  │  Ink UI     │  │ 自动评分 │  │  只读工具  │
  └─────────────┘  └──────────┘  └───────────┘
```

## 核心流程（交互模式）

```
while(true) {
  等待用户输入
  AgentCore.run(input, callbacks) → 流式 UI + 工具调用循环
  完成 → 等待用户
}
```

## 评估模式

```
加载 test case → 备份 test-example
  ↓
for each case:
  恢复沙盒 → AgentCore.run(input) → 验证结果 → 评分
  ↓
生成报告 → eval-reports/
```

## 工具列表

| 工具 | 底层 | 用途 |
|------|------|------|
| read | fs/promises | 读取文件 |
| write | fs/promises | 创建新文件 |
| edit | fs/promises | Search & Replace 修改文件 |
| multi_edit | fs/promises | 同一文件多处 Search & Replace |
| grep | @vscode/ripgrep | 正则搜索代码内容（支持 output_mode） |
| glob | @vscode/ripgrep | 按文件名模式查找文件 |
| ls | @vscode/ripgrep | 列出目录文件树 |
| symbols | web-tree-sitter | AST 分析（列符号 / 获取定义） |
| bash | child_process | 执行 bash 命令 |
| task | AgentCore | SubAgent 委派（独立上下文，只读工具集） |

## 技术栈

| 库 | 用途 |
|---|------|
| @anthropic-ai/sdk | LLM API（streaming） |
| ink + react | 终端 UI 框架 |
| @vscode/ripgrep | 代码搜索引擎 |
| web-tree-sitter | AST 解析（WASM） |
| @repomix/tree-sitter-wasms | 预构建语法文件 |
