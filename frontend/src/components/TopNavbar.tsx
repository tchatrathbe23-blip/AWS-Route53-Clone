'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  Search, Bell, HelpCircle, ChevronDown, 
  Moon, Sun, LogOut, User as UserIcon, Shield
} from 'lucide-react';

export default function TopNavbar() {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="bg-aws-nav text-white h-12 flex items-center justify-between px-4 sticky top-0 z-50 select-none border-b border-gray-700">
      {/* Left: AWS Logo & Service Title */}
      <div className="flex items-center space-x-4">
        <Link href="/hosted-zones" className="flex items-center space-x-2 text-white hover:text-gray-200">
          <div className="flex items-center font-bold text-lg tracking-tight">
            <span className="text-aws-orange text-xl mr-1.5 font-black">aws</span>
            <span className="font-semibold text-gray-100 text-sm border-l border-gray-600 pl-2.5">Route 53</span>
          </div>
        </Link>
      </div>

      {/* Middle: Global AWS Service Search bar */}
      <div className="flex-1 max-w-xl mx-6">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            id="aws-global-search"
            type="text"
            placeholder="Search for services, features, docs (Press '/' to focus)"
            className="w-full bg-[#131921] hover:bg-[#1a232f] text-gray-200 text-xs pl-9 pr-8 py-1.5 rounded border border-gray-600 focus:border-aws-orange focus:outline-none transition-all"
          />
          <kbd className="absolute right-2.5 top-2 text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.2 rounded border border-gray-600">
            /
          </kbd>
        </div>
      </div>

      {/* Right: Regions, Theme, Notifications, Account */}
      <div className="flex items-center space-x-2">
        {/* Dark Mode toggle */}
        <button
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Global Region selector badge (Route53 is Global) */}
        <div className="hidden md:flex items-center space-x-1 px-2 py-1 text-xs text-gray-300 hover:text-white rounded cursor-default">
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1 inline-block"></span>
          <span className="font-medium">Global</span>
        </div>

        {/* Support / Help */}
        <button className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded" title="Support">
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded" title="Notifications">
          <Bell className="w-4 h-4" />
        </button>

        {/* Account Menu */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center space-x-2 px-2.5 py-1 text-xs font-medium text-gray-200 hover:bg-gray-700 rounded transition"
          >
            <UserIcon className="w-3.5 h-3.5 text-aws-orange" />
            <span>{user ? user.username : 'aws-admin'} @ {user?.account_id || '123456789012'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-slate-800 rounded shadow-xl border border-gray-200 dark:border-slate-700 py-2 z-50 text-gray-800 dark:text-gray-200 text-xs">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                <div className="font-semibold text-gray-900 dark:text-white">{user?.username || 'aws-admin'}</div>
                <div className="text-gray-500 text-[11px]">Account ID: {user?.account_id || '123456789012'}</div>
              </div>
              <div className="px-4 py-2">
                <div className="text-[11px] text-gray-400 font-medium uppercase mb-1">Role / Permissions</div>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                  <Shield className="w-3.5 h-3.5 mr-1" /> AdministratorAccess
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-slate-700 mt-1 pt-1">
                <Link
                  href="/login"
                  onClick={() => setUserDropdownOpen(false)}
                  className="block px-4 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  Switch Account / Login
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 flex items-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
