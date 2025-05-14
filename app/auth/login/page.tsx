'use client';

import AuthForm from "@/components/auth/AuthForm"; // Corrected import path
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-2xl">
        <div>
          <Link href="/" className="inline-block mb-6 transition-transform hover:scale-105">
            <img
              className="mx-auto h-12 w-auto sm:h-14" // Adjusted size
              src="/logo.png" // Ensure this logo exists in /public
              alt="FibroGuardian Pro"
            />
          </Link>
          <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Inloggen op uw account
          </h2>
        </div>
        <AuthForm initialIsLogin={true} /> {/* Explicitly set to login mode */}
        <div className="text-sm text-center mt-6">
          <Link href="/auth/forgot-password" className="font-medium text-purple-600 hover:text-purple-500 hover:underline">
              Wachtwoord vergeten?
          </Link>
        </div>
        <div className="text-sm text-center text-gray-600">
          Nog geen account?{' '}
          <Link href="/auth/register" className="font-medium text-purple-600 hover:text-purple-500 hover:underline">
            Registreer hier
          </Link>
        </div>
      </div>
    </div>
  );
}