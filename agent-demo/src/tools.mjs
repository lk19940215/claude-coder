/**
 * 工具定义与执行器
 *
 * 每个工具由两部分组成:
 *   1. schema — JSON Schema 描述（告诉 LLM 这个工具是什么、怎么调用）
 *   2. execute — 实际执行函数（接收 LLM 给的参数，返回字符串结果）
 *
 * 工具集:
 *   read_file     — 读取文件
 *   write_file    — 创建/覆盖文件
 *   edit_file     — Search & Replace 编辑文件（修改用这个，不要用 write_file 覆盖）
 *   grep_search   — 正则搜索代码（@vscode/ripgrep）
 *   list_files    — 列出目录文件（@vscode/ripgrep --files）
 *   execute_bash  — 执行 bash 命令（平台相关）
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { execSync } from 'child_process';
import { dirname } from 'path';
import { rgPath } from '@vscode/ripgrep';

// ─── 工具注册表 ──────────────────────────────────────────
// 所有工具在这里注册。LLM 只看到 schema，运行时根据 name 找到 execute 函数。
export const registry = {};

function define(name, description, properties, required, executeFn) {
  registry[name] = {
    schema: {
      name,
      description,
      input_schema: { type: 'object', properties, required }
    },
    execute: executeFn
  };
}

// ─── read_file ───────────────────────────────────────────
define(
  'read_file',
  '读取指定路径的文件内容。用于了解代码结构和内容。',
  { path: { type: 'string', description: '文件路径' } },
  ['path'],
  async ({ path }) => {
    try {
      return await readFile(path, 'utf-8');
    } catch (e) {
      return `错误: ${e.message}`;
    }
  }
);

// ─── write_file ──────────────────────────────────────────
define(
  'write_file',
  '将内容写入文件（创建新文件或完全覆盖）。自动创建父目录。仅用于创建新文件，修改已有文件请用 edit_file。',
  {
    path: { type: 'string', description: '文件路径' },
    content: { type: 'string', description: '要写入的完整文件内容' }
  },
  ['path', 'content'],
  async ({ path, content }) => {
    try {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content, 'utf-8');
      return `文件已写入: ${path} (${content.length} 字符)`;
    } catch (e) {
      return `写入失败: ${e.message}`;
    }
  }
);

// ─── edit_file ───────────────────────────────────────────
// 原理：readFile → 字符串查找 old_string → 唯一性检查 → replace → writeFile
define(
  'edit_file',
  '通过 Search & Replace 修改文件。old_string 必须与文件内容完全匹配（从 read_file 结果中复制）。修改已有文件必须用此工具，不要用 write_file 覆盖。',
  {
    path: { type: 'string', description: '文件路径' },
    old_string: { type: 'string', description: '要替换的原始文本（必须完全匹配文件中的内容）' },
    new_string: { type: 'string', description: '替换后的新文本' },
  },
  ['path', 'old_string', 'new_string'],
  async ({ path, old_string, new_string }) => {
    try {
      const content = await readFile(path, 'utf-8');

      // 唯一性检查：split 后的数组长度 - 1 = 匹配次数
      const count = content.split(old_string).length - 1;

      if (count === 0) {
        return `错误: 未在 ${path} 中找到匹配内容。请确认 old_string 与文件内容完全一致（包括空格和换行）。`;
      }
      if (count > 1) {
        return `错误: 在 ${path} 中找到 ${count} 处匹配。old_string 不够唯一，请提供更多上下文行。`;
      }

      const newContent = content.replace(old_string, new_string);
      await writeFile(path, newContent, 'utf-8');
      return `已编辑: ${path}`;
    } catch (e) {
      return `编辑失败: ${e.message}`;
    }
  }
);

// ─── grep_search ────────────────────────────────────────
// 使用 ripgrep（通过 @vscode/ripgrep npm 包提供二进制）
// 自动遵守 .gitignore，跳过二进制文件，速度极快

define(
  'grep_search',
  '在文件中搜索正则模式。返回匹配的文件路径、行号、行内容。用于查找代码引用、函数定义、import 语句等。',
  {
    pattern: { type: 'string', description: '正则表达式（如 "function\\s+\\w+"、"import.*from"）' },
    path: { type: 'string', description: '搜索目录或文件路径，默认当前目录' },
    include: { type: 'string', description: '文件过滤（如 "*.js"、"*.{ts,tsx}"）' },
  },
  ['pattern'],
  async ({ pattern, path = '.', include }) => {
    try {
      let cmd = `"${rgPath}" --line-number --no-heading --max-count 200 "${pattern}" "${path}"`;
      if (include) cmd += ` --glob "${include}"`;
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 10_000, maxBuffer: 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
      return output || `未找到匹配: ${pattern}`;
    } catch (e) {
      if (e.status === 1) return `未找到匹配: ${pattern}`;
      return e.stdout || e.stderr?.toString() || `搜索失败: ${e.message}`;
    }
  }
);

// ─── list_files ─────────────────────────────────────────
// 使用 ripgrep --files 列出文件，自动遵守 .gitignore
define(
  'list_files',
  '列出目录下的文件。自动跳过 .gitignore 中的目录（node_modules、.git 等）。',
  {
    path: { type: 'string', description: '目录路径，默认当前目录' },
    max_depth: { type: 'number', description: '最大递归深度，默认 3' },
  },
  [],
  async ({ path = '.', max_depth = 3 }) => {
    try {
      const cmd = `"${rgPath}" --files --max-depth ${max_depth} "${path}"`;
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 10_000, maxBuffer: 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
      return output || `空目录: ${path}`;
    } catch (e) {
      if (e.status === 1) return `空目录: ${path}`;
      return e.stdout || e.stderr?.toString() || `列出失败: ${e.message}`;
    }
  }
);

// ─── execute_bash ────────────────────────────────────────
define(
  'execute_bash',
  '执行 bash 命令并返回输出。用于运行测试、安装依赖、git 操作等。注意：搜索代码用 grep_search，列文件用 list_files。',
  { command: { type: 'string', description: '要执行的 bash 命令' } },
  ['command'],
  async ({ command }) => {
    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        timeout: 30_000,
        maxBuffer: 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return output || '(命令执行成功，无输出)';
    } catch (e) {
      return [
        `退出码: ${e.status ?? 'unknown'}`,
        e.stdout ? `stdout:\n${e.stdout}` : '',
        e.stderr ? `stderr:\n${e.stderr}` : ''
      ].filter(Boolean).join('\n');
    }
  }
);

// ─── 导出 ────────────────────────────────────────────────

export const toolSchemas = Object.values(registry).map(t => t.schema);

export async function executeTool(name, input) {
  const tool = registry[name];
  if (!tool) return `未知工具: ${name}`;
  try {
    return await tool.execute(input);
  } catch (e) {
    return `工具异常: ${name} — ${e.message}`;
  }
}
