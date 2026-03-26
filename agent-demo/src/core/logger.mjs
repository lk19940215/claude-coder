/**
 * Logger - 调试日志（写入文件）
 *
 * 核心方法:
 *   init()               → 创建日志文件，返回文件路径
 *   start(...)            → 写入启动信息（prompt + 工具列表）
 *   round(userInput)      → 写入轮次分隔符（#1, #2...）
 *   log(label, data)      → 写入一条日志（自动格式化）
 *
 * 日志格式:
 *   轮次标题（#N）在第 0 列，轮次内内容缩进 2 格
 *   在 VS Code 中可按缩进折叠整轮对话
 */

import { appendFileSync, mkdirSync } from 'fs';

function ts() {
  return new Date().toTimeString().split(' ')[0];
}

function formatResponse(response, indent) {
  const { model, stop_reason, usage, content } = response;
  const parts = [];
  const p = indent;

  const inputT = usage?.input_tokens || 0;
  const outputT = usage?.output_tokens || 0;
  parts.push(`${p}模型: ${model} | stop: ${stop_reason} | tokens: ${inputT} → ${outputT}`);

  if (Array.isArray(content)) {
    for (const block of content) {
      if (block.type === 'thinking') {
        parts.push(`${p}[thinking]`);
        const text = block.thinking || '';
        parts.push(text.split('\n').map(l => `${p}  ${l}`).join('\n'));
      } else if (block.type === 'text') {
        parts.push(`${p}[text]`);
        const text = block.text || '';
        parts.push(text.split('\n').map(l => `${p}  ${l}`).join('\n'));
      } else if (block.type === 'tool_use') {
        parts.push(`${p}[tool_use: ${block.name}]`);
        const json = JSON.stringify(block.input, null, 2);
        parts.push(json.split('\n').map(l => `${p}  ${l}`).join('\n'));
      }
    }
  }

  return parts.join('\n');
}

export class Logger {
  constructor(debug = false, { silent = false } = {}) {
    this.debug = debug;
    this.silent = silent;
    this.file = null;
    this._roundNum = 0;
    this._inRound = false;
  }

  init(prefix = '') {
    if (!this.debug) return null;
    mkdirSync('logs', { recursive: true });
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const tag = prefix ? `${prefix}-` : '';
    this.file = `logs/${tag}${date}_${time}.log`;
    this._raw(`${'═'.repeat(60)}\n  ${prefix || 'Agent'} 启动 ${now.toLocaleString()}\n${'═'.repeat(60)}\n`);
    return this.file;
  }

  start({ systemPrompt, toolSchemas }) {
    if (systemPrompt) {
      this._section('System Prompt', `[已注入] ${systemPrompt.split('\n')[0]}...`);
    }
    if (toolSchemas) {
      const summary = toolSchemas.map(t => `  - ${t.name}: ${t.description}`).join('\n');
      this._section('可用工具', summary);
    }
  }

  round(userInput) {
    this._roundNum++;
    const preview = userInput.length > 60 ? userInput.substring(0, 60) + '...' : userInput;
    this._raw(`\n${'━'.repeat(60)}\n#${this._roundNum} | ${preview}\n${'━'.repeat(60)}`);
    this._inRound = true;
  }

  get _indent() {
    return this._inRound ? '  ' : '';
  }

  log(label, data) {
    const p = this._indent;

    if (label === '响应内容' && data && typeof data === 'object') {
      this._section('响应', formatResponse(data, p + '  '));
      return;
    }

    if (label.startsWith('工具完成') && typeof data === 'string') {
      const indented = data.split('\n').map(l => `${p}    ${l}`).join('\n');
      this._section(label, `${indented}\n${p}    ── ${data.length} 字符 ──`);
      return;
    }

    if (label.startsWith('工具开始') && data && typeof data === 'object') {
      this._section(label, `${p}  ${JSON.stringify(data)}`);
      return;
    }

    if (data === undefined) {
      this._section(label);
    } else if (typeof data === 'string') {
      const indented = data.split('\n').map(l => `${p}  ${l}`).join('\n');
      this._section(label, indented);
    } else {
      const json = JSON.stringify(data, null, 2);
      const indented = json.split('\n').map(l => `${p}  ${l}`).join('\n');
      this._section(label, indented);
    }
  }

  _section(title, data) {
    const p = this._indent;
    const header = `${p}[${ts()}] ────── ${title} ──────`;
    if (data === undefined) {
      this._raw(header);
    } else {
      this._raw(`${header}\n${data}`);
    }
  }

  _raw(text) {
    if (!this.debug || !this.file) return;
    appendFileSync(this.file, text + '\n');
  }
}
