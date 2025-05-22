
// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskExecutionContainer from '@/containers/tasks/TaskExecutionContainer';
import { NotificationProvider } from '@/context/NotificationContext';
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { AuthProvider } from '@/components/auth/AuthProvider';

// Mock the Next.js router
jest.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn()
    }),
    usePathname: () => '/taken/123/start'
  };
});

// Mock the hooks
jest.mock('@/hooks/useMutations', () => ({
  useAddTaskLog: () => ({
    mutate: jest.fn((data, options) => {
      options.onSuccess({ id: 'mock-log-id' });
    }),
    isPending: false,
    error: null
  }),
  useUpdateTaskLog: () => ({
    mutate: jest.fn((data, options) => {
      options.onSuccess();
    }),
    isPending: false,
    error: null
  })
}));

jest.mock('@/hooks/useSupabaseQuery', () => ({
  useTask: () => ({
    data: {
      id: 'mock-task-id',
      titel: 'Test Taak',
      beschrijving: 'Dit is een test taak',
      duur: 30,
      type: 'taak',
      user_id: 'mock-user-id',
      herhaal_patroon: 'eenmalig',
      created_at: new Date(),
      updated_at: new Date()
    },
    isLoading: false,
    error: null,
    isError: false
  })
}));

// Mock the auth context
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'mock-user-id' },
    signOut: jest.fn(),
    isLoading: false
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children)
}));

// Mock the notification context
jest.mock('@/context/NotificationContext', () => ({
  useNotification: () => ({
    addNotification: jest.fn(),
    notifications: [],
    removeNotification: jest.fn()
  }),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children)
}));

describe('TaskExecutionContainer Component', () => {
  it('renders the task execution container correctly', () => {
    render(
      <ReactQueryProvider>
        <AuthProvider>
          <NotificationProvider>
            <TaskExecutionContainer taskId="mock-task-id" />
          </NotificationProvider>
        </AuthProvider>
      </ReactQueryProvider>
    );
    
    // Check if the task title is displayed
    expect(screen.getByText('Test Taak')).toBeInTheDocument();
  });

  it('handles starting and stopping a task', async () => {
    render(
      <ReactQueryProvider>
        <AuthProvider>
          <NotificationProvider>
            <TaskExecutionContainer taskId="mock-task-id" />
          </NotificationProvider>
        </AuthProvider>
      </ReactQueryProvider>
    );
    
    // Find and click the start button
    const startButton = screen.getByRole('button', { name: /start/i });
    fireEvent.click(startButton);
    
    // Check if the stop button appears
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    });
    
    // Click the stop button
    const stopButton = screen.getByRole('button', { name: /stop/i });
    fireEvent.click(stopButton);
    
    // Check if the feedback modal appears
    await waitFor(() => {
      expect(screen.getByText(/hoe voel je je/i)).toBeInTheDocument();
    });
  });

  it('handles submitting feedback after task completion', async () => {
    render(
      <ReactQueryProvider>
        <AuthProvider>
          <NotificationProvider>
            <TaskExecutionContainer taskId="mock-task-id" />
          </NotificationProvider>
        </AuthProvider>
      </ReactQueryProvider>
    );
    
    // Start and stop the task
    const startButton = screen.getByRole('button', { name: /start/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    });
    
    const stopButton = screen.getByRole('button', { name: /stop/i });
    fireEvent.click(stopButton);
    
    // Fill in the feedback form
    await waitFor(() => {
      expect(screen.getByText(/hoe voel je je/i)).toBeInTheDocument();
    });
    
    // Find and interact with the feedback form elements
    const painScoreInput = screen.getByLabelText(/pijnscore/i);
    fireEvent.change(painScoreInput, { target: { value: '7' } });
    
    const fatigueScoreInput = screen.getByLabelText(/vermoeidheidsscore/i);
    fireEvent.change(fatigueScoreInput, { target: { value: '8' } });
    
    const moodSelect = screen.getByLabelText(/stemming/i);
    fireEvent.change(moodSelect, { target: { value: 'goed' } });
    
    const noteInput = screen.getByLabelText(/notitie/i);
    fireEvent.change(noteInput, { target: { value: 'Dit was een goede oefening' } });
    
    // Submit the feedback
    const submitButton = screen.getByRole('button', { name: /opslaan/i });
    fireEvent.click(submitButton);
    
    // Check if the feedback was submitted successfully
    await waitFor(() => {
      // This would typically check for a success message or redirection
      // For now, we'll just check that the feedback modal is no longer visible
      expect(screen.queryByText(/hoe voel je je/i)).not.toBeInTheDocument();
    });
  });
});
