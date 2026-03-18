import React from 'react';

interface NavItem {
  id: string;
  title: string;
}

interface SidebarNavProps {
  /** 导航项列表 */
  items: NavItem[];
  /** 当前激活的项 ID */
  activeId: string;
  /** 点击导航项的回调 */
  onItemClick: (e: React.MouseEvent, id: string) => void;
}

/**
 * 侧边栏导航组件
 * 支持动画延迟和激活状态样式
 */
const SidebarNav: React.FC<SidebarNavProps> = ({ items, activeId, onItemClick }) => {
  return (
    <nav>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`nav-item animate-slide-in-left ${activeId === item.id ? 'nav-item-active' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={(e) => onItemClick(e, item.id)}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SidebarNav;