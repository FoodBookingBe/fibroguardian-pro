'use client';
import React, { useState, useEffect, FormEvent } from 'react'; // Import React en FormEvent
// import { Button } from '@/components/ds/atoms/Button'; // Placeholder
// import { Card } from '@/components/ds/atoms/Card'; // Placeholder
import { useAuth } from '@/components/auth/AuthProvider'; 
import { useFeatureAccess } from '@/hooks/useFeatureAccess'; 
import { MessageSquare, X, ChevronUp, ChevronDown, Search, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  categories: string[];
}

// Voorbeeld FAQs, uitbreiden naar behoefte
const faqs: FAQItem[] = [
  {
    question: 'Hoe kan ik mijn symptomen bijhouden?',
    answer: 'Ga naar het "Dagboek" of "Taken" tabblad en selecteer een taak om te loggen, of maak een nieuwe log aan. U kunt pijn, vermoeidheid, slaapkwaliteit en andere relevante symptomen invoeren.',
    categories: ['symptomen', 'logboek', 'taken', 'beginners']
  },
  {
    question: 'Hoe verbind ik met mijn specialist?',
    answer: 'Navigeer naar "Mijn Specialisten" in het menu. Klik op "Specialist Uitnodigen" en vul het e-mailadres van uw zorgverlener in. Zij ontvangen een uitnodiging om veilig verbinding te maken met uw FibroGuardian Pro account.',
    categories: ['specialisten', 'verbinding', 'delen']
  },
  {
    question: 'Hoe kan ik mijn abonnement wijzigen of opzeggen?',
    answer: 'U kunt uw abonnement beheren via "Instellingen" > "Abonnement". Daar vindt u opties om uw plan te upgraden, downgraden, de factureringscyclus aan te passen, of uw abonnement op te zeggen.',
    categories: ['abonnement', 'betaling', 'account']
  },
  {
    question: 'Werkt de FibroGuardian Pro app ook offline?',
    answer: 'Ja, veel kernfunctionaliteiten zoals het loggen van symptomen en het bekijken van uw planning werken offline. Zodra u weer een internetverbinding heeft, worden uw gegevens automatisch gesynchroniseerd met de server.',
    categories: ['offline', 'technisch', 'synchronisatie']
  },
  {
    question: 'Hoe exporteer ik mijn gegevens?',
    answer: 'Ga naar de "Rapporten" sectie. Hier kunt u aangepaste rapporten genereren en uw gegevens exporteren naar PDF of CSV formaat voor eigen gebruik of om te delen met uw zorgverleners.',
    categories: ['gegevens', 'export', 'rapporten']
  },
  {
    question: 'Waar vind ik meer gedetailleerde hulp of handleidingen?',
    answer: 'Voor uitgebreide handleidingen en antwoorden op meer specifieke vragen, kunt u ons volledige Help Center bezoeken via de link onderaan deze widget.',
    categories: ['help', 'documentatie']
  }
];

// Basis Button component
const Button = ({ onClick, children, variant = 'primary', size = 'md', className: btnClassName = '', type = 'button', disabled, ...props }: any) => (
  <button 
    type={type}
    onClick={onClick} 
    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 disabled:opacity-60 ${btnClassName} ${variant === 'primary' ? 'bg-purple-600 text-white hover:bg-purple-700' : variant === 'ghost' ? 'text-gray-600 hover:bg-gray-100' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactFormData, setContactFormData] = useState({ subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, profile } = useAuth(); // Haal user en profile op
  const { hasAccess } = useFeatureAccess(); // Voor priority support check
  
  const filteredFAQs = searchQuery
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : faqs;
  
  const handleToggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };
  
  const handleContactSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/support/create-ticket', { // Aangepast endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactFormData,
          userEmail: user?.email, // E-mail van de ingelogde gebruiker
          userName: profile ? `${profile.voornaam} ${profile.achternaam}` : 'Niet ingelogd',
          userType: profile?.type,
          userId: user?.id,
        })
      });
      
      if (response.ok) {
        setContactFormData({ subject: '', message: '' });
        setShowContactForm(false);
        alert('Support ticket succesvol verzonden! We nemen zo snel mogelijk contact op.');
      } else {
        const errorData = await response.json();
        alert(`Fout bij verzenden: ${errorData.error || 'Probeer het later opnieuw.'}`);
      }
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      alert('Netwerkfout bij het verzenden van je ticket. Controleer je verbinding.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Sluit widget bij Escape toets
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <button
        className={`fixed bottom-5 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 ease-in-out ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open Hulp & Support"
        aria-expanded={isOpen}
      >
        <HelpCircle size={28} />
      </button>
      
      <div 
        className={`fixed bottom-5 right-5 z-50 w-[calc(100%-2.5rem)] max-w-sm bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        style={{ maxHeight: 'calc(100vh - 2.5rem - 1.25rem)' }} // Max hoogte minus margins
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-widget-title"
      >
        <header className="flex items-center justify-between bg-gray-100 p-3 border-b border-gray-200 rounded-t-xl">
          <h3 id="support-widget-title" className="font-semibold text-gray-800 text-md">Hulp & Ondersteuning</h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full"
            aria-label="Sluit support widget"
          >
            <X size={20} />
          </button>
        </header>
        
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Zoek in FAQs..."
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 space-y-2">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => (
              <div key={index} className="border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                <button
                  className="flex items-center justify-between w-full text-left py-2 text-sm font-medium text-gray-700 hover:text-purple-600 focus:outline-none"
                  onClick={() => handleToggleFAQ(index)}
                  aria-expanded={expandedFAQ === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span>{faq.question}</span>
                  {expandedFAQ === index ? (
                    <ChevronUp size={18} className="flex-shrink-0 text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="flex-shrink-0 text-gray-400" />
                  )}
                </button>
                {expandedFAQ === index && (
                  <div id={`faq-answer-${index}`} className="mt-1 pr-6 text-xs text-gray-600 leading-relaxed">
                    <p>{faq.answer}</p>
                    {/* <div className="mt-2 flex flex-wrap gap-1">
                      {faq.categories.map((cat, catIndex) => (
                        <span key={catIndex} className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[10px] rounded-full">{cat}</span>
                      ))}
                    </div> */}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Geen resultaten voor "{searchQuery}"</p>
              <p className="text-xs text-gray-400 mt-1">Probeer een andere zoekterm.</p>
            </div>
          )}
        </div>
        
        <footer className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          {showContactForm ? (
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <label htmlFor="support-subject" className="block text-xs font-medium text-gray-600 mb-0.5">Onderwerp</label>
                <input type="text" id="support-subject" className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500" value={contactFormData.subject} onChange={(e) => setContactFormData({...contactFormData, subject: e.target.value})} required />
              </div>
              <div>
                <label htmlFor="support-message" className="block text-xs font-medium text-gray-600 mb-0.5">Bericht</label>
                <textarea id="support-message" rows={3} className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500" value={contactFormData.message} onChange={(e) => setContactFormData({...contactFormData, message: e.target.value})} required></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowContactForm(false)} disabled={isSubmitting}>Annuleren</Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting} loading={isSubmitting}>
                  {isSubmitting ? 'Verzenden...' : 'Verzenden'}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-xs text-gray-600 mb-2 text-center">
                Geen antwoord gevonden? Wij helpen u graag verder.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open('https://fibroguardian.be/help-center', '_blank')} className="w-full border-gray-300">Help Center</Button>
                <Button variant="primary" size="sm" onClick={() => setShowContactForm(true)} className="w-full">Contactformulier</Button>
              </div>
              {hasAccess('priority-support') && (
                <p className="mt-2 text-center text-[11px] text-purple-600 bg-purple-50 p-1.5 rounded-md">U heeft prioriteitsondersteuning!</p>
              )}
            </>
          )}
        </footer>
      </div>
    </>
  );
}
