interface AppConfig {
  appUrl: string;
  apiUrl?: string; // Optional, as it was in .env.example
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  aiServiceApiKey?: string; // Optional
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!appUrl) {
  console.warn(
    "NEXT_PUBLIC_APP_URL is not defined. Some functionalities like absolute redirects might not work as expected."
  );
}

export const config: AppConfig = {
  appUrl: appUrl || "http://localhost:3000", // Fallback to localhost if not set
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  aiServiceApiKey: process.env.AI_SERVICE_API_KEY,
};