# CLI 架构设计

## 概述

Claude Coder 是一个纯 CLI 工具，采用简洁的两层架构。

## 入口设计

```
claude-coder/
├── bin/
│   └── cli.js          # CLI 入口，命令路由
└── src/
    ├── index.js        # 模块导出（预留，暂无实际用途）
    ├── common/         # 共享基础设施
    ├── core/           # 核心运行时
    ├── modules/        # 功能模块
    └── commands/       # CLI 命令实现
```

## 入口职责

### bin/cli.js — CLI 入口

**职责**：解析命令行参数，路由到对应模块执行。

```javascript
switch (command) {
  case 'run':
    const runner = require('../src/core/runner');
    await runner.run(opts);
    break;
  case 'setup':
    const setup = require('../src/commands/setup');
    await setup.setup();
    break;
  // ...
}
```

**设计原则**：
- 直接引用内部模块，无中间层
- 按需加载，每次只执行一个命令
- 保持轻量，快速启动

### src/index.js — 模块导出入口（预留）

**当前状态**：暂无实际用途。

```javascript
module.exports = {
  config: require('./common/config'),
  session: require('./core/session'),
  runner: require('./core/runner'),
  // ...
};
```

**保留原因**：
- 未来可能开放库能力，允许外部代码 `require('claude-coder')`
- 便于测试时引用内部模块

**删除条件**：
- 确认永远不会作为库被引用
- 测试文件直接引用内部模块路径

## package.json 配置

```json
{
  "bin": {
    "claude-coder": "bin/cli.js"
  },
  "files": [
    "bin/",
    "src/",
    "templates/"
  ]
}
```

**注意**：未设置 `main` 字段，当前定位为纯 CLI 工具。

## 设计决策

### 为什么 CLI 不走 src/index.js？

1. **职责分离** - CLI 是启动脚本，不是库 API
2. **按需加载** - 直接引用只加载需要的模块
3. **无中间层开销** - 少一层转发，代码更清晰

### 常见模式对比

| 模式 | 特点 | 适用场景 |
|------|------|----------|
| CLI + 库双入口 | `bin/` + `main` | VS Code、ESLint |
| 纯 CLI | 仅 `bin/` | create-react-app、npm-check |
| 纯库 | 仅 `main` | lodash、axios |

Claude Coder 当前采用**纯 CLI** 模式。

## 相关文档

- [模型配置传导链路](./model-config-flow.md)