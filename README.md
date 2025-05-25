# FibroGuardian Pro

Een uitgebreide gezondheidsmanagement applicatie voor fibromyalgie patiënten en specialisten.

## 🚀 Features

- **Dashboard**: Overzicht van gezondheidsmetrieken en voortgang
- **Taken Management**: Dagelijkse taken en opdrachten voor patiënten
- **AI Inzichten**: Intelligente analyses van gezondheidspatronen
- **Specialist Connectie**: Communicatie tussen patiënten en zorgverleners
- **Reflecties**: Dagelijkse reflecties en stemming tracking
- **Rapporten**: Gedetailleerde voortgangsrapporten
- **Abonnement Management**: Stripe geïntegreerde betalingen

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: Tailwind CSS
- **Charts**: Recharts, Chart.js
- **Payments**: Stripe
- **AI**: Claude API (Anthropic)
- **Deployment**: Vercel
- **Testing**: Jest, React Testing Library

## 📦 Installation

1. **Clone de repository**
   ```bash
   git clone https://github.com/your-username/fibroguardian.git
   cd fibroguardian
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**

   Maak een `.env.local` bestand aan:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Database
   DATABASE_URL=your_database_url
   DIRECT_URL=your_direct_database_url

   # App URLs
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:3000/api

   # AI Services
   AI_SERVICE_API_KEY=your_claude_api_key

   # Stripe (optioneel voor development)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Automatische Deployment via GitHub Actions

1. **Fork/Clone de repository naar je GitHub account**

2. **Stel GitHub Secrets in**

   Ga naar je repository → Settings → Secrets and variables → Actions

   Voeg de volgende secrets toe:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   DATABASE_URL
   DIRECT_URL
   AI_SERVICE_API_KEY
   STRIPE_SECRET_KEY
   NEXT_PUBLIC_APP_URL
   NEXT_PUBLIC_API_URL
   VERCEL_TOKEN
   VERCEL_ORG_ID
   VERCEL_PROJECT_ID
   ```

3. **Verkrijg Vercel credentials**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login en link project
   vercel login
   vercel link

   # Verkrijg project info
   vercel project ls
   ```

4. **Push naar main branch**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

### Handmatige Deployment via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login en deploy**
   ```bash
   vercel login
   vercel --prod
   ```

3. **Stel environment variables in**
   ```bash
   # Gebruik het PowerShell script (Windows)
   powershell -ExecutionPolicy Bypass -File deploy-env.ps1

   # Of handmatig via CLI
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   ```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:css        # Run Stylelint
npm run fix             # Auto-fix linting issues

# Database
npm run db:types        # Generate Supabase types
npm run db:validate     # Validate TypeScript
npm run db:migrate      # Run database migrations

# Quality Reports
npm run quality:report  # Generate quality reports
```

## 📁 Project Structure

```
fibroguardian/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── ...
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── tasks/            # Task management
│   └── ...
├── lib/                  # Utility libraries
│   ├── supabase-client.ts
│   ├── supabase-server.ts
│   └── ...
├── types/               # TypeScript type definitions
├── hooks/               # Custom React hooks
├── context/             # React context providers
└── public/              # Static assets
```

## 🔐 Environment Variables

### Required for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIs...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `AI_SERVICE_API_KEY` | Claude API key | `sk-ant-api03-...` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | Required for payments |
| `NEXT_PUBLIC_APP_URL` | App base URL | `http://localhost:3000` |
| `GROQ_API_KEY` | Groq API key | For additional AI features |

## 🤝 Contributing

1. Fork de repository
2. Maak een feature branch (`git checkout -b feature/amazing-feature`)
3. Commit je changes (`git commit -m 'Add amazing feature'`)
4. Push naar de branch (`git push origin feature/amazing-feature`)
5. Open een Pull Request

## 📝 License

Dit project is gelicenseerd onder de MIT License - zie het [LICENSE](LICENSE) bestand voor details.

## 🆘 Support

Voor vragen of ondersteuning:

- 📧 Email: support@fibroguardian.com
- 📖 Documentatie: [docs.fibroguardian.com](https://docs.fibroguardian.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/fibroguardian/issues)

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced AI insights
- [ ] Wearable device integration
- [ ] Multi-language support
- [ ] Offline functionality
- [ ] Advanced reporting

---

**FibroGuardian Pro** - Empowering fibromyalgia patients with intelligent health management.
