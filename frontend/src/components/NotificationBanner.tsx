'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface AlertNotification {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface NotificationBannerProps {
  notification: AlertNotification | null;
  onClose: () => void;
}

export default function NotificationBanner({ notification, onClose }: NotificationBannerProps) {
  if (!notification) return null;

  const config = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-900 dark:text-red-200',
      icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200',
      icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />,
    },
  }[notification.type];

  return (
    <div className={`flex items-start justify-between p-3.5 mb-4 rounded border-l-4 shadow-sm ${config.bg} text-xs transition-all`}>
      <div className="flex items-start space-x-2.5">
        {config.icon}
        <span className="font-medium mt-0.5">{notification.message}</span>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-4"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
