import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import OverzichtClient from './overzicht-client';

export const dynamic = 'force-dynamic';

export default async function OverzichtPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Controleer of gebruiker is ingelogd
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }
  
  // Haal gebruikersprofiel op
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    redirect('/dashboard?error=profile_not_found');
  }
  
  // Haal taken op voor de huidige week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Zondag als start van de week
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Zaterdag als einde van de week
  endOfWeek.setHours(23, 59, 59, 999);
  
  // Haal taken op
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });
  
  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
  }
  
  // Haal task logs op voor de huidige week
  const { data: taskLogs, error: taskLogsError } = await supabase
    .from('task_logs')
    .select('*, tasks(titel)')
    .eq('user_id', session.user.id)
    .gte('start_tijd', startOfWeek.toISOString())
    .lte('eind_tijd', endOfWeek.toISOString())
    .order('start_tijd', { ascending: false });
  
  if (taskLogsError) {
    console.error('Error fetching task logs:', taskLogsError);
  }
  
  // Haal reflecties op voor de huidige week
  const { data: reflecties, error: reflectiesError } = await supabase
    .from('reflecties')
    .select('*')
    .eq('user_id', session.user.id)
    .gte('datum', startOfWeek.toISOString().split('T')[0])
    .lte('datum', endOfWeek.toISOString().split('T')[0])
    .order('datum', { ascending: false });
  
  if (reflectiesError) {
    console.error('Error fetching reflecties:', reflectiesError);
  }
  
  return (
    <div>
      <OverzichtClient 
        user={session.user}
        userProfile={profile}
        tasks={tasks || []}
        taskLogs={taskLogs || []}
        reflecties={reflecties || []}
        startOfWeek={startOfWeek.toISOString()}
        endOfWeek={endOfWeek.toISOString()}
      />
    </div>
  );
}
