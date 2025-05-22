import React from 'react';

export default function EmptySpecialistState(): JSX.Element {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <p className="text-gray-600 mb-4">U heeft nog geen specialisten toegevoegd.</p>
      <p className="text-gray-500">
        Gebruik de knop "Specialist Toevoegen" om een specialist toe te voegen aan uw account.
      </p>
    </div>
  );
}
