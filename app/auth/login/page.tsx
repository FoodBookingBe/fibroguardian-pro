'use client';

import AuthForm from "@/components/auth/AuthForm"; // Corrected import path
import Link from 'next/link';
import Image from 'next/image'; // Import Next.js Image component

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-2xl">
        <div>
          <Link href="/" className="inline-block mb-6 transition-transform hover:scale-105">
            <Image
              className="mx-auto" // Removed h-12 w-auto sm:h-14, let width/height props control size
              src="/logo.png" // Ensure this logo exists in /public
              alt="FibroGuardian Pro"
              width={56} // Example width, adjust as needed (sm:h-14 is 56px)
              height={56} // Example height, adjust to maintain aspect ratio
              priority // If it's LCP
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
      </div>
    </div>
  );
}
