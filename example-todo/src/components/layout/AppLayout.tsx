import { Header } from './Header'
import { TagSidebar } from '../tags/TagSidebar'
import { TaskList } from '../tasks/TaskList'
import { PomodoroTimer } from '../timer/PomodoroTimer'

export interface AppLayoutProps {
  className?: string
}

export function AppLayout({ className = '' }: AppLayoutProps) {
  return (
    <div className={`min-h-screen flex flex-col bg-[#121416] ${className}`}>
      {/* 顶部导航 */}
      <Header />

      {/* 主内容区域 - 三栏布局 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 左侧 - 标签侧边栏 */}
        <aside className="w-64 flex-shrink-0 border-r border-[#2D3139]">
          <TagSidebar />
        </aside>

        {/* 中间 - 任务列表 */}
        <section className="flex-1 flex flex-col p-6 overflow-hidden">
          <TaskList />
        </section>

        {/* 右侧 - 番茄钟 */}
        <aside className="w-80 flex-shrink-0 border-l border-[#2D3139] p-6 overflow-y-auto">
          <PomodoroTimer />
        </aside>
      </main>
    </div>
  )
}

export default AppLayout