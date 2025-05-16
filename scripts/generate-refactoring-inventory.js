const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Base directory for components
const componentsDir = path.join(__dirname, '..', 'components');
const containersDir = path.join(__dirname, '..', 'containers'); // Also check containers

// Function to find all .tsx files, excluding .test.tsx and .stories.tsx
const findComponentFiles = (dir) => {
  return glob.sync(path.join(dir, '**/*.tsx'), {
    ignore: ['**/*.test.tsx', '**/*.stories.tsx', '**/*.spec.tsx'],
  });
};

const componentFiles = [...findComponentFiles(componentsDir), ...findComponentFiles(containersDir)];

// Uitzondering voor al gerefactorde componenten of pure presentational components
// Add names of components that are already refactored or are known to be purely presentational
const alreadyRefactoredOrPresentational = [
  'ReflectiesList', // Presentational, container is ReflectiesListContainer
  'ReflectiesListContainer',
  'SpecialistCard', // Presentational
  'SpecialistsListContainer',
  'DailyPlanner', // Presentational, container is DailyPlannerContainer
  'DailyPlannerContainer',
  'TasksPageContainer', // Container, uses TaskList (presentational)
  'ConditionalRender', // UI utility
  'NotificationList', // UI utility
  'AlertMessage', // UI utility
  'SkeletonLoader', // UI utility
  'SkipLink', // UI utility
  'TaskCard', // Presentational, used by TaskList and DailyPlanner
  'TaskList', // Presentational, used by TasksPageContainer
  // Add other components as they are refactored or confirmed presentational
];

// Regexes om client components en data fetching/state te detecteren
const clientComponentRegex = /^\s*['"]use client['"]/;
const dataFetchingRegex = /use(Query|Mutation|Supabase|Tasks|Profile|Reflecties|MySpecialists|MyPatients|Insights|TaskLogs|RecentLogs|Task|UpsertTask|DeleteTask|UpdateProfile|AddTaskLog|UpdateTaskLog|DeleteTaskLog|UpsertReflectie|DeleteReflectie|AddSpecialistPatientRelation|DeleteSpecialistPatientRelation)/i;
const stateRegex = /useState|useReducer/;
const directSupabaseCallRegex = /\.from\s*\(\s*['"].*['"]\s*\)\s*\.\s*(select|insert|update|delete|rpc|upload|download)/;
const windowAlertRegex = /window\.alert\s*\(/;
const windowLocationReloadRegex = /window\.location\.reload\s*\(\)/;


// Resultaten opslaan
const componentsNeedingRefactoring = [];

componentFiles.forEach(file => {
  const componentName = path.basename(file, '.tsx');
  const relativePath = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');

  // Sla al gerefactorde/presentational componenten over
  if (alreadyRefactoredOrPresentational.includes(componentName)) {
    return;
  }
  
  const content = fs.readFileSync(file, 'utf8');
  
  const isClientComponent = clientComponentRegex.test(content);
  const hasDataFetchingHook = dataFetchingRegex.test(content);
  const hasDirectSupabaseCall = directSupabaseCallRegex.test(content);
  const hasStateManagement = stateRegex.test(content);
  const usesWindowAlert = windowAlertRegex.test(content);
  const usesWindowLocationReload = windowLocationReloadRegex.test(content);

  let priority = 'LOW';
  let reason = [];
  let needsContainer = false;

  if (hasDataFetchingHook || hasDirectSupabaseCall) {
    priority = 'HIGH';
    reason.push('Bevat data fetching/directe Supabase calls.');
    needsContainer = true;
  } else if (isClientComponent && hasStateManagement) {
    priority = 'MEDIUM';
    reason.push('Client component met state management.');
    // needsContainer might be true if state is complex and related to data
  } else if (isClientComponent) {
    priority = 'LOW'; // Client component, but no obvious data/state logic found by regex
    reason.push('Client component, handmatige check nodig.');
  } else {
    // Likely a server component or simple presentational component not matching 'use client'
    // These generally don't need refactoring in the context of this plan (moving client logic to containers)
    return; 
  }

  if (usesWindowAlert) {
    reason.push('Gebruikt window.alert().');
    if (priority === 'LOW') priority = 'MEDIUM'; // Escalate priority
  }
  if (usesWindowLocationReload) {
    reason.push('Gebruikt window.location.reload().');
    if (priority === 'LOW') priority = 'MEDIUM'; // Escalate priority
  }
  
  if (reason.length > 0) {
    componentsNeedingRefactoring.push({
      path: relativePath,
      name: componentName,
      priority,
      needsContainer,
      reason: reason.join(' '),
    });
  }
});

// Sorteer op prioriteit
componentsNeedingRefactoring.sort((a, b) => {
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return priorityOrder[a.priority] - priorityOrder[b.priority];
});

// Output markdown
const highPriority = componentsNeedingRefactoring.filter(c => c.priority === 'HIGH');
const mediumPriority = componentsNeedingRefactoring.filter(c => c.priority === 'MEDIUM');
const lowPriority = componentsNeedingRefactoring.filter(c => c.priority === 'LOW');

const generateMarkdownList = (list, title) => {
  if (list.length === 0) return `\n### ${title}\n\nGeen componenten in deze categorie.\n`;
  return `\n### ${title}\n\n${list.map(c => 
    `- [ ] **${c.name}** (${c.path})\n  - Reden: ${c.reason}${c.needsContainer ? '\n  - Actie: Maak Container + Presentational componenten.' : ''}`
  ).join('\n')}\n`;
};

const markdown = `# Component Refactoring Inventory

Dit document bevat een geprioriteerde lijst van componenten die gerefactord moeten worden.
De focus ligt op het verplaatsen van data fetching en complexe state naar Container componenten,
en het standaardiseren van UI feedback (notificaties, error handling).

${generateMarkdownList(highPriority, 'Hoge Prioriteit (Data Fetching / Directe DB Calls / Kritieke UI Issues)')}
${generateMarkdownList(mediumPriority, 'Gemiddelde Prioriteit (Client Componenten met State / UI Issues)')}
${generateMarkdownList(lowPriority, 'Lage Prioriteit (Client Componenten - Handmatige Check Nodig)')}

## Refactoring Instructies

Voor componenten die een Container + Presentational split nodig hebben:

1.  **Maak een Container component** (bv. in een nieuwe \`containers/\` map of naast het presentational component):
    *   Verantwoordelijk voor data fetching (met React Query hooks) en state management.
    *   Gebruikt \`ConditionalRender\` voor loading/error/empty states.
    *   Definieert alle event handlers en callbacks.
    *   Rendert het Presentational component en geeft alle benodigde data en functies als props door.
2.  **Refactor het oorspronkelijke component naar een Presentational component:**
    *   Verwijder alle data fetching, directe Supabase calls, en complexe state logica.
    *   Accepteert alleen props en is verantwoordelijk voor de UI rendering.
    *   Gebruik \`React.memo\` voor optimalisatie indien zinvol.
3.  **Update de parent componenten** om de nieuwe Container component te gebruiken.

Voor andere refactorings (bv. vervangen \`window.alert\`, \`window.location.reload\`):
*   Gebruik \`useNotification()\` voor gebruikersfeedback.
*   Gebruik \`queryClient.invalidateQueries()\` na mutaties om data te verversen i.p.v. \`window.location.reload()\`.
`;

const outputPath = path.join(__dirname, '..', 'utils', 'refactoring-inventory.md');
fs.mkdirSync(path.dirname(outputPath), { recursive: true }); // Ensure utils directory exists
fs.writeFileSync(outputPath, markdown);
console.log(`Refactoring inventory gegenereerd op ${path.relative(path.join(__dirname, '..'), outputPath).replace(/\\/g, '/')}`);
