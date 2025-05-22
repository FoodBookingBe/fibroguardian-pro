import React from 'react';

import Link from 'next/link';
import Image from 'next/image';

export default function Home(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Image 
            src="/logo.png" 
            alt="FibroGuardian Pro Logo" 
            width={48} 
            height={48} 
            className="rounded-lg"
          />
          <span className="text-xl font-bold text-purple-800">FibroGuardian Pro</span>
        </div>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link 
                href="/auth/login" 
                className="px-4 py-2 rounded-md bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
              >
                Inloggen
              </Link>
            </li>
            <li>
              <Link 
                href="/auth/register" 
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
              >
                Registreren
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="container mx-auto px-4 py-12 md:py-24 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold text-purple-900 mb-4">
              Uw persoonlijke gezondheidscoach voor fibromyalgie
            </h1>
            <p className="text-lg text-gray-700 mb-6">
              FibroGuardian Pro helpt u uw dagelijkse activiteiten, pijn- en energieniveaus bij te houden, zodat u en uw zorgverleners inzicht krijgen in uw gezondheidspatronen.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/auth/register" 
                className="px-6 py-3 rounded-md bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
              >
                Start vandaag nog
              </Link>
              <Link 
                href="#features" 
                className="px-6 py-3 rounded-md bg-white border border-purple-600 text-purple-600 font-medium hover:bg-purple-50 transition-colors"
              >
                Meer informatie
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <Image 
              src="/dashboard-preview.png" 
              alt="FibroGuardian Pro Dashboard Voorbeeld" 
              width={600} 
              height={400} 
              className="rounded-lg shadow-lg"
              priority
            />
          </div>
        </section>

        <section id="features" className="bg-purple-50 py-12 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-purple-900 mb-12">Speciaal ontworpen voor fibromyalgiepatiënten</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Taakbeheer</h3>
                <p className="text-gray-600">Plan, beheer en monitor uw dagelijkse activiteiten en houd uw energieniveau in balans.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Gezondheidsmetrieken</h3>
                <p className="text-gray-600">Volg uw pijn, vermoeidheid en andere symptomen om inzicht te krijgen in uw gezondheidspatronen.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-inzichten</h3>
                <p className="text-gray-600">Ontvang gepersonaliseerde inzichten en suggesties op basis van uw unieke gezondheidsgegevens.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-purple-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-between">
            <div className="w-full md:w-1/3 mb-8 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <Image 
                  src="/logo-white.png" 
                  alt="FibroGuardian Pro Logo" 
                  width={40} 
                  height={40} 
                  className="rounded-lg"
                />
                <span className="text-xl font-bold">FibroGuardian Pro</span>
              </div>
              <p className="text-purple-200">
                De meest complete app voor het beheren van fibromyalgie symptomen en dagelijkse activiteiten.
              </p>
            </div>
            
            <div className="w-full md:w-1/3 mb-8 md:mb-0">
              <h3 className="text-lg font-semibold mb-4">Snelle Links</h3>
              <ul className="space-y-2">
                <li><Link href="/auth/login" className="text-purple-200 hover:text-white transition-colors">Inloggen</Link></li>
                <li><Link href="/auth/register" className="text-purple-200 hover:text-white transition-colors">Registreren</Link></li>
                <li><Link href="/privacy" className="text-purple-200 hover:text-white transition-colors">Privacybeleid</Link></li>
                <li><Link href="/voorwaarden" className="text-purple-200 hover:text-white transition-colors">Gebruiksvoorwaarden</Link></li>
              </ul>
            </div>
            
            <div className="w-full md:w-1/3">
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-purple-200 mb-2">Vragen? Neem contact met ons op.</p>
              <a href="mailto:info@fibroguardian.be" className="text-white hover:underline">info@fibroguardian.be</a>
            </div>
          </div>
          
          <div className="border-t border-purple-800 mt-8 pt-8 text-center text-purple-300">
            <p>&copy; {new Date().getFullYear()} FibroGuardian Pro. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}