import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

export default async function OverzichtPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Controleer of gebruiker is ingelogd
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('No session found, redirecting to login');
    return redirect('/auth/login');
  }
  
  // Haal gebruikersprofiel op
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    return redirect('/dashboard?error=profile_not_found');
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dag & Week Overzicht</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Week van {format(startOfWeek, 'd MMMM', { locale: nl })} tot {format(endOfWeek, 'd MMMM', { locale: nl })}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-purple-700 mb-1">Taken deze week</h3>
            <p className="text-2xl font-bold text-purple-800">
              {tasks?.length || 0}
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-blue-700 mb-1">Uitgevoerde taken</h3>
            <p className="text-2xl font-bold text-blue-800">
              {taskLogs?.length || 0}
            </p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-amber-700 mb-1">Reflecties</h3>
            <p className="text-2xl font-bold text-amber-800">
              {reflecties?.length || 0}
            </p>
          </div>
        </div>
        
        <p className="text-gray-600">
          Bekijk gedetailleerde statistieken en inzichten over uw taken, energie- en pijnniveaus.
          Gebruik de navigatie om te schakelen tussen dag- en weekweergave.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Recente Taken</h2>
          
          {!taskLogs || taskLogs.length === 0 ? (
            <p className="text-gray-500">Geen taken uitgevoerd deze week.</p>
          ) : (
            <div className="space-y-4">
              {taskLogs.slice(0, 3).map(log => (
                <div key={log.id} className="border-l-4 border-purple-500 pl-4 py-2">
                  <h4 className="font-medium text-gray-800">{log.tasks?.titel || 'Onbekende taak'}</h4>
                  <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
                    <span>
                      {format(parseISO(log.start_tijd), 'dd/MM - HH:mm')}
                    </span>
                    <span>•</span>
                    <span>Pijn: {log.pijn_score}/20</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Recente Reflecties</h2>
          
          {!reflecties || reflecties.length === 0 ? (
            <p className="text-gray-500">Geen reflecties toegevoegd deze week.</p>
          ) : (
            <div className="space-y-4">
              {reflecties.slice(0, 3).map(reflectie => (
                <div key={reflectie.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {format(parseISO(reflectie.datum), 'EEEE d MMMM', { locale: nl })}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-600">{reflectie.notitie}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
