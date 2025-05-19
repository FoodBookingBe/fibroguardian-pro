# FibroGuardian Verbeteringsaanbevelingen

Dit document bevat gedetailleerde aanbevelingen voor verdere verbeteringen aan de FibroGuardian applicatie, gebaseerd op de codebase analyse.

## 1. Test Coverage Uitbreiden

De huidige test coverage is beperkt. Hier zijn specifieke aanbevelingen om dit te verbeteren:

### 1.1 Component Tests

- **Reflectie Componenten**: Implementeer tests voor de reflectie invoer en weergave componenten
  ```typescript
  // Voorbeeld test voor ReflectieFormContainer
  it('should validate pijn_score and vermoeidheid_score fields', async () => {
    render(<ReflectieFormContainer />);
    
    // Vul een ongeldige pijnscore in (boven 20)
    fireEvent.change(screen.getByLabelText(/pijnscore/i), { target: { value: '25' } });
    
    // Controleer of de validatiefout wordt weergegeven
    await waitFor(() => {
      expect(screen.getByText(/score moet tussen 0 en 20 liggen/i)).toBeInTheDocument();
    });
  });
  ```

- **Dashboard Componenten**: Test de HealthMetrics en DailyPlanner componenten
  ```typescript
  // Voorbeeld test voor HealthMetricsChart
  it('should render chart with correct data points', () => {
    const mockData = [
      { datum: new Date('2025-05-01'), pijn_score: 5, vermoeidheid_score: 8 },
      { datum: new Date('2025-05-02'), pijn_score: 4, vermoeidheid_score: 7 }
    ];
    
    render(<HealthMetricsChart data={mockData} />);
    
    // Controleer of de chart elementen aanwezig zijn
    expect(screen.getByTestId('health-metrics-chart')).toBeInTheDocument();
    // Controleer of de juiste datapunten worden weergegeven
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });
  ```

### 1.2 API Route Tests

- Implementeer tests voor alle API routes met MSW (Mock Service Worker)
  ```typescript
  // Voorbeeld test voor reflecties API
  import { rest } from 'msw';
  import { setupServer } from 'msw/node';
  
  const server = setupServer(
    rest.get('/api/reflecties', (req, res, ctx) => {
      return res(ctx.json([
        { id: '1', user_id: 'test-user', datum: '2025-05-01', pijn_score: 5 }
      ]));
    })
  );
  
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  
  it('fetches reflecties successfully', async () => {
    const { result } = renderHook(() => useReflecties());
    
    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].pijn_score).toBe(5);
    });
  });
  ```

### 1.3 End-to-End Tests

- Implementeer Cypress of Playwright tests voor kritieke gebruikersstromen
  ```javascript
  // Voorbeeld Cypress test voor login flow
  describe('Authentication Flow', () => {
    it('should allow a user to login', () => {
      cy.visit('/auth/login');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      // Controleer of de gebruiker naar het dashboard wordt doorgestuurd
      cy.url().should('include', '/dashboard');
      cy.get('h1').should('contain', 'Dashboard');
    });
  });
  ```

### 1.4 Test Coverage Rapportage

- Configureer Jest om test coverage rapporten te genereren
  ```javascript
  // In jest.config.js
  module.exports = {
    // ...bestaande configuratie
    collectCoverage: true,
    collectCoverageFrom: [
      '**/*.{js,jsx,ts,tsx}',
      '!**/*.d.ts',
      '!**/node_modules/**',
      '!**/.next/**',
    ],
    coverageReporters: ['json', 'lcov', 'text', 'clover'],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  };
  ```

## 2. Database Query Optimalisatie

### 2.1 Query Invalidatie Strategie

- Verbeter de query invalidatie in `hooks/useMutations.ts`:
  ```typescript
  // Voorbeeld voor useDeleteTask
  const useDeleteTask = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    return useMutation(
      async (taskId: string) => {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId);
        
        if (error) throw error;
        return taskId;
      },
      {
        onSuccess: (_, taskId) => {
          // Invalideer specifieke query voor deze gebruiker
          if (user?.id) {
            queryClient.invalidateQueries(['tasks', user.id]);
          } else {
            // Fallback naar bredere invalidatie als user ID niet beschikbaar is
            queryClient.invalidateQueries(['tasks']);
          }
          
          // Invalideer ook de specifieke task query
          queryClient.invalidateQueries(['task', taskId]);
        }
      }
    );
  };
  ```

### 2.2 Pagination en Infinite Scrolling

- Implementeer pagination voor grote lijsten zoals takenlijsten en reflecties
  ```typescript
  // Voorbeeld hook voor gepagineerde reflecties
  const useReflectiesPaginated = (limit = 10) => {
    const [page, setPage] = useState(0);
    const { user } = useAuth();
    
    const fetchReflecties = async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('reflecties')
        .select('*')
        .eq('user_id', user?.id)
        .order('datum', { ascending: false })
        .range(pageParam * limit, (pageParam + 1) * limit - 1);
      
      if (error) throw error;
      return { data, nextPage: data.length === limit ? pageParam + 1 : undefined };
    };
    
    return useInfiniteQuery(
      ['reflecties', user?.id, 'paginated', limit],
      fetchReflecties,
      {
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled: !!user?.id
      }
    );
  };
  ```

### 2.3 Selectieve Kolommen

- Beperk de geretourneerde kolommen in queries om dataverkeer te verminderen
  ```typescript
  // Voorbeeld voor het ophalen van alleen benodigde velden
  const { data, error } = await supabase
    .from('tasks')
    .select('id, titel, beschrijving, duur, herhaal_patroon')
    .eq('user_id', user.id);
  ```

### 2.4 Caching Strategie

- Implementeer een consistente caching strategie voor alle queries
  ```typescript
  // Voorbeeld configuratie in QueryClientConfig.ts
  export const queryClientConfig: QueryClientConfig = {
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minuten
        cacheTime: 30 * 60 * 1000, // 30 minuten
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
        retry: 1,
      },
    },
  };
  ```

## 3. Toegankelijkheidsverbeteringen

### 3.1 ARIA Attributen

- Voeg ARIA attributen toe aan interactieve componenten
  ```tsx
  // Voorbeeld voor een tabpanel component
  <div
    role="tabpanel"
    id={`tabpanel-${id}`}
    aria-labelledby={`tab-${id}`}
    hidden={!isActive}
  >
    {children}
  </div>
  ```

### 3.2 Toetsenbordnavigatie

- Zorg ervoor dat alle interactieve elementen toegankelijk zijn via het toetsenbord
  ```tsx
  // Voorbeeld voor een custom button component
  const CustomButton = ({ onClick, children, ...props }) => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onClick(e);
      }
    };
    
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    );
  };
  ```

### 3.3 Kleurcontrast

- Controleer en verbeter het kleurcontrast voor betere leesbaarheid
  ```css
  /* Voorbeeld voor betere contrastverhouding */
  .text-primary {
    color: #5a2ca0; /* Donkerder paars voor betere leesbaarheid op witte achtergrond */
  }
  
  .text-error {
    color: #d32f2f; /* Donkerder rood voor betere leesbaarheid */
  }
  ```

### 3.4 Screenreader Ondersteuning

- Voeg verborgen tekst toe voor screenreaders waar nodig
  ```tsx
  // Voorbeeld voor een icon button
  <button aria-label="Verwijder taak" onClick={handleDelete}>
    <TrashIcon />
    <span className="sr-only">Verwijder taak</span>
  </button>
  ```

### 3.5 Toegankelijkheidsaudit

- Voer een volledige toegankelijkheidsaudit uit met tools zoals Lighthouse of axe
  ```javascript
  // Voorbeeld script voor axe-core integratie in tests
  import { axe } from 'jest-axe';
  
  it('should not have accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  ```

## 4. Performance Monitoring

### 4.1 Web Vitals Tracking

- Implementeer Web Vitals tracking om gebruikerservaringen te meten
  ```typescript
  // In lib/analytics/performance.ts
  import { getCLS, getFID, getLCP, getTTFB, getFCP } from 'web-vitals';
  
  export function reportWebVitals(metric) {
    // Stuur metrics naar analytics platform
    console.log(metric);
    
    // Voorbeeld: stuur naar Google Analytics
    if (window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }
  }
  
  export function initWebVitals() {
    getCLS(reportWebVitals);
    getFID(reportWebVitals);
    getLCP(reportWebVitals);
    getTTFB(reportWebVitals);
    getFCP(reportWebVitals);
  }
  ```

### 4.2 Performance Budgets

- Stel performance budgets in voor kritieke pagina's
  ```javascript
  // In next.config.js
  module.exports = {
    // ...bestaande configuratie
    experimental: {
      // ...bestaande experimentele opties
      performanceBudget: {
        // Maximale grootte voor First Contentful Paint
        fcpMaxDuration: 1000, // 1 seconde
        // Maximale JavaScript bundle grootte
        maxJsBundleSize: 100 * 1024, // 100 KB
      },
    },
  };
  ```

### 4.3 Lazy Loading

- Implementeer lazy loading voor componenten die niet direct zichtbaar zijn
  ```typescript
  // Voorbeeld voor lazy loading van een zware component
  import dynamic from 'next/dynamic';
  
  const HealthMetricsChart = dynamic(
    () => import('@/components/dashboard/HealthMetricsChart'),
    {
      loading: () => <p>Grafiek wordt geladen...</p>,
      ssr: false, // Disable Server-Side Rendering als het niet nodig is
    }
  );
  ```

### 4.4 Server-Side Rendering Optimalisatie

- Optimaliseer Server-Side Rendering voor kritieke pagina's
  ```typescript
  // Voorbeeld voor geoptimaliseerde getServerSideProps
  export async function getServerSideProps(context) {
    // Gebruik een korte cache tijd voor SSR
    context.res.setHeader(
      'Cache-Control',
      'public, s-maxage=10, stale-while-revalidate=59'
    );
    
    // Haal alleen de minimaal benodigde data op
    const { data: initialData } = await fetchCriticalData();
    
    return {
      props: {
        initialData,
      },
    };
  }
  ```

## 5. Security Enhancements

### 5.1 Content Security Policy

- Implementeer een strikte Content Security Policy
  ```typescript
  // In lib/security-headers.ts
  export const securityHeaders = [
    {
      key: 'Content-Security-Policy',
      value: `
        default-src 'self';
        script-src 'self' 'unsafe-inline' https://analytics.example.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https://storage.googleapis.com;
        font-src 'self';
        connect-src 'self' https://*.supabase.co;
        frame-ancestors 'none';
        form-action 'self';
        base-uri 'self';
      `.replace(/\s{2,}/g, ' ').trim()
    },
    // ...andere headers
  ];
  ```

### 5.2 Input Validatie

- Verbeter input validatie voor alle formulieren
  ```typescript
  // Voorbeeld voor verbeterde Zod schema's
  const taskSchema = z.object({
    titel: z.string().min(1, 'Titel is verplicht').max(100),
    beschrijving: z.string().max(500).optional(),
    duur: z.number().int().positive().max(480).optional(),
    herhaal_patroon: z.enum(['eenmalig', 'dagelijks', 'wekelijks', 'maandelijks', 'aangepast']),
    dagen_van_week: z.array(z.string()).optional(),
    metingen: z.array(z.string()).optional(),
    notities: z.string().max(1000).optional(),
    labels: z.array(z.string()).max(10).optional(),
  });
  ```

### 5.3 Rate Limiting

- Implementeer rate limiting voor alle API routes
  ```typescript
  // Voorbeeld middleware voor rate limiting
  import rateLimit from 'express-rate-limit';
  import slowDown from 'express-slow-down';
  
  // Combineer rate limiting met progressive slowdown
  const applyMiddleware = (handler) => {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minuut
      max: 60, // max 60 requests per minuut
      handler: (_, res) => {
        res.status(429).json({
          error: 'Te veel verzoeken, probeer het later opnieuw'
        });
      }
    })(slowDown({
      windowMs: 60 * 1000,
      delayAfter: 30, // vertraag na 30 requests
      delayMs: (hits) => hits * 50 // 50ms * aantal hits boven delayAfter
    })(handler));
  };
  ```

### 5.4 Authenticatie Verbetering

- Implementeer multi-factor authenticatie
  ```typescript
  // Voorbeeld voor MFA setup component
  const MFASetup = () => {
    const [qrCode, setQrCode] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    
    const setupMFA = async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });
      
      if (error) {
        console.error('MFA setup error:', error);
        return;
      }
      
      setQrCode(data.totp.qr_code);
    };
    
    const verifyMFA = async () => {
      const { error } = await supabase.auth.mfa.challenge({
        factorId: 'totp',
        code: verificationCode
      });
      
      if (error) {
        console.error('MFA verification error:', error);
        return;
      }
      
      // MFA succesvol ingesteld
    };
    
    return (
      <div>
        <button onClick={setupMFA}>MFA instellen</button>
        {qrCode && (
          <>
            <img src={qrCode} alt="QR Code voor MFA" />
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Verificatiecode"
            />
            <button onClick={verifyMFA}>Verifiëren</button>
          </>
        )}
      </div>
    );
  };
  ```

## 6. Code Quality en Maintainability

### 6.1 Code Linting en Formatting

- Configureer ESLint en Prettier voor consistente code stijl
  ```javascript
  // In .eslintrc.js
  module.exports = {
    extends: [
      'next',
      'next/core-web-vitals',
      'plugin:@typescript-eslint/recommended',
      'prettier'
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  };
  ```

### 6.2 Type Safety

- Verbeter TypeScript type safety door `any` types te vermijden
  ```typescript
  // Voorbeeld voor betere type definities
  type TaskFilter = {
    status?: 'open' | 'completed';
    startDate?: Date;
    endDate?: Date;
    labels?: string[];
    searchTerm?: string;
  };
  
  // Gebruik deze type in plaats van any
  const filterTasks = (tasks: Task[], filters: TaskFilter): Task[] => {
    // Implementatie
  };
  ```

### 6.3 Error Handling

- Implementeer een consistente error handling strategie
  ```typescript
  // In lib/error-handler.ts
  export class AppError extends Error {
    public readonly code: string;
    public readonly userMessage: string;
    
    constructor(code: string, message: string, userMessage: string) {
      super(message);
      this.code = code;
      this.userMessage = userMessage;
      Object.setPrototypeOf(this, AppError.prototype);
    }
  }
  
  export const handleApiError = (error: unknown) => {
    if (error instanceof AppError) {
      return {
        code: error.code,
        message: error.userMessage
      };
    }
    
    console.error('Onverwachte fout:', error);
    return {
      code: 'unknown_error',
      message: 'Er is een onverwachte fout opgetreden. Probeer het later opnieuw.'
    };
  };
  ```

### 6.4 Code Documentatie

- Verbeter code documentatie met JSDoc commentaar
  ```typescript
  /**
   * Berekent de gemiddelde pijn- en vermoeidheidsscores over een periode.
   * 
   * @param reflecties - Array van reflecties om te analyseren
   * @param startDate - Begin van de periode (inclusief)
   * @param endDate - Einde van de periode (inclusief)
   * @returns Object met gemiddelde scores of null als er geen data is
   * 
   * @example
   * const scores = calculateAverageScores(reflecties, new Date('2025-05-01'), new Date('2025-05-07'));
   * // { pijnScore: 4.2, vermoeidheidScore: 5.8 }
   */
  export function calculateAverageScores(
    reflecties: Reflectie[],
    startDate: Date,
    endDate: Date
  ): { pijnScore: number; vermoeidheidScore: number } | null {
    // Implementatie
  }
  ```

## 7. User Experience Improvements

### 7.1 Offline Modus Verbetering

- Verbeter de offline gebruikerservaring met betere feedback
  ```typescript
  // In een custom hook
  export const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(
      typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    
    useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }, []);
    
    return isOnline;
  };
  
  // In een component
  const OfflineBanner = () => {
    const isOnline = useOnlineStatus();
    
    if (isOnline) return null;
    
    return (
      <div className="offline-banner">
        <AlertIcon />
        <p>U bent momenteel offline. Sommige functies zijn mogelijk niet beschikbaar.</p>
      </div>
    );
  };
  ```

### 7.2 Formulier UX

- Verbeter formulier gebruikerservaring met inline validatie
  ```typescript
  // Voorbeeld voor een formulierveld met inline validatie
  const FormField = ({ name, label, validation, ...props }) => {
    const { register, formState: { errors, touchedFields } } = useFormContext();
    const error = errors[name];
    const isTouched = touchedFields[name];
    
    return (
      <div className="form-field">
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          {...register(name, validation)}
          className={error ? 'input-error' : ''}
          {...props}
        />
        {error && isTouched && (
          <p className="error-message">{error.message}</p>
        )}
      </div>
    );
  };
  ```

### 7.3 Skeleton Loading

- Implementeer skeleton loading voor een betere laadervaring
  ```typescript
  // Voorbeeld voor een skeleton loader component
  const SkeletonLoader = ({ type = 'card', count = 1 }) => {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={`skeleton skeleton-${type}`}>
            <div className="skeleton-animation"></div>
          </div>
        ))}
      </>
    );
  };
  
  // Gebruik in een component
  const TaskList = () => {
    const { data: tasks, isLoading } = useTasks();
    
    if (isLoading) {
      return <SkeletonLoader type="task-card" count={5} />;
    }
    
    return (
      <div className="task-list">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    );
  };
  ```

### 7.4 Error Boundaries

- Implementeer Error Boundaries om te voorkomen dat de hele app crasht
  ```typescript
  // In components/common/ErrorBoundary.tsx
  import React, { Component, ErrorInfo, ReactNode } from 'react';
  
  interface Props {
    children: ReactNode;
    fallback?: ReactNode;
  }
  
  interface State {
    hasError: boolean;
    error?: Error;
  }
  
  class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = { hasError: false };
    }
    
    static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
    }
    
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
      console.error('Error boundary caught error:', error, errorInfo);
      // Hier zou je de fout naar een monitoring service kunnen sturen
    }
    
    render(): ReactNode {
      if (this.state.hasError) {
        if (this.props.fallback) {
          return this.props.fallback;
        }
        
        return (
          <div className="error-boundary">
            <h2>Er is iets misgegaan.</h2>
            <p>Probeer de pagina te vernieuwen of neem contact op met ondersteuning.</p>
            <button onClick={() => window.location.reload()}>
              Pagina vernieuwen
            </button>
          </div>
        );
      }
      
      return this.props.children;
    }
  }
  
  export default ErrorBoundary;
  ```

### 7.5 Progressieve Verbetering

- Implementeer progressieve verbetering voor betere toegankelijkheid
  ```typescript
  // Voorbeeld voor een component met progressieve verbetering
  const EnhancedDatePicker = ({ onChange, value, ...props }) => {
    // Controleer of de browser geavanceerde features ondersteunt
    const supportsDateInput = useSupportsDateInput();
    
    if (supportsDateInput) {
      return (
        <input
          type="date"
          value={value}
          onChange={onChange}
          {...props}
        />
      );
    }
    
    // Fallback voor browsers die geen native date input ondersteunen
    return (
      <div className="custom-date-picker">
        <input
          type="text"
          value={formatDate(value)}
          onChange={(e) => {
            const parsedDate = parseDate(e.target.value);
            if (parsedDate) {
              onChange({ target: { value: parsedDate } });
            }
          }}
          placeholder="DD-MM-JJJJ"
          {...props}
        />
        {/* Eventueel een custom calendar UI hier */}
      </div>
    );
  };
  ```

## 8. Implementatieplan

Om deze aanbevelingen effectief te implementeren, stel ik het volgende plan voor:

1. **Fase 1: Kritieke Verbeteringen** (1-2 weken)
   - Fix de JSX transformatie in tsconfig.json
   - Verwijder dubbele RLS policies in database/schema.sql
   - Verbeter de test coverage voor kritieke componenten
   - Implementeer PWA caching en offline fallbacks

2. **Fase 2: Performance Optimalisatie** (2-3 weken)
   - Optimaliseer database queries
   - Implementeer lazy loading voor zware componenten
   - Voer bundle analyse uit en optimaliseer grote dependencies
   - Verbeter caching strategieën

3. **Fase 3: Gebruikerservaring & Toegankelijkheid** (2-3 weken)
   - Verbeter ARIA attributen en toetsenbordnavigatie
   - Implementeer skeleton loading en betere laadstatus
   - Verbeter formulier UX met inline validatie
   - Voer toegankelijkheidsaudit uit en los problemen op

4. **Fase 4: Monitoring & Onderhoud** (doorlopend)
   - Implementeer Web Vitals tracking
   - Verbeter error handling en monitoring
   - Voer regelmatig code reviews en refactoring uit
   - Blijf test coverage verbeteren

Door deze aanbevelingen te implementeren, zal de FibroGuardian applicatie aanzienlijk verbeteren in termen van stabiliteit, prestaties, toegankelijkheid en gebruikerservaring.
