/**
 * Claude Coder 官网 - 类型定义
 */

// 导航链接
export interface NavLink {
  path: string;
  label: string;
}

// 功能特性
export interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

// 文档目录项
export interface DocItem {
  id: string;
  title: string;
}

// 使用案例
export interface Example {
  id: string;
  title: string;
  description: string;
  command: string;
  result: string;
}

// 快速上手步骤
export interface QuickStartStep {
  id: number;
  title: string;
  content: React.ReactNode;
}

// 页脚链接
export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

// 社交媒体链接
export interface SocialLink {
  name: string;
  href: string;
  icon: string;
}
