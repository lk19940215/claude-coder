import { createHashRouter, RouterProvider } from 'react-router-dom';
import App from '../App';

// 页面组件（懒加载）
const Home = () => import('../pages/Home');
const Features = () => import('../pages/Features');
const QuickStart = () => import('../pages/QuickStart');
const Docs = () => import('../pages/Docs');
const Examples = () => import('../pages/Examples');

// 懒加载包装器
const lazyLoad = (loader: () => Promise<{ default: React.ComponentType }>) => {
  const LazyComponent = React.lazy(loader);
  return <LazyComponent />;
};

import React, { Suspense } from 'react';

// 加载中组件
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-100)]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-500)]" />
  </div>
);

// 路由配置
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoading />}>
            {lazyLoad(Home)}
          </Suspense>
        ),
      },
      {
        path: 'features',
        element: (
          <Suspense fallback={<PageLoading />}>
            {lazyLoad(Features)}
          </Suspense>
        ),
      },
      {
        path: 'quick-start',
        element: (
          <Suspense fallback={<PageLoading />}>
            {lazyLoad(QuickStart)}
          </Suspense>
        ),
      },
      {
        path: 'docs',
        element: (
          <Suspense fallback={<PageLoading />}>
            {lazyLoad(Docs)}
          </Suspense>
        ),
      },
      {
        path: 'examples',
        element: (
          <Suspense fallback={<PageLoading />}>
            {lazyLoad(Examples)}
          </Suspense>
        ),
      },
    ],
  },
]);

// RouterProvider 包装组件
export const Router = () => <RouterProvider router={router} />;

export default router;
