# 模型配置传导链路

## 概述

Claude Coder 通过环境变量将模型配置传递给 Claude Agent SDK。本文档描述配置从 `.env` 文件到 SDK 的完整传导路径。

## 传导链路图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         .claude-coder/.env                          │
│                                                                     │
│  MODEL_PROVIDER=coding-plan                                        │
│  ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic         │
│  ANTHROPIC_API_KEY=xxx                                             │
│  ANTHROPIC_DEFAULT_OPUS_MODEL=glm-5                                │
│  ANTHROPIC_DEFAULT_SONNET_MODEL=qwen3-coder-next                   │
│  ANTHROPIC_DEFAULT_HAIKU_MODEL=qwen3-coder-plus                    │
│  ANTHROPIC_MODEL=kimi-k2.5                                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    src/common/config.js                             │
│                                                                     │
│  parseEnvFile(p.envFile)                                           │
│      ↓                                                              │
│  loadConfig() → { provider, baseUrl, defaultOpus, ... }            │
│      ↓                                                              │
│  buildEnvVars(config) → { ANTHROPIC_DEFAULT_OPUS_MODEL, ... }      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    src/core/session.js                              │
│                                                                     │
│  applyEnvConfig(config) {                                          │
│    Object.assign(process.env, buildEnvVars(config));               │
│  }                                                                  │
│                                                                     │
│  // 每个 session 启动前调用                                          │
│  runCodingSession → applyEnvConfig()                               │
│  runScanSession  → applyEnvConfig()                                │
│  runAddSession   → applyEnvConfig()                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       process.env                                   │
│                                                                     │
│  process.env.ANTHROPIC_DEFAULT_OPUS_MODEL = "glm-5"                │
│  process.env.ANTHROPIC_DEFAULT_SONNET_MODEL = "qwen3-coder-next"   │
│  ...                                                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Claude Agent SDK                                 │
│                                                                     │
│  SDK 从 process.env 读取环境变量                                     │
│  根据 alias (opus/sonnet/haiku) 自动选择对应模型                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 关键函数

### 1. parseEnvFile(filepath)

**文件**: `src/common/config.js`

解析 `.env` 文件为键值对对象。

```javascript
function parseEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return {};
  const content = fs.readFileSync(filepath, 'utf8');
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      vars[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return vars;
}
```

### 2. loadConfig()

**文件**: `src/common/config.js`

加载配置并构建 config 对象。

```javascript
function loadConfig() {
  const p = paths();
  const env = parseEnvFile(p.envFile);
  const config = {
    provider: env.MODEL_PROVIDER || 'claude',
    baseUrl: env.ANTHROPIC_BASE_URL || '',
    apiKey: env.ANTHROPIC_API_KEY || '',
    model: env.ANTHROPIC_MODEL || '',
    defaultOpus: env.ANTHROPIC_DEFAULT_OPUS_MODEL || '',
    defaultSonnet: env.ANTHROPIC_DEFAULT_SONNET_MODEL || '',
    defaultHaiku: env.ANTHROPIC_DEFAULT_HAIKU_MODEL || '',
    // ... 其他字段
    raw: env,
  };
  return config;
}
```

### 3. buildEnvVars(config)

**文件**: `src/common/config.js`

将 config 对象转换为 SDK 所需的环境变量格式。

```javascript
function buildEnvVars(config) {
  const env = { ...process.env };
  if (config.baseUrl) env.ANTHROPIC_BASE_URL = config.baseUrl;
  if (config.apiKey) env.ANTHROPIC_API_KEY = config.apiKey;
  if (config.model) env.ANTHROPIC_MODEL = config.model;
  if (config.defaultOpus) env.ANTHROPIC_DEFAULT_OPUS_MODEL = config.defaultOpus;
  if (config.defaultSonnet) env.ANTHROPIC_DEFAULT_SONNET_MODEL = config.defaultSonnet;
  if (config.defaultHaiku) env.ANTHROPIC_DEFAULT_HAIKU_MODEL = config.defaultHaiku;
  // ... 其他字段
  return env;
}
```

### 4. applyEnvConfig(config)

**文件**: `src/core/session.js`

将环境变量注入到当前 Node 进程。

```javascript
function applyEnvConfig(config) {
  Object.assign(process.env, buildEnvVars(config));
}
```

## SDK 支持的环境变量

| 环境变量 | 说明 |
|----------|------|
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | 控制 `opus` alias 映射到哪个模型 |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | 控制 `sonnet` alias 映射 |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | 控制 `haiku` alias 映射 |
| `ANTHROPIC_MODEL` | 默认模型 |
| `ANTHROPIC_BASE_URL` | API 端点 |
| `ANTHROPIC_API_KEY` | API 密钥 |

**已废弃**: `ANTHROPIC_SMALL_FAST_MODEL` → 使用 `ANTHROPIC_DEFAULT_HAIKU_MODEL` 替代

## 调用时机

每个 session 函数在启动前都会调用 `applyEnvConfig()`：

```javascript
// src/core/session.js

async function runCodingSession(sessionNum, opts = {}) {
  const config = loadConfig();
  applyEnvConfig(config);  // 注入环境变量
  // ... 启动 SDK session
}

async function runScanSession(requirement, opts = {}) {
  const config = loadConfig();
  applyEnvConfig(config);  // 注入环境变量
  // ... 启动 SDK session
}

async function runAddSession(instruction, opts = {}) {
  const config = loadConfig();
  applyEnvConfig(config);  // 注入环境变量
  // ... 启动 SDK session
}
```

## 相关文档

- [Claude Code Model Configuration](https://code.claude.com/docs/en/model-config)
- [Claude Code Settings](https://code.claude.com/docs/en/settings)