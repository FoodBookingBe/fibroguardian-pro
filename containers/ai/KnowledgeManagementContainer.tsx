'use client';

import { useEffect, useState } from 'react';

import KnowledgeEntryForm from '@/components/ai/KnowledgeEntryForm';
import { _useAuth as useAuth } from '@/components/auth/AuthProvider';
import { AlertMessage } from '@/components/common/AlertMessage';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { ExpertKnowledge } from '@/types/ai';

interface KnowledgeManagementContainerProps {
  className?: string;
}

/**
 * Container component for the Knowledge Management System
 * Displays a list of knowledge entries and a form to add new entries
 */
export default function KnowledgeManagementContainer({
  className = ''
}: KnowledgeManagementContainerProps): JSX.Element {
  const { user } = useAuth();
  const [knowledgeEntries, setKnowledgeEntries] = useState<ExpertKnowledge[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch knowledge entries
  const fetchKnowledgeEntries = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();

      // Get user role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('type')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Kon gebruikersprofiel niet ophalen');
      }

      setUserRole(profileData.type);

      // Fetch knowledge entries based on role
      let query = supabase
        .from('expert_knowledge')
        .select('*');

      if (profileData.type === 'specialist') {
        // Specialists can see their own entries and approved entries
        query = query.or(`specialist_id.eq.${user.id},is_approved.eq.true`);
      } else if (profileData.type === 'admin') {
        // Admins can see all entries
        // No additional filter needed
      } else {
        // Regular users can only see approved entries
        query = query.eq('is_approved', true);
      }

      // Order by creation date
      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setKnowledgeEntries(data as ExpertKnowledge[]);
    } catch (err) {
      console.error('Error fetching knowledge entries:', err);
      setError('Kon kennisbank niet laden');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setShowForm(false);
    fetchKnowledgeEntries();
  };

  // Handle approve/reject knowledge entry
  const handleModerateEntry = async (entryId: string, approve: boolean) => {
    if (!user?.id || userRole !== 'admin') return;

    try {
      const supabase = getSupabaseBrowserClient();

      const { error } = await supabase
        .from('expert_knowledge')
        .update({ is_approved: approve })
        .eq('id', entryId);

      if (error) {
        throw error;
      }

      // Update local state
      setKnowledgeEntries(prev =>
        prev.map(entry =>
          entry.id === entryId
            ? { ...entry, is_approved: approve }
            : entry
        )
      );
    } catch (err) {
      console.error('Error moderating knowledge entry:', err);
      setError('Kon kennisitem niet bijwerken');
    }
  };

  // Initialize
  useEffect(() => {
    if (user?.id) {
      fetchKnowledgeEntries();
    }
  }, [user?.id]);

  // Format date
  const formatDate = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get content type label
  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'article':
        return 'Artikel';
      case 'guideline':
        return 'Richtlijn';
      case 'recommendation':
        return 'Aanbeveling';
      default:
        return type;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Kennisbank</h2>
        </div>
        <div className="mt-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-6 w-3/4 rounded bg-gray-200"></div>
              <div className="mt-2 h-4 w-1/2 rounded bg-gray-200"></div>
              <div className="mt-2 h-20 rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
        <AlertMessage
          type="error"
          title="Fout bij laden kennisbank"
          message={error}
        />
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Kennisbank</h2>

        {/* Show form button for specialists */}
        {userRole === 'specialist' && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            {showForm ? 'Annuleren' : 'Kennis Toevoegen'}
          </button>
        )}
      </div>

      {/* Knowledge entry form */}
      {showForm && userRole === 'specialist' && (
        <div className="mt-6">
          <KnowledgeEntryForm onSuccess={handleFormSuccess} />
        </div>
      )}

      {/* Knowledge entries list */}
      <div className="mt-6 space-y-6">
        {knowledgeEntries.length === 0 ? (
          <p className="text-center text-gray-500">Geen kennisitems gevonden</p>
        ) : (
          knowledgeEntries.map(entry => (
            <div
              key={entry.id}
              className={`rounded-lg border p-4 ${entry.is_approved
                ? 'border-green-200 bg-green-50'
                : 'border-amber-200 bg-amber-50'
                }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{entry.title}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${entry.is_approved
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                    }`}>
                    {entry.is_approved ? 'Goedgekeurd' : 'In afwachting'}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                    {getContentTypeLabel(entry.content_type)}
                  </span>
                </div>
              </div>

              <p className="mb-3 whitespace-pre-wrap text-gray-700">{entry.content}</p>

              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {entry.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Toegevoegd op {formatDate(entry.created_at)}</span>

                {/* Admin moderation buttons */}
                {userRole === 'admin' && !entry.is_approved && (
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleModerateEntry(entry.id, true)}
                      className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Goedkeuren
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModerateEntry(entry.id, false)}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                      Afwijzen
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
