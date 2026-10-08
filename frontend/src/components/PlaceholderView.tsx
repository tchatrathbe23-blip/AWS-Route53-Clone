import React from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { LucideIcon, ArrowLeft } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  icon: LucideIcon;
  description: string;
}

export default function PlaceholderView({ title, icon: Icon, description }: PlaceholderViewProps) {
  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: title }]}
        title={title}
        description={description}
      />

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-12 text-center max-w-2xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 text-aws-blue dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title} Preview</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          {description} This section is part of the AWS Route 53 architecture scope and is scheduled for rollout in an upcoming update.
        </p>

        <div className="inline-flex items-center space-x-3">
          <Link
            href="/hosted-zones"
            className="px-4 py-2 text-xs font-semibold bg-aws-orange hover:bg-aws-orangeHover text-white rounded transition flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to Hosted zones</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
