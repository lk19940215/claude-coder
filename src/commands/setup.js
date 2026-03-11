'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { ensureLoopDir, paths, log, COLOR, getProjectRoot, parseEnvFile, updateEnvVar } = require('../common/config');

function createInterface() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function askChoice(rl, prompt, min, max, defaultVal) {
  while (true) {
    const raw = await ask(rl, prompt);
    const val = raw.trim() || String(defaultVal || '');
    const num = parseInt(val, 10);
    if (num >= min && num <= max) return num;
    console.log(`请输入 ${min}-${max}`);
  }
}

async function askApiKey(rl, platform, apiUrl, existingKey) {
  if (existingKey) {
    console.log('保留当前 API Key 请直接回车，或输入新 Key:');
  } else {
    console.log(`请输入 ${platform} 的 API Key:`);
  }
  if (apiUrl) {
    console.log(`  ${COLOR.blue}获取入口: ${apiUrl}${COLOR.reset}`);
    console.log('');
  }
  const key = await ask(rl, '  API Key: ');
  if (!key.trim()) {
    if (existingKey) return existingKey;
    console.error('API Key 不能为空');
    process.exit(1);
  }
  return key.trim();
}

function writeConfig(filePath, lines) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(filePath)) {
    const ts = new Date().toISOString().replace(/[:\-T]/g, '').slice(0, 14);
    const backup = `${filePath}.bak.${ts}`;
    fs.copyFileSync(filePath, backup);
    log('info', `已备份旧配置到: ${backup}`);
  }

  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}

function ensureGitignore() {
  const gitignore = path.join(getProjectRoot(), '.gitignore');
  const patterns = ['.claude-coder/.env', '.claude-coder/.runtime/'];
  let content = '';
  if (fs.existsSync(gitignore)) {
    content = fs.readFileSync(gitignore, 'utf8');
  }
  const toAdd = patterns.filter(p => !content.includes(p));
  if (toAdd.length > 0) {
    const block = '\n# Claude Coder（含 API Key 和临时文件）\n' + toAdd.join('\n') + '\n';
    fs.appendFileSync(gitignore, block, 'utf8');
    log('info', '已将 .claude-coder/.env 添加到 .gitignore');
  }
}

// === 提供商配置模块 ===

async function configureDefault() {
  return {
    lines: [
      '# Claude Coder 模型配置',
      '# 提供商: Claude 官方',
      '',
      'MODEL_PROVIDER=claude',
      'API_TIMEOUT_MS=3000000',
      'MCP_TOOL_TIMEOUT=30000',
    ],
    summary: 'Claude 官方模型',
  };
}

async function configureCodingPlan(rl, existing) {
  // 1. 选择或输入 BASE_URL
  console.log('请选择或输入 BASE_URL:');
  console.log('');
  console.log('  1) 智谱 GLM        https://open.bigmodel.cn/api/anthropic');
  console.log('  2) Z.AI           https://api.z.ai/api/anthropic');
  console.log('  3) 阿里云百炼      https://coding.dashscope.aliyuncs.com/apps/anthropic');
  console.log('  4) 其他（手动输入）');
  console.log('');

  const urlChoice = await askChoice(rl, '选择 [1-4，默认 1]: ', 1, 4, 1);
  let finalUrl = '';

  if (urlChoice === 4) {
    const defaultUrl = existing.ANTHROPIC_BASE_URL || '';
    console.log('');
    let baseUrl = await ask(rl, `  BASE_URL${defaultUrl ? ` (回车保留: ${defaultUrl})` : ''}: `);
    finalUrl = baseUrl.trim() || defaultUrl;
  } else {
    const urlMap = {
      1: 'https://open.bigmodel.cn/api/anthropic',
      2: 'https://api.z.ai/api/anthropic',
      3: 'https://coding.dashscope.aliyuncs.com/apps/anthropic',
    };
    finalUrl = urlMap[urlChoice];
  }

  if (!finalUrl) {
    console.error('BASE_URL 不能为空');
    process.exit(1);
  }

  // 2. 输入 API_KEY（提示获取地址）
  const apiUrlMap = {
    'open.bigmodel.cn': 'https://open.bigmodel.cn/usercenter/proj-mgmt/apikeys',
    'api.z.ai': 'https://z.ai/manage-apikey/apikey-list',
    'dashscope.aliyuncs.com': 'https://bailian.console.aliyun.com/?tab=model#/api-key',
  };

  let apiUrlHint = '';
  for (const [host, url] of Object.entries(apiUrlMap)) {
    if (finalUrl.includes(host)) {
      apiUrlHint = url;
      break;
    }
  }

  console.log('');
  if (apiUrlHint) {
    console.log(`  ${COLOR.blue}API Key 获取地址: ${apiUrlHint}${COLOR.reset}`);
  }
  const apiKey = await askApiKey(rl, 'Coding Plan', '', existing.ANTHROPIC_API_KEY);

  // 3. 返回配置（使用「长时间自运行Agent」推荐配置）
  return {
    lines: [
      '# Claude Coder 模型配置',
      '# 提供商: Coding Plan',
      '',
      'MODEL_PROVIDER=coding-plan',
      `ANTHROPIC_BASE_URL=${finalUrl}`,
      `ANTHROPIC_API_KEY=${apiKey}`,
      '',
      '# 模型路由配置（可在 .claude-coder/.env 修改）',
      'ANTHROPIC_DEFAULT_OPUS_MODEL=glm-5',
      'ANTHROPIC_DEFAULT_SONNET_MODEL=qwen3-coder-next',
      'ANTHROPIC_DEFAULT_HAIKU_MODEL=qwen3-coder-plus',
      'ANTHROPIC_MODEL=kimi-k2.5',
      '',
      'API_TIMEOUT_MS=3000000',
      'MCP_TOOL_TIMEOUT=30000',
    ],
    summary: `Coding Plan (${finalUrl})`,
  };
}

async function configureAPI(rl, existing) {
  console.log('请选择 API 模式:');
  console.log('');
  console.log('  1) DeepSeek Chat (V3) - 速度快成本低 [推荐]');
  console.log('  2) DeepSeek Reasoner (R1) - 全链路推理');
  console.log('  3) DeepSeek Hybrid (R1+V3) - 规划用R1，执行用V3');
  console.log('  4) 自定义 - 输入其他 API');
  console.log('');
  const choice = await askChoice(rl, '选择 [1-4，默认 1]: ', 1, 4, 1);

  if (choice === 4) {
    return await configureCustomAPI(rl, existing);
  }

  return await configureDeepSeekMode(rl, existing, choice);
}

async function configureDeepSeekMode(rl, existing, choice) {
  const existingKey = existing.MODEL_PROVIDER === 'deepseek' ? existing.ANTHROPIC_API_KEY : '';
  const apiKey = await askApiKey(rl, 'DeepSeek', 'https://platform.deepseek.com/api_keys', existingKey);

  const dsModel = ['deepseek-chat', 'deepseek-reasoner', 'deepseek-hybrid'][choice - 1];

  const lines = [
    '# Claude Coder 模型配置',
    `# 提供商: DeepSeek`,
    `# 模型: ${dsModel} | API_TIMEOUT_MS=600000 防止长输出超时（10分钟）`,
    '',
    'MODEL_PROVIDER=deepseek',
    'ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic',
    `ANTHROPIC_API_KEY=${apiKey}`,
    `ANTHROPIC_AUTH_TOKEN=${apiKey}`,
    '',
    'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1',
  ];

  if (dsModel === 'deepseek-chat') {
    lines.push(
      '# [DeepSeek Chat 降本策略]',
      'ANTHROPIC_MODEL=deepseek-chat',
      'ANTHROPIC_DEFAULT_OPUS_MODEL=deepseek-chat',
      'ANTHROPIC_DEFAULT_SONNET_MODEL=deepseek-chat',
      'ANTHROPIC_DEFAULT_HAIKU_MODEL=deepseek-chat'
    );
  } else if (dsModel === 'deepseek-reasoner') {
    lines.push(
      '# [DeepSeek Pure Reasoner 模式]',
      'ANTHROPIC_MODEL=deepseek-reasoner',
      'ANTHROPIC_DEFAULT_OPUS_MODEL=deepseek-reasoner',
      'ANTHROPIC_DEFAULT_SONNET_MODEL=deepseek-reasoner',
      'ANTHROPIC_DEFAULT_HAIKU_MODEL=deepseek-reasoner'
    );
  } else {
    lines.push(
      '# [DeepSeek Hybrid 混合模式]',
      'ANTHROPIC_MODEL=deepseek-reasoner',
      'ANTHROPIC_DEFAULT_OPUS_MODEL=deepseek-reasoner',
      'ANTHROPIC_DEFAULT_SONNET_MODEL=deepseek-chat',
      'ANTHROPIC_DEFAULT_HAIKU_MODEL=deepseek-chat'
    );
  }

  lines.push('API_TIMEOUT_MS=600000', 'MCP_TOOL_TIMEOUT=30000');

  return { lines, summary: `DeepSeek (${dsModel})` };
}

async function configureCustomAPI(rl, existing) {
  const defaultUrl = existing.MODEL_PROVIDER === 'custom' ? existing.ANTHROPIC_BASE_URL || '' : '';
  console.log('请输入 Anthropic 兼容的 BASE_URL:');
  let baseUrl = await ask(rl, `  URL${defaultUrl ? ` (回车保留: ${defaultUrl})` : ''}: `);
  baseUrl = baseUrl.trim() || defaultUrl;

  if (!baseUrl) {
    console.error('BASE_URL 不能为空');
    process.exit(1);
  }

  const existingKey = existing.MODEL_PROVIDER === 'custom' ? existing.ANTHROPIC_API_KEY : '';
  const apiKey = await askApiKey(rl, '自定义 API', '', existingKey);

  console.log('');
  const modelInput = await ask(rl, '默认模型名称（回车跳过）: ');
  const model = modelInput.trim();

  const lines = [
    '# Claude Coder 模型配置',
    '# 提供商: 自定义 API',
    '',
    'MODEL_PROVIDER=custom',
    `ANTHROPIC_BASE_URL=${baseUrl}`,
    `ANTHROPIC_API_KEY=${apiKey}`,
  ];

  if (model) {
    lines.push(`ANTHROPIC_MODEL=${model}`);
  }

  lines.push('API_TIMEOUT_MS=3000000', 'MCP_TOOL_TIMEOUT=30000');

  return { lines, summary: `自定义 API (${baseUrl})` };
}

// === MCP 配置模块 ===

async function configureMCP(rl) {
  console.log('');
  console.log('是否启用 Playwright MCP（浏览器自动化测试）？');
  console.log('');
  console.log('  Playwright MCP 由微软官方维护 (github.com/microsoft/playwright-mcp)');
  console.log('  提供 browser_click、browser_snapshot 等 25+ 浏览器自动化工具');
  console.log('  适用于有 Web 前端的项目，Agent 可用它做端到端测试');
  console.log('');
  console.log('  1) 是 - 启用 Playwright MCP（项目有 Web 前端）');
  console.log('  2) 否 - 跳过（纯后端 / CLI 项目）');
  console.log('');

  const mcpChoice = await askChoice(rl, '选择 [1-2]: ', 1, 2);

  const mcpConfig = { enabled: false, mode: null };

  if (mcpChoice === 1) {
    mcpConfig.enabled = true;
    console.log('');
    console.log('请选择 Playwright MCP 浏览器模式:');
    console.log('');
    console.log('  1) persistent - 懒人模式（默认，推荐）');
    console.log('     登录一次永久生效，适合 Google SSO、企业内网 API 拉取等日常开发');
    console.log('');
    console.log('  2) isolated - 开发模式');
    console.log('     每次会话从快照加载，适合验证登录流程的自动化测试');
    console.log('');
    console.log('  3) extension - 连接真实浏览器（实验性）');
    console.log('     通过 Chrome 扩展复用已有登录态和插件');
    console.log('     需要安装 "Playwright MCP Bridge" 扩展');
    console.log('');

    const modeChoice = await askChoice(rl, '选择 [1-3，默认 1]: ', 1, 3, 1);
    const modeMap = { 1: 'persistent', 2: 'isolated', 3: 'extension' };
    mcpConfig.mode = modeMap[modeChoice];

    console.log('');
    if (mcpConfig.mode === 'extension') {
      console.log(`  ${COLOR.yellow}⚠ 前置条件：安装 Playwright MCP Bridge 浏览器扩展${COLOR.reset}`);
      console.log(`  ${COLOR.blue}  https://chromewebstore.google.com/detail/playwright-mcp-bridge/mmlmfjhmonkocbjadbfplnigmagldckm${COLOR.reset}`);
      console.log('');
      console.log('  安装扩展后，运行 claude-coder auth 生成 .mcp.json 配置');
    } else if (mcpConfig.mode === 'persistent') {
      console.log('  使用 claude-coder auth <URL> 打开浏览器完成首次登录');
      console.log('  登录状态将持久保存，后续 MCP 会话自动复用');
      console.log('');
      console.log('  请确保已安装 Playwright:');
      console.log(`  ${COLOR.blue}npx playwright install chromium${COLOR.reset}`);
    } else {
      console.log('  使用 claude-coder auth <URL> 录制登录状态到 playwright-auth.json');
      console.log('  MCP 每次会话从此文件加载初始 cookies/localStorage');
    }
  }

  return mcpConfig;
}

// === 显示当前配置 ===

function showCurrentConfig(existing) {
  console.log('');
  console.log(`${COLOR.blue}当前配置:${COLOR.reset}`);
  console.log(`  提供商:     ${existing.MODEL_PROVIDER || '未配置'}`);
  console.log(`  BASE_URL:   ${existing.ANTHROPIC_BASE_URL || '默认'}`);
  console.log(`  模型:       ${existing.ANTHROPIC_MODEL || '默认'}`);
  console.log(`  MCP:        ${existing.MCP_PLAYWRIGHT === 'true' ? `已启用 (${existing.MCP_PLAYWRIGHT_MODE || 'persistent'})` : '未启用'}`);
  const compTimeout = existing.SESSION_COMPLETION_TIMEOUT || '300';
  const turns = existing.SESSION_MAX_TURNS || '0';
  console.log(`  停顿超时:   ${existing.SESSION_STALL_TIMEOUT || '1200'} 秒`);
  console.log(`  完成检测:   ${compTimeout} 秒`);
  console.log(`  工具轮次:   ${turns === '0' ? '无限制' : turns}`);
  const simplifyInterval = existing.SIMPLIFY_INTERVAL || '0';
  const simplifyCommits = existing.SIMPLIFY_COMMITS || '3';
  console.log(`  自动审查:   ${simplifyInterval === '0' ? '禁用' : `每 ${simplifyInterval} 个 session`}${simplifyInterval !== '0' ? `，审查 ${simplifyCommits} 个 commit` : ''}`);
  console.log('');
}

// === 提供商选择 ===

const PROVIDER_MENU = `
请选择模型提供商:

  1) 默认        Claude 官方模型，使用系统登录态
  2) Coding Plan 自建 API，使用推荐的多模型路由配置
  3) API         DeepSeek 或其他 Anthropic 兼容 API
`;

const PROVIDER_CONFIG = [configureDefault, configureCodingPlan, configureAPI];

async function selectProvider(rl, existing, showHeader = true) {
  if (showHeader) console.log(PROVIDER_MENU);
  const choice = await askChoice(rl, '选择 [1-3]: ', 1, 3);
  console.log('');
  return PROVIDER_CONFIG[choice - 1](rl, existing);
}

// === MCP 配置追加 ===

function appendMcpConfig(lines, mcpConfig) {
  lines.push('', '# MCP 工具配置');
  if (mcpConfig.enabled) {
    lines.push('MCP_PLAYWRIGHT=true');
    if (mcpConfig.mode) lines.push(`MCP_PLAYWRIGHT_MODE=${mcpConfig.mode}`);
  } else {
    lines.push('MCP_PLAYWRIGHT=false');
  }
}

// === 更新单项配置 ===

async function updateApiKeyOnly(rl, existing) {
  const provider = existing.MODEL_PROVIDER;
  if (!provider || provider === 'claude') {
    log('warn', 'Claude 官方无需配置 API Key（使用系统登录态）');
    return;
  }

  const apiUrlMap = {
    'coding-plan': '',
    'deepseek': 'https://platform.deepseek.com/api_keys',
    'custom': '',
  };

  const apiKey = await askApiKey(rl, provider, apiUrlMap[provider] || '', existing.ANTHROPIC_API_KEY);
  updateEnvVar('ANTHROPIC_API_KEY', apiKey);
  if (provider === 'deepseek') {
    updateEnvVar('ANTHROPIC_AUTH_TOKEN', apiKey);
  }
  log('ok', 'API Key 已更新');
}

async function updateMCPOnly(rl) {
  const mcpConfig = await configureMCP(rl);
  updateEnvVar('MCP_PLAYWRIGHT', mcpConfig.enabled ? 'true' : 'false');
  if (mcpConfig.enabled && mcpConfig.mode) {
    updateEnvVar('MCP_PLAYWRIGHT_MODE', mcpConfig.mode);
    const { updateMcpConfig } = require('./auth');
    updateMcpConfig(paths(), mcpConfig.mode);
  }
  log('ok', 'MCP 配置已更新');
}

async function updateSafetyLimits(rl, existing) {
  const currentStall = existing.SESSION_STALL_TIMEOUT || '1200';
  const currentCompletion = existing.SESSION_COMPLETION_TIMEOUT || '300';
  const currentTurns = existing.SESSION_MAX_TURNS || '0';

  console.log(`${COLOR.blue}当前安全限制:${COLOR.reset}`);
  console.log(`  停顿超时:     ${currentStall} 秒 (${Math.floor(parseInt(currentStall) / 60)} 分钟)`);
  console.log(`  完成检测超时: ${currentCompletion} 秒 (${Math.ceil(parseInt(currentCompletion) / 60)} 分钟)`);
  console.log(`  最大工具轮次: ${currentTurns === '0' ? '无限制' : currentTurns}`);
  console.log('');
  console.log(`${COLOR.yellow}说明:${COLOR.reset}`);
  console.log('  完成检测 — 模型写入 session_result.json 后缩短等待，解决"完成但不退出"');
  console.log('  停顿超时 — 长时间无工具调用时自动中断（通用兜底）');
  console.log('  最大轮次 — 限制总轮次，仅 CI 推荐（默认 0 = 无限制）');
  console.log('');

  const stallInput = await ask(rl, `停顿超时秒数（回车保留 ${currentStall}）: `);
  if (stallInput.trim()) {
    const seconds = parseInt(stallInput.trim(), 10);
    if (isNaN(seconds) || seconds < 60) {
      log('warn', '停顿超时需 >= 60 秒，跳过');
    } else {
      updateEnvVar('SESSION_STALL_TIMEOUT', String(seconds));
      log('ok', `停顿超时已设置为 ${seconds} 秒 (${Math.floor(seconds / 60)} 分钟)`);
    }
  }

  console.log('');
  const compInput = await ask(rl, `完成检测超时秒数（回车保留 ${currentCompletion}）: `);
  if (compInput.trim()) {
    const seconds = parseInt(compInput.trim(), 10);
    if (isNaN(seconds) || seconds < 30) {
      log('warn', '完成检测超时需 >= 30 秒，跳过');
    } else {
      updateEnvVar('SESSION_COMPLETION_TIMEOUT', String(seconds));
      log('ok', `完成检测超时已设置为 ${seconds} 秒`);
    }
  }

  console.log('');
  const turnsInput = await ask(rl, `最大工具轮次（回车保留 ${currentTurns === '0' ? '无限制' : currentTurns}，输入 0 = 无限制）: `);
  if (turnsInput.trim()) {
    const turns = parseInt(turnsInput.trim(), 10);
    if (isNaN(turns) || turns < 0) {
      log('warn', '请输入 >= 0 的整数，跳过');
    } else {
      updateEnvVar('SESSION_MAX_TURNS', String(turns));
      log('ok', `最大工具轮次已设置为 ${turns === 0 ? '无限制' : turns}`);
    }
  }
}

async function updateSimplifyConfig(rl, existing) {
  const currentInterval = existing.SIMPLIFY_INTERVAL || '0';
  const currentCommits = existing.SIMPLIFY_COMMITS || '3';

  console.log(`${COLOR.blue}自动代码审查配置:${COLOR.reset}`);
  console.log(`  当前状态:     ${currentInterval === '0' ? '禁用' : `每 ${currentInterval} 个 session 运行一次`}`);
  console.log(`  审查范围:     ${currentCommits} 个 commit`);
  console.log('');
  console.log(`${COLOR.yellow}说明:${COLOR.reset}`);
  console.log('  自动审查 — 在 run() 循环中定期运行代码审查，检查代码复用性、质量、效率');
  console.log('  审查间隔 — 每 N 个成功的 session 后运行一次（0 = 禁用）');
  console.log('  审查范围 — 审查最近 N 个 commit 的代码变更');
  console.log('');

  const intervalInput = await ask(rl, `审查间隔（输入 0 禁用，回车保留 ${currentInterval === '0' ? '禁用' : currentInterval}）: `);
  if (intervalInput.trim()) {
    const interval = parseInt(intervalInput.trim(), 10);
    if (isNaN(interval) || interval < 0) {
      log('warn', '请输入 >= 0 的整数，跳过');
    } else {
      updateEnvVar('SIMPLIFY_INTERVAL', String(interval));
      log('ok', `自动审查已${interval === 0 ? '禁用' : `设置为每 ${interval} 个 session 运行一次`}`);
    }
  }

  const newInterval = existing.SIMPLIFY_INTERVAL || currentInterval;
  if (newInterval !== '0') {
    console.log('');
    const commitsInput = await ask(rl, `审查 commit 数量（回车保留 ${currentCommits}）: `);
    if (commitsInput.trim()) {
      const commits = parseInt(commitsInput.trim(), 10);
      if (isNaN(commits) || commits < 1) {
        log('warn', '请输入 >= 1 的整数，跳过');
      } else {
        updateEnvVar('SIMPLIFY_COMMITS', String(commits));
        log('ok', `审查范围已设置为 ${commits} 个 commit`);
      }
    }
  }
}

// === 主函数 ===

async function setup() {
  const p = paths();
  ensureLoopDir();
  const rl = createInterface();

  // 加载现有配置
  let existing = {};
  if (fs.existsSync(p.envFile)) {
    existing = parseEnvFile(p.envFile);
  }

  console.log('');
  console.log('============================================');
  console.log('  Claude Coder 配置');
  console.log('============================================');

  // 首次配置：引导完整流程
  if (!fs.existsSync(p.envFile) || !existing.MODEL_PROVIDER) {
    console.log('');
    console.log('  检测到未配置，开始初始化...');
    console.log('');

    const configResult = await selectProvider(rl, existing);
    const mcpConfig = await configureMCP(rl);

    appendMcpConfig(configResult.lines, mcpConfig);
    writeConfig(p.envFile, configResult.lines);
    ensureGitignore();

    // 如果启用了 MCP，生成 .mcp.json
    if (mcpConfig.enabled && mcpConfig.mode) {
      const { updateMcpConfig } = require('./auth');
      updateMcpConfig(p, mcpConfig.mode);
    }

    console.log('');
    log('ok', `配置完成！提供商: ${configResult.summary}`);
    console.log('');
    console.log(`  配置文件: ${p.envFile}`);
    console.log('  使用方式: claude-coder run "你的需求"');
    console.log('  重新配置: claude-coder setup');
    console.log('');
    console.log(`  ${COLOR.yellow}安全限制: 默认 20 分钟无工具调用自动中断，写入 session_result 后 5 分钟${COLOR.reset}`);
    console.log(`  ${COLOR.yellow}调整方式: claude-coder setup → 配置安全限制${COLOR.reset}`);
    console.log('');

    rl.close();
    return;
  }

  // 已有配置：菜单选择
  while (true) {
    existing = parseEnvFile(p.envFile);
    showCurrentConfig(existing);

    console.log('请选择要执行的操作:');
    console.log('');
    console.log('  1) 切换模型提供商');
    console.log('  2) 更新 API Key');
    console.log('  3) 配置 MCP');
    console.log('  4) 配置安全限制');
    console.log('  5) 配置自动审查');
    console.log('  6) 完全重新配置');
    console.log('  7) 退出');
    console.log('');

    const action = await askChoice(rl, '选择 [1-7]: ', 1, 7);
    console.log('');

    if (action === 7) {
      log('info', '退出配置');
      break;
    }

    switch (action) {
      case 1: {
        const configResult = await selectProvider(rl, existing);
        appendMcpConfig(configResult.lines, {
          enabled: existing.MCP_PLAYWRIGHT === 'true',
          mode: existing.MCP_PLAYWRIGHT_MODE || null,
        });
        writeConfig(p.envFile, configResult.lines);
        log('ok', `已切换到: ${configResult.summary}`);
        break;
      }
      case 2: {
        await updateApiKeyOnly(rl, existing);
        break;
      }
      case 3: {
        await updateMCPOnly(rl);
        break;
      }
      case 4: {
        await updateSafetyLimits(rl, existing);
        break;
      }
      case 5: {
        await updateSimplifyConfig(rl, existing);
        break;
      }
      case 6: {
        const configResult = await selectProvider(rl, existing);
        const mcpConfig = await configureMCP(rl);
        appendMcpConfig(configResult.lines, mcpConfig);
        writeConfig(p.envFile, configResult.lines);

        if (mcpConfig.enabled && mcpConfig.mode) {
          const { updateMcpConfig } = require('./auth');
          updateMcpConfig(p, mcpConfig.mode);
        }

        log('ok', '配置已更新');
        break;
      }
    }

    console.log('');
    const cont = await ask(rl, '继续配置其他项？(y/N) ');
    if (!/^[Yy]/.test(cont.trim())) break;
  }

  rl.close();
}

module.exports = { setup };
