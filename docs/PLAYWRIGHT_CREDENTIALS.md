# 浏览器测试工具与凭证管理

## 工具选择

| 维度 | Playwright MCP | Chrome DevTools MCP |
|------|---------------|---------------------|
| **维护方** | 微软 | Google |
| **核心优势** | 25+ 自动化工具，支持多实例并行 | 连接已打开的 Chrome，调试能力更强 |
| **多实例** | 支持 | 不支持（单实例限制，多开请配置 Playwright MCP） |
| **安装要求** | `npx playwright install chromium` | Node.js v20.19+ / Chrome 144+ / 启用远程调试 |
| **配置文件** | `.mcp.json` | `.mcp.json` |
| **环境变量** | `WEB_TEST_TOOL=playwright` | `WEB_TEST_TOOL=chrome-devtools` |

---

## Playwright MCP 三种模式

| 维度 | persistent（推荐） | isolated | extension |
|------|-------------------|----------|-----------|
| **适合场景** | Google SSO、企业内网、日常开发 | 验证登录流程、干净测试环境 | 需要浏览器插件或绕过自动化检测 |
| **状态存储** | `.claude-coder/.runtime/browser-profile/` | `.claude-coder/playwright-auth.json` | 无（浏览器自身管理） |
| **前置安装** | `npx playwright install chromium` | `npx playwright install chromium` | Playwright MCP Bridge 扩展 |
| **.mcp.json 参数** | `--user-data-dir=<path>` | `--isolated --storage-state=<path>` | `--extension` |

### persistent 模式
```bash
claude-coder auth https://your-app.com
# 浏览器打开 → 完成登录 → 关闭浏览器
# 登录状态永久保存（session cookie 自动转持久化）
```

### isolated 模式
```bash
claude-coder auth https://your-app.com
# 使用 playwright codegen 录制 → 关闭浏览器
# 登录状态保存到 playwright-auth.json
```

### extension 模式

1. 在真实 Chrome/Edge 中安装 [Playwright MCP Bridge](https://chromewebstore.google.com/detail/playwright-mcp-bridge/mmlmfjhmonkocbjadbfplnigmagldckm) 扩展
2. 确保扩展已启用
3. 无需安装 Chromium

---

## Chrome DevTools MCP

### 配置步骤

```bash
# Step 1: setup 中选择 Chrome DevTools MCP
claude-coder setup

# Step 2: 配置 .mcp.json
claude-coder auth
```

### 前置条件

1. Node.js v20.19+（npx 自动下载 `chrome-devtools-mcp` 包）
2. Chrome 144+ 版本
3. 打开 `chrome://inspect/#remote-debugging`
3. 启用远程调试，允许传入调试连接

### 功能列表

- **输入自动化**: 点击、输入、表单填写
- **页面导航**: 多页面管理、截图
- **性能分析**: Trace 录制、Core Web Vitals、Lighthouse 审计
- **调试工具**: Console 消息、网络请求检查、内存快照

### 限制

- 单实例限制：同一时间只能连接一个 Chrome 调试会话
- 如需多实例并行测试，请使用 Playwright MCP

---

## 快速配置流程

```bash
# Step 1: 初始化配置（选择工具和模式）
claude-coder setup
# → 选择浏览器测试工具 → 选择模式
# → 写入 .claude-coder/.env 的 WEB_TEST_TOOL / WEB_TEST_MODE

# Step 2: 认证/配置（根据工具自动选择流程）
claude-coder auth [URL]
```

认证完成后会自动：
1. 保存登录状态
2. 生成/更新 `.mcp.json`（Claude Code SDK 读取此文件启动 MCP 服务）
3. 更新 `.gitignore`
4. 设置 `.env` 中 `WEB_TEST_TOOL` 变量

### Step 3：开始使用

```bash
claude-coder run "你的需求"
# Agent 自动通过配置的浏览器工具操作浏览器
```

---

## .env 变量参考

```bash
# 浏览器测试工具: playwright | chrome-devtools | 空（不启用）
WEB_TEST_TOOL=playwright

# Playwright 模式: persistent | isolated | extension（仅 playwright 有效）
WEB_TEST_MODE=persistent
```

---

## .mcp.json 示例

### Playwright MCP (persistent)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--user-data-dir=.claude-coder/.runtime/browser-profile"
      ]
    }
  }
}
```

### Chrome DevTools MCP

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--autoConnect"]
    }
  }
}
```

---

## 切换工具

```bash
claude-coder setup
# → 选择「配置浏览器测试工具」
# → 重新选择工具和模式
```

> **说明**：切换工具时会自动更新 `.env` 和 `.mcp.json`。如果之前已经 auth 过对应模式（如 persistent 的 browser-profile 还在），切换回去后无需重新 auth。
