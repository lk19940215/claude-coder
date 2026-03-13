import React, { useState } from 'react';

const sections = [
  { id: 'hook', title: 'Hook 提示注入' },
  { id: 'session', title: 'Session 守护' },
  { id: 'model', title: '多模型路由' },
  { id: 'test', title: '测试凭证' },
];

const Features: React.FC = () => {
  const [activeSection, setActiveSection] = useState('hook');

  return (
    <div className="min-h-screen">
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--text-50)] mb-8">功能特性</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <nav className="card sticky top-24">
                <ul className="space-y-2">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                        onClick={() => setActiveSection(section.id)}
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Hook Injection */}
              <section id="hook" className="card">
                <h2 className="text-2xl font-bold text-[var(--text-50)] mb-4">Hook 提示注入机制</h2>
                <p className="text-[var(--text-400)] mb-4">
                  通过 JSON 配置在工具调用时向模型注入上下文引导，实现零代码扩展规则。
                </p>
                <div className="code-block mb-4">
                  <pre className="text-[var(--text-200)]">{`{
  "hooks": [
    {
      "trigger": "tool_call",
      "tool": "edit_file",
      "inject": "请确保代码符合项目编码规范"
    }
  ]
}`}</pre>
                </div>
              </section>

              {/* Session Guardian */}
              <section id="session" className="card">
                <h2 className="text-2xl font-bold text-[var(--text-50)] mb-4">Session 守护机制</h2>
                <p className="text-[var(--text-400)] mb-4">
                  中断策略、倒计时活跃度检测、工具运行状态追踪、防刷屏机制，确保长时间稳定运行。
                </p>
                <ul className="list-disc list-inside text-[var(--text-400)] space-y-2">
                  <li>自动检测 Session 超时和中断</li>
                  <li>倒计时活跃度检测</li>
                  <li>工具运行状态实时追踪</li>
                  <li>智能防刷屏机制</li>
                </ul>
              </section>

              {/* Multi-Model Routing */}
              <section id="model" className="card">
                <h2 className="text-2xl font-bold text-[var(--text-50)] mb-4">多模型路由</h2>
                <p className="text-[var(--text-400)] mb-4">
                  支持 Claude 官方、Coding Plan、DeepSeek 等任意 API，灵活配置模型路由。
                </p>
                <div className="code-block mb-4">
                  <pre className="text-[var(--text-200)]">{`# 环境变量配置
ANTHROPIC_DEFAULT_OPUS_MODEL=glm-5
ANTHROPIC_DEFAULT_SONNET_MODEL=qwen3-coder-next
ANTHROPIC_DEFAULT_HAIKU_MODEL=qwen3-coder-plus`}</pre>
                </div>
              </section>

              {/* Test Credentials */}
              <section id="test" className="card">
                <h2 className="text-2xl font-bold text-[var(--text-50)] mb-4">测试凭证方案</h2>
                <p className="text-[var(--text-400)] mb-4">
                  Playwright 登录态导出、API Key 持久化，安全存储测试凭证。
                </p>
                <div className="code-block">
                  <pre className="text-[var(--text-200)]">{`# 导出浏览器登录态
claude-coder auth http://localhost:3000`}</pre>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Features;
