/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // Temporarily ignore TypeScript errors during build
        ignoreBuildErrors: true,
    },
    eslint: {
        // Temporarily ignore ESLint errors during build
        ignoreDuringBuilds: true,
    },
    images: {
        domains: ['vqxhwbdhguhcigdouqpc.supabase.co'], // Add Supabase storage domain
    },
    // PWA configuration can be added here if next-pwa is used
}

export default nextConfig
