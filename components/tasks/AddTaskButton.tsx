import React from 'react';

'use client';
import Link from 'next/link';

export default function AddTaskButton(): JSX.Element {
  // Placeholder for AddTaskButton component
  // Simple link to a page for creating a new task
  return (
    <Link href="/taken/nieuw" className="btn-primary"> {/* Assuming /taken/nieuw is the route for new task form */}
      Nieuwe Taak Toevoegen
    </Link>
  );
}