
import DashboardLayout from '@/components/layout/DashboardLayout';
import PatientAllTasksList from '@/components/specialisten/PatientAllTasksList'; // Importeer nieuwe lijst
import PatientInsightCard from '@/components/specialisten/PatientInsightCard';
import { getSupabaseServerComponentClient } from '@/lib/supabase-server';
import { Profile } from '@/types'; // Task niet meer direct nodig hier
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PatientDetailPageProps {
  params: {
    id: string; // Dit is de patient.id uit de URL
  };
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const supabase = getSupabaseServerComponentClient();
  const patientId = params.id;

  const { data: { user: specialistUser }, error: specialistUserError } = await supabase.auth.getUser();

  if (specialistUserError || !specialistUser) {
    console.error('PatientDetailPage: Specialist not authenticated.', specialistUserError);
    // DashboardLayout of middleware zou moeten redirecten als niet ingelogd
    return notFound();
  }

  // 1. Controleer of de ingelogde specialist gekoppeld is aan deze patiënt
  const { data: connection, error: connectionError } = await supabase
    .from('specialist_patienten')
    .select('patient_id')
    .eq('specialist_id', specialistUser.id)
    .eq('patient_id', patientId)
    .maybeSingle();

  if (connectionError) {
    console.error(`PatientDetailPage: Error checking specialist-patient connection for patient ${patientId}:`, connectionError);
    return <DashboardLayout><div className="p-4">Fout bij het controleren van patiënttoegang.</div></DashboardLayout>;
  }

  if (!connection) {
    console.warn(`PatientDetailPage: Specialist ${specialistUser.id} is niet gekoppeld aan patient ${patientId}. Toegang geweigerd.`);
    // Je kunt hier een specifiekere "geen toegang" pagina tonen of redirecten
    return notFound();
  }

  // 2. Haal het profiel van de patiënt op
  // De RLS policy "Specialisten kunnen profielen van gekoppelde patienten zien" zou dit moeten toestaan
  const { data: patientProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', patientId)
    .single();

  if (profileError || !patientProfile) {
    console.error(`PatientDetailPage: Patient profile with ID ${patientId} not found.`, profileError);
    return notFound();
  }

  const patient = patientProfile as Profile;

  // De taken worden nu client-side gehaald in PatientAllTasksList en PatientInsightCard
  // We hoeven ze hier niet meer server-side op te halen, tenzij voor een snelle, niet-gedetailleerde weergave.
  // Voor nu verwijderen we de server-side task fetch hier om dubbel werk te voorkomen.

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/specialisten/patienten" className="text-purple-600 hover:text-purple-800">&larr; Terug naar patiëntenlijst</Link>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800 mb-4">
            Patiënt Details: {patient.voornaam} {patient.achternaam}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p><strong>Email:</strong> {patient.email || 'N/A'}</p>
            <p><strong>Type:</strong> {patient.type}</p>
            <p><strong>Postcode:</strong> {patient.postcode || 'N/A'}</p>
            <p><strong>Gemeente:</strong> {patient.gemeente || 'N/A'}</p>
            <p><strong>Geboortedatum:</strong> {patient.geboortedatum ? new Date(patient.geboortedatum).toLocaleDateString('nl-BE') : 'N/A'}</p>
            <p><strong>Geregistreerd op:</strong> {new Date(patient.created_at).toLocaleDateString('nl-BE')}</p>
          </div>
        </div>

        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Alle Toegewezen Taken</h2>
          {/* Client-side component voor het tonen van alle taken met details */}
          <PatientAllTasksList patientId={patientId} specialistId={specialistUser.id} />
        </div>

        {/* Sectie voor gedetailleerde inzichten (blijft PatientInsightCard gebruiken) */}
        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Gedetailleerde Inzichten</h2>
          <PatientInsightCard patientId={patientId} specialistId={specialistUser.id} />
        </div>
      </div>
    </DashboardLayout>
  );
}
