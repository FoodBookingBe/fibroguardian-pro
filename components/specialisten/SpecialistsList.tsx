
import { Profile } from '@/types'; // Using Profile type directly

interface SpecialistsListProps {
  specialists: Profile[];
  onRemove: (specialistId: string) => void;
}

export default function SpecialistsList({ specialists, onRemove }: SpecialistsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {specialists.map(specialist => (
        <div key={specialist.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {specialist.voornaam} {specialist.achternaam}
            </h2>
            {specialist.email && (
              <p className="text-gray-600 mb-4">{specialist.email}</p>
            )}

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Specialist Type:</h3>
              <p className="text-sm text-gray-600 capitalize">{specialist.type}</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => onRemove(specialist.id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
