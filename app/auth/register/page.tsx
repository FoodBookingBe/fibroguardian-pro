'use client';

import AuthForm from "@/components/auth/AuthForm";
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-2xl">
        <div>
          <Link href="/" className="inline-block mb-6 transition-transform hover:scale-105">
            <img
              className="mx-auto h-12 w-auto sm:h-14"
              src="/logo.png" // Ensure this logo exists in /public
              alt="FibroGuardian Pro"
            />
          </Link>
          <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Maak een nieuw account aan
          </h2>
        </div>
        {/* AuthForm will be in 'register' mode if isLogin is false (default for a separate register page) */}
        {/* We might need to pass a prop to AuthForm if it doesn't auto-detect based on route, or have separate Login/Register forms */}
        {/* For now, assuming AuthForm handles its state or we adjust it later. */}
        {/* To explicitly set it to register mode, we would need to modify AuthForm or pass a prop. */}
        {/* Explicitly set to register mode */}
        <AuthForm initialIsLogin={false} />
        <div className="text-sm text-center text-gray-600 mt-6">
          Al een account?{' '}
          <Link href="/auth/login" className="font-medium text-purple-600 hover:text-purple-500 hover:underline">
            Log hier in
          </Link>
        </div>
      </div>
    </div>
  );
}