import { analytics } from '@/lib/analytics/eventTracking';
import { trackOnboardingStep, OnboardingStepName } from '@/lib/analytics/userJourney'; // getLatestCompletedOnboardingStep was unused
import { EmailTemplate, getEmailContent, WelcomeEmailData } from '@/utils/email-templates';
// import { sendEmail } from '@/lib/email/sendEmail'; // Placeholder - team implementeert e-mail verzendlogica
import type { User } from '@supabase/supabase-js'; // Supabase User type
import type { Profile } from '@/types'; // Project Profile type
import { getSupabaseBrowserClient } from '@/lib/supabase'; // Om profiel op te halen

// Placeholder voor sendEmail functie
async function sendEmail(options: { to: string | undefined; subject: string; html: string; text: string; }): Promise<void> {
  if (!options.to) {
    console.warn("[OnboardingEngine] sendEmail: Ontvanger (to) is niet gedefinieerd.", options);
    return;
  }
  console.log(`[OnboardingEngine] Mock sendEmail to: ${options.to}, subject: ${options.subject}`);
  // In een echte implementatie, roep hier je e-mail service aan (bv. Supabase Edge Function, Resend, SendGrid)
  return Promise.resolve();
}


export interface OnboardingEngineConfig {
  daysBetweenEmails?: number;
  maxOnboardingEmails?: number;
  emailsEnabled?: boolean;
  notificationsEnabled?: boolean; // Voor in-app notificaties
  // URLs voor e-mail templates
  dashboardUrl?: string;
  supportEmail?: string;
  logoUrl?: string;
  companyName?: string;
  preferencesUrl?: string;
  privacyUrl?: string;
}

export class OnboardingEngine {
  private config: Required<OnboardingEngineConfig>; // Alle properties zijn nu required
  // private supabase = getSupabaseBrowserClient(); // Unused

  constructor(config?: Partial<OnboardingEngineConfig>) {
    // Default configuratie
    this.config = {
      daysBetweenEmails: 3,
      maxOnboardingEmails: 5,
      emailsEnabled: process.env.NODE_ENV === 'production', // Alleen in productie standaard
      notificationsEnabled: true,
      dashboardUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` : 'http://localhost:3000/dashboard',
      supportEmail: 'support@fibroguardian.be',
      logoUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/logo.png` : 'http://localhost:3000/logo.png',
      companyName: 'FibroGuardian Pro',
      preferencesUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/instellingen/voorkeuren` : 'http://localhost:3000/instellingen/voorkeuren',
      privacyUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/privacy` : 'http://localhost:3000/privacy',
      ...config, // Overschrijf defaults met meegegeven config
    };
  }
  
  public async startOnboarding(user: User, profile: Profile) {
    if (!user || !user.email) {
        console.error("[OnboardingEngine] Kan onboarding niet starten: user of user.email is niet beschikbaar.");
        return;
    }
    if (!profile) {
        console.error("[OnboardingEngine] Kan onboarding niet starten: profile is niet beschikbaar.");
        return;
    }

    trackOnboardingStep('signup_started', { userId: user.id, userType: profile.type });
    trackOnboardingStep('account_created', { userId: user.id, userType: profile.type });
    
    if (this.config.emailsEnabled) {
      await this.sendWelcomeEmail(user, profile);
    }
    // await this.scheduleNextOnboardingAction(user, profile); // Hernoemd voor duidelijkheid
  }
  
  private async sendWelcomeEmail(user: User, profile: Profile) {
    const emailData: WelcomeEmailData = {
      firstName: profile.voornaam || 'Gebruiker',
      userType: profile.type,
      dashboardUrl: this.config.dashboardUrl,
      supportEmail: this.config.supportEmail,
      logoUrl: this.config.logoUrl,
      companyName: this.config.companyName,
      year: new Date().getFullYear(),
      preferencesUrl: this.config.preferencesUrl,
      privacyUrl: this.config.privacyUrl,
    };
    
    const { html, text } = getEmailContent(EmailTemplate.WELCOME, emailData);
    
    await sendEmail({
      to: user.email, // user.email zou hier gedefinieerd moeten zijn
      subject: `Welkom bij ${this.config.companyName}!`,
      html,
      text
    });
    
    analytics.trackEvent('email_sent', {
      email_template: EmailTemplate.WELCOME,
      user_type: profile.type,
    });
  }
  
  // De scheduling logica (scheduleNextOnboardingAction, etc.) is complex en vereist een
  // backend job scheduler (bv. cron jobs, Supabase scheduled functions, of een queue systeem).
  // Dit valt buiten de scope van een client-side library.
  // De functies hieronder zijn placeholders om het concept te illustreren.
  // In een echte implementatie zouden deze API calls doen naar een backend service.

  // private async scheduleNextOnboardingAction(user: User, profile: Profile) {
  //   const latestStep = getLatestCompletedOnboardingStep(); // Haal de laatst voltooide stap op
  //   console.log(`[OnboardingEngine] User ${user.id}, latest completed step: ${latestStep}`);
  //   // TODO: Implementeer logica om volgende actie te bepalen en in te plannen
  // }

  public async completeOnboardingStep(user: User, step: OnboardingStepName, data?: unknown) {
    if (!user) return;
    trackOnboardingStep(step, { userId: user.id, ...data} // Type assertion fixed
const _typedData = data as Record<string, unknown> ;);
    
    // const profile = await this.getUserProfile(user.id); // Haal up-to-date profiel
    // if (profile) {
    //   await this.scheduleNextOnboardingAction(user, profile);
    // }
  }
  
  // private async getUserProfile(userId: string): Promise<Profile | null> {
  //   const { data, error } = await this.supabase
  //     .from('profiles')
  //     .select('*')
  //     .eq('id', userId)
  //     .single();
  //   if (error) {
  //     console.error(`[OnboardingEngine] Error fetching profile for ${userId}:`, error);
  //     return null;
  //   }
  //   return data as Profile | null;
  // }
}

// Singleton instance (optioneel, kan ook per context/gebruik aangemaakt worden)
// export const _onboardingEngine = new OnboardingEngine();
