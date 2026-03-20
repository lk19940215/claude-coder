export interface HeaderProps {
  className?: string
}

export function Header({ className = '' }: HeaderProps) {
  return (
    <header
      className={`
        h-16 px-6
        flex items-center justify-between
        bg-[#1A1D21] border-b border-[#2D3139]
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🍅</span>
        <h1 className="text-xl font-bold bg-gradient-to-r from-[#7CB68E] to-[#D4A574] bg-clip-text text-transparent">
          FlowTask
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-6">
        <NavLink href="#features">功能</NavLink>
        <NavLink href="#stats">统计</NavLink>
        <NavLink href="#settings">设置</NavLink>
      </nav>
    </header>
  )
}

// 导航链接组件
interface NavLinkProps {
  href: string
  children: React.ReactNode
}

function NavLink({ href, children }: NavLinkProps) {
  return (
    <a
      href={href}
      className="
        text-sm font-medium text-[#9CA3AF]
        hover:text-[#E5E7EB]
        transition-colors
      "
    >
      {children}
    </a>
  )
}

export default Header