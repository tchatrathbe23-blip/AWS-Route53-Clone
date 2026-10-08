'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { KeyRound, ShieldCheck, ArrowRight, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [authType, setAuthType] = useState<'iam' | 'root'>('iam');
  const [accountId, setAccountId] = useState('123456789012');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password, accountId);
      router.push('/hosted-zones');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* AWS Brand Header */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-[#232f3e] px-8 py-5 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-aws-orange text-2xl font-black">aws</span>
            <span className="text-white text-base font-semibold border-l border-gray-600 pl-3">Sign In</span>
          </div>
          <span className="text-xs text-gray-400">AWS Console</span>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 text-red-700 dark:text-red-300 text-xs rounded">
              {error}
            </div>
          )}

          {/* User Role Selection Tabs */}
          <div className="flex border-b border-gray-200 dark:border-slate-800 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthType('iam')}
              className={`pb-2.5 px-3 border-b-2 transition ${
                authType === 'iam'
                  ? 'border-aws-orange text-aws-orange'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              IAM User
            </button>
            <button
              type="button"
              onClick={() => setAuthType('root')}
              className={`pb-2.5 px-3 border-b-2 transition ${
                authType === 'root'
                  ? 'border-aws-orange text-aws-orange'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Root User
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {authType === 'iam' && (
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account ID (12 digits) or account alias
                </label>
                <input
                  type="text"
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-gray-900 dark:text-gray-100 focus:border-aws-orange focus:bg-white dark:focus:bg-slate-900 transition"
                  placeholder="123456789012"
                />
              </div>
            )}

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                {authType === 'iam' ? 'IAM user name' : 'Root user email address'}
              </label>
              <input
                type={authType === 'iam' ? 'text' : 'email'}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-gray-900 dark:text-gray-100 focus:border-aws-orange focus:bg-white dark:focus:bg-slate-900 transition"
                placeholder={authType === 'iam' ? 'e.g. admin' : 'admin@scaler-labs.aws'}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-gray-900 dark:text-gray-100 focus:border-aws-orange focus:bg-white dark:focus:bg-slate-900 transition"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-aws-orange hover:bg-aws-orangeHover text-white font-medium py-2 px-4 rounded shadow transition flex items-center justify-center space-x-1.5"
              >
                <span>{loading ? 'Signing in...' : 'Sign in'}</span>
                {!loading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 text-center text-[11px] text-gray-500 dark:text-gray-400">
            <span>Mocked AWS Route53 Authentication Session. Default credentials pre-filled.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
