/**
 * task 工具 — SubAgent 入口
 *
 * 父 Agent 通过 task 委派子任务给 SubAgent。
 * SubAgent: 独立上下文 + 受限只读工具 + batch 模式
 *
 * 通过 taskEvents 向父 Agent 发送进度事件：
 *   'start'   — SubAgent 开始
 *   'tool'    — SubAgent 调用工具
 *   'done'    — SubAgent 完成
 */

import { EventEmitter } from "events";
import { define, registry } from "./registry.mjs";
import { AgentCore } from "../core/agent-core.mjs";
import { Logger } from "../core/logger.mjs";
import {
  API_KEY,
  BASE_URL,
  DEFAULT_MODEL,
  MAX_TOKENS,
  DEBUG,
} from "../config.mjs";

export const taskEvents = new EventEmitter();

const SUB_TOOLS = ["read", "grep", "glob", "ls", "symbols"];

const getSystemPrompt = (description) => {
  return `你是一个专注的子任务代理。\n\n任务: ${description}\n\n你只有只读工具（read/grep/glob/ls/symbols），不能修改文件。\n分析后直接给出结论。`;
};

define(
  "task",
  "委派子任务给 SubAgent（独立上下文，只读工具集 read/grep/glob/ls/symbols）。适合调研、搜索、分析等不需要修改文件的任务。",
  {
    description: {
      type: "string",
      description: "子任务描述",
    },
    prompt: {
      type: "string",
      description: "给 SubAgent 的具体指令",
    },
  },
  ["description", "prompt"],
  async ({ description, prompt }) => {
    const tools = SUB_TOOLS.filter((n) => registry[n]).map(
      (n) => registry[n].schema,
    );

    const executor = async (name, input) => {
      const tool = registry[name];
      if (!tool || !SUB_TOOLS.includes(name))
        return `SubAgent 不允许使用工具: ${name}`;
      return await tool.execute(input);
    };

    const logger = DEBUG ? new Logger(true, { silent: true }) : null;
    logger?.init("sub-agent");

    const systemPrompt = getSystemPrompt(description);

    const subAgent = new AgentCore({
      apiKey: API_KEY,
      baseURL: BASE_URL,
      model: DEFAULT_MODEL,
      maxTokens: MAX_TOKENS,
      systemPrompt,
      tools,
      executor,
      logger,
    });

    logger?.start({
      systemPrompt,
      toolSchemas: subAgent.toolSchemas,
    });

    logger?.round(prompt);
    taskEvents.emit("start", { description });

    let stepCount = 0;
    const callbacks = {
      onToolStart(name, input) {
        stepCount++;
        taskEvents.emit("tool", { step: stepCount, name, input });
      },
    };

    const trace = await subAgent.run(prompt, [], callbacks, { maxTurns: 8 });
    taskEvents.emit("done", { toolCalls: trace.toolCalls.length, description });

    if (trace.stopReason === "error")
      return `SubAgent 执行失败: ${trace.error}`;

    const toolNames = [...new Set(trace.toolCalls.map((t) => t.name))].join(
      ", ",
    );
    const summary =
      trace.toolCalls.length > 0
        ? `\n[SubAgent 调用 ${trace.toolCalls.length} 次工具: ${toolNames}]`
        : "";

    return (trace.finalText || "无结果") + summary;
  },
);
