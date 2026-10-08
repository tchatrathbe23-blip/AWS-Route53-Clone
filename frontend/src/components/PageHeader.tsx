'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs: Crumb[];
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ breadcrumbs, title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
        <Link href="/hosted-zones" className="hover:text-aws-blue hover:underline">
          Route 53
        </Link>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-aws-blue hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-gray-800 dark:text-gray-200 font-medium">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Main title and primary actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h1>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-3xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center space-x-2.5 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
