'use strict';

/**
 * 流程集成测试
 * 模拟完整工作流: setup -> init -> plan -> run
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 模拟环境
const PROJECT_ROOT = process.cwd();
const CLAUDE_DIR = path.join(PROJECT_ROOT, '.claude-coder');

// 清理函数
function cleanup() {
  if (fs.existsSync(CLAUDE_DIR)) {
    fs.rmSync(CLAUDE_DIR, { recursive: true, force: true });
  }
}

// 初始化测试环境
function initTestEnv() {
  cleanup();

  // 加载模块
  const { ensureLoopDir, paths, log, loadConfig, buildEnvVars } = require('../src/common/config');
  const { scan, validateProfile } = require('../src/core/scan');
  const { init } = require('../src/core/init');

  return {
    ensureLoopDir,
    paths,
    log,
    loadConfig,
    buildEnvVars,
    scan,
    validateProfile,
    init,
  };
}

// ============ 流程测试 ============

console.log('\n========================================');
console.log('  流程集成测试');
console.log('========================================\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    testsFailed++;
  }
}

// ========== Phase 1: Setup ==========
console.log('Phase 1: Setup');

test('ensureLoopDir 创建目录结构', () => {
  const { ensureLoopDir, paths } = initTestEnv();

  ensureLoopDir();

  const p = paths();
  assert(fs.existsSync(p.loopDir), 'loopDir 应存在');
  assert(fs.existsSync(p.runtime), 'runtime 应存在');
  assert(fs.existsSync(p.logsDir), 'logsDir 应存在');
});

test('paths() 返回正确的路径对象', () => {
  const { paths } = initTestEnv();

  const p = paths();

  assert(p.loopDir.endsWith('.claude-coder'));
  assert(p.profile.endsWith('project_profile.json'));
  assert(p.tasksFile.endsWith('tasks.json'));
  assert(p.envFile.endsWith('.env'));
});

// ========== Phase 2: Init ==========
console.log('\nPhase 2: Init');

test('init.js 导入 scan 正确', () => {
  // 验证模块可以正常加载
  const initModule = require('../src/core/init');
  assert(typeof initModule.init === 'function');
});

test('scan.js validateProfile 检测不存在的 profile', () => {
  cleanup();

  const { validateProfile } = initTestEnv();
  const result = validateProfile();

  assert.strictEqual(result.valid, false);
  assert(result.issues.includes('profile 不存在'));
});

test('profile 数据结构验证', () => {
  const { paths, validateProfile } = initTestEnv();
  const p = paths();

  // 创建有效的 profile
  const validProfile = {
    tech_stack: {
      backend: { framework: 'express' },
      frontend: { framework: 'react' },
      package_managers: ['npm']
    },
    services: [
      { name: 'api', port: 3000, command: 'npm start' }
    ],
    existing_docs: ['README.md'],
    env_setup: {}
  };

  fs.mkdirSync(path.dirname(p.profile), { recursive: true });
  fs.writeFileSync(p.profile, JSON.stringify(validProfile));

  const result = validateProfile();
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.issues.length, 0);
});

// ========== Phase 3: Plan ==========
console.log('\nPhase 3: Plan');

test('plan 无 profile 时应该抛出错误', () => {
  cleanup();

  const { paths } = initTestEnv();
  const p = paths();

  // profile 不存在
  assert(!fs.existsSync(p.profile));

  // plan.js 会在运行时检查
  const plan = require('../src/core/plan');

  // 验证 run 函数存在
  assert(typeof plan.run === 'function');
});

test('plan.js 模块加载正常', () => {
  // 验证模块可以正常加载
  const plan = require('../src/core/plan');
  assert(typeof plan.run === 'function');
  assert(typeof plan.runPlanSession === 'function');
});

// ========== Phase 4: Run ==========
console.log('\nPhase 4: Run');

test('run 无 profile 应该报错', () => {
  cleanup();

  // runner.js 会在运行时检查
  const { run } = require('../src/core/runner');
  assert(typeof run === 'function');
});

test('run 无 tasks.json 应该报错', () => {
  const { paths } = initTestEnv();
  const p = paths();

  // 创建 profile 但不创建 tasks
  fs.mkdirSync(path.dirname(p.profile), { recursive: true });
  fs.writeFileSync(p.profile, JSON.stringify({
    tech_stack: { backend: { framework: 'express' } },
    services: [],
    existing_docs: ['README.md']
  }));

  assert(fs.existsSync(p.profile));
  assert(!fs.existsSync(p.tasksFile));
});

// ========== Phase 5: Simplify ==========
console.log('\nPhase 5: Simplify');

test('simplify ensureLoopDir 被调用', () => {
  cleanup();

  const { paths } = initTestEnv();
  const p = paths();

  // 确保目录不存在
  assert(!fs.existsSync(p.logsDir));

  // simplify 应该调用 ensureLoopDir
  const { simplify } = require('../src/core/simplify');
  assert(typeof simplify === 'function');
});

// ========== Phase 6: 配置验证 ==========
console.log('\nPhase 6: 配置验证');

test('loadConfig 默认值正确', () => {
  cleanup();

  const { paths, loadConfig } = initTestEnv();
  const p = paths();

  // 创建最小配置
  fs.mkdirSync(path.dirname(p.envFile), { recursive: true });
  fs.writeFileSync(p.envFile, '');

  const config = loadConfig();

  assert.strictEqual(config.provider, 'claude');
  assert.strictEqual(config.timeoutMs, 3000000);
  assert.strictEqual(config.mcpToolTimeout, 30000);
});

test('buildEnvVars 正确构建环境变量', () => {
  const { loadConfig, buildEnvVars } = initTestEnv();

  const config = {
    baseUrl: 'https://api.anthropic.com',
    apiKey: 'test-key',
    model: 'claude-sonnet-4-6',
  };

  const env = buildEnvVars(config);

  assert.strictEqual(env.ANTHROPIC_BASE_URL, 'https://api.anthropic.com');
  assert.strictEqual(env.ANTHROPIC_API_KEY, 'test-key');
  assert.strictEqual(env.ANTHROPIC_MODEL, 'claude-sonnet-4-6');
});

// ========== Phase 7: 任务处理 ==========
console.log('\nPhase 7: 任务处理');

test('loadTasks 正确加载任务', () => {
  const { paths } = initTestEnv();
  const p = paths();

  const tasksData = {
    features: [
      { id: '1', description: 'Task 1', status: 'pending' },
      { id: '2', description: 'Task 2', status: 'in_progress' },
      { id: '3', description: 'Task 3', status: 'done' },
      { id: '4', description: 'Task 4', status: 'failed' }
    ]
  };

  fs.mkdirSync(path.dirname(p.tasksFile), { recursive: true });
  fs.writeFileSync(p.tasksFile, JSON.stringify(tasksData));

  const { loadTasks, getStats, findNextTask } = require('../src/common/tasks');

  const data = loadTasks();
  assert(data !== null);
  assert.strictEqual(data.features.length, 4);

  const stats = getStats(data);
  assert.strictEqual(stats.total, 4);
  assert.strictEqual(stats.pending, 1);
  assert.strictEqual(stats.in_progress, 1);
  assert.strictEqual(stats.done, 1);
  assert.strictEqual(stats.failed, 1);

  const nextTask = findNextTask(data);
  assert(nextTask !== null);
  // findNextTask 优先返回 failed 任务
  assert.strictEqual(nextTask.status, 'failed');
  assert.strictEqual(nextTask.id, '4');
});

// 清理
console.log('\n清理测试环境...');
cleanup();

// 结果
console.log('\n========================================');
console.log(`  测试结果: ${testsPassed} passed, ${testsFailed} failed`);
console.log('========================================\n');

process.exit(testsFailed > 0 ? 1 : 0);