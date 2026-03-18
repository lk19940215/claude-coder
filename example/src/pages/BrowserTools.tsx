import React, { useState, useCallback } from 'react';
import PageLayout from '../components/layout/PageLayout';
import SectionCard from '../components/ui/SectionCard';
import EnhancedCodeBlock from '../components/ui/EnhancedCodeBlock';
import FishStepCard from '../components/ui/FishStepCard';
import MobileSidebar from '../components/ui/MobileSidebar';
import SidebarNav from '../components/ui/SidebarNav';
import { useMobileSidebar } from '../hooks/useMobileSidebar';
import { scrollToElement } from '../utils';

const sections = [
  { id: 'overview', title: '工具对比' },
  { id: 'playwright-setup', title: 'Playwright MCP' },
  { id: 'devtools-setup', title: 'Chrome DevTools MCP' },
  { id: 'config', title: '配置参考' },
  { id: 'faq', title: '常见问题' },
];

const BrowserTools: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const { isOpen, toggle, close } = useMobileSidebar();

  const handleNavClick = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setActiveSection(id);
    scrollToElement(id);
    close();
  }, [close]);

  return (
    <PageLayout>
      <MobileSidebar
        isOpen={isOpen}
        onClose={close}
        onToggle={toggle}
        title="导航"
      >
        <SidebarNav items={sections} activeId={activeSection} onItemClick={handleNavClick} />
      </MobileSidebar>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-heading-1 text-[var(--text-50)] mb-4">浏览器测试工具</h1>
        <p className="text-body text-[var(--text-400)]">
          Playwright MCP 与 Chrome DevTools MCP 的对比、安装与配置
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24">
            <div className="card p-4">
              <h3 className="text-caption text-[var(--text-400)] uppercase tracking-wider mb-4">目录导航</h3>
              <SidebarNav items={sections} activeId={activeSection} onItemClick={handleNavClick} />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">

          {/* Overview Comparison */}
          <SectionCard id="overview" variant="default" className="card-hover-enhanced">
            <h2 className="text-heading-2 text-[var(--text-50)] mb-6">工具对比</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-300)]">
                    <th className="text-left py-3 px-4 text-[var(--text-400)] font-medium">维度</th>
                    <th className="text-left py-3 px-4 text-[var(--primary-400)] font-medium">Playwright MCP</th>
                    <th className="text-left py-3 px-4 text-[var(--lazy-cyan)] font-medium">Chrome DevTools MCP</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--text-200)]">
                  {[
                    ['维护方', '微软 (Microsoft)', 'Google'],
                    ['核心优势', '25+ 自动化工具，多实例并行', '连接已打开 Chrome，调试能力强'],
                    ['多实例', '✓ 支持', '✗ 单实例限制'],
                    ['安装依赖', 'npx playwright install chromium', 'Node.js v20.19+ / Chrome 144+'],
                    ['凭证方案', 'persistent 模式复用浏览器 profile', '直接复用已打开 Chrome 的登录态'],
                    ['性能分析', '基础（截图 + DOM 快照）', '✓ Trace / Lighthouse / Core Web Vitals'],
                    ['网络调试', '—', '✓ 请求检查 / 内存快照'],
                    ['适合场景', 'CI/CD、并行测试、隔离环境', '本地开发、调试、复用已有环境'],
                  ].map(([label, playwright, devtools], i) => (
                    <tr key={i} className="border-b border-[var(--border-300)]/50 hover:bg-[var(--bg-100)]/50 transition-colors">
                      <td className="py-3 px-4 text-[var(--text-400)] font-medium">{label}</td>
                      <td className="py-3 px-4">{playwright}</td>
                      <td className="py-3 px-4">{devtools}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-caption text-[var(--text-400)] mt-4">
              两种工具互斥配置，通过 <code className="text-[var(--lazy-cyan)]">claude-coder setup</code> 随时切换，切换后无需重新认证。
            </p>
          </SectionCard>

          {/* Playwright MCP Setup */}
          <SectionCard id="playwright-setup" variant="primary" className="card-hover-enhanced">
            <h2 className="text-heading-2 text-[var(--text-50)] mb-2">Playwright MCP</h2>
            <p className="text-body text-[var(--text-400)] mb-6">微软维护，25+ 浏览器自动化工具，支持多实例并行</p>

            <div className="space-y-6">
              <FishStepCard stepNumber={1} title="选择工具" staggerIndex={1}>
                <EnhancedCodeBlock language="bash" title="Step 1">{`claude-coder setup
# → 选择「Playwright MCP」
# → 选择模式：persistent（推荐）/ isolated / extension`}</EnhancedCodeBlock>
              </FishStepCard>

              <FishStepCard stepNumber={2} title="安装浏览器" staggerIndex={2}>
                <EnhancedCodeBlock language="bash" title="Step 2">{`npx playwright install chromium
# 自动下载 Chromium 到系统缓存（约 150MB）`}</EnhancedCodeBlock>
              </FishStepCard>

              <FishStepCard stepNumber={3} title="导出登录态" staggerIndex={3}>
                <EnhancedCodeBlock language="bash" title="Step 3">{`claude-coder auth http://localhost:3000
# 弹出浏览器 → 完成登录 → 关闭浏览器
# 登录态自动保存到 .claude-coder/.runtime/browser-profile/`}</EnhancedCodeBlock>
              </FishStepCard>

              <FishStepCard stepNumber={4} title="开始使用" staggerIndex={4} variant="success">
                <EnhancedCodeBlock language="bash" title="Step 4">{`claude-coder run "测试登录页面功能"
# Agent 自动通过 Playwright MCP 操作浏览器`}</EnhancedCodeBlock>
              </FishStepCard>
            </div>

            {/* Three Modes */}
            <div className="mt-8">
              <h3 className="text-heading-3 text-[var(--text-50)] mb-4">三种模式</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    mode: 'persistent',
                    label: '推荐',
                    desc: '复用浏览器 profile，保留登录态、Cookie、LocalStorage',
                    fit: 'Google SSO、企业内网、日常开发',
                  },
                  {
                    mode: 'isolated',
                    label: '隔离',
                    desc: '每次创建干净环境，通过 storage-state 注入凭证',
                    fit: '验证登录流程、干净测试环境',
                  },
                  {
                    mode: 'extension',
                    label: '扩展',
                    desc: '连接已安装 MCP Bridge 扩展的真实浏览器',
                    fit: '需要浏览器插件或绕过自动化检测',
                  },
                ].map(({ mode, label, desc, fit }) => (
                  <div key={mode} className="rounded-lg p-4 bg-[var(--bg-100)] border border-[var(--border-300)]">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm text-[var(--lazy-cyan)]">{mode}</code>
                      <span className="text-xs px-1.5 py-0.5 bg-[var(--primary-600)]/20 text-[var(--primary-400)] rounded">{label}</span>
                    </div>
                    <p className="text-sm text-[var(--text-200)] mb-2">{desc}</p>
                    <p className="text-xs text-[var(--text-400)]">适合：{fit}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Chrome DevTools MCP Setup */}
          <SectionCard id="devtools-setup" variant="primary" className="card-hover-enhanced">
            <h2 className="text-heading-2 text-[var(--text-50)] mb-2">Chrome DevTools MCP</h2>
            <p className="text-body text-[var(--text-400)] mb-6">Google 维护，连接已打开的 Chrome，调试 + 性能分析能力更强</p>

            <div className="space-y-6">
              <FishStepCard stepNumber={1} title="环境要求" staggerIndex={1}>
                <ul className="space-y-2 text-[var(--text-200)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--lazy-cyan)] mt-0.5">●</span>
                    <span><strong className="text-[var(--text-50)]">Node.js v20.19+</strong> — nvm 用户: <code className="text-xs bg-[var(--bg-100)] px-1.5 py-0.5 rounded text-[var(--lazy-cyan)]">nvm alias default 22 && nvm use 22</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--lazy-cyan)] mt-0.5">●</span>
                    <span><strong className="text-[var(--text-50)]">Chrome 144+</strong> — 检查版本: <code className="text-xs bg-[var(--bg-100)] px-1.5 py-0.5 rounded text-[var(--lazy-cyan)]">chrome://version</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--lazy-cyan)] mt-0.5">●</span>
                    <span><strong className="text-[var(--text-50)]">启用远程调试</strong> — 打开 <code className="text-xs bg-[var(--bg-100)] px-1.5 py-0.5 rounded text-[var(--lazy-cyan)]">chrome://inspect/#remote-debugging</code></span>
                  </li>
                </ul>
              </FishStepCard>

              <FishStepCard stepNumber={2} title="选择工具" staggerIndex={2}>
                <EnhancedCodeBlock language="bash" title="Step 2">{`claude-coder setup
# → 选择「Chrome DevTools MCP」
# 如 Node.js 版本不足，会提示升级方法`}</EnhancedCodeBlock>
              </FishStepCard>

              <FishStepCard stepNumber={3} title="配置 MCP" staggerIndex={3}>
                <EnhancedCodeBlock language="bash" title="Step 3">{`claude-coder auth
# 自动生成 .mcp.json（autoConnect 模式）
# npx 会自动下载 chrome-devtools-mcp 包`}</EnhancedCodeBlock>
              </FishStepCard>

              <FishStepCard stepNumber={4} title="开始使用" staggerIndex={4} variant="success">
                <EnhancedCodeBlock language="bash" title="Step 4">{`# 确保 Chrome 已打开并启用远程调试
claude-coder run "分析页面性能并优化"
# Agent 通过 Chrome DevTools MCP 连接已打开的 Chrome`}</EnhancedCodeBlock>
              </FishStepCard>
            </div>

            {/* Capabilities */}
            <div className="mt-8">
              <h3 className="text-heading-3 text-[var(--text-50)] mb-4">独有能力</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: '🔍', title: '性能分析', desc: 'Trace 录制、Core Web Vitals、Lighthouse 审计' },
                  { icon: '🌐', title: '网络调试', desc: '请求检查、响应分析、Network 面板功能' },
                  { icon: '💾', title: '内存分析', desc: '堆快照、内存泄漏检测' },
                  { icon: '📋', title: 'Console 消息', desc: '实时捕获 Console 日志和错误' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 rounded-lg p-3 bg-[var(--bg-100)] border border-[var(--border-300)]">
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <div>
                      <h4 className="text-sm font-medium text-[var(--text-50)]">{title}</h4>
                      <p className="text-xs text-[var(--text-400)]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Config Reference */}
          <SectionCard id="config" variant="default" className="card-hover-enhanced">
            <h2 className="text-heading-2 text-[var(--text-50)] mb-6">配置参考</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-heading-3 text-[var(--text-50)] mb-3">.env 环境变量</h3>
                <EnhancedCodeBlock language="bash" title=".claude-coder/.env">{`# 浏览器测试工具: playwright | chrome-devtools | 空（不启用）
WEB_TEST_TOOL=playwright

# Playwright 模式: persistent | isolated | extension（仅 playwright 有效）
WEB_TEST_MODE=persistent`}</EnhancedCodeBlock>
              </div>

              <div>
                <h3 className="text-heading-3 text-[var(--text-50)] mb-3">.mcp.json — Playwright MCP</h3>
                <EnhancedCodeBlock language="json" title=".mcp.json (Playwright)">{`{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--user-data-dir=.claude-coder/.runtime/browser-profile"
      ]
    }
  }
}`}</EnhancedCodeBlock>
              </div>

              <div>
                <h3 className="text-heading-3 text-[var(--text-50)] mb-3">.mcp.json — Chrome DevTools MCP</h3>
                <EnhancedCodeBlock language="json" title=".mcp.json (Chrome DevTools)">{`{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--autoConnect"]
    }
  }
}`}</EnhancedCodeBlock>
              </div>
            </div>
          </SectionCard>

          {/* FAQ */}
          <SectionCard id="faq" variant="default" className="card-hover-enhanced">
            <h2 className="text-heading-2 text-[var(--text-50)] mb-6">常见问题</h2>
            <div className="space-y-6">
              {[
                {
                  q: 'Playwright 和 Chrome DevTools 该选哪个？',
                  a: '如果你需要多实例并行测试或 CI/CD 集成，选 Playwright MCP。如果你只需要本地调试、想复用已打开 Chrome 的登录态和扩展，选 Chrome DevTools MCP。',
                },
                {
                  q: 'Chrome DevTools MCP 报安装失败？',
                  a: '确保 Node.js ≥ v20.19。nvm 用户执行 nvm alias default 22 && nvm use 22，然后重新安装 npm install -g @anthropic-ai/claude-code。',
                },
                {
                  q: 'Playwright 浏览器启动后白屏或超时？',
                  a: '运行 npx playwright install chromium 确保浏览器已安装。persistent 模式下检查 .claude-coder/.runtime/browser-profile/ 目录是否存在。',
                },
                {
                  q: '切换工具后需要重新认证吗？',
                  a: '不需要。claude-coder setup 切换时自动更新 .env 和 .mcp.json。之前的认证数据（如 browser-profile）保留，切回时直接可用。',
                },
                {
                  q: '两个工具可以同时启用吗？',
                  a: '不可以。.mcp.json 中同时只保留一个工具的配置，切换时自动替换。如需多开测试实例，请使用 Playwright MCP。',
                },
                {
                  q: 'Chrome DevTools MCP 的 autoConnect 是什么？',
                  a: '自动连接本地已打开的 Chrome 浏览器，无需手动指定端口。前提是 Chrome 已启用远程调试（chrome://inspect/#remote-debugging）。',
                },
                {
                  q: 'nvm 切换 Node 版本后 claude 命令找不到了？',
                  a: '这是因为 claude-code 安装在旧 Node 版本下。执行 nvm alias default 22 && nvm use 22 && npm install -g @anthropic-ai/claude-code 即可。',
                },
              ].map(({ q, a }, i) => (
                <div key={i} className="border-b border-[var(--border-300)]/50 pb-4 last:border-0">
                  <h3 className="text-sm font-medium text-[var(--primary-400)] mb-2">Q: {q}</h3>
                  <p className="text-sm text-[var(--text-200)] leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </SectionCard>

        </div>
      </div>
    </PageLayout>
  );
};

export default BrowserTools;
