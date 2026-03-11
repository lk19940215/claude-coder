'use strict';

// ─────────────────────────────────────────────────────────────
// Claude Coder - 统一入口
// ─────────────────────────────────────────────────────────────

module.exports = {
  // Common (共享基础设施)
  config: require('./common/config'),
  Indicator: require('./common/indicator').Indicator,

  // Core (核心运行时)
  session: require('./core/session'),
  runner: require('./core/runner'),
  plan: require('./core/plan'),
  hooks: require('./core/hooks'),

  // Modules (功能模块)
  tasks: require('./modules/tasks'),
  scanner: require('./modules/scanner'),
  prompts: require('./modules/prompts'),

  // Commands (CLI 命令)
  setup: require('./commands/setup'),
  init: require('./commands/init'),
  auth: require('./commands/auth'),
  validator: require('./commands/validator'),
};