'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadSDK } = require('./session');
const { paths, log } = require('../common/config');
const { Indicator } = require('../common/indicator');

const EXIT_TIMEOUT_MS = 30000;

/**
 * 解析输入参数
 * 支持: plan "需求内容" 或 plan -r requirements.md
 */
function parseInput(args) {
  if (!args || args.length === 0) {
    return { type: 'help' };
  }

  if (args[0] === '-r' || args[0] === '--read') {
    if (!args[1]) {
      throw new Error('请指定要读取的文件路径');
    }
    return { type: 'file', path: args[1] };
  }

  return { type: 'instruction', content: args.join(' ') };
}

/**
 * 获取用户输入内容
 */
function getUserInput(input) {
  if (input.type === 'instruction') {
    return input.content;
  }

  if (input.type === 'file') {
    if (!fs.existsSync(input.path)) {
      throw new Error(`文件不存在: ${input.path}`);
    }
    return fs.readFileSync(input.path, 'utf8');
  }

  return '';
}

/**
 * 构建计划生成提示语
 */
function buildPlanPrompt(userInput) {
  return `${userInput}
【约束】不要提问，默认使用最佳推荐方案。
【重要】在最后输出中，必须包含实际方案文件的写入路径，格式如下：
方案文件已写入：\`<实际路径>\`
`;
}

/**
 * 从结果中提取文件路径
 */
function extractPlanPath(result) {
  const pathMatch = result.match(/`([^`]+\.md)`/) || result.match(/\/[^\s`']+\.md/);
  if (pathMatch) {
    return pathMatch[1] || pathMatch[0];
  }
  return null;
}

/**
 * 复制计划文件到项目目录
 */
function copyPlanToProject(generatedPath) {
  const filename = path.basename(generatedPath);
  const targetDir = path.join(process.cwd(), '.claude-coder', 'plan');
  const targetPath = path.join(targetDir, filename);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.copyFileSync(generatedPath, targetPath);
  return targetPath;
}

/**
 * 从消息中提取结果文本
 */
function extractResultText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].type === 'result') {
      return messages[i].result || '';
    }
  }
  return '';
}

/**
 * 日志消息处理
 */
function logMessage(message, logStream, indicator) {
  if (message.type === 'assistant' && message.message?.content) {
    for (const block of message.message.content) {
      if (block.type === 'text' && block.text) {
        if (indicator) indicator.updateActivity();
        if (logStream) logStream.write(block.text);
      }
      if (block.type === 'tool_use' && logStream) {
        logStream.write(`[TOOL_USE] ${block.name}: ${JSON.stringify(block.input).slice(0, 300)}\n`);
      }
    }
  }
}

/**
 * 运行计划生成 session
 * @param {string} userInput - 用户输入（指令或文件内容）
 * @param {object} opts - 选项 { projectRoot, model, indicator, logStream }
 */
async function runPlanSession(userInput, opts = {}) {
  const sdk = await loadSDK();
  const prompt = buildPlanPrompt(userInput);

  // 外部传入或内部创建
  const p = paths();
  const logFile = path.join(p.logsDir, `plan_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.log`);
  const logStream = opts.logStream || fs.createWriteStream(logFile, { flags: 'a' });
  const indicator = opts.indicator || new Indicator();

  const queryOpts = {
    permissionMode: 'plan',
    disallowedTools: ['askUserQuestion'],
    cwd: opts.projectRoot || process.cwd(),
  };
  if (opts.model) queryOpts.model = opts.model;

  // ExitPlanMode 超时检测
  let exitPlanModeDetected = false;
  let exitPlanModeTime = null;

  try {
    const session = sdk.query({ prompt, options: queryOpts });

    const collected = [];
    for await (const msg of session) {
      // 检测 ExitPlanMode 超时
      if (exitPlanModeDetected && exitPlanModeTime) {
        const elapsed = Date.now() - exitPlanModeTime;
        if (elapsed > EXIT_TIMEOUT_MS && msg.type !== 'result') {
          log('warn', '检测到 ExitPlanMode，等待用户批准超时');
          log('info', `计划可能已生成，请查看: ${path.join(os.homedir(), '.claude', 'plans')}`);
          return { success: false, reason: 'timeout', targetPath: null };
        }
      }

      collected.push(msg);
      logMessage(msg, logStream, indicator);

      // 检测 ExitPlanMode
      if (msg.type === 'assistant' && msg.message?.content) {
        for (const block of msg.message.content) {
          if (block.type === 'tool_use' && block.name === 'ExitPlanMode') {
            exitPlanModeDetected = true;
            exitPlanModeTime = Date.now();
          }
        }
      }
    }

    // 清理（仅内部创建的流）
    if (!opts.logStream) {
      logStream.end();
    }

    // 提取结果
    const result = extractResultText(collected);
    const planPath = extractPlanPath(result);

    if (planPath && fs.existsSync(planPath)) {
      const targetPath = copyPlanToProject(planPath);
      log('ok', `计划已生成: ${targetPath}`);
      return { success: true, targetPath, generatedPath: planPath };
    }

    log('warn', '无法从输出中提取计划路径');
    return { success: false, reason: 'no_path', targetPath: null };

  } catch (err) {
    if (!opts.logStream) {
      logStream.end();
    }
    log('error', `计划生成失败: ${err.message}`);
    return { success: false, reason: 'error', error: err.message, targetPath: null };
  }
}

/**
 * 从文件读取用户输入
 */
function readUserInputFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * 主入口 - CLI 调用
 * @param {string[]} args - 命令行参数
 * @param {object} opts - 选项 { projectRoot, model }
 */
async function run(args, opts = {}) {
  const input = parseInput(args);

  if (input.type === 'help') {
    console.log(`
Usage:
  claude-coder plan "需求内容"
  claude-coder plan -r requirements.md
`);
    return { success: false, reason: 'help' };
  }

  const userInput = getUserInput(input);

  // CLI 独立调用时，创建 indicator
  const indicator = new Indicator();
  indicator.start(0, 1);

  const result = await runPlanSession(userInput, opts);

  indicator.stop();
  return result;
}

module.exports = {
  runPlanSession,
  run,
  parseInput,
  getUserInput,
  buildPlanPrompt,
  extractPlanPath,
  copyPlanToProject,
  readUserInputFile,
};