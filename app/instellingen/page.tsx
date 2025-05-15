import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
// import ProfileForm from '@/components/settings/ProfileForm';
// import AccountSettings from '@/components/settings/AccountSettings';
// import NotificationSettings from '@/components/settings/NotificationSettings';

export default async function InstellingenPage() {
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
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch user profile for settings
  // const { data: profile, error } = await supabase
  //   .from('profiles')
  //   .select('*')
  //   .eq('id', user.id)
  //   .single();

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Instellingen</h1>
      </header>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Profiel</h2>
          {/* <ProfileForm profile={profile} userId={user.id} /> */}
          <p>Profielinstellingen komen hier. (Component: `ProfileForm`)</p>
          <Link href="/instellingen/profiel" className="text-purple-600 hover:underline">Bewerk Profiel</Link>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Account</h2>
          {/* <AccountSettings user={user} /> */}
          <p>Accountinstellingen (bv. wachtwoord wijzigen, e-mail wijzigen) komen hier.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Notificaties</h2>
          {/* <NotificationSettings userId={user.id} /> */}
          <p>Notificatie-instellingen komen hier.</p>
        </section>
      </div> {/* Closing for div className="space-y-8" */}
    </div> {/* Closing for div className="container..." */}
  );
}