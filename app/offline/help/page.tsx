'use client';

import React from 'react';

import Image from 'next/image';
import Link from 'next/link';

export default function OfflineHelpPage(): JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/" className="text-purple-600 hover:text-purple-800 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <div className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="FibroGuardian Pro Logo" 
              width={40} 
              height={40} 
              className="mr-3"
            />
            <h1 className="text-2xl font-bold text-gray-800">Offline Hulp</h1>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-purple-800 mb-4">Wat kunt u doen in offline modus?</h2>
          <p className="text-gray-600 mb-6">
            FibroGuardian Pro is ontworpen om ook te werken wanneer u geen internetverbinding heeft. 
            Hier zijn de belangrijkste functies die beschikbaar zijn in offline modus:
          </p>
          
          <div className="space-y-6">
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-800 mb-2">Dagelijkse reflecties</h3>
              <p className="text-gray-600">
                U kunt uw dagelijkse reflecties blijven invullen, inclusief pijnscores, vermoeidheid en stemming. 
                Deze worden lokaal opgeslagen en automatisch gesynchroniseerd zodra u weer online bent.
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-800 mb-2">Taken en activiteiten</h3>
              <p className="text-gray-600">
                Bekijk uw geplande taken en markeer ze als voltooid. Nieuwe taaklogboeken worden lokaal opgeslagen 
                en gesynchroniseerd wanneer u weer verbinding heeft.
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-800 mb-2">Eerder bekeken gegevens</h3>
              <p className="text-gray-600">
                Pagina&apos;s en gegevens die u eerder heeft bekeken terwijl u online was, zijn beschikbaar in de cache. 
                Dit omvat uw profielgegevens, eerdere reflecties en taken.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-purple-800 mb-4">Veelgestelde vragen</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Worden mijn gegevens bewaard als ik offline ben?</h3>
              <p className="text-gray-600">
                Ja, alle gegevens die u invoert terwijl u offline bent, worden veilig opgeslagen in de lokale opslag van uw browser. 
                Ze worden automatisch gesynchroniseerd met de server zodra u weer online bent.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Wat gebeurt er als ik offline een reflectie invul?</h3>
              <p className="text-gray-600">
                Uw reflectie wordt lokaal opgeslagen en gemarkeerd voor synchronisatie. Zodra u weer online bent, 
                wordt deze automatisch naar de server verzonden. U hoeft niets extra&apos;s te doen.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Kan ik nieuwe taken aanmaken in offline modus?</h3>
              <p className="text-gray-600">
                Nee, voor het aanmaken van nieuwe taken is een internetverbinding vereist. U kunt wel bestaande taken bekijken en voltooien.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Hoe weet ik of ik online of offline ben?</h3>
              <p className="text-gray-600">
                FibroGuardian Pro toont een melding wanneer u offline gaat of weer online komt. 
                U kunt ook de netwerkstatus van uw apparaat controleren.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Wat moet ik doen als gegevens niet synchroniseren?</h3>
              <p className="text-gray-600">
                Als u weer online bent maar uw gegevens lijken niet te synchroniseren, probeer de pagina te vernieuwen. 
                Als het probleem aanhoudt, neem dan contact op met ondersteuning.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-purple-800 mb-4">Tips voor offline gebruik</h2>
          
          <ul className="space-y-2 text-gray-600 list-disc pl-5">
            <li>Zorg ervoor dat u regelmatig online gaat om uw gegevens te synchroniseren.</li>
            <li>Als u weet dat u offline gaat, bezoek dan eerst de belangrijkste pagina&apos;s die u nodig heeft.</li>
            <li>Gebruik de &quot;Vernieuwen&quot; knop op de offline pagina om te controleren of u weer online bent.</li>
            <li>Als u problemen ondervindt met synchronisatie, probeer de browser te sluiten en opnieuw te openen.</li>
            <li>Voor kritieke gegevens kunt u een screenshot maken als extra back-up.</li>
          </ul>
        </div>
        
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Terug naar startpagina
          </Link>
        </div>
      </div>
    </div>
  );
}
