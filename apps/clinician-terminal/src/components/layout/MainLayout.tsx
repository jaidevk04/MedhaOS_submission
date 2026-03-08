'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100', className)}>
      {children}
    </div>
  );
}

interface ThreeColumnLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  className?: string;
}

export function ThreeColumnLayout({
  left,
  center,
  right,
  className,
}: ThreeColumnLayoutProps) {
  return (
    <div className={cn('flex h-screen overflow-hidden', className)}>
      {/* Left Panel - 30% */}
      <div className="w-[30%] border-r bg-white overflow-y-auto">
        {left}
      </div>

      {/* Center Panel - 50% */}
      <div className="w-[50%] border-r bg-white overflow-y-auto">
        {center}
      </div>

      {/* Right Panel - 20% */}
      <div className="w-[20%] bg-white overflow-y-auto">
        {right}
      </div>
    </div>
  );
}

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveContainer({
  children,
  className,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        'container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl',
        className
      )}
    >
      {children}
    </div>
  );
}
