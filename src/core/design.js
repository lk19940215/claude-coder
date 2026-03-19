'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { buildSystemPrompt } = require('./prompts');
const { log } = require('../common/config');
const { assets } = require('../common/assets');
const { saveDesignState } = require('./state');
const { Session } = require('./session');

// ─── Design Dir ───────────────────────────────────────────

function getDesignDir() {
  const envDir = process.env.DESIGN_DIR;
  if (envDir) {
    const resolved = path.resolve(assets.projectRoot, envDir);
    if (!fs.existsSync(resolved)) fs.mkdirSync(resolved, { recursive: true });
    return resolved;
  }
  return assets.dir('design');
}

function scanPenFiles(designDir) {
  const files = [];
  const scan = (dir, prefix = '') => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        scan(path.join(dir, entry.name), prefix + entry.name + '/');
      } else if (entry.name.endsWith('.pen')) {
        files.push({ rel: prefix + entry.name, abs: path.join(dir, entry.name) });
      }
    }
  };
  scan(designDir);
  return files;
}

// ─── Prompt Builders ─────────────────────────────────────

function buildProjectContext() {
  const root = assets.projectRoot;
  let ctx = '';

  const pkgPath = path.join(root, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      ctx += `### 项目信息\n- name: ${pkg.name || '未定义'}\n- description: ${pkg.description || '未定义'}\n- 项目根路径: ${root}\n\n`;
    } catch { /* ignore */ }
  }

  return ctx;
}

function buildDesignPrompt(instruction) {
  const designDir = getDesignDir();

  let designContext = `### 设计文件目录\n绝对路径: ${designDir}\n`;

  const systemPenPath = path.join(designDir, 'system.lib.pen');
  const isInit = !fs.existsSync(systemPenPath);
  designContext += isInit
    ? '### 设计库\n尚未创建 system.lib.pen，请先根据下方「初始化模板」生成。\n\n'
    : '### 设计库\n已有 system.lib.pen，请先 Read 查看并复用。\n\n';

  if (isInit) {
    const initTemplate = assets.read('designInit') || '';
    if (initTemplate) {
      designContext += `### 初始化模板\n\n${initTemplate}\n\n`;
    }
  }

  const mapPath = path.join(designDir, 'design_map.json');
  if (fs.existsSync(mapPath)) {
    try {
      const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      const pages = Object.entries(map.pages || {});
      if (pages.length > 0) {
        designContext += '### 已有页面\n';
        for (const [name, info] of pages) {
          designContext += `- **${name}**: ${info.description} (${path.join(designDir, info.pen)})\n`;
        }
        designContext += '\n';
      }
    } catch { /* ignore */ }
  }

  designContext += buildProjectContext();

  return assets.render('designUser', {
    designContext,
    instruction: instruction
      ? `用户需求:\n${instruction}`
      : '用户未提供需求，使用对话模式收集。',
    modeHint: instruction
      ? '【自动模式】用户已提供需求，直接设计，不要提问。'
      : '【对话模式】使用 AskUserQuestion 工具引导用户描述需求。',
  });
}

function buildFixPrompt(designDir, userInput) {
  const penFiles = scanPenFiles(designDir);
  let designContext = '### 需要检查修复的 .pen 文件\n\n';
  if (penFiles.length === 0) {
    designContext += '（未发现 .pen 文件）\n';
  } else {
    for (const f of penFiles) {
      designContext += `- ${f.abs}\n`;
    }
  }
  designContext += '\n';

  const instruction = userInput
    ? `用户反馈的问题:\n${userInput}\n\n请 Read 每个文件，检查并修复所有不合规内容。`
    : '请 Read 每个文件，检查并修复所有不合规内容。';

  return assets.render('designFixUser', { designContext, instruction });
}

// ─── Post-session Summary ─────────────────────────────────

function showDesignSummary(designDir) {
  const penFiles = scanPenFiles(designDir);
  if (penFiles.length === 0) {
    log('warn', '设计目录中没有 .pen 文件');
    return 0;
  }

  console.log('');
  console.log('┌─ 设计文件 ─────────────────────────────────────┐');
  for (const f of penFiles) {
    console.log(`│  ${f.rel.padEnd(52)}│`);
  }
  console.log('└───────────────────────────────────────────────┘');

  const hasMap = fs.existsSync(path.join(designDir, 'design_map.json'));
  if (hasMap) log('info', 'design_map.json OK');

  return penFiles.length;
}

// ─── User Confirm ────────────────────────────────────────

function askUser(question) {
  if (!process.stdin.isTTY) return Promise.resolve('');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer.trim()); });
  });
}

// ─── Fix Session ─────────────────────────────────────────

async function runFixSession(config, designDir, userInput, opts) {
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  log('info', '正在修复 .pen 文件...');

  await Session.run('design', config, {
    logFileName: `design_fix_${ts}.log`,
    label: 'design_fix',
    async execute(session) {
      const queryOpts = session.buildQueryOptions(opts);
      queryOpts.systemPrompt = buildSystemPrompt('designFix');
      return await session.runQuery(buildFixPrompt(designDir, userInput), queryOpts);
    },
  });

  log('ok', '修复完成');
  showDesignSummary(designDir);
}

// ─── Main Entry ──────────────────────────────────────────

async function executeDesign(config, input, opts = {}) {
  if (opts.reset) {
    saveDesignState({});
    log('ok', 'Design 状态已重置');
    return;
  }

  const designDir = getDesignDir();
  if (!fs.existsSync(designDir)) fs.mkdirSync(designDir, { recursive: true });
  const pagesDir = path.join(designDir, 'pages');
  if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });

  if (opts.fix) {
    const penFiles = scanPenFiles(designDir);
    if (penFiles.length === 0) {
      log('warn', '设计目录中没有 .pen 文件需要修复');
      return;
    }
    const answer = await askUser(`\n发现 ${penFiles.length} 个 .pen 文件，是否进行修复？(Y/n) `);
    if (answer.toLowerCase() === 'n') { log('info', '已取消'); return; }
    await runFixSession(config, designDir, input, opts);
    return;
  }

  const instruction = input || '';
  const isAutoMode = !!instruction;
  log('info', `Design 模式: ${isAutoMode ? '自动' : '对话'}`);

  if (!opts.model || !opts.model.includes('glm')) {
    log('info', '提示: design 推荐使用 --model glm-5 获得最佳效果');
  }

  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  let currentInstruction = instruction;
  let iteration = 0;

  while (true) {
    iteration++;
    log('info', iteration === 1
      ? (isAutoMode ? '正在根据需求生成 UI 设计...' : '正在启动对话式设计...')
      : `正在根据反馈调整设计 (第 ${iteration} 轮)...`);

    const sessionResult = await Session.run('design', config, {
      logFileName: `design_${ts}_${iteration}.log`,
      label: isAutoMode ? 'design_auto' : 'design_dialogue',
      async execute(session) {
        const queryOpts = session.buildQueryOptions(opts);
        queryOpts.systemPrompt = buildSystemPrompt('design');
        if (isAutoMode && iteration === 1) {
          queryOpts.disallowedTools = ['askUserQuestion'];
        }
        return await session.runQuery(buildDesignPrompt(currentInstruction), queryOpts);
      },
    });

    if (sessionResult && !sessionResult.success) {
      log('warn', 'AI 会话未正常完成，检查生成结果...');
    }

    const penCount = showDesignSummary(designDir);
    if (penCount === 0) {
      log('error', 'AI 未生成任何 .pen 文件');
      return;
    }

    log('ok', `设计目录: ${designDir}  文件: ${penCount}`);

    const answer = await askUser('\n有什么要调整的？(直接回车确认 / fix 修复 / 输入调整需求 / cancel 取消)\n> ');
    const cmd = answer.toLowerCase();

    if (cmd === 'cancel') { log('info', '已取消'); return; }

    if (cmd === 'fix' || cmd === '修复') {
      await runFixSession(config, designDir, '', opts);
      continue;
    }

    if (!answer) {
      saveDesignState({ lastTimestamp: new Date().toISOString(), designDir, penCount });
      log('ok', '设计完成！');
      console.log('');
      log('info', '迭代调整: claude-coder design "修改xxx"');
      log('info', '修复文件: claude-coder design --fix');
      log('info', '生成计划: claude-coder plan');
      return;
    }

    currentInstruction = answer;
    log('info', `收到调整需求: ${answer}`);
  }
}

module.exports = { executeDesign };
