import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const docs = [
  { id: 'getting-started', title: '入门指南' },
  { id: 'core-concepts', title: '核心概念' },
  { id: 'commands', title: '命令参考' },
  { id: 'troubleshooting', title: '故障排查' },
];

const Docs: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState('getting-started');

  return (
    <div className="min-h-screen">
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <nav className="card sticky top-24">
                <h3 className="text-[var(--text-50)] font-semibold mb-4 px-2">文档目录</h3>
                <ul className="space-y-1">
                  {docs.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`nav-item ${activeDoc === item.id ? 'active' : ''}`}
                        onClick={() => setActiveDoc(item.id)}
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Content */}
            <div className="lg:col-span-3">
              <h1 className="text-4xl font-bold text-[var(--text-50)] mb-8">文档中心</h1>

              <div className="space-y-8">
                {/* Getting Started */}
                <section id="getting-started" className="card">
                  <h2 className="text-2xl font-bold text-[var(--text-50)] mb-4">入门指南</h2>
                  <p className="text-[var(--text-400)] mb-4">了解 Claude Coder 的基本概念和快速开始方法。</p>
                  <ul className="list-disc list-inside text-[var(--text-400)] space-y-2">
                    <li><Link to="/quick-start" className="text-[var(--primary-400)] hover:underline">安装指南</Link></li>
                    <li>配置说明</li>
                    <li>第一个项目</li>
                  </ul>
                </section>

                {/* Core Concepts */}
                <section id="core-concepts" className="card">
                  <h2 className="text-2xl font-bold text-[var(--text-50)] mb-4">核心概念</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-50)]">Hook 注入机制</h3>
                      <p className="text-[var(--text-400)]">在特定工具调用时自动注入上下文提示，扩展 AI 能力。</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-50)]">Session 守护</h3>
                      <p className="text-[var(--text-400)]">监控 Session 状态，处理中断和恢复，保证长时间运行。</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-50)]">任务分解</h3>
                      <p className="text-[var(--text-400)]">将复杂需求拆分为可执行的子任务，按优先级排序。</p>
                    </div>
                  </div>
                </section>

                {/* Commands */}
                <section id="commands" className="card">
                  <h2 className="text-2xl font-bold text-[var(--text-50)] mb-4">命令参考</h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <code className="code-block px-3 py-1 text-sm">setup</code>
                      <span className="text-[var(--text-400)]">交互式配置向导</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <code className="code-block px-3 py-1 text-sm">init</code>
                      <span className="text-[var(--text-400)]">初始化项目配置</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <code className="code-block px-3 py-1 text-sm">plan</code>
                      <span className="text-[var(--text-400)]">生成任务计划</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <code className="code-block px-3 py-1 text-sm">run</code>
                      <span className="text-[var(--text-400)]">执行编码任务</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <code className="code-block px-3 py-1 text-sm">simplify</code>
                      <span className="text-[var(--text-400)]">代码简化审查</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <code className="code-block px-3 py-1 text-sm">auth</code>
                      <span className="text-[var(--text-400)]">认证凭证管理</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <code className="code-block px-3 py-1 text-sm">status</code>
                      <span className="text-[var(--text-400)]">查看系统状态</span>
                    </div>
                  </div>
                </section>

                {/* Troubleshooting */}
                <section id="troubleshooting" className="card">
                  <h2 className="text-2xl font-bold text-[var(--text-50)] mb-4">故障排查</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-50)]">余额不足</h3>
                      <p className="text-[var(--text-400)]">检查 API Key 余额，或切换至其他模型提供商。</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-50)]">中断恢复</h3>
                      <p className="text-[var(--text-400)]">Session 会自动保存状态，重新运行即可从断点继续。</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-50)]">长时间无响应</h3>
                      <p className="text-[var(--text-400)]">检查网络连接，或增加 API 超时设置。</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Docs;
