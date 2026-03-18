import { useCallback, useEffect, useState } from 'react';

interface UseMobileSidebarReturn {
  /** 侧边栏是否打开 */
  isOpen: boolean;
  /** 切换侧边栏状态 */
  toggle: () => void;
  /** 打开侧边栏 */
  open: () => void;
  /** 关闭侧边栏 */
  close: () => void;
}

/**
 * 移动端侧边栏管理 Hook
 * 管理 isOpen 状态，支持 ESC 键关闭
 *
 * @example
 * ```tsx
 * const { isOpen, toggle, close } = useMobileSidebar();
 *
 * return (
 *   <>
 *     {/* 汉堡菜单按钮 *\/}
 *     <button onClick={toggle} className="sidebar-toggle-btn">
 *       <MenuIcon />
 *     </button>
 *
 *     {/* 侧边栏 *\/}
 *     <aside className={`sidebar-mobile ${isOpen ? 'open' : ''}`}>
 *       {/* ... *\/}
 *     </aside>
 *
 *     {/* 遮罩层 *\/}
 *     {isOpen && <div className="sidebar-overlay visible" onClick={close} />}
 *   </>
 * );
 * ```
 */
export function useMobileSidebar(): UseMobileSidebarReturn {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // ESC 键关闭侧边栏
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // 打开时禁止页面滚动
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  return { isOpen, toggle, open, close };
}

export default useMobileSidebar;