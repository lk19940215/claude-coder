import React from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const QuickStart: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--text-50)] mb-4">快速上手</h1>
          <p className="text-lg text-[var(--text-400)] mb-12">只需几步，开始使用 Claude Coder</p>

          {/* Steps */}
          <div className="space-y-12">
            {/* Step 1 */}
            <div className="card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-600)] flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[var(--text-50)] mb-3">安装</h2>
                  <div className="code-block">
                    <pre className="text-[var(--text-200)]">{`# 安装 Claude Agent SDK
npm install -g @anthropic-ai/claude-agent-sdk

# 安装 Claude Coder
npm install -g claude-coder`}</pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-600)] flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[var(--text-50)] mb-3">配置</h2>
                  <div className="code-block mb-4">
                    <pre className="text-[var(--text-200)]">{`# 交互式配置（模型、MCP、安全限制）
claude-coder setup

# 或手动配置环境变量
echo "ANTHROPIC_DEFAULT_OPUS_MODEL=glm-5" >> .env`}</pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-600)] flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[var(--text-50)] mb-3">初始化项目</h2>
                  <div className="code-block">
                    <pre className="text-[var(--text-200)]">{`cd your-project
claude-coder init`}</pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-600)] flex items-center justify-center text-white font-bold flex-shrink-0">4</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[var(--text-50)] mb-3">开始编码</h2>
                  <div className="code-block mb-4">
                    <pre className="text-[var(--text-200)]">{`# 方式一：直接输入需求
claude-coder run "实现用户注册和登录功能"

# 方式二：从需求文件读取
claude-coder run

# 方式三：交互模式
claude-coder plan -i "需求描述"`}</pre>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-50)] mb-2">常用选项</h3>
                  <ul className="list-disc list-inside text-[var(--text-400)] space-y-1">
                    <li><code>--max N</code>：限制 session 数（默认 50）</li>
                    <li><code>--pause N</code>：每 N 个 session 暂停确认</li>
                    <li><code>--dry-run</code>：预览模式（查看任务队列）</li>
                    <li><code>--model M</code>：指定模型</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className="card border-[var(--success-500)]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--success-500)] flex items-center justify-center text-white font-bold flex-shrink-0">✓</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[var(--text-50)] mb-3">验证安装</h2>
                  <div className="code-block">
                    <pre className="text-[var(--text-200)]">{`claude-coder status
# 应显示配置信息和模型状态`}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuickStart;
