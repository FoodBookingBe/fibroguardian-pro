import React from 'react';

// app/taken/[taskId]/page.tsx
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getSupabaseServerComponentClient } from '@/lib/supabase-server';
import { Task, TaskLog } from '@/types';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import TaskItemCard, { TaskWithStatusAndFeedbackForCard } from '@/components/tasks/TaskItemCard'; // Voor weergave

interface TaskDetailPageProps {
  params: {
    taskId: string;
  };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const taskId = params.taskId;
  const supabase = getSupabaseServerComponentClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Haal de taak op
  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .select<string, Task>('*')
    .eq('id', taskId)
    .eq('user_id', user.id) // Zorg dat gebruiker eigenaar is
    .single();

  if (taskError || !taskData) {
    console.error(`TaskDetailPage: Task with ID ${taskId} not found for user ${user.id}. Error:`, taskError);
    notFound();
  }

  // Haal de meest recente log op voor status en feedback (optioneel, kan ook in TaskItemCard als die client-side data haalt)
  const { data: logsData, error: logsError } = await supabase
    .from('task_logs')
    .select<string, TaskLog>('*')
    .eq('task_id', taskId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (logsError) {
    console.warn(`TaskDetailPage: Error fetching logs for task ${taskId}:`, logsError.message);
  }

  const latestLog = logsData?.[0];
  const status: 'voltooid' | 'openstaand' = latestLog?.eind_tijd ? 'voltooid' : 'openstaand';
  const voltooidOpDatum = status === 'voltooid' ? latestLog?.eind_tijd : null;

  const enrichedTask: TaskWithStatusAndFeedbackForCard = {
    ...(taskData as Task),
    status,
    voltooid_op: voltooidOpDatum,
    feedback: latestLog ? {
      pijn_score: latestLog.pijn_score,
      vermoeidheid_score: latestLog.vermoeidheid_score,
      energie_voor: latestLog.energie_voor,
      energie_na: latestLog.energie_na,
      stemming: latestLog.stemming,
      notitie: latestLog.notitie,
      hartslag: latestLog.hartslag,
    } : undefined,
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/taken" className="text-purple-600 hover:text-purple-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Terug naar Mijn Taken
          </Link>
        </div>
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Taakdetails</h1>
        </header>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <TaskItemCard task={enrichedTask} showActions={true} /> 
          {/* showActions kan hier true zijn om bijv. edit/delete knoppen te tonen die naar de juiste routes linken */}
        </div>
        {/* Hier kunnen later nog logboeken etc. getoond worden */}
      </div>
    </DashboardLayout>
  );
}
