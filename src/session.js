'use strict';

const fs = require('fs');
const path = require('path');
const { paths, loadConfig, buildEnvVars, getAllowedTools, log } = require('./config');
const { Indicator, inferPhaseStep } = require('./indicator');
const { buildSystemPrompt, buildCodingPrompt, buildScanPrompt, buildViewPrompt, buildAddPrompt } = require('./prompts');

function applyEnvConfig(config) {
  Object.assign(process.env, buildEnvVars(config));
}

async function runCodingSession(sessionNum, opts = {}) {
  const { query } = require('@anthropic-ai/claude-agent-sdk');
  const config = loadConfig();
  applyEnvConfig(config);
  const indicator = new Indicator();

  const prompt = buildCodingPrompt(sessionNum, opts);
  const systemPrompt = buildSystemPrompt(false);

  const p = paths();
  const logFile = path.join(p.logsDir, `session_${sessionNum}_${Date.now()}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  indicator.start(sessionNum);

  try {
    const session = query({
      prompt,
      options: {
        systemPrompt,
        allowedTools: getAllowedTools(config),
        permissionMode: 'bypassPermissions',
        verbose: true,
        cwd: opts.projectRoot || process.cwd(),
        timeout_ms: config.timeoutMs,
        hooks: {
          PreToolUse: [{
            matcher: '*',
            callback: (event) => {
              inferPhaseStep(indicator, event.tool_name, event.tool_input);
              return { decision: 'allow' };
            }
          }]
        }
      }
    });

    let result;
    for await (const message of session) {
      if (message.content) {
        const text = typeof message.content === 'string'
          ? message.content
          : JSON.stringify(message.content);
        process.stdout.write(text);
        logStream.write(text);
      }
      result = message;
    }

    logStream.end();
    indicator.stop();

    return {
      exitCode: 0,
      cost: result?.total_cost_usd || null,
      tokenUsage: result?.message?.usage || null,
      logFile,
    };
  } catch (err) {
    logStream.end();
    indicator.stop();
    log('error', `Claude SDK 错误: ${err.message}`);
    return {
      exitCode: 1,
      cost: null,
      tokenUsage: null,
      logFile,
      error: err.message,
    };
  }
}

async function runScanSession(requirement, opts = {}) {
  const { query } = require('@anthropic-ai/claude-agent-sdk');
  const config = loadConfig();
  applyEnvConfig(config);
  const indicator = new Indicator();

  const projectType = hasCodeFiles(opts.projectRoot || process.cwd()) ? 'existing' : 'new';
  const prompt = buildScanPrompt(projectType, requirement);
  const systemPrompt = buildSystemPrompt(true);

  const p = paths();
  const logFile = path.join(p.logsDir, `scan_${Date.now()}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  indicator.start(0);
  log('info', `正在调用 Claude Code 执行项目扫描（${projectType}项目）...`);

  try {
    const session = query({
      prompt,
      options: {
        systemPrompt,
        allowedTools: getAllowedTools(config),
        permissionMode: 'bypassPermissions',
        verbose: true,
        cwd: opts.projectRoot || process.cwd(),
        timeout_ms: config.timeoutMs,
        hooks: {
          PreToolUse: [{
            matcher: '*',
            callback: (event) => {
              inferPhaseStep(indicator, event.tool_name, event.tool_input);
              return { decision: 'allow' };
            }
          }]
        }
      }
    });

    let result;
    for await (const message of session) {
      if (message.content) {
        const text = typeof message.content === 'string'
          ? message.content
          : JSON.stringify(message.content);
        process.stdout.write(text);
        logStream.write(text);
      }
      result = message;
    }

    logStream.end();
    indicator.stop();

    return {
      exitCode: 0,
      cost: result?.total_cost_usd || null,
      logFile,
    };
  } catch (err) {
    logStream.end();
    indicator.stop();
    log('error', `扫描失败: ${err.message}`);
    return { exitCode: 1, cost: null, logFile, error: err.message };
  }
}

async function runViewSession(requirement, opts = {}) {
  const { query } = require('@anthropic-ai/claude-agent-sdk');
  const p = paths();
  const config = loadConfig();
  applyEnvConfig(config);

  let systemPrompt;
  let prompt;

  if (!fs.existsSync(p.profile) || !fs.existsSync(p.tasksFile)) {
    systemPrompt = buildSystemPrompt(true);
    const projectType = hasCodeFiles(opts.projectRoot || process.cwd()) ? 'existing' : 'new';
    prompt = buildViewPrompt({ needsScan: true, projectType, requirement });
  } else {
    systemPrompt = buildSystemPrompt(false);
    const { loadTasks, getFeatures } = require('./tasks');
    const data = loadTasks();
    const features = getFeatures(data);
    const allDone = features.length > 0 && features.every(f => f.status === 'done');
    prompt = buildViewPrompt({ allDone });
  }

  try {
    const session = query({
      prompt,
      options: {
        systemPrompt,
        allowedTools: getAllowedTools(config),
        permissionMode: 'bypassPermissions',
        verbose: true,
        cwd: opts.projectRoot || process.cwd(),
        timeout_ms: config.timeoutMs,
      }
    });

    for await (const message of session) {
      if (message.content) {
        const text = typeof message.content === 'string'
          ? message.content
          : JSON.stringify(message.content);
        process.stdout.write(text);
      }
    }
  } catch (err) {
    log('error', `观测模式错误: ${err.message}`);
  }
}

async function runAddSession(instruction, opts = {}) {
  const { query } = require('@anthropic-ai/claude-agent-sdk');
  const config = loadConfig();
  applyEnvConfig(config);

  const systemPrompt = buildSystemPrompt(false);
  const prompt = buildAddPrompt(instruction);

  const p = paths();
  const logFile = path.join(p.logsDir, `add_tasks_${Date.now()}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  try {
    const session = query({
      prompt,
      options: {
        systemPrompt,
        allowedTools: getAllowedTools(config),
        permissionMode: 'bypassPermissions',
        verbose: true,
        cwd: opts.projectRoot || process.cwd(),
        timeout_ms: config.timeoutMs,
      }
    });

    for await (const message of session) {
      if (message.content) {
        const text = typeof message.content === 'string'
          ? message.content
          : JSON.stringify(message.content);
        process.stdout.write(text);
        logStream.write(text);
      }
    }

    logStream.end();
    log('ok', '任务追加完成');
  } catch (err) {
    logStream.end();
    log('error', `任务追加失败: ${err.message}`);
  }
}

function hasCodeFiles(projectRoot) {
  const markers = [
    'package.json', 'pyproject.toml', 'requirements.txt', 'setup.py',
    'Cargo.toml', 'go.mod', 'pom.xml', 'build.gradle',
    'Makefile', 'Dockerfile', 'docker-compose.yml',
    'README.md', 'main.py', 'app.py', 'index.js', 'index.ts',
  ];
  for (const m of markers) {
    if (fs.existsSync(path.join(projectRoot, m))) return true;
  }
  for (const d of ['src', 'lib', 'app', 'backend', 'frontend', 'web', 'server', 'client']) {
    if (fs.existsSync(path.join(projectRoot, d)) && fs.statSync(path.join(projectRoot, d)).isDirectory()) return true;
  }
  return false;
}

module.exports = {
  runCodingSession,
  runScanSession,
  runViewSession,
  runAddSession,
  hasCodeFiles,
};
