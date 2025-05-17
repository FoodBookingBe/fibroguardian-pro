'use client';
import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTaskLogs, useRecentLogs, RecentLogWithTaskTitle } from '@/hooks/useSupabaseQuery';
import TaskLogsPresentational from '@/components/tasks/TaskLogsPresentational';
import { ErrorMessage } from '@/lib/error-handler';

interface TaskLogsContainerProps {
  userId?: string; 
  taskId?: string; 
  limit?: number; 
  className?: string;
  title?: string; // Allow custom title to be passed to presentational
}

export default function TaskLogsContainer({ 
  userId: propUserId, 
  taskId, 
  limit = 10, 
  className = '',
  title 
}: TaskLogsContainerProps) {
  const { user: authUser } = useAuth();
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const effectiveUserId = propUserId || authUser?.id;

  const { 
    data: taskSpecificLogs, 
    isLoading: isLoadingTaskLogs, 
    error: taskLogsError, 
    isError: isTaskLogsError 
  } = useTaskLogs(taskId, { enabled: !!taskId });

  const { 
    data: recentUserLogs, 
    isLoading: isLoadingRecentLogs, 
    error: recentLogsError, 
    isError: isRecentLogsError 
  } = useRecentLogs(effectiveUserId, limit, { enabled: !taskId && !!effectiveUserId });

  const isLoading = taskId ? isLoadingTaskLogs : isLoadingRecentLogs;
  const isError = taskId ? isTaskLogsError : isRecentLogsError;
  const error = taskId ? taskLogsError : recentLogsError;
  const logsToDisplay: RecentLogWithTaskTitle[] = (taskId ? taskSpecificLogs : recentUserLogs) || [];
  
  const formatDate = (dateString: Date | string | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-BE', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  
  const calculateDuration = (startTime?: Date | string, endTime?: Date | string): string => {
    if (!startTime || !endTime) return 'Onbekend';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    if (durationMs < 0) return 'Ongeldig'; // Should not happen
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const toggleExpand = (id: string) => {
    setExpandedLogId(prevId => (prevId === id ? null : id));
  };
  
  return (
    <TaskLogsPresentational
      logsToDisplay={logsToDisplay}
      isLoading={isLoading}
      isError={isError}
      error={error as ErrorMessage | null}
      expandedLogId={expandedLogId}
      onToggleExpand={toggleExpand}
      formatDate={formatDate}
      calculateDuration={calculateDuration}
      limit={limit}
      taskId={taskId}
      className={className}
      title={title} // Pass down the title
    />
  );
}