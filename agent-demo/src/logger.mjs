/**
 * Logger - 统一输出（终端 + 日志文件）
 *
 * 三个核心方法:
 *   print(text)        → 只输出到终端
 *   log(label, data)   → 终端（带颜色） + 日志文件
 *   start(...)         → 启动信息
 */

import { appendFileSync, mkdirSync } from 'fs';

const C = {
  reset:   '\x1b[0m',
  dim:     '\x1b[2m',
  bold:    '\x1b[1m',
  cyan:    '\x1b[36m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  magenta: '\x1b[35m',
  blue:    '\x1b[34m',
};

const LABEL_COLORS = {
  '请求参数':   C.dim,
  '响应内容':   C.dim,
  '错误':       C.red,
};

function labelColor(label) {
  if (LABEL_COLORS[label]) return LABEL_COLORS[label];
  if (label.startsWith('工具开始')) return C.yellow;
  if (label.startsWith('工具完成')) return C.green;
  return C.dim;
}

export { C };

export class Logger {
  constructor(debug = false, { silent = false } = {}) {
    this.debug = debug;
    this.silent = silent;
    this.file = null;
  }

  init() {
    if (!this.debug) return null;
    mkdirSync('logs', { recursive: true });
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    this.file = `logs/${date}_${time}.log`;
    this._write(`${'═'.repeat(50)}\n  Agent 启动 ${now.toLocaleString()}\n${'═'.repeat(50)}`);
    return this.file;
  }

  start({ model, tools, logFile, systemPrompt, toolSchemas }) {
    if (!this.silent) {
      console.log(`\n${C.cyan}${C.bold}═══ AI Coding Agent ═══${C.reset}`);
      console.log(`${C.dim}模型: ${model}${C.reset}`);
      console.log(`${C.dim}工具: ${tools.join(', ')}${C.reset}`);
      if (logFile) console.log(`${C.dim}调试日志: ${logFile}${C.reset}`);
      console.log(`${C.dim}输入任务开始，exit 退出${C.reset}\n`);
    }
    if (systemPrompt) this._section('System Prompt', `[已注入] ${systemPrompt.split('\n')[0]}...`);
    if (toolSchemas) {
      const summary = toolSchemas.map(t => `  - ${t.name}: ${t.description}`).join('\n');
      this._section('可用工具', summary);
    }
  }

  print(text) {
    if (!this.silent) console.log(text);
  }

  log(label, data) {
    if (!this.silent) {
      const color = labelColor(label);
      if (data !== undefined) {
        const preview = typeof data === 'string' ? data : JSON.stringify(data);
        console.log(`${color}[${label}] ${preview.substring(0, 200)}${preview.length > 200 ? '...' : ''}${C.reset}`);
      } else {
        console.log(`${color}${label}${C.reset}`);
      }
    }
    this._section(label, data);
  }

  _section(title, data) {
    if (data === undefined) return this._write(`\n────── ${title} ──────`);
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    this._write(`\n────── ${title} ──────\n${content}`);
  }

  _write(text) {
    if (!this.debug || !this.file) return;
    appendFileSync(this.file, `[${new Date().toLocaleString()}] ${text}\n`);
  }
}
