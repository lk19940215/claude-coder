/**
 * Logger - 统一输出（终端 + 日志文件）
 *
 * 终端始终输出，日志文件仅在 DEBUG=true 时写入。
 */

import { appendFileSync, writeFileSync, mkdirSync } from 'fs';

const C = {
  reset:   '\x1b[0m',
  dim:     '\x1b[2m',
  cyan:    '\x1b[36m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
};

export class Logger {
  constructor(debug = false) {
    this.debug = debug;
    this.file = null;
  }

  init() {
    if (!this.debug) return null;
    mkdirSync('logs', { recursive: true });
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    this.file = `logs/${date}_${time}.log`;
    this._log(`${'═'.repeat(50)}\n  Agent 启动 ${now.toISOString()}\n${'═'.repeat(50)}`);
    return this.file;
  }

  start({ model, tools, logFile, systemPrompt, toolSchemas }) {
    console.log(`\n${C.cyan}═══ AI Coding Agent ═══${C.reset}`);
    console.log(`${C.dim}模型: ${model}${C.reset}`);
    console.log(`${C.dim}工具: ${tools.join(', ')}${C.reset}`);
    if (logFile) console.log(`${C.dim}调试日志: ${logFile}${C.reset}`);
    console.log(`${C.dim}输入任务开始，exit 退出${C.reset}\n`);
    if (systemPrompt) this._section('System Prompt', systemPrompt);
    if (toolSchemas) this._section('可用工具', toolSchemas);
  }

  startRequest({ model, messagesCount, baseURL, fullParams }) {
    const params = { model, max_tokens: fullParams?.max_tokens, baseURL: baseURL || 'default', messages数量: messagesCount };
    this._section('请求参数', params);
  }

  endRequest({ fullResponse }) {
    if (fullResponse) this._section('响应内容', fullResponse);
  }

  agentText(text) {
    console.log(`\n${C.cyan}Agent:${C.reset} ${text}\n`);
  }

  toolCall(name, input, result) {
    const inputStr = JSON.stringify(input);
    console.log(`  ${C.dim}[工具] ${name}(${inputStr.substring(0, 120)})${C.reset}`);
    console.log(`  ${C.dim}[结果] ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}${C.reset}`);
    this._section(`工具: ${name}`, { input, result: result.substring(0, 500) });
  }

  error(msg) {
    console.error(`\n${C.yellow}API 错误: ${msg}${C.reset}\n`);
    this._section('错误', msg);
  }

  bye() {
    console.log(`\n${C.dim}再见！${C.reset}\n`);
  }

  _section(title, data) {
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    this._log(`\n────── ${title} ──────\n${content}`);
  }

  _log(text) {
    if (!this.debug || !this.file) return;
    appendFileSync(this.file, `[${new Date().toISOString()}] ${text}\n`);
  }
}
