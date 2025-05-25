'use client';

import Image from 'next/image'; // Import Next.js Image component
import Link from 'next/link';

import AuthFormContainer from "@/containers/auth/AuthFormContainer"; // Updated import

export default function LoginPage(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-2xl rounded-xl sm:p-10">
        <div>
          <Link href="/" className="inline-block mb-6 transition-transform hover:scale-105">
            <Image
              className="mx-auto"
              src="/logo.png" // Ensure this logo exists in /public
              alt="FibroGuardian Pro"
              width={56} // Example width, adjust as needed (sm:h-14 is 56px)
              height={56} // Example height, adjust to maintain aspect ratio
              priority // If it's LCP
            />
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-center text-gray-900 sm:text-3xl">
            Inloggen op uw account
          </h2>
        </div>
        <AuthFormContainer initialIsLoginMode={true} /> {/* Use container and updated prop name */}
        <div className="mt-6 text-sm text-center">
          <Link href="/auth/forgot-password" className="font-medium text-purple-600 hover:text-purple-500 hover:underline">
            Wachtwoord vergeten?
          </Link>
        </div>
      </div>
    </div>
  );
}
