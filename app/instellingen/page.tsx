import { redirect } from 'next/navigation';

export default async function InstellingenPage() {
  // Minimal content for diagnostics
  // Simulate auth check
  const user = null; // Replace with actual auth check later
  if (!user) {
    // redirect('/auth/login'); // Comment out redirect for now to simplify
  }

  return (
    <div>
      <h1>Instellingen Pagina</h1>
      <p>Deze pagina is onder constructie.</p>
    </div>
  );
}