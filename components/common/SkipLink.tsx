export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-purple-600 text-white p-2 z-50 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
    >
      Ga naar hoofdinhoud
    </a>
  );
}