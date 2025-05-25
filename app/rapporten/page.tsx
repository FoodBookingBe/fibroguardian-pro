
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
// import RapportList from '@/components/rapporten/RapportList'; // Assuming a component to list reports
import DashboardLayout from '@/components/layout/DashboardLayout'; // Import DashboardLayout
import RapportGeneratorContainer from '@/containers/rapporten/RapportGeneratorContainer'; // Use the container

export default async function RapportenPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch existing reports for the user (example)
  // const { data: rapporten, error } = await supabase
  //   .from('rapporten') // Assuming a 'rapporten' table
  //   .select('*')
  //   .eq('user_id', user.id)
  //   .order('created_at', { ascending: false });

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Mijn Rapporten</h1>
          <Link href="/rapporten/nieuw" className="btn-primary">
            Nieuw Rapport
          </Link>
        </header>
        <RapportGeneratorContainer />
        {/* <RapportList rapporten={rapporten || []} /> */}
        {/* <p>Hier komt de functionaliteit voor het beheren en genereren van rapporten.</p>
      <p>Veronderstelt componenten zoals `RapportGenerator` en `RapportList`.</p> */}
      </div>
    </DashboardLayout>
  );
}
