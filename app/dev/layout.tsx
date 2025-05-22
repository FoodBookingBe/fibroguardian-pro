import React from 'react';

import { ReactNode } from 'react';

import Link from 'next/link';

interface DevLayoutProps {
  children: ReactNode;
}

/**
 * Layout component for the development section of the application.
 * Provides a consistent header and navigation for all development pages.
 */
export default function DevLayout({ children }: DevLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                <Link href="/dev" className="hover:text-indigo-200">
                  FibroGuardian Pro - Developer Tools
                </Link>
              </h1>
              <p className="text-xs text-indigo-200">Internal development and testing tools</p>
            </div>
            <nav>
              <Link href="/" className="rounded bg-indigo-600 px-3 py-1 text-sm hover:bg-indigo-500">
                Back to App
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-4 overflow-x-auto py-3">
            <Link
              href="/dev/performance"
              className="whitespace-nowrap rounded px-3 py-1 text-sm font-medium hover:bg-gray-100"
            >
              Performance
            </Link>
            <Link
              href="/dev/memory-leaks"
              className="whitespace-nowrap rounded px-3 py-1 text-sm font-medium hover:bg-gray-100"
            >
              Memory Leaks
            </Link>
            <Link
              href="/dev/accessibility"
              className="whitespace-nowrap rounded px-3 py-1 text-sm font-medium hover:bg-gray-100"
            >
              Accessibility
            </Link>
            <Link
              href="/dev/component-library"
              className="whitespace-nowrap rounded px-3 py-1 text-sm font-medium hover:bg-gray-100"
            >
              Component Library
            </Link>
            <Link
              href="/dev/api-playground"
              className="whitespace-nowrap rounded px-3 py-1 text-sm font-medium hover:bg-gray-100"
            >
              API Playground
            </Link>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="pb-12">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-white py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>FibroGuardian Pro - Developer Tools</p>
          <p className="text-xs">
            These tools are for internal development and testing purposes only. Not for production use.
          </p>
        </div>
      </footer>
    </div>
  );
}
