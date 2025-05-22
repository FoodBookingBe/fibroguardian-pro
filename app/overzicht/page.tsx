import React from 'react';

// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; // Old way
// import { cookies } from 'next/headers'; // Handled by getSupabaseServerComponentClient
import { getSupabaseServerComponentClient } from '@/lib/supabase-server'; // New way
import OverzichtClient from './overzicht-client';
import { User } from '@supabase/supabase-js'; // Import User type
import { Profile, Task, TaskLog, Reflectie } from '@/types'; // Import custom types

// Definieer interface voor data passing
interface OverzichtPageData {
  user: User;
  userProfile: Profile;
  tasks: Task[];
  taskLogs: TaskLog[];
  reflecties: Reflectie[];
  startOfWeek: string;
  endOfWeek: string;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

export default async function OverzichtPage() {
  const supabase = getSupabaseServerComponentClient(); // Use the new helper
  
  // Haal gebruikerssessie op - middleware zorgt al voor authenticatie
  // Use getUser() instead of getSession() for server components
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // Log session information for debugging
  console.log('[Server] OverzichtPage user check:', {
    hasUser: !!user,
    error: userError?.message
  });
  
  if (!user) {
    // Dit zou niet moeten gebeuren door middleware, maar voor de zekerheid
    console.log('[Server] No user found despite middleware check');
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">U bent niet ingelogd. <a href="/auth/login" className="underline">Log in</a> om deze pagina te bekijken.</p>
        </div>
      </div>
    );
  }
  
  // Haal gebruikersprofiel op
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    // Toon een foutmelding in plaats van redirect
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">Er is een fout opgetreden bij het ophalen van uw profiel.</p>
        </div>
      </div>
    );
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
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
  }
  
  // Haal task logs op voor de huidige week
  const { data: taskLogs, error: taskLogsError } = await supabase
    .from('task_logs')
    .select('*, tasks(titel)')
    .eq('user_id', user.id)
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
    .eq('user_id', user.id)
    .gte('datum', startOfWeek.toISOString().split('T')[0])
    .lte('datum', endOfWeek.toISOString().split('T')[0])
    .order('datum', { ascending: false });
  
  if (reflectiesError) {
    console.error('Error fetching reflecties:', reflectiesError);
  }
  
  // Gebruik de client component om de UI te renderen
  // Valideer voordat het wordt doorgegeven
  const pageData: OverzichtPageData = {
    user: user!, // We weten dat deze bestaat door eerdere check
    userProfile: profile as Profile, // Cast to Profile type
    tasks: (tasks || []) as Task[], // Cast to Task[]
    taskLogs: (taskLogs || []) as TaskLog[], // Cast to TaskLog[]
    reflecties: (reflecties || []) as Reflectie[], // Cast to Reflectie[]
    startOfWeek: startOfWeek.toISOString(),
    endOfWeek: endOfWeek.toISOString(),
  };

  // Log problemen in development maar niet in productie
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server] OverzichtPage data validation:', {
      hasUser: !!pageData.user,
      hasProfile: !!pageData.userProfile,
      tasksCount: pageData.tasks.length,
      logsCount: pageData.taskLogs.length,
      reflectiesCount: pageData.reflecties.length,
    });
  }

  return <OverzichtClient {...pageData} />;
}
