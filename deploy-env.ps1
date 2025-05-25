# FibroGuardian Pro - Vercel Environment Variables Setup Script

Write-Host "🚀 Setting up environment variables for FibroGuardian Pro..."

# Supabase Configuration
Write-Host "📊 Adding Supabase configuration..."
Write-Output "https://vqxhwbdhguhcigdouqpc.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
Write-Output "YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Database URLs (for Prisma)
Write-Host "🗄️ Adding database configuration..."
Write-Output "YOUR_DATABASE_URL_HERE" | vercel env add DATABASE_URL production
Write-Output "YOUR_DIRECT_URL_HERE" | vercel env add DIRECT_URL production

# Production App URLs - DEZE MOETEN WE NOG UPDATEN!
Write-Host "🌐 Adding production URLs - PLACEHOLDER VALUES..."
Write-Output "https://fibroguardian-pro.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production
Write-Output "https://fibroguardian-pro.vercel.app/api" | vercel env add NEXT_PUBLIC_API_URL production

# AI & External Services
Write-Host "🤖 Adding AI and external service keys..."
Write-Output "YOUR_CLAUDE_API_KEY_HERE" | vercel env add AI_SERVICE_API_KEY production
Write-Output "YOUR_GROQ_API_KEY_HERE" | vercel env add GROQ_API_KEY production
Write-Output "YOUR_GITHUB_PAT_HERE" | vercel env add GITHUB_PERSONAL_ACCESS_TOKEN production
Write-Output "YOUR_SENTRY_AUTH_TOKEN_HERE" | vercel env add SENTRY_AUTH_TOKEN production
Write-Output "YOUR_FIGMA_API_KEY_HERE" | vercel env add FIGMA_API_KEY production

Write-Host "✅ Environment variables setup completed!"
Write-Host "⚠️  IMPORTANT: Update NEXT_PUBLIC_APP_URL and NEXT_PUBLIC_API_URL with actual production domain after deployment!"
Write-Host "⚠️  IMPORTANT: Replace all placeholder values with actual API keys before running!"

# Show current status
Write-Host "📋 Current environment variables:"
vercel env ls
