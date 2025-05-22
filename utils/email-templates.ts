// utils/email-templates.ts

// Definieer een interface voor de data die elke template verwacht
// Dit helpt bij type-safety wanneer je de templates gebruikt.
export interface WelcomeEmailData {
  firstName: string;
  userType: 'patient' | 'specialist';
  dashboardUrl: string;
  supportEmail: string;
  logoUrl: string;
  companyName: string;
  year: number;
  preferencesUrl: string;
  privacyUrl: string;
}

// Voeg hier interfaces toe voor andere email data types
// export interface OnboardingTaskEmailData { ... }
// export interface SpecialistInvitationEmailData { ... }

export enum EmailTemplate {
  WELCOME = 'welcome',
  // ONBOARDING_TASK = 'onboarding_task',
  // ONBOARDING_SYMPTOM = 'onboarding_symptom',
  // SPECIALIST_INVITATION = 'specialist_invitation',
  // SUBSCRIPTION_CONFIRMATION = 'subscription_confirmation',
  // SUBSCRIPTION_RENEWAL = 'subscription_renewal',
  // FEATURE_ANNOUNCEMENT = 'feature_announcement',
}

export interface EmailContent {
  html: string;
  text: string;
}

/**
 * Genereert HTML en tekst voor e-mails op basis van een template en data
 */
export function getEmailContent(
  template: EmailTemplate,
  data: unknown // Gebruik 'any' voor nu, of een union type van alle specifieke data interfaces
): EmailContent {
  switch (template) {
    case EmailTemplate.WELCOME:
      // Type guard om zeker te zijn dat data het juiste formaat heeft
      if (isWelcomeEmailData(data)) {
        return generateWelcomeEmail(data);
      }
      throw new Error(`Ongeldige data voor WELCOME template.`);
    // Voeg hier cases toe voor andere templates
    // case EmailTemplate.ONBOARDING_TASK:
    //   return generateOnboardingTaskEmail(data as OnboardingTaskEmailData);
    default:
      console.error(`Onbekende e-mailtemplate: ${template}`);
      throw new Error(`Onbekende e-mailtemplate: ${template}`);
  }
}

// Type guard voor WelcomeEmailData
function isWelcomeEmailData(data: unknown): data is WelcomeEmailData {
  return (
    typeof data.firstName === 'string' &&
    (data.userType === 'patient' || data.userType === 'specialist') &&
    typeof data.dashboardUrl === 'string' &&
    typeof data.supportEmail === 'string' &&
    typeof data.logoUrl === 'string' &&
    typeof data.companyName === 'string' &&
    typeof data.year === 'number' &&
    typeof data.preferencesUrl === 'string' &&
    typeof data.privacyUrl === 'string'
  );
}


function generateWelcomeEmail(data: WelcomeEmailData): EmailContent {
  const { 
    firstName, userType, dashboardUrl, supportEmail, 
    logoUrl, companyName, year, preferencesUrl, privacyUrl 
  } = data;
  
  const patientTips = `
    <li><strong>Voltooi je profiel:</strong> Zorg dat je profiel compleet is voor de beste ervaring.</li>
    <li><strong>Maak je eerste taak aan:</strong> Begin met het plannen van activiteiten en het bijhouden van symptomen.</li>
    <li><strong>Verbind met een specialist:</strong> Nodig je zorgverlener uit om je voortgang te volgen.</li>
  `;
  const specialistTips = `
    <li><strong>Voltooi je praktijkprofiel:</strong> Zorg dat je praktijkgegevens compleet zijn.</li>
    <li><strong>Nodig patiënten uit:</strong> Begin met het uitnodigen van patiënten om je te verbinden.</li>
    <li><strong>Verken de dashboards:</strong> Ontdek hoe je patiëntgegevens kunt monitoren en analyseren.</li>
  `;

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welkom bij ${companyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 0; }
    .email-container { max-width: 600px; margin: 40px auto; padding: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;}
    .logo { max-width: 180px; height: auto; }
    h1 { color: #4f46e5; font-size: 24px; margin-top: 0; }
    p { margin-bottom: 16px; font-size: 16px; }
    ul { margin-bottom: 16px; padding-left: 20px; }
    li { margin-bottom: 8px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background-color: #4f46e5; color: white !important; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: 600; font-size: 16px; }
    .footer { margin-top: 40px; font-size: 12px; color: #6b7280; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .footer a { color: #4f46e5; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="${logoUrl}" alt="${companyName} Logo" class="logo">
    </div>
    
    <h1>Welkom bij ${companyName}, ${firstName}!</h1>
    
    <p>Bedankt voor het aanmaken van je account. We zijn blij dat je hebt gekozen voor ${companyName} om ${
      userType === 'patient' 
        ? 'je fibromyalgie symptomen te beheren.' 
        : 'je patiënten met fibromyalgie te begeleiden.'
    }</p>
    
    <p>Hier zijn enkele snelle tips om je op weg te helpen:</p>
    
    <ul>
      ${userType === 'patient' ? patientTips : specialistTips}
    </ul>
    
    <div class="button-container">
      <a href="${dashboardUrl}" class="button">Ga naar je Dashboard</a>
    </div>
    
    <p>Als je vragen hebt, aarzel dan niet om contact op te nemen met ons ondersteuningsteam via <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
    
    <p>Met vriendelijke groet,<br>
    Het ${companyName} Team</p>
    
    <div class="footer">
      <p>© ${year} ${companyName}. Alle rechten voorbehouden.</p>
      <p>Je ontvangt deze e-mail omdat je een account hebt aangemaakt bij ${companyName}.</p>
      <p><a href="${preferencesUrl}">E-mailvoorkeuren beheren</a> | <a href="${privacyUrl}">Privacybeleid</a></p>
    </div>
  </div>
</body>
</html>`;
  
  const text = `
Welkom bij ${companyName}, ${firstName}!

Bedankt voor het aanmaken van je account. We zijn blij dat je hebt gekozen voor ${companyName} om ${
  userType === 'patient' 
    ? 'je fibromyalgie symptomen te beheren.' 
    : 'je patiënten met fibromyalgie te begeleiden.'
}

Hier zijn enkele snelle tips om je op weg te helpen:
${userType === 'patient' ? 
  `- Voltooi je profiel\n- Maak je eerste taak aan\n- Verbind met een specialist` : 
  `- Voltooi je praktijkprofiel\n- Nodig patiënten uit\n- Verken de dashboards`
}

Ga naar je Dashboard: ${dashboardUrl}

Als je vragen hebt, neem contact op via ${supportEmail}.

Met vriendelijke groet,
Het ${companyName} Team

© ${year} ${companyName}. Alle rechten voorbehouden.
E-mailvoorkeuren: ${preferencesUrl} | Privacy: ${privacyUrl}
  `;
  
  return { html, text };
}

// Implementeer hier de andere generate...Email functies
// function generateOnboardingTaskEmail(data: OnboardingTaskEmailData): EmailContent { ... }
