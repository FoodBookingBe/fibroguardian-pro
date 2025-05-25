'use client';

import { useEffect, useState } from 'react';

import { _useAuth as useAuth } from '@/components/auth/AuthProvider';
import { AlertMessage } from '@/components/common/AlertMessage';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

// Types for the Specialist Intelligence Dashboard
interface Patient {
  id: string;
  voornaam: string;
  achternaam: string;
  email: string;
  avatar_url?: string;
  last_activity?: string;
  risk_score?: number;
}

interface SymptomPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  severity: number;
  affected_patients: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface TreatmentAnalysis {
  id: string;
  treatment_name: string;
  success_rate: number;
  patient_count: number;
  avg_improvement: number;
  side_effects: string[];
}

interface PredictiveAlert {
  id: string;
  patient_id: string;
  patient_name: string;
  alert_type: 'symptom_flare' | 'treatment_opportunity' | 'risk_factor';
  description: string;
  confidence: number;
  recommended_action?: string;
  urgency: 'low' | 'medium' | 'high';
}

interface KnowledgeGap {
  id: string;
  topic: string;
  description: string;
  relevance_score: number;
  patient_count: number;
  suggested_resources?: string[];
}

interface SpecialistAIDashboardData {
  criticalPatients: Patient[];
  trendingPatterns: SymptomPattern[];
  treatmentEffectiveness: TreatmentAnalysis[];
  predictiveAlerts: PredictiveAlert[];
  knowledgeGaps: KnowledgeGap[];
}

interface SpecialistIntelligenceDashboardProps {
  className?: string;
}

/**
 * Specialist Intelligence Dashboard component
 * Provides AI-driven insights for specialists to better manage their patients
 */
export default function SpecialistIntelligenceDashboard({
  className = ''
}: SpecialistIntelligenceDashboardProps): JSX.Element {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<SpecialistAIDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('alerts');

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setError(null);

        const supabase = getSupabaseBrowserClient();

        // Check if user is a specialist
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('type')
          .eq('id', user.id)
          .single();

        if (profileError || !profile || profile.type !== 'specialist') {
          throw new Error('Alleen specialisten hebben toegang tot dit dashboard');
        }

        // In a real implementation, this would call the AI service
        // For now, we'll simulate the data

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulated dashboard data
        const simulatedData: SpecialistAIDashboardData = {
          criticalPatients: [
            {
              id: '1',
              voornaam: 'Emma',
              achternaam: 'Jansen',
              email: 'emma.jansen@example.com',
              risk_score: 0.85
            },
            {
              id: '2',
              voornaam: 'Thomas',
              achternaam: 'de Vries',
              email: 'thomas.devries@example.com',
              risk_score: 0.72
            }
          ],
          trendingPatterns: [
            {
              id: '1',
              name: 'Ochtendstijfheid',
              description: 'Toenemende stijfheid in de ochtend, vooral in de onderrug',
              frequency: 0.68,
              severity: 0.75,
              affected_patients: 12,
              trend: 'increasing'
            },
            {
              id: '2',
              name: 'Vermoeidheid na lichte inspanning',
              description: 'Extreme vermoeidheid na korte periodes van activiteit',
              frequency: 0.82,
              severity: 0.65,
              affected_patients: 18,
              trend: 'stable'
            }
          ],
          treatmentEffectiveness: [
            {
              id: '1',
              treatment_name: 'Dagelijkse stretching routine',
              success_rate: 0.76,
              patient_count: 23,
              avg_improvement: 0.42,
              side_effects: ['Lichte spierpijn', 'Tijdelijke toename van stijfheid']
            },
            {
              id: '2',
              treatment_name: 'Mindfulness meditatie',
              success_rate: 0.68,
              patient_count: 15,
              avg_improvement: 0.35,
              side_effects: []
            }
          ],
          predictiveAlerts: [
            {
              id: '1',
              patient_id: '1',
              patient_name: 'Emma Jansen',
              alert_type: 'symptom_flare',
              description: 'Hoog risico op symptoomverergering binnen 48 uur gebaseerd op recente activiteitspatronen en weersverandering',
              confidence: 0.82,
              recommended_action: 'Preventieve rustperiode aanbevelen en pijnmedicatie aanpassen',
              urgency: 'high'
            },
            {
              id: '2',
              patient_id: '3',
              patient_name: 'Lucas Bakker',
              alert_type: 'treatment_opportunity',
              description: 'Gunstig moment voor het introduceren van hydrotherapie gebaseerd op recente symptoomverbetering',
              confidence: 0.75,
              recommended_action: 'Hydrotherapie sessies voorstellen tijdens volgende afspraak',
              urgency: 'medium'
            }
          ],
          knowledgeGaps: [
            {
              id: '1',
              topic: 'Voedingsinterventies',
              description: 'Gebrek aan specifieke informatie over anti-inflammatoire diëten voor fibromyalgie',
              relevance_score: 0.78,
              patient_count: 8,
              suggested_resources: ['Recente studies over mediterraan dieet en chronische pijn', 'Voedingsrichtlijnen voor auto-immuunziekten']
            },
            {
              id: '2',
              topic: 'Slaapkwaliteit verbetering',
              description: 'Beperkte kennis over niet-medicinale slaapinterventies',
              relevance_score: 0.85,
              patient_count: 14,
              suggested_resources: ['CBT-I protocollen', 'Slaaphygiëne best practices']
            }
          ]
        };

        setDashboardData(simulatedData);
      } catch (err) {
        console.error('Error fetching specialist dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Kon dashboard gegevens niet laden');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Specialist Intelligence Dashboard</h2>
        <SkeletonLoader count={5} type="card" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
        <AlertMessage
          type="error"
          title="Fout bij laden dashboard"
          message={error}
        />
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Specialist Intelligence Dashboard</h2>
        <p className="text-gray-500">Geen gegevens beschikbaar. Probeer het later opnieuw.</p>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
      <h2 className="mb-6 text-xl font-semibold text-gray-800">Specialist Intelligence Dashboard</h2>

      {/* Dashboard Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${activeTab === 'alerts'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
          >
            Alerts & Voorspellingen
          </button>
          <button
            onClick={() => setActiveTab('patterns')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${activeTab === 'patterns'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
          >
            Symptoompatronen
          </button>
          <button
            onClick={() => setActiveTab('treatments')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${activeTab === 'treatments'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
          >
            Behandeleffectiviteit
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${activeTab === 'knowledge'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
          >
            Kennishiaten
          </button>
        </nav>
      </div>

      {/* Alerts & Predictions Tab */}
      {activeTab === 'alerts' && (
        <div>
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Kritieke Patiënten</h3>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Patiënt
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Risicoscore
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actie
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {dashboardData.criticalPatients.map(patient => (
                    <tr key={patient.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {patient.avatar_url ? (
                              <img className="h-10 w-10 rounded-full" src={patient.avatar_url} alt="" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-800">
                                {patient.voornaam.charAt(0)}{patient.achternaam.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{patient.voornaam} {patient.achternaam}</div>
                            <div className="text-sm text-gray-500">{patient.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className={`mr-2 h-2.5 w-2.5 rounded-full ${(patient.risk_score || 0) > 0.7 ? 'bg-red-500' :
                              (patient.risk_score || 0) > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                          <span className={`text-sm ${(patient.risk_score || 0) > 0.7 ? 'text-red-800' :
                              (patient.risk_score || 0) > 0.4 ? 'text-yellow-800' : 'text-green-800'
                            }`}>
                            {formatPercentage(patient.risk_score || 0)}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <a href={`/specialisten/patient/${patient.id}`} className="text-purple-600 hover:text-purple-900">
                          Details bekijken
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-medium text-gray-900">Voorspellende Alerts</h3>
            <div className="space-y-4">
              {dashboardData.predictiveAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`rounded-lg border p-4 ${alert.urgency === 'high' ? 'border-red-200 bg-red-50' :
                      alert.urgency === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                        'border-blue-200 bg-blue-50'
                    }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-base font-medium text-gray-900">
                      {alert.patient_name} - {
                        alert.alert_type === 'symptom_flare' ? 'Symptoomverergering' :
                          alert.alert_type === 'treatment_opportunity' ? 'Behandelkans' :
                            'Risicofactor'
                      }
                    </h4>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${alert.urgency === 'high' ? 'bg-red-100 text-red-800' :
                        alert.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                      }`}>
                      {alert.urgency === 'high' ? 'Hoge urgentie' :
                        alert.urgency === 'medium' ? 'Gemiddelde urgentie' :
                          'Lage urgentie'}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-gray-700">{alert.description}</p>
                  {alert.recommended_action && (
                    <p className="mb-2 text-sm font-medium text-gray-900">
                      Aanbevolen actie: {alert.recommended_action}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Betrouwbaarheid: {formatPercentage(alert.confidence)}
                    </span>
                    <a
                      href={`/specialisten/patient/${alert.patient_id}`}
                      className="text-sm font-medium text-purple-600 hover:text-purple-900"
                    >
                      Patiënt bekijken
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Symptom Patterns Tab */}
      {activeTab === 'patterns' && (
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Trending Symptoompatronen</h3>
          <div className="space-y-6">
            {dashboardData.trendingPatterns.map(pattern => (
              <div key={pattern.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-base font-medium text-gray-900">{pattern.name}</h4>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${pattern.trend === 'increasing' ? 'bg-red-100 text-red-800' :
                      pattern.trend === 'decreasing' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                    {pattern.trend === 'increasing' ? 'Toenemend' :
                      pattern.trend === 'decreasing' ? 'Afnemend' :
                        'Stabiel'}
                  </span>
                </div>
                <p className="mb-4 text-sm text-gray-700">{pattern.description}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <p className="text-xs text-gray-500">Frequentie</p>
                    <p className="text-lg font-semibold text-gray-900">{formatPercentage(pattern.frequency)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <p className="text-xs text-gray-500">Ernst</p>
                    <p className="text-lg font-semibold text-gray-900">{formatPercentage(pattern.severity)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <p className="text-xs text-gray-500">Getroffen patiënten</p>
                    <p className="text-lg font-semibold text-gray-900">{pattern.affected_patients}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Treatment Effectiveness Tab */}
      {activeTab === 'treatments' && (
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Behandeleffectiviteit</h3>
          <div className="space-y-6">
            {dashboardData.treatmentEffectiveness.map(treatment => (
              <div key={treatment.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-2 text-base font-medium text-gray-900">{treatment.treatment_name}</h4>
                <div className="mb-4 grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <p className="text-xs text-gray-500">Succespercentage</p>
                    <p className="text-lg font-semibold text-gray-900">{formatPercentage(treatment.success_rate)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <p className="text-xs text-gray-500">Aantal patiënten</p>
                    <p className="text-lg font-semibold text-gray-900">{treatment.patient_count}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <p className="text-xs text-gray-500">Gem. verbetering</p>
                    <p className="text-lg font-semibold text-gray-900">{formatPercentage(treatment.avg_improvement)}</p>
                  </div>
                </div>
                {treatment.side_effects.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Bijwerkingen:</p>
                    <ul className="list-inside list-disc text-sm text-gray-600">
                      {treatment.side_effects.map((effect, index) => (
                        <li key={index}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Knowledge Gaps Tab */}
      {activeTab === 'knowledge' && (
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Kennishiaten</h3>
          <div className="space-y-6">
            {dashboardData.knowledgeGaps.map(gap => (
              <div key={gap.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-base font-medium text-gray-900">{gap.topic}</h4>
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                    Relevantie: {formatPercentage(gap.relevance_score)}
                  </span>
                </div>
                <p className="mb-3 text-sm text-gray-700">{gap.description}</p>
                <p className="text-sm text-gray-600">Betreft {gap.patient_count} patiënten</p>

                {gap.suggested_resources && gap.suggested_resources.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">Aanbevolen bronnen:</p>
                    <ul className="list-inside list-disc text-sm text-gray-600">
                      {gap.suggested_resources.map((resource, index) => (
                        <li key={index}>{resource}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4">
                  <a
                    href="/specialisten/kennisbank"
                    className="text-sm font-medium text-purple-600 hover:text-purple-900"
                  >
                    Kennisbank raadplegen
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
