'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className={`relative bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-800 w-full ${maxWidth} overflow-hidden`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
