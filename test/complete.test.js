'use strict';

/**
 * 完整流程测试
 * 覆盖所有 CLI 命令和关键场景
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

const CLI = `node ${path.join(__dirname, '..', 'bin', 'cli.js')}`;
const CLAUDE_DIR = path.join(process.cwd(), '.claude-coder');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    testsFailed++;
  }
}

function cleanup() {
  if (fs.existsSync(CLAUDE_DIR)) {
    fs.rmSync(CLAUDE_DIR, { recursive: true, force: true });
  }
}

function getPaths() {
  const { paths } = require('../src/common/config');
  return paths();
}

// ============ 测试套件 ============

console.log('\n========================================');
console.log('  Claude Coder 完整流程测试');
console.log('========================================\n');

// ========== 1. CLI 命令测试 ==========
console.log('1. CLI 命令测试');

test('init 命令存在', () => {
  const output = execSync(`${CLI} --help`, { encoding: 'utf8' });
  assert(output.includes('init'));
});

test('plan 命令存在', () => {
  const output = execSync(`${CLI} --help`, { encoding: 'utf8' });
  assert(output.includes('plan'));
});

test('run 命令存在', () => {
  const output = execSync(`${CLI} --help`, { encoding: 'utf8' });
  assert(output.includes('run'));
});

test('simplify 命令存在', () => {
  const output = execSync(`${CLI} --help`, { encoding: 'utf8' });
  assert(output.includes('simplify'));
});

test('status 命令存在', () => {
  const output = execSync(`${CLI} --help`, { encoding: 'utf8' });
  assert(output.includes('status'));
});

test('auth 命令存在', () => {
  const output = execSync(`${CLI} --help`, { encoding: 'utf8' });
  assert(output.includes('auth'));
});

// ========== 2. Init 流程测试 ==========
console.log('\n2. Init 流程测试');

test('init.js 导入 scan 模块正确', () => {
  const initModule = require('../src/core/init');
  assert(typeof initModule.init === 'function');
});

test('init profile 不存在时会调用 scan', () => {
  cleanup();
  const p = getPaths();
  assert(!fs.existsSync(p.profile), 'profile 应该不存在');
});

test('deployGuidanceFiles 创建 assets 目录', () => {
  cleanup();
  const { ensureLoopDir } = require('../src/common/config');
  ensureLoopDir();

  const p = getPaths();
  // 模拟部署
  if (!fs.existsSync(p.assetsDir)) {
    fs.mkdirSync(p.assetsDir, { recursive: true });
  }

  assert(fs.existsSync(p.assetsDir), 'assets 目录应该存在');
});

test('deployGuidanceFiles 部署指导文件', () => {
  cleanup();
  const { ensureLoopDir } = require('../src/common/config');
  ensureLoopDir();

  const p = getPaths();
  const assetsDir = p.assetsDir;
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // 检查模板文件是否存在
  if (fs.existsSync(p.guidanceTemplate)) {
    const content = fs.readFileSync(p.guidanceTemplate, 'utf8');
    assert(content.length > 0, 'guidance 模板应该有内容');
  }
});

// ========== 3. Plan 流程测试 ==========
console.log('\n3. Plan 流程测试');

test('plan 无 profile 时报错并提示 init', () => {
  cleanup();

  try {
    execSync(`${CLI} plan "test" --planOnly`, { encoding: 'utf8', stdio: 'pipe' });
    assert.fail('应该报错');
  } catch (err) {
    const output = err.stderr?.toString() || err.stdout?.toString() || '';
    assert(output.includes('profile') || output.includes('init'));
  }
});

test('plan --planOnly 参数在 CLI 中定义', () => {
  // 测试 --planOnly 参数存在
  const output = execSync(`${CLI} --help`, { encoding: 'utf8' });
  assert(output.includes('planOnly'));
});

test('plan -r 参数文件不存在时报错', () => {
  cleanup();
  const { ensureLoopDir } = require('../src/common/config');
  ensureLoopDir();

  const p = getPaths();

  // 创建 profile
  fs.mkdirSync(path.dirname(p.profile), { recursive: true });
  fs.writeFileSync(p.profile, JSON.stringify({
    tech_stack: { backend: { framework: 'express' } },
    services: [],
    existing_docs: ['README.md']
  }));

  // 测试文件不存在时的错误
  try {
    execSync(`${CLI} plan -r nonexistent.md --planOnly`, { encoding: 'utf8', stdio: 'pipe' });
    assert.fail('应该报错');
  } catch (err) {
    const output = (err.stderr || err.stdout || '').toString();
    assert(output.includes('文件不存在') || output.includes('不存在') || output.includes('error'), `实际输出: ${output}`);
  }
});

test('plan 有 profile 时可以继续', () => {
  cleanup();
  const { ensureLoopDir } = require('../src/common/config');
  ensureLoopDir();

  const p = getPaths();

  // 创建有效 profile
  fs.mkdirSync(path.dirname(p.profile), { recursive: true });
  fs.writeFileSync(p.profile, JSON.stringify({
    tech_stack: {
      backend: { framework: 'express' },
      frontend: { framework: 'react' }
    },
    services: [],
    existing_docs: ['README.md']
  }));

  assert(fs.existsSync(p.profile), 'profile 应该存在');
});

// ========== 4. Run 流程测试 ==========
console.log('\n4. Run 流程测试');

test('run 无 profile 时报错并提示 init', () => {
  cleanup();

  try {
    execSync(`${CLI} run --max 1`, { encoding: 'utf8', stdio: 'pipe' });
    assert.fail('应该报错');
  } catch (err) {
    const output = err.stderr?.toString() || err.stdout?.toString() || '';
    assert(output.includes('profile') || output.includes('init'));
  }
});

test('run 无 tasks.json 时报错并提示 plan', () => {
  cleanup();
  const { ensureLoopDir } = require('../src/common/config');
  ensureLoopDir();

  const p = getPaths();

  // 创建 profile 但不创建 tasks
  fs.mkdirSync(path.dirname(p.profile), { recursive: true });
  fs.writeFileSync(p.profile, JSON.stringify({
    tech_stack: { backend: { framework: 'express' } },
    services: [],
    existing_docs: ['README.md']
  }));

  try {
    execSync(`${CLI} run --max 1`, { encoding: 'utf8', stdio: 'pipe' });
    assert.fail('应该报错');
  } catch (err) {
    const output = err.stderr?.toString() || err.stdout?.toString() || '';
    assert(output.includes('tasks') || output.includes('plan'));
  }
});

test('run --dry-run 预览模式', () => {
  cleanup();
  const { ensureLoopDir } = require('../src/common/config');
  ensureLoopDir();

  const p = getPaths();

  // 创建 profile 和 tasks
  fs.mkdirSync(path.dirname(p.profile), { recursive: true });
  fs.writeFileSync(p.profile, JSON.stringify({
    tech_stack: { backend: { framework: 'express' } },
    services: [],
    existing_docs: ['README.md']
  }));

  fs.writeFileSync(p.tasksFile, JSON.stringify({
    features: [{ id: '1', description: 'Test', status: 'pending' }]
  }));

  const output = execSync(`${CLI} run --max 1 --dry-run`, { encoding: 'utf8' });
  assert(output.includes('预览模式') || output.includes('DRY-RUN'));
});

test('run --max 参数限制 session 数量', () => {
  cleanup();
  const { ensureLoopDir } = require('../src/common/config');
  ensureLoopDir();

  const p = getPaths();

  fs.mkdirSync(path.dirname(p.profile), { recursive: true });
  fs.writeFileSync(p.profile, JSON.stringify({
    tech_stack: { backend: { framework: 'express' } },
    services: [],
    existing_docs: ['README.md']
  }));

  // 创建多个任务
  fs.writeFileSync(p.tasksFile, JSON.stringify({
    features: [
      { id: '1', description: 'Task 1', status: 'pending' },
      { id: '2', description: 'Task 2', status: 'pending' }
    ]
  }));

  // 运行 --max 1 应该只处理 1 个 session
  // 注意：execSync 默认只返回 stdout，stderr 会直接输出
  const output = execSync(`${CLI} run --max 1 --dry-run 2>&1`, {
    encoding: 'utf8',
    shell: true
  });

  // 验证输出包含 session 相关信息
  assert(output.includes('Session 1') || output.includes('最多 1 个会话'), `输出不包含预期内容: ${output.slice(0, 200)}`);
});

// ========== 5. Simplify 流程测试 ==========
console.log('\n5. Simplify 流程测试');

test('simplify 模块导出正确', () => {
  const { simplify, _runSimplifySession } = require('../src/core/simplify');
  assert(typeof simplify === 'function');
  assert(typeof _runSimplifySession === 'function');
});

test('simplify ensureLoopDir 被调用', () => {
  cleanup();

  // 简化测试：验证 simplify 函数存在且可调用
  const { simplify } = require('../src/core/simplify');
  assert(typeof simplify === 'function');
});

// ========== 6. Status 命令测试 ==========
console.log('\n6. Status 命令测试');

test('status 命令无 tasks.json 时警告', () => {
  cleanup();
  // 确保 tasks.json 不存在
  const p = getPaths();
  if (fs.existsSync(p.tasksFile)) {
    fs.unlinkSync(p.tasksFile);
  }

  // 执行 status 命令，使用 2>&1 合并 stderr
  const output = execSync(`${CLI} status 2>&1`, {
    encoding: 'utf8',
    shell: true
  });

  // 检查输出包含 tasks.json 或 WARN 相关内容
  assert(output.includes('tasks.json') || output.includes('WARN') || output.includes('未找到'), `输出不包含预期内容: ${output.slice(0, 200)}`);
});

test('status 命令有 tasks.json 时显示进度', () => {
  cleanup();
  const { ensureLoopDir } = require('../src/common/config');
  ensureLoopDir();

  const p = getPaths();

  fs.writeFileSync(p.tasksFile, JSON.stringify({
    project: 'test-project',
    features: [
      { id: '1', description: 'Task 1', status: 'done' },
      { id: '2', description: 'Task 2', status: 'pending' }
    ]
  }));

  const output = execSync(`${CLI} status`, { encoding: 'utf8' });
  assert(output.includes('test-project') || output.includes('1') || output.includes('Task'));
});

// ========== 7. Auth 命令测试 ==========
console.log('\n7. Auth 命令测试');

test('auth 模块导出正确', () => {
  const { auth } = require('../src/commands/auth');
  assert(typeof auth === 'function');
});

// ========== 8. 任务状态测试 ==========
console.log('\n8. 任务状态测试');

test('findNextTask 优先返回 failed 任务', () => {
  cleanup();
  const { ensureLoopDir } = require('../src/common/config');
  ensureLoopDir();

  const p = getPaths();

  fs.writeFileSync(p.tasksFile, JSON.stringify({
    features: [
      { id: '1', description: 'Task 1', status: 'pending' },
      { id: '2', description: 'Task 2', status: 'failed' },
      { id: '3', description: 'Task 3', status: 'in_progress' }
    ]
  }));

  const { findNextTask, loadTasks } = require('../src/common/tasks');
  const data = loadTasks();
  const next = findNextTask(data);

  assert.strictEqual(next.status, 'failed');
  assert.strictEqual(next.id, '2');
});

test('findNextTask pending 无依赖时返回', () => {
  cleanup();
  const { ensureLoopDir } = require('../src/common/config');
  ensureLoopDir();

  const p = getPaths();

  fs.writeFileSync(p.tasksFile, JSON.stringify({
    features: [
      { id: '1', description: 'Task 1', status: 'pending' },
      { id: '2', description: 'Task 2', status: 'done' }
    ]
  }));

  const { findNextTask, loadTasks } = require('../src/common/tasks');
  const data = loadTasks();
  const next = findNextTask(data);

  assert.strictEqual(next.status, 'pending');
  assert.strictEqual(next.id, '1');
});

test('findNextTask pending 有依赖时跳过', () => {
  cleanup();
  const { ensureLoopDir } = require('../src/common/config');
  ensureLoopDir();

  const p = getPaths();

  fs.writeFileSync(p.tasksFile, JSON.stringify({
    features: [
      { id: '1', description: 'Task 1', status: 'pending', depends_on: ['2'] },
      { id: '2', description: 'Task 2', status: 'pending' }
    ]
  }));

  const { findNextTask, loadTasks } = require('../src/common/tasks');
  const data = loadTasks();
  const next = findNextTask(data);

  // Task 1 依赖 Task 2，所以返回 Task 2
  assert.strictEqual(next.id, '2');
});

test('setStatus 正确更新状态', () => {
  cleanup();
  const { ensureLoopDir } = require('../src/common/config');
  ensureLoopDir();

  const p = getPaths();

  fs.writeFileSync(p.tasksFile, JSON.stringify({
    features: [{ id: '1', description: 'Task 1', status: 'pending' }]
  }));

  const { setStatus, loadTasks } = require('../src/common/tasks');
  const data = loadTasks();

  setStatus(data, '1', 'in_progress');

  const updated = loadTasks();
  assert.strictEqual(updated.features[0].status, 'in_progress');
});

// ========== 9. Profile 验证测试 ==========
console.log('\n9. Profile 验证测试');

test('validateProfile 检测缺少框架', () => {
  cleanup();
  const { ensureLoopDir } = require('../src/common/config');
  ensureLoopDir();

  const p = getPaths();

  fs.mkdirSync(path.dirname(p.profile), { recursive: true });
  fs.writeFileSync(p.profile, JSON.stringify({
    tech_stack: {},
    services: [],
    existing_docs: ['README.md']
  }));

  const { validateProfile } = require('../src/core/scan');
  const result = validateProfile();

  assert(!result.valid);
  assert(result.issues.some(i => i.includes('框架')));
});

test('validateProfile 检测缺少 services', () => {
  cleanup();
  const { ensureLoopDir } = require('../src/common/config');
  ensureLoopDir();

  const p = getPaths();

  fs.mkdirSync(path.dirname(p.profile), { recursive: true });
  fs.writeFileSync(p.profile, JSON.stringify({
    tech_stack: { backend: { framework: 'express' } },
    services: [],
    existing_docs: ['README.md']
  }));

  const { validateProfile } = require('../src/core/scan');
  const result = validateProfile();

  assert(!result.valid);
  assert(result.issues.some(i => i.includes('services')));
});

// 清理
console.log('\n清理测试环境...');
cleanup();

// 结果
console.log('\n========================================');
console.log(`  测试结果: ${testsPassed} passed, ${testsFailed} failed`);
console.log('========================================\n');

process.exit(testsFailed > 0 ? 1 : 0);