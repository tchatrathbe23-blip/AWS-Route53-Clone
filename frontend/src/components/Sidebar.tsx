'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Globe, LayoutDashboard, Share2, Activity, GitFork, 
  Layers, ExternalLink 
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isMocked?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, isMocked: true },
  { name: 'Hosted zones', href: '/hosted-zones', icon: Globe },
  { name: 'Traffic policies', href: '/traffic-policies', icon: Share2, isMocked: true },
  { name: 'Health checks', href: '/health-checks', icon: Activity, isMocked: true },
  { name: 'Resolver', href: '/resolver', icon: GitFork, isMocked: true },
  { name: 'Profiles', href: '/profiles', icon: Layers, isMocked: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-3rem)]">
      <div className="py-4">
        <div className="px-5 mb-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Route 53
        </div>
        <nav className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-aws-blue dark:text-blue-400 font-semibold border-l-4 border-aws-blue rounded-l-none'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-aws-blue dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.isMocked && (
                  <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                    Preview
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Documentation & Info */}
      <div className="p-4 border-t border-gray-100 dark:border-slate-800 text-[11px] text-gray-500 dark:text-gray-400 space-y-2">
        <div className="font-semibold text-gray-700 dark:text-gray-300">Route 53 Resources</div>
        <a 
          href="https://docs.aws.amazon.com/route53/" 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center space-x-1 text-aws-blue hover:underline"
        >
          <span>Route 53 User Guide</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <div className="text-[10px] text-gray-400 pt-1">
          v1.0.0 Scaler Labs
        </div>
      </div>
    </aside>
  );
}
