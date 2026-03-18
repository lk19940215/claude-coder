import React from 'react';
import { MenuIcon, CloseIcon } from './Icons';

interface MobileSidebarProps {
  /** 侧边栏是否打开 */
  isOpen: boolean;
  /** 关闭侧边栏的回调 */
  onClose: () => void;
  /** 切换侧边栏的回调 */
  onToggle: () => void;
  /** 侧边栏标题 */
  title: string;
  /** 导航内容 */
  children: React.ReactNode;
}

/**
 * 移动端侧边栏组件
 * 包含汉堡菜单按钮、遮罩层和侧边栏内容
 */
const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  onToggle,
  title,
  children,
}) => {
  return (
    <>
      {/* Mobile sidebar toggle button */}
      <button
        onClick={onToggle}
        className="sidebar-toggle-btn fixed top-20 left-4 z-50 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <MenuIcon />
      </button>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay visible lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed top-0 left-0 w-[280px] h-screen bg-[var(--bg-100)] border-r border-[var(--border-300)] z-50 overflow-y-auto p-6 transition-transform duration-300 lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-heading-3 text-[var(--text-50)]">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-200)] transition-colors"
            aria-label="Close sidebar"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
};

export default MobileSidebar;