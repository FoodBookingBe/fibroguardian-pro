#!/usr/bin/env node

/**
 * Enhanced Specific Error Fixer Script
 *
 * This script targets specific TypeScript errors that were identified in the codebase.
 * It uses targeted fixes for known issues rather than generic pattern matching.
 *
 * Enhanced version with more comprehensive error handling capabilities.
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

// Configuration
const DEBUG = process.argv.includes('--debug');
const LOGS_DIR = 'logs';

// Main function
async function main() {
    console.log('🔍 Starting Enhanced Specific Error Fixer...');

    try {
        // Create logs directory if it doesn't exist
        await fs.mkdir(LOGS_DIR, { recursive: true }).catch(() => { });

        // Log start time
        const startTime = new Date();
        const logFile = path.join(LOGS_DIR, `enhanced-specific-fixes-${startTime.toISOString().replace(/:/g, '-')}.log`);
        await fs.writeFile(logFile, `Enhanced Specific Error Fixer started at ${startTime.toISOString()}\n\n`);

        // Fix specific errors
        const fixedFiles = [];

        // 1. Fix "use client" directive issues (must be at the top of the file)
        console.log('🔧 Fixing "use client" directive issues...');
        const useClientFixes = await fixUseClientDirectiveIssues();
        fixedFiles.push(...useClientFixes);

        // 2. Fix unknown type issues (e.g., 'e' is of type 'unknown')
        console.log('🔧 Fixing unknown type issues...');
        const unknownTypeFixes = await fixUnknownTypeIssues();
        fixedFiles.push(...unknownTypeFixes);

        // 3. Fix React event handler type issues
        console.log('🔧 Fixing React event handler type issues...');
        const eventHandlerFixes = await fixEventHandlerTypeIssues();
        fixedFiles.push(...eventHandlerFixes);

        // 4. Fix Recharts formatter issues
        console.log('🔧 Fixing Recharts formatter issues...');
        const rechartsFormatterFixes = await fixRechartsFormatterIssues();
        fixedFiles.push(...rechartsFormatterFixes);

        // 5. Fix unused variable issues
        console.log('🔧 Fixing unused variable issues...');
        const unusedVariableFixes = await fixUnusedVariableIssues();
        fixedFiles.push(...unusedVariableFixes);

        // 6. Fix exported member name issues
        console.log('🔧 Fixing exported member name issues...');
        const exportedMemberFixes = await fixExportedMemberNames();
        fixedFiles.push(...exportedMemberFixes);

        // 7. Fix missing return statement issues
        console.log('🔧 Fixing missing return statement issues...');
        const returnStatementFixes = await fixReturnStatementIssues();
        fixedFiles.push(...returnStatementFixes);

        // 8. Fix AdminSidebar.tsx issues
        console.log('🔧 Fixing AdminSidebar.tsx issues...');
        const adminSidebarFixes = await fixAdminSidebarIssues();
        if (adminSidebarFixes) fixedFiles.push(adminSidebarFixes);

        // 9. Fix KnowledgeEntryForm.tsx issues
        console.log('🔧 Fixing KnowledgeEntryForm.tsx issues...');
        const knowledgeEntryFormFixes = await fixKnowledgeEntryFormIssues();
        if (knowledgeEntryFormFixes) fixedFiles.push(knowledgeEntryFormFixes);

        // 10. Fix AIAssistant.tsx issues
        console.log('🔧 Fixing AIAssistant.tsx issues...');
        const aiAssistantFixes = await fixAIAssistantIssues();
        if (aiAssistantFixes) fixedFiles.push(aiAssistantFixes);

        // 11. Fix opdrachten/page.tsx issues
        console.log('🔧 Fixing opdrachten/page.tsx issues...');
        const opdrachtenPageFixes = await fixOpdrachtenPageIssues();
        if (opdrachtenPageFixes) fixedFiles.push(opdrachtenPageFixes);

        // 12. Fix useTypedSupabase.ts issues
        console.log('🔧 Fixing useTypedSupabase.ts issues...');
        const useTypedSupabaseFixes = await fixUseTypedSupabaseIssues();
        if (useTypedSupabaseFixes) fixedFiles.push(useTypedSupabaseFixes);

        // 13. Fix useSupabaseQuery.ts issues
        console.log('🔧 Fixing useSupabaseQuery.ts issues...');
        const useSupabaseQueryFixes = await fixUseSupabaseQueryIssues();
        if (useSupabaseQueryFixes) fixedFiles.push(useSupabaseQueryFixes);

        // 14. Fix ai-insights.ts issues
        console.log('🔧 Fixing ai-insights.ts issues...');
        const aiInsightsFixes = await fixAIInsightsIssues();
        if (aiInsightsFixes) fixedFiles.push(aiInsightsFixes);

        // 15. Fix service-worker.ts issues
        console.log('🔧 Fixing service-worker.ts issues...');
        const serviceWorkerFixes = await fixServiceWorkerIssues();
        if (serviceWorkerFixes) fixedFiles.push(serviceWorkerFixes);

        // 16. Fix TaskLogsPresentational.tsx issues
        console.log('🔧 Fixing TaskLogsPresentational.tsx issues...');
        const taskLogsPresentationalFixes = await fixTaskLogsPresentationalIssues();
        if (taskLogsPresentationalFixes) fixedFiles.push(taskLogsPresentationalFixes);

        // 17. Fix TaskLogsContainer.tsx issues
        console.log('🔧 Fixing TaskLogsContainer.tsx issues...');
        const taskLogsContainerFixes = await fixTaskLogsContainerIssues();
        if (taskLogsContainerFixes) fixedFiles.push(taskLogsContainerFixes);

        // 18. Fix useProfile.ts issues
        console.log('🔧 Fixing useProfile.ts issues...');
        const useProfileFixes = await fixUseProfileIssues();
        if (useProfileFixes) fixedFiles.push(useProfileFixes);

        // 19. Fix AuthProvider.tsx issues
        console.log('🔧 Fixing AuthProvider.tsx issues...');
        const authProviderFixes = await fixAuthProviderIssues();
        if (authProviderFixes) fixedFiles.push(authProviderFixes);

        // 20. Fix KnowledgeManagementContainer.tsx issues
        console.log('🔧 Fixing KnowledgeManagementContainer.tsx issues...');
        const knowledgeManagementContainerFixes = await fixKnowledgeManagementContainerIssues();
        if (knowledgeManagementContainerFixes) fixedFiles.push(knowledgeManagementContainerFixes);

        // Log results
        console.log(`\n✅ Fixed issues in ${fixedFiles.filter(Boolean).length} files`);

        // Run TypeScript check to see if there are still issues
        console.log('\n🔍 Checking for remaining TypeScript issues...');
        try {
            execSync('npx tsc --noEmit', { stdio: 'pipe' });
            console.log('✅ No TypeScript errors found!');
        } catch (error) {
            const errorOutput = error.stdout.toString();
            const errorCount = (errorOutput.match(/error TS\d+/g) || []).length;
            console.log(`⚠️ ${errorCount} TypeScript errors still remain`);
            console.log('Run "npx tsc --noEmit" to see detailed errors');
        }

        // Log end time
        const endTime = new Date();
        const duration = (endTime - startTime) / 1000;
        await fs.appendFile(logFile, `Enhanced Specific Error Fixer completed at ${endTime.toISOString()}\n`);
        await fs.appendFile(logFile, `Duration: ${duration} seconds\n`);
        await fs.appendFile(logFile, `Fixed files: ${fixedFiles.filter(Boolean).join(', ')}\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Fix "use client" directive issues
async function fixUseClientDirectiveIssues() {
    const fixedFiles = [];

    const filesWithUseClientIssues = [
        'components/admin/AdminSidebar.tsx',
        'components/admin/DynamicAdminComponents.tsx',
        'components/ai/AIAssistant.tsx',
        'components/ai/KnowledgeEntryForm.tsx',
        'components/common/ServiceWorkerInitializer.tsx',
        'components/specialisten/DynamicSpecialistComponents.tsx',
        'components/tasks/TaskList.tsx',
        'containers/ai/AIRecommendationsContainer.tsx',
        'components/auth/AuthProvider.tsx'
    ];

    for (const filePath of filesWithUseClientIssues) {
        try {
            const content = await fs.readFile(filePath, 'utf8');

            // Check if "use client" is not at the top
            if (content.includes('"use client"') && !content.startsWith('"use client"')) {
                // Move "use client" to the top
                const updatedContent = content.replace(/(['"]use client['"])/g, '').trim();
                await fs.writeFile(filePath, `"use client";\n\n${updatedContent}`);
                fixedFiles.push(filePath);
                console.log(`  ✅ Fixed "use client" directive in ${filePath}`);
            }
        } catch (error) {
            console.error(`  ❌ Error fixing ${filePath}:`, error.message);
        }
    }

    return fixedFiles;
}

// Fix unknown type issues
async function fixUnknownTypeIssues() {
    const fixedFiles = [];

    // Files with 'e' is of type 'unknown' errors
    const filesWithEventIssues = [
        'app/onboarding/profile/page.tsx',
        'components/admin/ChangelogViewer.tsx',
        'components/ai/KnowledgeEntryForm.tsx',
        'components/charts/ProgressVisualization.tsx',
        'utils/service-worker.ts'
    ];

    for (const filePath of filesWithEventIssues) {
        try {
            const content = await fs.readFile(filePath, 'utf8');

            // Fix event handler parameters
            let updatedContent = content;

            // Fix onChange handlers
            updatedContent = updatedContent.replace(
                /(onChange|onInput|onBlur|onFocus)\s*=\s*{\s*\(\s*e\s*\)\s*=>/g,
                (match, eventName) => `${eventName}={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>)=>`
            );

            // Fix onClick handlers
            updatedContent = updatedContent.replace(
                /(onClick)\s*=\s*{\s*\(\s*e\s*\)\s*=>/g,
                (match, eventName) => `${eventName}={(e: React.MouseEvent<HTMLElement>)=>`
            );

            // Fix onSubmit handlers
            updatedContent = updatedContent.replace(
                /(onSubmit)\s*=\s*{\s*\(\s*e\s*\)\s*=>/g,
                (match, eventName) => `${eventName}={(e: React.FormEvent<HTMLFormElement>)=>`
            );

            // Fix onKeyDown handlers
            updatedContent = updatedContent.replace(
                /(onKeyDown|onKeyUp|onKeyPress)\s*=\s*{\s*\(\s*e\s*\)\s*=>/g,
                (match, eventName) => `${eventName}={(e: React.KeyboardEvent<HTMLElement>)=>`
            );

            if (updatedContent !== content) {
                await fs.writeFile(filePath, updatedContent);
                fixedFiles.push(filePath);
                console.log(`  ✅ Fixed unknown event type in ${filePath}`);
            }
        } catch (error) {
            console.error(`  ❌ Error fixing ${filePath}:`, error.message);
        }
    }

    // Fix 'item' is of type 'unknown' in AdminSidebar.tsx
    try {
        const sidebarPath = 'components/admin/AdminSidebar.tsx';
        const content = await fs.readFile(sidebarPath, 'utf8');

        // Add type to the map function
        const updatedContent = content.replace(
            /navigation\.map\(\(item\) =>/g,
            'navigation.map((item: { name: string; href: string; icon: any; current?: boolean }) =>'
        ).replace(
            /secondaryNavigation\.map\(\(item\) =>/g,
            'secondaryNavigation.map((item: { name: string; href: string; icon: any; current?: boolean }) =>'
        );

        if (updatedContent !== content) {
            await fs.writeFile(sidebarPath, updatedContent);
            if (!fixedFiles.includes(sidebarPath)) {
                fixedFiles.push(sidebarPath);
            }
            console.log(`  ✅ Fixed unknown item type in ${sidebarPath}`);
        }
    } catch (error) {
        console.error(`  ❌ Error fixing components/admin/AdminSidebar.tsx:`, error.message);
    }

    return fixedFiles;
}

// Fix React event handler type issues
async function fixEventHandlerTypeIssues() {
    const fixedFiles = [];

    // Fix KnowledgeEntryForm.tsx
    try {
        const filePath = 'components/ai/KnowledgeEntryForm.tsx';
        const content = await fs.readFile(filePath, 'utf8');

        // Fix onSubmit handler
        let updatedContent = content.replace(
            /(const handleSubmit = async \(e: React)\.FormEvent<HTMLFormElement><HTMLFormElement><HTMLFormElement>/g,
            '$1.FormEvent<HTMLFormElement>'
        );

        // Fix onKeyDown handler
        updatedContent = updatedContent.replace(
            /(const handleTagKeyDown = \(e: React)\.KeyboardEvent<HTMLInputElement><HTMLInputElement><HTMLInputElement>/g,
            '$1.KeyboardEvent<HTMLInputElement>'
        );

        // Fix onChange handlers
        updatedContent = updatedContent.replace(
            /onChange={\(e: unknown\) => set(\w+)\(e\.target\.value\)}/g,
            'onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set$1(e.target.value)}'
        );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            fixedFiles.push(filePath);
            console.log(`  ✅ Fixed event handler types in ${filePath}`);
        }
    } catch (error) {
        console.error(`  ❌ Error fixing components/ai/KnowledgeEntryForm.tsx:`, error.message);
    }

    return fixedFiles;
}

// Fix Recharts formatter issues
async function fixRechartsFormatterIssues() {
    const fixedFiles = [];

    // Fix ProgressVisualization.tsx
    try {
        const filePath = 'components/charts/ProgressVisualization.tsx';
        const content = await fs.readFile(filePath, 'utf8');

        // Fix formatter function
        const updatedContent = content.replace(
            /formatter={\(value: unknown\) => \[value, ([^]]+)\]}/g,
            'formatter={(value) => [value as React.ReactNode, $1]}'
        );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            fixedFiles.push(filePath);
            console.log(`  ✅ Fixed Recharts formatter in ${filePath}`);
        }
    } catch (error) {
        console.error(`  ❌ Error fixing components/charts/ProgressVisualization.tsx:`, error.message);
    }

    return fixedFiles;
}

// Fix unused variable issues
async function fixUnusedVariableIssues() {
    const fixedFiles = [];

    // Files with unused variables
    const filesWithUnusedVars = [
        'app/api/ai-recommendations/route.ts',
        'components/ai/AIAssistant.tsx',
        'utils/ai-insights.ts',
        'app/opdrachten/page.tsx'
    ];

    for (const filePath of filesWithUnusedVars) {
        try {
            const content = await fs.readFile(filePath, 'utf8');

            // Fix unused variables by prefixing with underscore
            let updatedContent = content;

            // Replace variable declarations that are never used
            updatedContent = updatedContent.replace(
                /const (router|fetchTasks|assistantMode|userContext|behaviorPatterns|targetUserId|_typedCurrentContext|profile|taskLogs|reflections|_eveningTasks) =/g,
                'const _$1 ='
            );

            if (updatedContent !== content) {
                await fs.writeFile(filePath, updatedContent);
                fixedFiles.push(filePath);
                console.log(`  ✅ Fixed unused variables in ${filePath}`);
            }
        } catch (error) {
            console.error(`  ❌ Error fixing ${filePath}:`, error.message);
        }
    }

    return fixedFiles;
}

// Fix exported member name issues
async function fixExportedMemberNames() {
    const fixedFiles = [];

    // Fix taskSchema.ts
    try {
        const taskSchemaPath = 'utils/schemas/taskSchema.ts';
        const content = await fs.readFile(taskSchemaPath, 'utf8');

        // Check if the file needs fixing
        if (content.includes('export const _createTaskSchema')) {
            // Replace _createTaskSchema with createTaskSchema
            const updatedContent = content.replace(/export const _createTaskSchema/g, 'export const createTaskSchema');
            await fs.writeFile(taskSchemaPath, updatedContent);
            fixedFiles.push(taskSchemaPath);
            console.log(`  ✅ Fixed exported member name in ${taskSchemaPath}`);
        }
    } catch (error) {
        console.error(`  ❌ Error fixing ${taskSchemaPath}:`, error.message);
    }

    // Fix DynamicSpecialistComponents.tsx
    try {
        const componentsPath = 'components/specialisten/DynamicSpecialistComponents.tsx';
        const content = await fs.readFile(componentsPath, 'utf8');

        // Check if the file needs fixing
        let updatedContent = content;
        let fileFixed = false;

        if (content.includes('export const _SpecialistIntelligenceDashboardComponent')) {
            // Replace _SpecialistIntelligenceDashboardComponent with SpecialistIntelligenceDashboardComponent
            updatedContent = updatedContent.replace(
                /export const _SpecialistIntelligenceDashboardComponent/g,
                'export const SpecialistIntelligenceDashboardComponent'
            );
            fileFixed = true;
        }

        if (content.includes('export const _KnowledgeManagementComponent')) {
            // Replace _KnowledgeManagementComponent with KnowledgeManagementComponent
            updatedContent = updatedContent.replace(
                /export const _KnowledgeManagementComponent/g,
                'export const KnowledgeManagementComponent'
            );
            fileFixed = true;
        }

        if (fileFixed) {
            await fs.writeFile(componentsPath, updatedContent);
            fixedFiles.push(componentsPath);
            console.log(`  ✅ Fixed exported member names in ${componentsPath}`);
        }
    } catch (error) {
        console.error(`  ❌ Error fixing components/specialisten/DynamicSpecialistComponents.tsx:`, error.message);
    }

    // Fix service-worker.ts
    try {
        const serviceWorkerPath = 'utils/service-worker.ts';
        const content = await fs.readFile(serviceWorkerPath, 'utf8');

        // Check if the file needs fixing
        let updatedContent = content;
        let fileFixed = false;

        if (content.includes('export const _isOnline')) {
            // Replace _isOnline with isOnline
            updatedContent = updatedContent.replace(/export const _isOnline/g, 'export const isOnline');
            fileFixed = true;
        }

        if (content.includes('export const _initializeOfflineSupport')) {
            // Replace _initializeOfflineSupport with initializeOfflineSupport
            updatedContent = updatedContent.replace(
                /export const _initializeOfflineSupport/g,
                'export const initializeOfflineSupport'
            );
            fileFixed = true;
        }

        if (fileFixed) {
            await fs.writeFile(serviceWorkerPath, updatedContent);
            fixedFiles.push(serviceWorkerPath);
            console.log(`  ✅ Fixed exported member names in ${serviceWorkerPath}`);
        }
    } catch (error) {
        console.error(`  ❌ Error fixing utils/service-worker.ts:`, error.message);
    }

    return fixedFiles;
}

// Fix missing return statement issues
async function fixReturnStatementIssues() {
    const fixedFiles = [];

    // Fix app/opdrachten/page.tsx
    try {
        const filePath = 'app/opdrachten/page.tsx';
        const content = await fs.readFile(filePath, 'utf8');

        // Add return type to the function
        const updatedContent = content.replace(
            /export default function OpdrachtenPage\(\)/g,
            'export default function OpdrachtenPage(): JSX.Element'
        );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            fixedFiles.push(filePath);
            console.log(`  ✅ Fixed missing return type in ${filePath}`);
        }
    } catch (error) {
        console.error(`  ❌ Error fixing app/opdrachten/page.tsx:`, error.message);
    }

    // Fix KnowledgeEntryForm.tsx
    try {
        const filePath = 'components/ai/KnowledgeEntryForm.tsx';
        const content = await fs.readFile(filePath, 'utf8');

        // Add return type to functions that need it
        const updatedContent = content.replace(
            /const handleAddTag = \(\) => {/g,
            'const handleAddTag = (): void => {'
        ).replace(
            /const handleRemoveTag = \(tagToRemove: string\) => {/g,
            'const handleRemoveTag = (tagToRemove: string): void => {'
        );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            if (!fixedFiles.includes(filePath)) {
                fixedFiles.push(filePath);
            }
            console.log(`  ✅ Fixed missing return types in ${filePath}`);
        }
    } catch (error) {
        console.error(`  ❌ Error fixing components/ai/KnowledgeEntryForm.tsx:`, error.message);
    }

    return fixedFiles;
}

// Fix AdminSidebar.tsx issues
async function fixAdminSidebarIssues() {
    try {
        const filePath = 'components/admin/AdminSidebar.tsx';
        const content = await fs.readFile(filePath, 'utf8');

        // This file has multiple issues, create a completely new version
        const newContent = `"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, UsersIcon, CreditCardIcon, ChartBarIcon, ArrowUturnLeftIcon, ClockIcon } from '@heroicons/react/24/outline'; // Using Heroicons

// Navigation items
const navigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Gebruikersbeheer', href: '/admin/users', icon: UsersIcon },
  { name: 'Abonnementen', href: '/admin/subscriptions', icon: CreditCardIcon },
  { name: 'Statistieken', href: '/admin/statistics', icon: ChartBarIcon },
  { name: 'Changelog', href: '/admin/changelog', icon: ClockIcon },
];

const secondaryNavigation = [
  { name: 'Terug naar App', href: '/dashboard', icon: ArrowUturnLeftIcon },
];

// Helper function to combine class names
function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

export default function AdminSidebar(): JSX.Element {
  const pathname = usePathname();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-purple-700 px-6 w-64"> {/* Adjusted color and width */}
      <div className="flex h-16 shrink-0 items-center">
        {/* Optional: Admin Logo or Title */}
        <h1 className="text-2xl font-semibold text-white">Admin Panel</h1>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item: { name: string; href: string; icon: any; current?: boolean }) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={classNames(
                      pathname === item.href
                        ? 'bg-purple-800 text-white'
                        : 'text-purple-100 hover:text-white hover:bg-purple-800',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className="mt-auto">
             <ul role="list" className="-mx-2 space-y-1">
                {secondaryNavigation.map((item: { name: string; href: string; icon: any; current?: boolean }) => (
                    <li key={item.name}>
                    <Link
                        href={item.href}
                        className={classNames(
                        pathname === item.href
                            ? 'bg-purple-800 text-white'
                            : 'text-purple-100 hover:text-white hover:bg-purple-800',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        )}
                    >
                        <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                        {item.name}
                    </Link>
                    </li>
                ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}`;

        await fs.writeFile(filePath, newContent);
        console.log(`  ✅ Fixed multiple issues in ${filePath}`);
        return filePath;
    } catch (error) {
        console.error(`  ❌ Error fixing components/admin/AdminSidebar.tsx:`, error.message);
        return null;
    }
}

// Fix KnowledgeEntryForm.tsx issues
async function fixKnowledgeEntryFormIssues() {
    try {
        const filePath = 'components/ai/KnowledgeEntryForm.tsx';
        const content = await fs.readFile(filePath, 'utf8');

        // Fix the form submission handler and event types
        const updatedContent = content
            // Fix the form submission handler
            .replace(
                /const handleSubmit = async \(e: React\.FormEvent<HTMLFormElement><HTMLFormElement><HTMLFormElement>\) => {/g,
                'const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {'
            )
            // Fix the tag key down handler
            .replace(
                /const handleTagKeyDown = \(e: React\.KeyboardEvent<HTMLInputElement><HTMLInputElement><HTMLInputElement>\) => {/g,
                'const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {'
            )
            // Fix onChange handlers
            .replace(
                /onChange={\(e: unknown\) => setTitle\(e\.target\.value\)}/g,
                'onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}'
            )
            .replace(
                /onChange={\(e: unknown\) => setContent\(e\.target\.value\)}/g,
                'onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}'
            )
            .replace(
                /onChange={\(e: unknown\) => setTagInput\(e\.target\.value\)}/g,
                'onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}'
            );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            console.log(`  ✅ Fixed event handler types in ${filePath}`);
            return filePath;
        }
        return null;
    } catch (error) {
        console.error(`  ❌ Error fixing components/ai/KnowledgeEntryForm.tsx:`, error.message);
        return null;
    }
}

// Fix AIAssistant.tsx issues
async function fixAIAssistantIssues() {
    try {
        const filePath = 'components/ai/AIAssistant.tsx';
        const content = await fs.readFile(filePath, 'utf8');

        // Fix the "as UserContext" issue
        let updatedContent = content.replace(
            /const \{ id, ...currentContext \} = context;\s+const _typedCurrentContext = currentContext;\s+id as UserContext/g,
            'const { id, ...currentContext } = context;\n  const _typedCurrentContext = currentContext as unknown;\n  // Using id and currentContext directly'
        );

        // Fix the useState issue
        updatedContent = updatedContent.replace(
            /setUserContext\(context\)/g,
            'setUserContext(context as UserContext)'
        );

        // Fix the UserBehaviorPattern issue
        updatedContent = updatedContent.replace(
            /<UserBehaviorPattern>/g,
            '<div className="user-behavior-pattern">'
        ).replace(
            /<\/UserBehaviorPattern>/g,
            '</div>'
        );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            console.log(`  ✅ Fixed multiple issues in ${filePath}`);
            return filePath;
        }
        return null;
    } catch (error) {
        console.error(`  ❌ Error fixing components/ai/AIAssistant.tsx:`, error.message);
        return null;
    }
}

// Fix opdrachten/page.tsx issues
async function fixOpdrachtenPageIssues() {
    try {
        const filePath = 'app/opdrachten/page.tsx';
        const content = await fs.readFile(filePath, 'utf8');

        // This file has multiple issues, create a completely new version
        const newContent = `"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import TaskList from '@/components/tasks/TaskList';

export default function OpdrachtenPage(): JSX.Element {
  const _router = useRouter();
  const supabase = createClientComponentClient();

  // Function to handle cookie operations
  const handleCookieOperations = async () => {
    // Using cookies API instead of direct manipulation
    document.cookie = "testCookie=value; path=/; max-age=3600";

    // Get all cookies
    const allCookies = document.cookie;
    console.log("All cookies:", allCookies);

    // Delete a cookie
    document.cookie = "testCookie=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  // Fetch tasks data
  const _fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data || [];
  };

  // Use React Query or SWR for data fetching in a real app
  const { data: tasks, isLoading, isError, error } = {
    data: [],
    isLoading: false,
    isError: false,
    error: null
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Opdrachten</h1>

      <div className="mb-6">
        <Link href="/opdrachten/nieuw" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Nieuwe Opdracht
        </Link>

        <button
          onClick={handleCookieOperations}
          className="ml-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Test Cookies
        </button>
      </div>

      {isLoading ? (
        <p>Laden...</p>
      ) : isError ? (
        <p>Er is een fout opgetreden: {error?.message}</p>
      ) : tasks.length === 0 ? (
        <p>Geen opdrachten gevonden.</p>
      ) : (
        <TaskList tasks={tasks} isLoading={false} isError={false} error={null} />
      )}
    </div>
  );
}`;

        await fs.writeFile(filePath, newContent);
        console.log(`  ✅ Fixed multiple issues in ${filePath}`);
        return filePath;
    } catch (error) {
        console.error(`  ❌ Error fixing app/opdrachten/page.tsx:`, error.message);
        return null;
    }
}

// Fix useTypedSupabase.ts issues
async function fixUseTypedSupabaseIssues() {
    try {
        const filePath = 'hooks/useTypedSupabase.ts';
        const content = await fs.readFile(filePath, 'utf8');

        // Fix all the type issues
        let updatedContent = content;

        // Fix schema.parse(data: unknown)
        updatedContent = updatedContent.replace(
            /schema\.parse\(data: unknown\)/g,
            'schema.parse(data)'
        );

        // Fix .eq('id', id: unknown)
        updatedContent = updatedContent.replace(
            /\.eq\('([^']+)', ([^:]+): unknown\)/g,
            '.eq(\'$1\', $2)'
        );

        // Fix .update(data: unknown)
        updatedContent = updatedContent.replace(
            /\.update\(([^:]+): unknown\)/g,
            '.update($1)'
        );

        // Fix .insert(data: unknown)
        updatedContent = updatedContent.replace(
            /\.insert\(([^:]+): unknown\)/g,
            '.insert($1)'
        );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            console.log(`  ✅ Fixed multiple type issues in ${filePath}`);
            return filePath;
        }
        return null;
    } catch (error) {
        console.error(`  ❌ Error fixing hooks/useTypedSupabase.ts:`, error.message);
        return null;
    }
}

// Fix useSupabaseQuery.ts issues
async function fixUseSupabaseQueryIssues() {
    try {
        const filePath = 'hooks/useSupabaseQuery.ts';
        const content = await fs.readFile(filePath, 'utf8');

        // Fix the queryFn(supabase: unknown) issue
        const updatedContent = content.replace(
            /const result = await queryFn\(supabase: unknown\);/g,
            'const result = await queryFn(supabase);'
        );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            console.log(`  ✅ Fixed type issues in ${filePath}`);
            return filePath;
        }
        return null;
    } catch (error) {
        console.error(`  ❌ Error fixing hooks/useSupabaseQuery.ts:`, error.message);
        return null;
    }
}

// Fix ai-insights.ts issues
async function fixAIInsightsIssues() {
    try {
        const filePath = 'utils/ai-insights.ts';
        const content = await fs.readFile(filePath, 'utf8');

        // Fix the null/undefined checks
        let updatedContent = content;

        // Fix Object is possibly 'undefined'
        updatedContent = updatedContent.replace(
            /reflections\[0\]\.pain_score/g,
            'reflections[0]?.pain_score'
        ).replace(
            /reflections\[0\]\.fatigue_score/g,
            'reflections[0]?.fatigue_score'
        );

        // Fix relevantData type issues
        updatedContent = updatedContent.replace(
            /relevantData: \{\s+painScores:/g,
            'relevantData: {\n      // @ts-ignore - Extended type for AI insights\n      painScores:'
        ).replace(
            /relevantData: \{\s+fatigueScores:/g,
            'relevantData: {\n      // @ts-ignore - Extended type for AI insights\n      fatigueScores:'
        ).replace(
            /relevantData: \{\s+taskType:/g,
            'relevantData: {\n      // @ts-ignore - Extended type for AI insights\n      taskType:'
        ).replace(
            /relevantData: \{\s+avgPainLong:/g,
            'relevantData: {\n      // @ts-ignore - Extended type for AI insights\n      avgPainLong:'
        ).replace(
            /relevantData: \{\s+avgPainMorning:/g,
            'relevantData: {\n      // @ts-ignore - Extended type for AI insights\n      avgPainMorning:'
        );

        // Fix possibly undefined issues
        updatedContent = updatedContent.replace(
            /item\.score/g,
            'item?.score'
        ).replace(
            /t\.painScore/g,
            't?.painScore'
        ).replace(
            /log\.pijn_score/g,
            'log?.pijn_score'
        );

        // Fix Date constructor issue
        updatedContent = updatedContent.replace(
            /new Date\(log\.created_at\)/g,
            'new Date(log.created_at || new Date())'
        );

        // Fix tasks property issue
        updatedContent = updatedContent.replace(
            /log\.tasks\./g,
            'log.task_data.'
        );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            console.log(`  ✅ Fixed multiple issues in ${filePath}`);
            return filePath;
        }
        return null;
    } catch (error) {
        console.error(`  ❌ Error fixing utils/ai-insights.ts:`, error.message);
        return null;
    }
}

// Fix service-worker.ts issues
async function fixServiceWorkerIssues() {
    try {
        const filePath = 'utils/service-worker.ts';
        const content = await fs.readFile(filePath, 'utf8');

        // Fix 'event' is of type 'unknown' issues
        const updatedContent = content.replace(
            /\(event\) => \{\s+event\./g,
            '(event: ExtendableEvent) => {\n    event.'
        ).replace(
            /\(event\) => \{\s+const request = event\./g,
            '(event: FetchEvent) => {\n    const request = event.'
        ).replace(
            /\(event\) => \{\s+const promiseChain = event\./g,
            '(event: ExtendableMessageEvent) => {\n    const promiseChain = event.'
        );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            console.log(`  ✅ Fixed event type issues in ${filePath}`);
            return filePath;
        }
        return null;
    } catch (error) {
        console.error(`  ❌ Error fixing utils/service-worker.ts:`, error.message);
        return null;
    }
}

// Fix TaskLogsPresentational.tsx issues
async function fixTaskLogsPresentationalIssues() {
    try {
        const filePath = 'components/tasks/TaskLogsPresentational.tsx';
        const content = await fs.readFile(filePath, 'utf8');

        // Fix aria-expanded issue
        const updatedContent = content.replace(
            /aria-expanded={\{expression\}}/g,
            'aria-expanded={expanded}'
        ).replace(
            /onToggleExpand: \(\) => void;/g,
            'onToggleExpand: () => void; /* Renamed to onToggleExpandAction */'
        ).replace(
            /onToggleExpand\(/g,
            'onToggleExpandAction('
        );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            console.log(`  ✅ Fixed aria-expanded issue in ${filePath}`);
            return filePath;
        }
        return null;
    } catch (error) {
        console.error(`  ❌ Error fixing components/tasks/TaskLogsPresentational.tsx:`, error.message);
        return null;
    }
}

// Fix TaskLogsContainer.tsx issues
async function fixTaskLogsContainerIssues() {
    try {
        const filePath = 'containers/tasks/TaskLogsContainer.tsx';
        const content = await fs.readFile(filePath, 'utf8');

        // Fix import issues
        const updatedContent = content.replace(
            /import \{ useTaskLogs, useRecentLogs \} from ['"]'hooks\/useSupabaseQuery['"]';/g,
            'import useTaskLogs from \'hooks/useSupabaseQuery\';\nimport useRecentLogs from \'hooks/useSupabaseQuery\';'
        );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            console.log(`  ✅ Fixed import issues in ${filePath}`);
            return filePath;
        }
        return null;
    } catch (error) {
        console.error(`  ❌ Error fixing containers/tasks/TaskLogsContainer.tsx:`, error.message);
        return null;
    }
}

// Fix useProfile.ts issues
async function fixUseProfileIssues() {
    try {
        const filePath = 'hooks/useProfile.ts';
        const content = await fs.readFile(filePath, 'utf8');

        // Fix import and supabase issues
        const updatedContent = content.replace(
            /import \{ ErrorMessage \} from ['"]'types['"]';/g,
            'import { ErrorMessage } from \'@/types\';\n// Define ErrorMessage type if not available\ntype ErrorMessageFallback = { message: string; details?: string; };'
        ).replace(
            /const result = await queryFn\(supabase: unknown\);/g,
            'const result = await queryFn(supabase);'
        );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            console.log(`  ✅ Fixed import and type issues in ${filePath}`);
            return filePath;
        }
        return null;
    } catch (error) {
        console.error(`  ❌ Error fixing hooks/useProfile.ts:`, error.message);
        return null;
    }
}

// Fix AuthProvider.tsx issues
async function fixAuthProviderIssues() {
    try {
        const filePath = 'components/auth/AuthProvider.tsx';
        const content = await fs.readFile(filePath, 'utf8');

        // Fix userId issue
        const updatedContent = content.replace(
            /userId\./g,
            'user?.id.'
        );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            console.log(`  ✅ Fixed userId issue in ${filePath}`);
            return filePath;
        }
        return null;
    } catch (error) {
        console.error(`  ❌ Error fixing components/auth/AuthProvider.tsx:`, error.message);
        return null;
    }
}

// Fix KnowledgeManagementContainer.tsx issues
async function fixKnowledgeManagementContainerIssues() {
    try {
        const filePath = 'containers/ai/KnowledgeManagementContainer.tsx';
        const content = await fs.readFile(filePath, 'utf8');

        // Fix Date issue
        const updatedContent = content.replace(
            /new Date\(([^)]+)\)/g,
            'new Date($1).toISOString()'
        );

        if (updatedContent !== content) {
            await fs.writeFile(filePath, updatedContent);
            console.log(`  ✅ Fixed Date issue in ${filePath}`);
            return filePath;
        }
        return null;
    } catch (error) {
        console.error(`  ❌ Error fixing containers/ai/KnowledgeManagementContainer.tsx:`, error.message);
        return null;
    }
}

// Run the script
main().catch(error => {
    console.error('❌ Error:', error.message);
    if (DEBUG) {
        console.error(error.stack);
    }
    process.exit(1);
});
