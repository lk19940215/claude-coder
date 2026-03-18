import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GITHUB_REPO_URL } from '../../utils';
import { GitHubIcon, MenuIcon } from '../ui/Icons';

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/quick-start', label: '快速上手' },
  { path: '/features', label: '功能特性' },
  { path: '/docs', label: '文档' },
  { path: '/examples', label: '案例' },
];

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-opacity-90 backdrop-blur-md border-b border-[var(--border-300)] bg-[var(--bg-100)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-[var(--text-50)]">Claude Coder</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium relative py-1 transition-colors ${
                  location.pathname === link.path
                    ? 'text-[var(--text-50)]'
                    : 'text-[var(--text-400)] hover:text-[var(--text-50)]'
                }`}
              >
                {link.label}
                {/* Active indicator with gradient border */}
                {location.pathname === link.path && (
                  <span className="absolute bottom-[-4px] left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-full" />
                )}
                {/* Hover underline animation */}
                <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[var(--text-400)] transition-all duration-300 group-hover/link:w-full" />
              </Link>
            ))}
          </nav>

          {/* Right Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-[var(--text-400)] hover:text-[var(--text-50)] transition-colors group"
            >
              <GitHubIcon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
              <span className="link-underline">Star</span>
            </a>
            <Link to="/quick-start" className="btn-primary animate-pulse-glow text-sm no-underline">
              下载安装
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-[var(--text-200)]"
            aria-label="Toggle menu"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--bg-200)] border-t border-[var(--border-300)]">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block py-2 text-sm relative transition-colors ${
                  location.pathname === link.path
                    ? 'text-[var(--text-50)] border-l-2 border-[var(--gradient-start)] pl-3 bg-[var(--bg-200)]'
                    : 'text-[var(--text-200)] hover:text-[var(--text-50)] pl-3'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
