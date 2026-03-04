'use strict';

const fs = require('fs');
const net = require('net');
const http = require('http');
const { spawn, execSync } = require('child_process');
const { paths, log, getProjectRoot } = require('./config');

function loadProfile() {
  const p = paths();
  if (!fs.existsSync(p.profile)) {
    log('error', '未找到 project_profile.json，请先运行 claude-coder run 完成项目扫描');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p.profile, 'utf8'));
}

function isPortFree(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => { server.close(); resolve(true); });
    server.listen(port, '127.0.0.1');
  });
}

function waitForHealth(url, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise(resolve => {
    const check = () => {
      if (Date.now() - start > timeoutMs) { resolve(false); return; }
      const req = http.get(url, res => {
        resolve(res.statusCode < 500);
      });
      req.on('error', () => setTimeout(check, 1000));
      req.setTimeout(3000, () => { req.destroy(); setTimeout(check, 1000); });
    };
    check();
  });
}

function runCmd(cmd, cwd) {
  try {
    execSync(cmd, { cwd: cwd || getProjectRoot(), stdio: 'inherit', shell: true });
    return true;
  } catch {
    return false;
  }
}

async function init() {
  const profile = loadProfile();
  const projectRoot = getProjectRoot();
  let stepCount = 0;

  // 1. Environment activation
  const envSetup = profile.env_setup || {};
  if (envSetup.python_env && envSetup.python_env !== 'system' && envSetup.python_env !== 'none') {
    stepCount++;
    if (envSetup.python_env.startsWith('conda:')) {
      const envName = envSetup.python_env.slice(6);
      log('info', `[${stepCount}] Python 环境: conda activate ${envName}`);
      runCmd(`conda activate ${envName}`);
    } else if (envSetup.python_env === 'venv') {
      log('info', `[${stepCount}] Python 环境: venv`);
      runCmd('source .venv/bin/activate || .venv\\Scripts\\activate');
    }
  }
  if (envSetup.node_version && envSetup.node_version !== 'none') {
    stepCount++;
    log('info', `[${stepCount}] Node.js: v${envSetup.node_version}`);
    runCmd(`nvm use ${envSetup.node_version}`);
  }

  // 2. Dependencies
  const pkgManagers = (profile.tech_stack && profile.tech_stack.package_managers) || [];
  for (const pm of pkgManagers) {
    stepCount++;
    if (pm === 'npm' || pm === 'yarn' || pm === 'pnpm') {
      if (fs.existsSync(`${projectRoot}/node_modules`)) {
        log('ok', `[${stepCount}] ${pm} 依赖已安装，跳过`);
      } else {
        log('info', `[${stepCount}] 安装依赖: ${pm} install`);
        runCmd(`${pm} install`, projectRoot);
      }
    } else if (pm === 'pip') {
      const reqFile = fs.existsSync(`${projectRoot}/requirements.txt`);
      if (reqFile) {
        log('info', `[${stepCount}] 安装依赖: pip install -r requirements.txt`);
        runCmd('pip install -r requirements.txt', projectRoot);
      }
    }
  }

  // 3. Custom init commands
  const customInit = profile.custom_init || [];
  for (const cmd of customInit) {
    stepCount++;
    log('info', `[${stepCount}] 自定义: ${cmd}`);
    runCmd(cmd, projectRoot);
  }

  // 4. Services
  const services = profile.services || [];
  for (const svc of services) {
    stepCount++;
    const free = await isPortFree(svc.port);
    if (!free) {
      log('ok', `[${stepCount}] ${svc.name} 已在端口 ${svc.port} 运行，跳过`);
      continue;
    }

    log('info', `[${stepCount}] 启动 ${svc.name} (端口 ${svc.port})...`);
    const cwd = svc.cwd ? `${projectRoot}/${svc.cwd}` : projectRoot;
    const child = spawn(svc.command, { cwd, shell: true, detached: true, stdio: 'ignore' });
    child.unref();

    if (svc.health_check) {
      const healthy = await waitForHealth(svc.health_check);
      if (healthy) {
        log('ok', `${svc.name} 就绪: ${svc.health_check}`);
      } else {
        log('warn', `${svc.name} 健康检查超时 (${svc.health_check})，继续执行`);
      }
    }
  }

  // Summary
  if (stepCount === 0) {
    log('info', '无需初始化操作');
  } else {
    log('ok', `初始化完成 (${stepCount} 步)`);
  }

  if (services.length > 0) {
    console.log('');
    for (const svc of services) {
      console.log(`  ${svc.name}: http://localhost:${svc.port}`);
    }
    console.log('');
  }
}

module.exports = { init };
