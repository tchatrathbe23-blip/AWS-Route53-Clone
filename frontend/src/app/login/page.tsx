'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // ============================================================
  // 1. STATE MANAGEMENT
  // ============================================================

  // Interview question:
  // "How would you restrict authType to only IAM or Root?"
  // Answer: Use a TypeScript union type.
  const [authType, setAuthType] = useState<'iam' | 'root'>('iam');

  const [accountId, setAccountId] = useState('123456789012');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // CHANGE 1:
  // Interview question:
  // "How would you implement show/hide password?"
  const [showPassword, setShowPassword] = useState(false);

  // CHANGE 2:
  // Interview question:
  // "How would you add Remember Me?"
  const [rememberMe, setRememberMe] = useState(false);


  // ============================================================
  // 2. FORM SUBMISSION
  // ============================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // CHANGE 3:
    // Prevent user from submitting the form multiple times
    // while the previous request is still running.
    if (loading) {
      return;
    }

    setError('');

    // ============================================================
    // CHANGE 4: ACCOUNT ID VALIDATION
    // ============================================================
    // Interview question:
    // "How would you validate that AWS account ID
    // contains exactly 12 digits?"

    if (authType === 'iam' && !/^\d{12}$/.test(accountId)) {
      setError('Account ID must contain exactly 12 digits.');
      return;
    }


    // ============================================================
    // CHANGE 5: PASSWORD VALIDATION
    // ============================================================
    // Interview question:
    // "How would you make sure password has minimum 8 characters?"

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }


    // ============================================================
    // START API REQUEST
    // ============================================================

    setLoading(true);

    try {
      await login(username, password, accountId);

      // ========================================================
      // CHANGE 6: REMEMBER ME
      // ========================================================
      // Normally this would be handled more securely by the
      // authentication system/backend.
      //
      // Here we simply demonstrate how the frontend could
      // remember the username.

      if (rememberMe) {
        localStorage.setItem('route53_remembered_user', username);
      } else {
        localStorage.removeItem('route53_remembered_user');
      }


      // ========================================================
      // CHANGE 7: CLEAR PASSWORD AFTER SUCCESSFUL LOGIN
      // ========================================================
      // Never keep the password unnecessarily after login.

      setPassword('');


      // ========================================================
      // CHANGE 8: REDIRECT AFTER LOGIN
      // ========================================================
      // Interview question:
      // "How would you redirect the user after successful login?"

      router.push('/hosted-zones');

    } catch (err: any) {

      // ========================================================
      // ERROR HANDLING
      // ========================================================

      setError(err.message || 'Failed to sign in');

    } finally {

      // ========================================================
      // ALWAYS STOP LOADING
      // ========================================================
      // finally executes whether request succeeds or fails.

      setLoading(false);
    }
  };


  // ============================================================
  // 3. UI
  // ============================================================

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">

      {/* ======================================================
          AWS BRAND HEADER
          ====================================================== */}

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden">

        <div className="bg-[#232f3e] px-8 py-5 border-b border-gray-700 flex items-center justify-between">

          <div className="flex items-center space-x-2">

            <span className="text-aws-orange text-2xl font-black">
              aws
            </span>

            <span className="text-white text-base font-semibold border-l border-gray-600 pl-3">
              Sign In
            </span>

          </div>

          <span className="text-xs text-gray-400">
            AWS Console
          </span>

        </div>


        {/* ======================================================
            FORM CONTENT
            ====================================================== */}

        <div className="p-8">

          {/* ====================================================
              ERROR MESSAGE
              ==================================================== */}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 text-red-700 dark:text-red-300 text-xs rounded">
              {error}
            </div>
          )}


          {/* ====================================================
              USER ROLE SELECTION
              ==================================================== */}

          <div className="flex border-b border-gray-200 dark:border-slate-800 mb-6 text-xs font-semibold">

            {/* IAM TAB */}

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


            {/* ROOT TAB */}

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


          {/* ====================================================
              LOGIN FORM
              ==================================================== */}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">


            {/* ==================================================
                ACCOUNT ID
                ================================================== */}

            {authType === 'iam' && (
              <div>

                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account ID (12 digits) or account alias
                </label>

                <input
                  type="text"

                  // CHANGE 9:
                  // Required only for IAM login.
                  required={authType === 'iam'}

                  value={accountId}

                  onChange={(e) => setAccountId(e.target.value)}

                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-gray-900 dark:text-gray-100 focus:border-aws-orange focus:bg-white dark:focus:bg-slate-900 transition"

                  placeholder="123456789012"
                />

              </div>
            )}


            {/* ==================================================
                USERNAME / EMAIL
                ================================================== */}

            <div>

              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">

                {authType === 'iam'
                  ? 'IAM user name'
                  : 'Root user email address'}

              </label>


              <input
                // CHANGE 10:
                // Input type changes depending on login type.
                type={authType === 'iam' ? 'text' : 'email'}

                required

                value={username}

                onChange={(e) => setUsername(e.target.value)}

                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-gray-900 dark:text-gray-100 focus:border-aws-orange focus:bg-white dark:focus:bg-slate-900 transition"

                placeholder={
                  authType === 'iam'
                    ? 'e.g. admin'
                    : 'admin@scaler-labs.aws'
                }

              />

            </div>


            {/* ==================================================
                PASSWORD
                ================================================== */}

            <div>

              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>


              {/* CHANGE 11:
                  Password show/hide functionality */}

              <div className="relative">

                <input
                  type={showPassword ? 'text' : 'password'}

                  required

                  value={password}

                  onChange={(e) => setPassword(e.target.value)}

                  className="w-full px-3 py-2 pr-16 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-gray-900 dark:text-gray-100 focus:border-aws-orange focus:bg-white dark:focus:bg-slate-900 transition"

                  placeholder="••••••••"
                />


                {/* SHOW / HIDE BUTTON */}

                <button
                  type="button"

                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }

                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>

              </div>

            </div>


            {/* ==================================================
                CHANGE 12: REMEMBER ME
                ================================================== */}

            <div className="flex items-center justify-between">

              <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400">

                <input
                  type="checkbox"

                  checked={rememberMe}

                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }

                />

                Remember me

              </label>


              {/* =================================================
                  CHANGE 13: FORGOT PASSWORD
                  ================================================= */}

              <button
                type="button"

                onClick={() =>
                  router.push('/forgot-password')
                }

                className="text-xs text-aws-blue hover:underline"
              >
                Forgot password?
              </button>

            </div>


            {/* ==================================================
                SUBMIT BUTTON
                ================================================== */}

            <div className="pt-2">

              <button
                type="submit"

                // CHANGE 14:
                // Disable button while request is running.
                disabled={loading}

                className="w-full bg-aws-orange hover:bg-aws-orangeHover disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded shadow transition flex items-center justify-center space-x-1.5"
              >

                <span>
                  {loading
                    ? 'Signing in...'
                    : 'Sign in'}
                </span>


                {!loading && (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}

              </button>

            </div>

          </form>


          {/* ====================================================
              FOOTER
              ==================================================== */}

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 text-center text-[11px] text-gray-500 dark:text-gray-400">

            <span>
              Mocked AWS Route53 Authentication Session.
              Default credentials pre-filled.
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}