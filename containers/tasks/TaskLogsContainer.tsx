'use client';
import React, { useState, useCallback } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import TaskLogsPresentational from '@/components/tasks/TaskLogsPresentational';
import { useTaskLogs, useRecentLogs } from '@/hooks/useSupabaseQuery';
import { ErrorMessage } from '@/lib/error-handler';
import { RecentLogWithTaskTitle } from '@/types';

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
}: TaskLogsContainerProps): JSX.Element { // Added return type
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
  
  // memoizedFormatDate is no longer needed here as formatDate is imported directly in Presentational
  // memoizedCalculateDuration is moved to Presentational
  
  const memoizedToggleExpand = useCallback((id: string) => {
    setExpandedLogId(prevId => (prevId === id ? null : id));
  }, []);
  
  return (
    <TaskLogsPresentational
      logsToDisplay={logsToDisplay}
      isLoading={isLoading}
      isError={isError}
      error={error as ErrorMessage | null}
      expandedLogId={expandedLogId}
      onToggleExpand={memoizedToggleExpand}
      // formatDate prop removed
      // calculateDuration prop removed
      limit={limit}
      taskId={taskId}
      className={className}
      title={title} // Pass down the title
    />
  );
}
