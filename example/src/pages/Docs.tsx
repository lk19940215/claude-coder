import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import SectionCard from '../components/ui/SectionCard';
import EnhancedCodeBlock from '../components/ui/EnhancedCodeBlock';
import MobileSidebar from '../components/ui/MobileSidebar';
import SidebarNav from '../components/ui/SidebarNav';
import { useMobileSidebar } from '../hooks/useMobileSidebar';
import { scrollToElement } from '../utils';

const docs = [
  { id: 'getting-started', title: '入门指南' },
  { id: 'core-concepts', title: '核心概念' },
  { id: 'commands', title: '命令参考' },
  { id: 'troubleshooting', title: '故障排查' },
];

const Docs: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState('getting-started');
  const { isOpen, toggle, close } = useMobileSidebar();

  const handleNavClick = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setActiveDoc(id);
    scrollToElement(id);
    close();
  }, [close]);

  return (
    <PageLayout>
      <MobileSidebar
        isOpen={isOpen}
        onClose={close}
        onToggle={toggle}
        title="文档目录"
      >
        <SidebarNav items={docs} activeId={activeDoc} onItemClick={handleNavClick} />
      </MobileSidebar>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-heading-1 text-[var(--text-50)] mb-4">文档中心</h1>
        <p className="text-body text-[var(--text-400)]">快速了解 Claude Coder 的完整使用指南</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24">
            <div className="card p-4">
              <h3 className="text-caption text-[var(--text-400)] uppercase tracking-wider mb-4">文档导航</h3>
              <SidebarNav items={docs} activeId={activeDoc} onItemClick={handleNavClick} />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Getting Started */}
          <SectionCard id="getting-started" variant="default" className="card-hover-enhanced">
            <h2 className="text-heading-2 text-[var(--text-50)] mb-4">入门指南</h2>
            <p className="text-body mb-6 leading-relaxed">
              三步即可启动你的第一个自主编码 Agent：安装 → 配置 → 运行。
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                <span className="text-[var(--gradient-start)]">→</span>
                <Link to="/quick-start" className="text-[var(--primary-400)] hover:underline">安装指南</Link>
              </li>
              <li className="flex items-center gap-3 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                <span className="text-[var(--gradient-start)]">→</span>
                <span className="text-body">模型配置：</span>
                <EnhancedCodeBlock language="bash" showLineNumbers={false} className="inline-flex">
                  claude-coder setup
                </EnhancedCodeBlock>
              </li>
              <li className="flex items-center gap-3 animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
                <span className="text-[var(--gradient-start)]">→</span>
                <span className="text-body">第一个项目：</span>
                <EnhancedCodeBlock language="bash" showLineNumbers={false} className="inline-flex">
                  claude-coder run "你的需求"
                </EnhancedCodeBlock>
              </li>
            </ul>
          </SectionCard>

          {/* Core Concepts */}
          <SectionCard id="core-concepts" variant="default" className="card-hover-enhanced">
            <h2 className="text-heading-2 text-[var(--text-50)] mb-6">核心概念</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-heading-3 text-[var(--text-50)] mb-2">Hook 注入机制</h3>
                <p className="text-body leading-relaxed">
                  在 SDK 工具调用（如 edit_file、run_command）时自动注入上下文提示，
                  三级匹配粒度灵活控制 AI 行为，无需修改源码。
                </p>
              </div>
              <div>
                <h3 className="text-heading-3 text-[var(--text-50)] mb-2">Session 守护</h3>
                <p className="text-body leading-relaxed">
                  Harness 持续监控 Agent Session 状态，自动处理超时、中断、无响应。
                  失败时 git 回滚 + 重试，确保长时间无人值守编码的稳定性。
                </p>
              </div>
              <div>
                <h3 className="text-heading-3 text-[var(--text-50)] mb-2">任务分解与编排</h3>
                <p className="text-body leading-relaxed">
                  将复杂需求拆分为独立子任务，按依赖关系排序。每个 Session 执行 6 步流程：
                  恢复上下文 → 环境检查 → 选任务 → 编码 → 测试 → 收尾。
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Commands */}
          <SectionCard id="commands" variant="default" className="card-hover-enhanced">
            <h2 className="text-heading-2 text-[var(--text-50)] mb-6">命令参考</h2>
            <div className="space-y-4">
              {[
                { cmd: 'setup', desc: '交互式配置（模型、MCP、安全限制、自动审查）' },
                { cmd: 'init', desc: '初始化项目（扫描技术栈、生成 profile、部署食谱）' },
                { cmd: 'go', desc: 'AI 对话式需求收集与方案组装' },
                { cmd: 'go "需求"', desc: 'AI 自动分析需求并组装方案' },
                { cmd: 'plan "需求"', desc: '生成任务计划方案' },
                { cmd: 'run "需求"', desc: '启动自动编码循环' },
                { cmd: 'simplify', desc: '代码审查和简化' },
                { cmd: 'auth [url]', desc: '配置浏览器测试工具 / 导出登录状态' },
                { cmd: 'status', desc: '查看进度和成本统计' },
              ].map(({ cmd, desc }, index) => (
                <div
                  key={cmd}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 animate-slide-in-left"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <code className="code-block px-3 py-1.5 text-sm text-white shrink-0">{cmd}</code>
                  <span className="text-body">{desc}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Troubleshooting */}
          <SectionCard id="troubleshooting" variant="default" className="card-hover-enhanced">
            <h2 className="text-heading-2 text-[var(--text-50)] mb-6">故障排查</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-heading-3 text-[var(--text-50)] mb-2">余额不足 (Credit balance too low)</h3>
                <p className="text-body leading-relaxed">
                  运行{' '}
                  <code className="text-sm text-[var(--primary-300)] bg-[var(--bg-200)] px-2 py-0.5 rounded">
                    claude-coder setup
                  </code>{' '}
                  重新配置 API Key，或切换至其他模型。
                </p>
              </div>
              <div>
                <h3 className="text-heading-3 text-[var(--text-50)] mb-2">中断恢复</h3>
                <p className="text-body leading-relaxed">
                  Session 自动保存进度，直接重新运行{' '}
                  <code className="text-sm text-[var(--primary-300)] bg-[var(--bg-200)] px-2 py-0.5 rounded">
                    claude-coder run
                  </code>{' '}
                  即可从断点继续。
                </p>
              </div>
              <div>
                <h3 className="text-heading-3 text-[var(--text-50)] mb-2">长时间无响应</h3>
                <p className="text-body leading-relaxed">
                  模型处理复杂任务时可能出现长思考间隔，这是正常行为。
                  超过阈值后 Harness 自动中断并重试。可通过{' '}
                  <code className="text-sm text-[var(--primary-300)] bg-[var(--bg-200)] px-2 py-0.5 rounded">
                    SESSION_STALL_TIMEOUT
                  </code>{' '}
                  调整。
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </PageLayout>
  );
};

export default Docs;
