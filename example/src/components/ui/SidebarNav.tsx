import React from 'react';

interface NavItem {
  id: string;
  title: string;
}

interface SidebarNavProps {
  items: NavItem[];
  activeId: string;
  onItemClick: (e: React.MouseEvent, id: string) => void;
}

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