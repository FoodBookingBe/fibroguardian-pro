import React from 'react';

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Developer Tools | FibroGuardian Pro',
  description: 'Internal development and testing tools for FibroGuardian Pro',
};

/**
 * Developer Tools index page.
 * Provides an overview of available developer tools and resources.
 */
export default function DevIndexPage(): JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Developer Tools</h1>
        <p className="text-gray-600">
          Welcome to the FibroGuardian Pro developer tools. These tools are designed to help with development, testing, and optimization.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Available Tools</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Performance Tool */}
          <div className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md">
            <h3 className="mb-2 text-xl font-medium text-indigo-600">Performance</h3>
            <p className="mb-4 text-gray-600">
              Tools for monitoring and optimizing application performance, including bundle analysis and rendering metrics.
            </p>
            <Link
              href="/dev/performance"
              className="inline-block rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              View Performance Tools
            </Link>
          </div>

          {/* Memory Leaks Tool */}
          <div className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md">
            <h3 className="mb-2 text-xl font-medium text-indigo-600">Memory Leaks</h3>
            <p className="mb-4 text-gray-600">
              Tools for detecting and preventing memory leaks in React components, with examples and best practices.
            </p>
            <Link
              href="/dev/memory-leaks"
              className="inline-block rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              View Memory Leak Tools
            </Link>
          </div>

          {/* Accessibility Tool */}
          <div className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md">
            <h3 className="mb-2 text-xl font-medium text-indigo-600">Accessibility</h3>
            <p className="mb-4 text-gray-600">
              Tools for testing and improving accessibility, including WCAG compliance checks and keyboard navigation testing.
            </p>
            <Link
              href="/dev/accessibility"
              className="inline-block rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              View Accessibility Tools
            </Link>
          </div>

          {/* Component Library */}
          <div className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md">
            <h3 className="mb-2 text-xl font-medium text-indigo-600">Component Library</h3>
            <p className="mb-4 text-gray-600">
              A showcase of all available components with documentation, props, and usage examples.
            </p>
            <Link
              href="/dev/component-library"
              className="inline-block rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              View Component Library
            </Link>
          </div>

          {/* API Playground */}
          <div className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md">
            <h3 className="mb-2 text-xl font-medium text-indigo-600">API Playground</h3>
            <p className="mb-4 text-gray-600">
              Interactive playground for testing API endpoints, with request builders and response viewers.
            </p>
            <Link
              href="/dev/api-playground"
              className="inline-block rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              View API Playground
            </Link>
          </div>

          {/* Documentation */}
          <div className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md">
            <h3 className="mb-2 text-xl font-medium text-indigo-600">Documentation</h3>
            <p className="mb-4 text-gray-600">
              Comprehensive documentation for developers, including architecture guides, API references, and best practices.
            </p>
            <Link
              href="/dev/docs"
              className="inline-block rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Developer Resources</h2>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="mb-2 font-medium text-indigo-600">Code Quality</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                <li>ESLint Configuration</li>
                <li>Prettier Setup</li>
                <li>TypeScript Configuration</li>
                <li>Jest Test Setup</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-indigo-600">Performance</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                <li>Bundle Analysis</li>
                <li>Performance Monitoring</li>
                <li>Optimization Techniques</li>
                <li>Caching Strategies</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-indigo-600">Security</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                <li>Authentication Flow</li>
                <li>Authorization Policies</li>
                <li>Data Encryption</li>
                <li>Security Best Practices</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-indigo-600">Database</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                <li>Schema Documentation</li>
                <li>Migration Scripts</li>
                <li>Query Optimization</li>
                <li>Data Modeling</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-indigo-600">Architecture</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                <li>System Architecture</li>
                <li>Component Structure</li>
                <li>State Management</li>
                <li>API Design</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-indigo-600">Deployment</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                <li>CI/CD Pipeline</li>
                <li>Environment Configuration</li>
                <li>Deployment Strategies</li>
                <li>Monitoring Setup</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-yellow-50 p-4">
        <h2 className="mb-2 text-xl font-semibold">Developer Notes</h2>
        <p className="mb-2">
          These tools are for internal development and testing purposes only. They are not intended for production use.
        </p>
        <p className="text-sm text-gray-600">
          If you encounter any issues or have suggestions for improvement, please contact the development team.
        </p>
      </div>
    </div>
  );
}
