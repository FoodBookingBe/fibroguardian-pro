import * as fs from 'fs';
import * as path from 'path';
// import * as ts from 'typescript'; // TypeScript AST parsing is complex for this, regex might be simpler for now

interface ComponentAudit {
  path: string;
  issues: string[];
  type: 'presentational' | 'container' | 'unknown' | 'pageOrLayout';
  hasPropInterface: boolean;
  hasMemo: boolean;
  hasDataFetchingHooks: boolean;
  hasMutationHooks: boolean;
  hasDirectSupabaseCall: boolean;
  hasWindowCall: boolean;
}

const projectRoot = path.resolve(__dirname, '..');
const componentsDir = path.join(projectRoot, 'components');
const containersDir = path.join(projectRoot, 'containers');
const appDir = path.join(projectRoot, 'app'); // Include app directory for pages/layouts

// Function to find all .tsx files, excluding .test.tsx and .stories.tsx
const findCodeFiles = (dir: string): string[] => {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      // Exclude common non-component dirs, adjust as needed
      if (!['node_modules', '.next', 'public', 'scripts', 'reports', '.github', 'docs'].includes(file)) {
        results = results.concat(findCodeFiles(filePath));
      }
    } else if (filePath.endsWith('.tsx') && !filePath.endsWith('.test.tsx') && !filePath.endsWith('.spec.tsx') && !filePath.endsWith('.stories.tsx')) {
      results.push(filePath);
    }
  });
  return results;
};


const allRelevantFiles = [
    ...findCodeFiles(componentsDir), 
    ...findCodeFiles(containersDir),
    ...findCodeFiles(appDir) // Add files from app directory
];


// Regexes
const clientComponentRegex = /^\s*['"]use client['"]/;
const dataFetchingHookRegex = /use(Tasks|Profile|Reflecties|MySpecialists|MyPatients|Insights|TaskLogs|RecentLogs|Task|SupabaseQuery)/; // Focused on query hooks
const mutationHookRegex = /use(UpsertTask|DeleteTask|UpdateProfile|AddTaskLog|UpdateTaskLog|DeleteTaskLog|UpsertReflectie|DeleteReflectie|AddSpecialistPatientRelation|DeleteSpecialistPatientRelation)/;
const directSupabaseCallRegex = /\.from\s*\(\s*['"].*['"]\s*\)\s*\.\s*(select|insert|update|delete|rpc|upload|download)/;
const windowCallRegex = /window\.(alert|location|confirm|prompt|localStorage|sessionStorage)/;
const propsInterfaceRegex = /interface\s+\w+Props/;
const reactMemoRegex = /React\.memo\s*\(|memo\s*\(/;


function auditComponentFile(filePath: string): ComponentAudit {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
  const issues: string[] = [];
  
  let type: ComponentAudit['type'] = 'unknown';
  const isClient = clientComponentRegex.test(content);
  const hasDataHooks = dataFetchingHookRegex.test(content);
  const hasMutationHooks = mutationHookRegex.test(content);
  const hasSupabaseDirect = directSupabaseCallRegex.test(content);

  if (relativePath.startsWith('app/') && (relativePath.endsWith('/page.tsx') || relativePath.endsWith('/layout.tsx'))) {
    type = 'pageOrLayout';
  } else if (relativePath.includes('/containers/') || relativePath.endsWith('Container.tsx')) {
    type = 'container';
  } else if (isClient && !hasDataHooks && !hasMutationHooks && !hasSupabaseDirect) {
    // If it's a client component without direct data logic, assume presentational for now
    type = 'presentational';
  } else if (!isClient && !hasDataHooks && !hasMutationHooks && !hasSupabaseDirect) {
    // If not 'use client' and no data logic, could be a Server Component (presentational by nature)
    type = 'presentational';
  }


  if (type === 'presentational' && (hasDataHooks || hasMutationHooks || hasSupabaseDirect)) {
    issues.push('Presentational component seems to contain data fetching/mutation logic.');
  }
  if (type === 'container' && !(hasDataHooks || hasMutationHooks || hasSupabaseDirect) && isClient) {
    // A client container without data logic might be okay if it only manages complex local UI state.
    // This rule might need refinement.
    // issues.push('Container component does not seem to use data fetching/mutation hooks.');
  }
  
  const hasProps = propsInterfaceRegex.test(content);
  if (isClient && !hasProps && type !== 'pageOrLayout' && !relativePath.endsWith('Client.tsx')) { // Client components (not pages/layouts) usually have props
     // issues.push('Potentially missing Props interface for a client component.');
  }

  const hasMemo = reactMemoRegex.test(content);
  if (type === 'presentational' && !hasMemo) {
    issues.push('Presentational component could benefit from React.memo.');
  }

  const hasWindowCalls = windowCallRegex.test(content);
  if (hasWindowCalls) {
    issues.push('Component uses window global (alert, location, etc.). Consider abstracting to service or context.');
  }
  
  return {
    path: relativePath,
    issues,
    type,
    hasPropInterface: hasProps,
    hasMemo,
    hasDataFetchingHooks: hasDataHooks,
    hasMutationHooks: hasMutationHooks,
    hasDirectSupabaseCall: hasSupabaseDirect,
    hasWindowCall: hasWindowCalls,
  };
}

const allAudits = allRelevantFiles.map(auditComponentFile);

// Generate report
let markdownReport = '# Component Pattern Audit Report\n\n';
markdownReport += `_Generated on ${new Date().toISOString()}_\n\n`;
markdownReport += `Total files audited: ${allAudits.length}\n`;
const componentsWithIssues = allAudits.filter(a => a.issues.length > 0);
markdownReport += `Files with potential issues: ${componentsWithIssues.length}\n\n`;

markdownReport += '## Files with Potential Issues\n\n';
if (componentsWithIssues.length === 0) {
  markdownReport += 'No major pattern issues found based on current heuristics.\n';
} else {
  for (const audit of componentsWithIssues) {
    markdownReport += `### \`${audit.path}\`\n\n`;
    markdownReport += `- Detected Type: **${audit.type}**\n`;
    markdownReport += '- Issues:\n';
    for (const issue of audit.issues) {
      markdownReport += `  - ${issue}\n`;
    }
    markdownReport += '\n';
  }
}

markdownReport += '\n## Heuristics Used:\n';
markdownReport += '- **Container**: Path includes `/containers/` or ends with `Container.tsx`.\n';
markdownReport += '- **Presentational**: Is `\'use client\'` but no data/mutation hooks or direct Supabase calls detected; OR is not `\'use client\'` and no data logic (assumed Server Component).\n';
markdownReport += '- **Page/Layout**: Path starts with `app/` and ends with `/page.tsx` or `/layout.tsx`.\n';
markdownReport += '- **Data Fetching**: Uses common query hook names (e.g., `useTasks`, `useProfile`).\n';
markdownReport += '- **Mutations**: Uses common mutation hook names (e.g., `useUpsertTask`).\n';
markdownReport += '- **Direct Supabase**: Contains `.from(...).select(...)` etc.\n';
markdownReport += '- **Window Calls**: Contains `window.alert`, `window.location`, etc.\n';
markdownReport += '- **React.memo**: Checks for `React.memo(` or `memo(`.\n';


const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}
fs.writeFileSync(path.join(reportsDir, 'component-pattern-audit.md'), markdownReport);
console.log(`Component pattern audit complete. Report saved to ${path.join(reportsDir, 'component-pattern-audit.md')}`);
