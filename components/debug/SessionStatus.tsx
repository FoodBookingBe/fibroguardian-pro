'use client';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase'; // Corrected import path

export default function SessionStatus() {
  const [status, setStatus] = useState<string>('Checking...');
  
  useEffect(() => {
    async function checkSession() {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setStatus(`Error: ${error.message}`);
      } else if (data.session) {
        setStatus(`Active session: ${data.session.user.email}`);
      } else {
        setStatus('No active session found');
      }
    }
    
    checkSession();
  }, []);
  
  return (
    <div className="p-2 bg-gray-100 text-sm text-gray-700 rounded mb-4">
      <strong>Session Debug:</strong> {status}
    </div>
  );
}