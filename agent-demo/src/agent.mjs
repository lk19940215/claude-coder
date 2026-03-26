/**
 * AI Coding Agent - 交互模式
 *
 * 基于 AgentCore 引擎，叠加 Ink UI 和日志。
 *
 * 流程:
 *   while(true) {
 *     1. 等待用户输入
 *     2. AgentCore.run(input) — 流式回调驱动 UI
 *     3. 完成后回到 1
 *   }
 *
 * 运行: npm start
 * 恢复会话: RESUME_FILE=logs/xxx-messages.json npm start
 */

import { API_KEY, BASE_URL, DEFAULT_MODEL, MAX_TOKENS, DEBUG, SYSTEM_PROMPT, RESUME_FILE } from './config.mjs';
import { AgentCore } from './core/agent-core.mjs';
import { createDisplay } from './core/ink.mjs';
import { Logger } from './core/logger.mjs';
import { Messages } from './core/messages.mjs';
import { taskEvents } from './tools/task.mjs';

// ─── Preview 函数 ─────────────────────────────────────────

function toolResultPreview(name, result) {
  if (!result || result.startsWith('错误') || result.startsWith('rg:')) return result.substring(0, 60);
  if (name === 'read') return `${result.split('\n').length} 行`;
  if (name === 'grep') return `${result.split('\n').filter(l => l.trim()).length} 处匹配`;
  if (name === 'glob' || name === 'ls') return `${result.split('\n').filter(l => l.trim()).length} 个文件`;
  if (name === 'edit' || name === 'multi_edit') return result;
  if (name === 'write') return result;
  if (name === 'symbols') return result.split('\n')[0] || '';
  if (name === 'bash') return result.split('\n')[0]?.substring(0, 60) || '';
  if (name === 'task') return result.split('\n')[0]?.substring(0, 80) || '';
  return '';
}

function toolInputPreview(name, input) {
  if (name === 'read') return input.path;
  if (name === 'write') return `${input.path} (${input.content?.length || 0} 字符)`;
  if (name === 'edit') return input.path;
  if (name === 'multi_edit') return `${input.path} (${input.edits?.length || 0} 处)`;
  if (name === 'grep') return `/${input.pattern}/${input.include ? ` ${input.include}` : ''}`;
  if (name === 'glob') return input.pattern;
  if (name === 'ls') return input.path || '.';
  if (name === 'symbols') return `${input.mode} ${input.path}${input.name ? ` → ${input.name}` : ''}`;
  if (name === 'bash') return `$ ${input.command?.substring(0, 80)}`;
  if (name === 'task') return input.description?.substring(0, 60) || '';
  return JSON.stringify(input).substring(0, 80);
}

// ─── 初始化 ───────────────────────────────────────────────

const logger = new Logger(DEBUG, { silent: true });
const messages = new Messages();
const display = createDisplay();

const agent = new AgentCore({
  apiKey: API_KEY,
  baseURL: BASE_URL,
  model: DEFAULT_MODEL,
  maxTokens: MAX_TOKENS,
  systemPrompt: SYSTEM_PROMPT,
  logger,
});

const callbacks = {
  onStatus(state) { display.status(state); },
  onToolStart(name, input) {
    if (name === 'task') display.status('sub-agent');
    display.toolStart(name, toolInputPreview(name, input));
  },
  onToolEnd(name, result, success) {
    display.toolEnd(name, result.length, toolResultPreview(name, result), success);
  },
  onBlockStart(type) { display.startStream(type); },
  onBlockEnd() { display.finishStream(); },
  onText(chunk) { display.appendText(chunk); },
  onThinking(chunk) { display.appendText(chunk); },
  onError(e) { display.print(`❌ 请求失败: ${e.message}`, 'red'); },
};

// SubAgent 进度事件 → Ink UI
taskEvents.on('tool', ({ step, name }) => {
  display.print(`    ↳ SubAgent [${step}] ${name}`, 'magenta');
});

async function main() {
  const logFile = logger.init();
  await messages.init(logFile);

  if (RESUME_FILE) {
    const { ok, count } = await messages.load(RESUME_FILE);
    if (ok) logger.log('会话恢复', `加载 ${count} 条历史消息`);
  }

  display.start({
    model: DEFAULT_MODEL,
    tools: agent.toolSchemas.map(t => t.name),
    logFile,
  });

  logger.start({
    systemPrompt: SYSTEM_PROMPT,
    toolSchemas: agent.toolSchemas,
  });

  while (true) {
    const input = await display.waitForInput();
    if (!input) break;

    display.print(`\n你: ${input}`, 'green', { bold: true });
    logger.round(input);

    await agent.run(input, messages, callbacks, { stream: true });
  }

  display.destroy();
}

main();
