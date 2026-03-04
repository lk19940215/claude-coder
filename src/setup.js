'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { ensureLoopDir, paths, log, COLOR, getProjectRoot } = require('./config');

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

  // Backup existing
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
  const patterns = ['.auto-coder/.env', '.auto-coder/.runtime/'];
  let content = '';
  if (fs.existsSync(gitignore)) {
    content = fs.readFileSync(gitignore, 'utf8');
  }
  const toAdd = patterns.filter(p => !content.includes(p));
  if (toAdd.length > 0) {
    const block = '\n# Auto Coder（含 API Key 和临时文件）\n' + toAdd.join('\n') + '\n';
    fs.appendFileSync(gitignore, block, 'utf8');
    log('info', '已将 .auto-coder/.env 添加到 .gitignore');
  }
}

async function setup() {
  const p = paths();
  ensureLoopDir();
  const rl = createInterface();

  // Load existing config for defaults
  let existing = {};
  if (fs.existsSync(p.envFile)) {
    const { parseEnvFile } = require('./config');
    existing = parseEnvFile(p.envFile);
  }

  console.log('');
  console.log('============================================');
  console.log('  Auto Coder 前置配置');
  console.log('============================================');
  console.log('');
  console.log('  第一步: 模型提供商配置');
  console.log('  第二步: MCP 工具 + 调试输出（可选）');
  console.log('');

  // Detect existing config
  if (fs.existsSync(p.envFile)) {
    log('warn', `检测到已有配置文件: ${p.envFile}`);
    console.log(`  当前模型提供商: ${existing.MODEL_PROVIDER || '未知'}`);
    console.log(`  当前 BASE_URL: ${existing.ANTHROPIC_BASE_URL || '默认'}`);
    console.log(`  Playwright MCP: ${existing.MCP_PLAYWRIGHT || '未配置'}`);
    console.log('');
    const reply = await ask(rl, '是否重新配置？(y/n) ');
    if (!/^[Yy]/.test(reply.trim())) {
      log('info', '保留现有配置，退出');
      rl.close();
      return;
    }
    console.log('');
  }

  // Provider selection
  console.log('请选择模型提供商:');
  console.log('');
  console.log('  1) Claude 官方');
  console.log(`  2) GLM Coding Plan (智谱/Z.AI)      ${COLOR.blue}https://open.bigmodel.cn${COLOR.reset}`);
  console.log(`  3) 阿里云 Coding Plan (百炼)         ${COLOR.blue}https://bailian.console.aliyun.com${COLOR.reset}`);
  console.log(`  4) DeepSeek                          ${COLOR.blue}https://platform.deepseek.com${COLOR.reset}`);
  console.log('  5) 自定义 (Anthropic 兼容)');
  console.log('');

  const choice = await askChoice(rl, '选择 [1-5]: ', 1, 5);
  console.log('');

  let configLines = [];

  switch (choice) {
    case 1: {
      configLines = [
        '# Auto Coder 模型配置',
        '# 提供商: Claude 官方',
        '',
        'MODEL_PROVIDER=claude',
        'API_TIMEOUT_MS=3000000',
        'MCP_TOOL_TIMEOUT=30000',
      ];
      log('ok', '已配置为 Claude 官方模型');
      break;
    }
    case 2: {
      // GLM platform
      console.log('请选择 GLM 平台:');
      console.log('');
      console.log('  1) 智谱开放平台 (open.bigmodel.cn) - 国内直连');
      console.log('  2) Z.AI (api.z.ai) - 海外节点');
      console.log('');
      const platChoice = await askChoice(rl, '选择 [1-2，默认 1]: ', 1, 2, 1);
      const isBigmodel = platChoice === 1;
      const glmProvider = isBigmodel ? 'glm-bigmodel' : 'glm-zai';
      const glmBaseUrl = isBigmodel
        ? 'https://open.bigmodel.cn/api/anthropic'
        : 'https://api.z.ai/api/anthropic';
      const glmApiUrl = isBigmodel
        ? 'https://open.bigmodel.cn/usercenter/proj-mgmt/apikeys'
        : 'https://z.ai/manage-apikey/apikey-list';

      // GLM model
      console.log('');
      console.log('请选择 GLM 模型版本:');
      console.log('');
      console.log('  1) GLM 4.7  - 旗舰模型，推理与代码能力强');
      console.log('  2) GLM 5    - 最新模型（2026），能力更强');
      console.log('');
      const modelChoice = await askChoice(rl, '选择 [1-2，默认 1]: ', 1, 2, 1);
      const glmModel = modelChoice === 1 ? 'glm-4.7' : 'glm-5';

      const existingKey = existing.MODEL_PROVIDER === glmProvider ? existing.ANTHROPIC_API_KEY : '';
      const apiKey = await askApiKey(rl, glmProvider, glmApiUrl, existingKey);

      configLines = [
        '# Auto Coder 模型配置',
        `# 提供商: GLM (${glmProvider})`,
        `# 模型: ${glmModel}`,
        '',
        `MODEL_PROVIDER=${glmProvider}`,
        `ANTHROPIC_MODEL=${glmModel}`,
        `ANTHROPIC_BASE_URL=${glmBaseUrl}`,
        `ANTHROPIC_API_KEY=${apiKey}`,
        'API_TIMEOUT_MS=3000000',
        'MCP_TOOL_TIMEOUT=30000',
      ];
      log('ok', `已配置为 GLM 模型 (${glmProvider}, ${glmModel})`);
      log('info', `BASE_URL: ${glmBaseUrl}`);
      break;
    }
    case 3: {
      // Aliyun
      console.log('请选择阿里云百炼区域:');
      console.log('');
      console.log('  1) 国内版 (coding.dashscope.aliyuncs.com)');
      console.log('  2) 国际版 (coding-intl.dashscope.aliyuncs.com)');
      console.log('');
      const regionChoice = await askChoice(rl, '选择 [1-2，默认 1]: ', 1, 2, 1);
      const aliyunBaseUrl = regionChoice === 1
        ? 'https://coding.dashscope.aliyuncs.com/apps/anthropic'
        : 'https://coding-intl.dashscope.aliyuncs.com/apps/anthropic';

      const existingKey = existing.MODEL_PROVIDER === 'aliyun-coding' ? existing.ANTHROPIC_API_KEY : '';
      const apiKey = await askApiKey(rl, '阿里云百炼', 'https://bailian.console.aliyun.com/?tab=model#/api-key', existingKey);

      configLines = [
        '# Auto Coder 模型配置',
        '# 提供商: 阿里云 Coding Plan (百炼)',
        '# Opus: glm-5 | Sonnet/Haiku: qwen3-coder-plus | Fallback: qwen3.5-plus',
        '',
        'MODEL_PROVIDER=aliyun-coding',
        `ANTHROPIC_BASE_URL=${aliyunBaseUrl}`,
        `ANTHROPIC_API_KEY=${apiKey}`,
        '',
        'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1',
        '# Planner (规划/推理) → glm-5',
        'ANTHROPIC_DEFAULT_OPUS_MODEL=glm-5',
        '# Executor (写代码/编辑/工具调用) → qwen3-coder-plus',
        'ANTHROPIC_DEFAULT_SONNET_MODEL=qwen3-coder-plus',
        'ANTHROPIC_DEFAULT_HAIKU_MODEL=qwen3-coder-plus',
        'ANTHROPIC_SMALL_FAST_MODEL=qwen3-coder-plus',
        '# Fallback (通用) → qwen3.5-plus',
        'ANTHROPIC_MODEL=qwen3.5-plus',
        'API_TIMEOUT_MS=3000000',
        'MCP_TOOL_TIMEOUT=30000',
      ];
      log('ok', '已配置为阿里云 Coding Plan (百炼)');
      log('info', `BASE_URL: ${aliyunBaseUrl}`);
      log('info', '模型映射: Opus=glm-5 / Sonnet+Haiku=qwen3-coder-plus / Fallback=qwen3.5-plus');
      break;
    }
    case 4: {
      // DeepSeek
      const existingKey = existing.MODEL_PROVIDER === 'deepseek' ? existing.ANTHROPIC_API_KEY : '';
      const apiKey = await askApiKey(rl, 'DeepSeek', 'https://platform.deepseek.com/api_keys', existingKey);

      console.log('');
      console.log('请选择 DeepSeek 模型:');
      console.log('');
      console.log('  1) deepseek-chat     - 通用对话 (V3)，速度快成本低 [推荐日常使用]');
      console.log('  2) deepseek-reasoner - 纯推理模式 (R1)，全链路使用 R1，成本最高 [适合攻坚]');
      console.log('  3) deepseek-hybrid   - 混合模式 (R1 + V3)，规划用 R1，执行用 V3 [性价比之选]');
      console.log('');
      const dsChoice = await askChoice(rl, '选择 [1-3，默认 1]: ', 1, 3, 1);
      const dsModel = ['deepseek-chat', 'deepseek-reasoner', 'deepseek-hybrid'][dsChoice - 1];

      configLines = [
        '# Auto Coder 模型配置',
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
        configLines.push(
          '# [DeepSeek Chat 降本策略]',
          'ANTHROPIC_MODEL=deepseek-chat',
          'ANTHROPIC_SMALL_FAST_MODEL=deepseek-chat',
          'ANTHROPIC_DEFAULT_OPUS_MODEL=deepseek-chat',
          'ANTHROPIC_DEFAULT_SONNET_MODEL=deepseek-chat',
          'ANTHROPIC_DEFAULT_HAIKU_MODEL=deepseek-chat',
        );
      } else if (dsModel === 'deepseek-reasoner') {
        configLines.push(
          '# [DeepSeek Pure Reasoner 模式]',
          'ANTHROPIC_MODEL=deepseek-reasoner',
          'ANTHROPIC_SMALL_FAST_MODEL=deepseek-reasoner',
          'ANTHROPIC_DEFAULT_OPUS_MODEL=deepseek-reasoner',
          'ANTHROPIC_DEFAULT_SONNET_MODEL=deepseek-reasoner',
          'ANTHROPIC_DEFAULT_HAIKU_MODEL=deepseek-reasoner',
        );
      } else {
        configLines.push(
          '# [DeepSeek Hybrid 混合模式]',
          'ANTHROPIC_MODEL=deepseek-reasoner',
          'ANTHROPIC_DEFAULT_OPUS_MODEL=deepseek-reasoner',
          'ANTHROPIC_SMALL_FAST_MODEL=deepseek-chat',
          'ANTHROPIC_DEFAULT_SONNET_MODEL=deepseek-chat',
          'ANTHROPIC_DEFAULT_HAIKU_MODEL=deepseek-chat',
        );
      }

      configLines.push('API_TIMEOUT_MS=600000', 'MCP_TOOL_TIMEOUT=30000');
      log('ok', `已配置为 DeepSeek (${dsModel}，Anthropic 兼容)`);
      log('info', 'BASE_URL: https://api.deepseek.com/anthropic');
      break;
    }
    case 5: {
      // Custom
      const defaultUrl = existing.MODEL_PROVIDER === 'custom' ? existing.ANTHROPIC_BASE_URL || '' : '';
      console.log(`请输入 Anthropic 兼容的 BASE_URL${defaultUrl ? `（回车保留: ${defaultUrl}）` : ''}:`);
      let baseUrl = await ask(rl, '  URL: ');
      baseUrl = baseUrl.trim() || defaultUrl;
      console.log('');

      const existingKey = existing.MODEL_PROVIDER === 'custom' ? existing.ANTHROPIC_API_KEY : '';
      const apiKey = await askApiKey(rl, '自定义平台', '', existingKey);

      configLines = [
        '# Auto Coder 模型配置',
        '# 提供商: 自定义',
        '',
        'MODEL_PROVIDER=custom',
        `ANTHROPIC_BASE_URL=${baseUrl}`,
        `ANTHROPIC_API_KEY=${apiKey}`,
        'API_TIMEOUT_MS=3000000',
        'MCP_TOOL_TIMEOUT=30000',
      ];
      log('ok', '已配置为自定义模型');
      log('info', `BASE_URL: ${baseUrl}`);
      break;
    }
  }

  // === Step 2: MCP tools ===
  console.log('');
  console.log('============================================');
  console.log('  MCP 工具配置（可选）');
  console.log('============================================');
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

  configLines.push('', '# MCP 工具配置');
  if (mcpChoice === 1) {
    configLines.push('MCP_PLAYWRIGHT=true');
    log('ok', 'Playwright MCP 已启用');
    console.log('');
    console.log('  请确保已安装 Playwright MCP：');
    console.log(`  ${COLOR.blue}npx @anthropic-ai/claude-code mcp add playwright -- npx @anthropic-ai/playwright-mcp${COLOR.reset}`);
    console.log(`  ${COLOR.blue}详见: https://github.com/microsoft/playwright-mcp${COLOR.reset}`);
  } else {
    configLines.push('MCP_PLAYWRIGHT=false');
    log('info', '已跳过 Playwright MCP');
  }

  // Debug output
  console.log('');
  console.log('是否开启 Claude 调试输出（便于排查问题，输出较多）？');
  console.log('');
  console.log('  1) 否 - 静默（默认，推荐）');
  console.log('  2) 是 - verbose（完整每轮输出）');
  console.log('  3) 是 - mcp（MCP 调用，如 Playwright Click）');
  console.log('');

  const debugChoice = await askChoice(rl, '选择 [1-3，默认 1]: ', 1, 3, 1);
  configLines.push('', '# Claude 调试（可随时修改）');
  if (debugChoice === 2) {
    configLines.push('CLAUDE_DEBUG=verbose');
    log('info', '已启用 CLAUDE_DEBUG=verbose');
  } else if (debugChoice === 3) {
    configLines.push('CLAUDE_DEBUG=mcp');
    log('info', '已启用 CLAUDE_DEBUG=mcp');
  } else {
    configLines.push('# CLAUDE_DEBUG=verbose  # 取消注释可开启');
  }

  // Write config
  writeConfig(p.envFile, configLines);
  ensureGitignore();

  rl.close();

  console.log('');
  log('ok', '配置完成！');
  console.log('');
  console.log(`  配置文件: ${p.envFile}`);
  console.log('  使用方式: auto-coder run "你的需求"');
  console.log('  详细需求: 创建 requirements.md 后运行 auto-coder run');
  console.log('  重新配置: auto-coder setup');
  console.log('');
}

module.exports = { setup };
