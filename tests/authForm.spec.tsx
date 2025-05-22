
// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthForm from '@/components/auth/AuthForm';
import { NotificationProvider } from '@/context/NotificationContext';
import { ReactQueryProvider } from '@/lib/react-query-provider';

// Mock the Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn()
    }),
    usePathname: () => '/auth/login'
  };
});

// Mock the Supabase client
jest.mock('@/lib/supabase-client', () => ({
  getSupabaseBrowserClient: jest.fn().mockReturnValue({
    auth: {
      signInWithPassword: jest.fn().mockImplementation(({ email, password }) => {
        if (email === 'test@example.com' && password === 'password123') {
          return Promise.resolve({
            data: { user: { id: 'test-user-id' } },
            error: null
          });
        }
        return Promise.resolve({
          data: { user: null },
          error: { message: 'Invalid login credentials' }
        });
      }),
      signUp: jest.fn().mockImplementation(({ email, password }) => {
        if (email && password) {
          return Promise.resolve({
            data: { user: { id: 'new-user-id' } },
            error: null
          });
        }
        return Promise.resolve({
          data: { user: null },
          error: { message: 'Registration failed' }
        });
      })
    }
  })
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

describe('AuthForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login mode correctly', () => {
    render(
      <ReactQueryProvider>
        <NotificationProvider>
          <AuthForm initialIsLogin={true} />
        </NotificationProvider>
      </ReactQueryProvider>
    );
    // Check for the heading that contains "Inloggen"
    expect(screen.getByRole('heading', { name: /Inloggen/i })).toBeInTheDocument();
    // Check for the submit button with text "Inloggen"
    expect(screen.getByRole('button', { name: /^Inloggen$/i })).toBeInTheDocument();
    // Check that the switch mode button contains text about registration
    expect(screen.getByText(/Nog geen account\? Registreer hier/i)).toBeInTheDocument();
  });

  it('renders registration mode correctly', () => {
    render(
      <ReactQueryProvider>
        <NotificationProvider>
          <AuthForm initialIsLogin={false} />
        </NotificationProvider>
      </ReactQueryProvider>
    );
    // Check for the heading that contains "Registreren"
    expect(screen.getByRole('heading', { name: /Registreren/i })).toBeInTheDocument();
    // Check for the submit button with text "Registreren"
    expect(screen.getByRole('button', { name: /^Registreren$/i })).toBeInTheDocument();
    // Check that the switch mode button contains text about login
    expect(screen.getByText(/Al een account\? Log hier in/i)).toBeInTheDocument();
  });

  it('switches between login and registration modes', () => {
    render(
      <ReactQueryProvider>
        <NotificationProvider>
          <AuthForm initialIsLogin={true} />
        </NotificationProvider>
      </ReactQueryProvider>
    );
    
    // Initially in login mode
    expect(screen.getByRole('heading', { name: /Inloggen/i })).toBeInTheDocument();
    
    // Click the switch mode button
    fireEvent.click(screen.getByText(/Nog geen account\? Registreer hier/i));
    
    // Now in registration mode
    expect(screen.getByRole('heading', { name: /Registreren/i })).toBeInTheDocument();
    
    // Click the switch mode button again
    fireEvent.click(screen.getByText(/Al een account\? Log hier in/i));
    
    // Back to login mode
    expect(screen.getByRole('heading', { name: /Inloggen/i })).toBeInTheDocument();
  });

  it('validates form fields in login mode', async () => {
    render(
      <ReactQueryProvider>
        <NotificationProvider>
          <AuthForm initialIsLogin={true} />
        </NotificationProvider>
      </ReactQueryProvider>
    );
    
    // Submit the form without filling in any fields
    fireEvent.click(screen.getByRole('button', { name: /^Inloggen$/i }));
    
    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText(/E-mail is verplicht/i)).toBeInTheDocument();
      expect(screen.getByText(/Wachtwoord is verplicht/i)).toBeInTheDocument();
    });
  });

  it('validates form fields in registration mode', async () => {
    render(
      <ReactQueryProvider>
        <NotificationProvider>
          <AuthForm initialIsLogin={false} />
        </NotificationProvider>
      </ReactQueryProvider>
    );
    
    // Submit the form without filling in any fields
    fireEvent.click(screen.getByRole('button', { name: /^Registreren$/i }));
    
    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText(/Voornaam is verplicht/i)).toBeInTheDocument();
      expect(screen.getByText(/Achternaam is verplicht/i)).toBeInTheDocument();
      expect(screen.getByText(/E-mail is verplicht/i)).toBeInTheDocument();
      expect(screen.getByText(/Wachtwoord is verplicht/i)).toBeInTheDocument();
    });
  });

  it('submits login form with valid credentials', async () => {
    render(
      <ReactQueryProvider>
        <NotificationProvider>
          <AuthForm initialIsLogin={true} />
        </NotificationProvider>
      </ReactQueryProvider>
    );
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/E-mailadres/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/Wachtwoord/i), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /^Inloggen$/i }));
    
    // Check that the login function was called with the correct credentials
    // Note: We're not checking for navigation since AuthProvider handles that now
    await waitFor(() => {
      const mockSupabase = require('@/lib/supabase-client').getSupabaseBrowserClient();
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('submits registration form with valid data', async () => {
    render(
      <ReactQueryProvider>
        <NotificationProvider>
          <AuthForm initialIsLogin={false} />
        </NotificationProvider>
      </ReactQueryProvider>
    );
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Voornaam/i), {
      target: { value: 'Test' }
    });
    
    fireEvent.change(screen.getByLabelText(/Achternaam/i), {
      target: { value: 'User' }
    });
    
    fireEvent.change(screen.getByLabelText(/E-mailadres/i), {
      target: { value: 'newuser@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/Wachtwoord/i), {
      target: { value: 'password123' }
    });
    
    // Select user type (now using radio buttons)
    fireEvent.click(screen.getByLabelText(/Patiënt/i));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /^Registreren$/i }));
    
    // Check that the registration function was called with correct data
    await waitFor(() => {
      const mockSupabase = require('@/lib/supabase-client').getSupabaseBrowserClient();
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: expect.any(String),
          data: {
            voornaam: 'Test',
            achternaam: 'User',
            type: 'patient'
          }
        }
      });
    });
  });
});
