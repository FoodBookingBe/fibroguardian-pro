# Memory Leak Analysis Report

Generated on: 22/5/2025, 14:42:57

## Summary

- Total files checked: 102
- Files with potential issues: 87
- Total potential issues: 161

## Detailed Findings

### containers\tasks\TasksPageContainer.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 11)
- **EVENT_LISTENER**: Event listeners may not be properly removed (2 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 70)

### containers\tasks\TaskLogsContainer.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (1 instances) (line 0)

### containers\tasks\TaskFormContainer.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 2)
- **EVENT_LISTENER**: Event listeners may not be properly removed (6 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 47)

### containers\tasks\TaskExecutionContainer.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 2)
- **EVENT_LISTENER**: Event listeners may not be properly removed (7 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 37)

### containers\specialisten\PatientDetailsContainer.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (5 instances) (line 0)
- **TIMER_NOT_CLEARED**: setTimeout is used without clearTimeout (line 78)

### containers\specialisten\AddSpecialistButtonContainer.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 16)
- **TIMER_NOT_CLEARED**: setTimeout is used without clearTimeout (line 90)

### containers\specialisten\AddPatientButtonContainer.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 17)
- **TIMER_NOT_CLEARED**: setTimeout is used without clearTimeout (line 62)

### containers\settings\ProfileFormContainer.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 2)
- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 12)

### containers\reflecties\ReflectieFormContainer.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (6 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 25)
- **TIMER_NOT_CLEARED**: setTimeout is used without clearTimeout (line 87)

### containers\rapporten\RapportGeneratorContainer.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (8 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 25)
- **TIMER_NOT_CLEARED**: setTimeout is used without clearTimeout (line 99)

### containers\layout\TopbarContainer.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 2)
- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 58)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 13)

### containers\layout\SidebarContainer.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 2)
- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 34)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 14)

### containers\dashboard\DailyPlannerContainer.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (2 instances) (line 3)
- **EVENT_LISTENER**: Event listeners may not be properly removed (2 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 32)

### containers\dashboard\AIInsightsContainer.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (2 instances) (line 0)

### containers\auth\AuthFormContainer.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 40)

### containers\ai\KnowledgeManagementContainer.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 3)
- **EVENT_LISTENER**: Event listeners may not be properly removed (5 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 23)

### containers\ai\AIRecommendationsContainer.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (1 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 31)

### containers\ai\AIAssistantContainer.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 3)
- **EVENT_LISTENER**: Event listeners may not be properly removed (1 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 20)

### components\ui\NotificationList.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 3)
- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)

### components\ui\ConditionalRender.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (3 instances) (line 0)

### components\tasks\TaskLogsPresentational.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)

### components\tasks\TaskItemCard.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)

### components\tasks\TaskFormPresentational.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (13 instances) (line 0)

### components\tasks\TaskFilters.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 2)
- **EVENT_LISTENER**: Event listeners may not be properly removed (3 instances) (line 0)

### components\tasks\TaskExecutionPresentational.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (10 instances) (line 0)

### components\tasks\TaskCard.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (1 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 16)
- **TIMER_NOT_CLEARED**: setTimeout is used without clearTimeout (line 64)

### components\support\SupportWidget.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 2)
- **EVENT_LISTENER**: Event listeners may not be properly removed (14 instances) (line 122)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 54)

### components\subscription\withFeatureAccess.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)

### components\subscription\UpgradePrompt.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (9 instances) (line 0)

### components\subscription\SubscriptionManagement.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 2)
- **EVENT_LISTENER**: Event listeners may not be properly removed (7 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 28)
- **TIMER_NOT_CLEARED**: setTimeout is used without clearTimeout (line 41)

### components\subscription\PricingTables.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 2)
- **EVENT_LISTENER**: Event listeners may not be properly removed (7 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 19)

### components\specialisten\SpecialistTaskCreator.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (2 instances) (line 3)
- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)

### components\specialisten\SpecialistsListContainer.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (3 instances) (line 0)

### components\specialisten\SpecialistsList.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (1 instances) (line 0)

### components\specialisten\SpecialistCard.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (1 instances) (line 0)
- **TIMER_NOT_CLEARED**: setTimeout is used without clearTimeout (line 24)

### components\specialisten\PatientList.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)

### components\specialisten\PatientInsightCard.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (3 instances) (line 4)
- **EVENT_LISTENER**: Event listeners may not be properly removed (3 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 42)

### components\specialisten\PatientDetailsPresentational.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)

### components\specialisten\PatientAllTasksList.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 3)
- **EVENT_LISTENER**: Event listeners may not be properly removed (2 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 25)

### components\specialisten\DynamicSpecialistComponents.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (2 instances) (line 0)

### components\specialisten\CreateTaskAssignmentForm.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (2 instances) (line 3)
- **EVENT_LISTENER**: Event listeners may not be properly removed (9 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 35)

### components\specialisten\AddSpecialistButtonPresentational.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)

### components\specialisten\AddPatientButtonPresentational.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)

### components\settings\ProfileFormPresentational.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (8 instances) (line 0)

### components\reflecties\ReflectiesListContainer.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (2 instances) (line 0)

### components\reflecties\ReflectiesList.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (7 instances) (line 0)
- **TIMER_NOT_CLEARED**: setTimeout is used without clearTimeout (line 142)

### components\reflecties\ReflectieFormPresentational.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (5 instances) (line 0)

### components\rapporten\RapportGeneratorPresentational.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (13 instances) (line 0)

### components\onboarding\StepNavigation.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (3 instances) (line 0)

### components\onboarding\ProgressIndicator.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (1 instances) (line 0)

### components\onboarding\GuidedTour.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (3 instances) (line 2)
- **EVENT_LISTENER**: Event listeners may not be properly removed (6 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 31)

### components\layout\TopbarPresentational.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)

### components\layout\SidebarPresentational.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)

### components\layout\DashboardLayout.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 4)

### components\examples\MemoryLeakPreventionExample.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 1)
- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 26)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 10)

### components\dev\PerformanceDashboard.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 2)
- **EVENT_LISTENER**: Event listeners may not be properly removed (6 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 133)

### components\dashboard\HealthMetricsChart.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 4)

### components\dashboard\HealthMetrics.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (1 instances) (line 0)

### components\dashboard\DailyPlanner.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)

### components\dashboard\AIInsightsPresentational.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (2 instances) (line 0)

### components\common\ServiceWorkerInitializer.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 3)

### components\common\OfflineIndicator.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 3)

### components\common\LazyImage.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (2 instances) (line 1)
- **EVENT_LISTENER**: Event listeners may not be properly removed (5 instances) (line 0)

### components\common\ErrorBoundary.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (1 instances) (line 0)

### components\common\AlertMessage.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (1 instances) (line 0)

### components\charts\ProgressVisualization.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 3)
- **EVENT_LISTENER**: Event listeners may not be properly removed (8 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 45)

### components\charts\PainTrendChart.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (2 instances) (line 0)

### components\charts\HeartRateTrendChart.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (2 instances) (line 0)

### components\charts\FatigueTrendChart.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (2 instances) (line 0)

### components\charts\EnergyTrendChart.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (2 instances) (line 0)

### components\auth\AuthProvider.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (3 instances) (line 2)
- **EVENT_LISTENER**: Event listeners may not be properly removed (5 instances) (line 339)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 72)

### components\auth\AuthForm.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (11 instances) (line 0)

### components\ai\SpecialistIntelligenceDashboard.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 3)
- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 81)
- **TIMER_NOT_CLEARED**: setTimeout is used without clearTimeout (line 112)

### components\ai\KnowledgeEntryForm.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (13 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 26)

### components\ai\AIRecommendationCard.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (4 instances) (line 0)

### components\ai\AIInsightVisualization.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 2)
- **EVENT_LISTENER**: Event listeners may not be properly removed (2 instances) (line 0)

### components\ai\AIAssistant.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 3)
- **EVENT_LISTENER**: Event listeners may not be properly removed (13 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 75)
- **TIMER_NOT_CLEARED**: setTimeout is used without clearTimeout (line 153)

### components\admin\UsersPageClientView.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (2 instances) (line 3)
- **EVENT_LISTENER**: Event listeners may not be properly removed (9 instances) (line 0)

### components\admin\UserManagementControls.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (7 instances) (line 0)

### components\admin\EditUserForm.tsx

- **MISSING_CLEANUP**: Missing cleanup in useEffect (1 instances) (line 3)
- **EVENT_LISTENER**: Event listeners may not be properly removed (11 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 12)
- **TIMER_NOT_CLEARED**: setTimeout is used without clearTimeout (line 77)

### components\admin\ChangelogViewer.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (7 instances) (line 0)

### components\admin\AdminUsersList.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (2 instances) (line 0)

### components\admin\AdminSubscriptionsList.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (1 instances) (line 0)

### components\admin\AdminSidebar.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (1 instances) (line 0)

### components\admin\AddUserForm.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (12 instances) (line 0)
- **SET_STATE_WITHOUT_CHECK**: setState may be called after component unmount in async functions (line 22)
- **TIMER_NOT_CLEARED**: setTimeout is used without clearTimeout (line 64)

### components\admin\charts\UserSignupsChart.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (1 instances) (line 0)

### components\admin\charts\TaskCompletionChart.tsx

- **EVENT_LISTENER**: Event listeners may not be properly removed (1 instances) (line 0)

## Recommendations

1. **Add cleanup functions to useEffect hooks**:
   ```jsx
   useEffect(() => {
     const subscription = someAPI.subscribe();
     return () => {
       subscription.unsubscribe();
     };
   }, []);
   ```

2. **Use a mounted ref to prevent state updates after unmount**:
   ```jsx
   const isMounted = useRef(true);
   useEffect(() => {
     return () => {
       isMounted.current = false;
     };
   }, []);

   // Later in async functions
   if (isMounted.current) {
     setState(newValue);
   }
   ```

3. **Always clean up event listeners**:
   ```jsx
   useEffect(() => {
     window.addEventListener('resize', handleResize);
     return () => {
       window.removeEventListener('resize', handleResize);
     };
   }, []);
   ```

4. **Clear timers**:
   ```jsx
   useEffect(() => {
     const timerId = setTimeout(callback, 1000);
     return () => {
       clearTimeout(timerId);
     };
   }, []);
   ```

