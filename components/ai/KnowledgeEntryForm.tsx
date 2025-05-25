'use client';

// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}

import React, { useState } from 'react';

import { _useAuth as useAuth } from '@/components/auth/AuthProvider';
import { AlertMessage } from '@/components/common/AlertMessage';
import { useNotification } from '@/context/NotificationContext';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { ContentType } from '@/types/ai';

interface KnowledgeEntryFormProps {
  onSuccess?: () => void;
  className?: string;
}

/**
 * Form component for creating new knowledge entries
 * Used by specialists to add content to the AI knowledge base
 */
export default function KnowledgeEntryForm({
  onSuccess,
  className = ''
}: KnowledgeEntryFormProps): JSX.Element {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<ContentType>('article');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user?.id) {
      setError('U moet ingelogd zijn om kennis toe te voegen');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Titel en inhoud zijn verplicht');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();

      // Create knowledge entry
      const { data: _data, error: insertError } = await supabase
        .from('expert_knowledge')
        .insert({
          specialist_id: user.id,
          title,
          content,
          content_type: contentType,
          tags: tags.length > 0 ? tags : null,
          is_approved: false, // Requires approval by admin
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Success notification
      addNotification({
        type: 'success',
        message: 'Kennis succesvol toegevoegd. Een beheerder zal dit beoordelen.',
        duration: 5000
      });

      // Reset form
      setTitle('');
      setContent('');
      setContentType('article');
      setTags([]);
      setTagInput('');

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error creating knowledge entry:', err);
      setError('Er is een fout opgetreden bij het toevoegen van kennis');

      addNotification({
        type: 'error',
        message: 'Kon kennis niet toevoegen',
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle adding a tag
  const handleAddTag = (): void => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string): void => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle tag input keydown
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Kennis Toevoegen</h2>

      {error && (
        <AlertMessage
          type="error"
          title="Fout"
          message={error}
          className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit}>
        {/* Content Type */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Type Inhoud
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="contentType"
                value="article"
                checked={contentType === 'article'}
                onChange={() => setContentType('article')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Artikel</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="contentType"
                value="guideline"
                checked={contentType === 'guideline'}
                onChange={() => setContentType('guideline')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Richtlijn</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="contentType"
                value="recommendation"
                checked={contentType === 'recommendation'}
                onChange={() => setContentType('recommendation')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Aanbeveling</span>
            </label>
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
            Titel
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTitle(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            placeholder="Voer een titel in"
            required
          />
        </div>

        {/* Content */}
        <div className="mb-4">
          <label htmlFor="content" className="mb-1 block text-sm font-medium text-gray-700">
            Inhoud
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setContent(e.target.value)}
            rows={6}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            placeholder="Voer de inhoud in"
            required
          />
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label htmlFor="tags" className="mb-1 block text-sm font-medium text-gray-700">
            Tags
          </label>
          <div className="flex">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              placeholder="Voeg tags toe (druk op Enter)"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Toevoegen
            </button>
          </div>

          {/* Tag list */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-500 focus:bg-purple-500 focus:text-white focus:outline-none"
                  >
                    <span className="sr-only">Verwijder tag {tag}</span>
                    <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                      <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Bezig met toevoegen...' : 'Kennis Toevoegen'}
          </button>
        </div>
      </form>
    </div>
  );
}
