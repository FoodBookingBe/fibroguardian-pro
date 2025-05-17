const fs = require('fs');
const path = require('path');
const glob = require('glob');

const projectRoot = path.resolve(__dirname, '..');

// Directories to scan for components
const dirsToScan = [
  path.join(projectRoot, 'components'),
  path.join(projectRoot, 'containers'),
  // Add other directories like 'app' if you want to generate tests for page components
  // path.join(projectRoot, 'app'), 
];

// Function to find all .tsx files, excluding .d.ts, .test.tsx, .stories.tsx, .spec.tsx
const findComponentFiles = (dir) => {
  return glob.sync(path.join(dir, '**/*.tsx'), {
    ignore: ['**/*.d.ts', '**/*.test.tsx', '**/*.stories.tsx', '**/*.spec.tsx'],
  });
};

let allComponentFiles = [];
dirsToScan.forEach(dir => {
  if (fs.existsSync(dir)) {
    allComponentFiles = allComponentFiles.concat(findComponentFiles(dir));
  } else {
    console.warn(`Directory not found, skipping: ${dir}`);
  }
});

// Filter out components that already have a test file
const componentsWithoutTests = allComponentFiles.filter(file => {
  const testFileJs = file.replace('.tsx', '.test.js');
  const testFileTsx = file.replace('.tsx', '.test.tsx');
  const testFileSpecJs = file.replace('.tsx', '.spec.js');
  const testFileSpecTsx = file.replace('.tsx', '.spec.tsx');
  return !fs.existsSync(testFileJs) && !fs.existsSync(testFileTsx) &&
         !fs.existsSync(testFileSpecJs) && !fs.existsSync(testFileSpecTsx);
});

// Genereer test templates
componentsWithoutTests.forEach(componentFile => {
  const componentName = path.basename(componentFile, '.tsx');
  // Place test file next to the component file
  const testFile = componentFile.replace('.tsx', '.test.tsx'); 
  const componentDir = path.dirname(componentFile);
  const relativePathToComponent = `./${componentName}`; // Relative import from test file to component

  // Determine if it's likely a container or presentational based on name/path
  const isContainer = componentName.includes('Container') || componentFile.includes('/containers/');
  const isPresentational = !isContainer; // Simple heuristic

  // Determine relative paths for common imports from the test file's location
  // This needs to be robust if test files are in a central __tests__ folder.
  // For now, assuming test file is co-located or in a __tests__ subfolder.
  // A more robust solution would calculate relative paths from testFile to projectRoot/lib etc.
  
  // For co-located tests, these paths might need adjustment if your structure is different
  // e.g., if lib is at root, path.relative(path.dirname(testFile), path.join(projectRoot, 'lib/QueryClientConfig'))
  const queryClientConfigPath = '@/lib/QueryClientConfig'; // Using alias
  const notificationContextPath = '@/context/NotificationContext'; // Using alias

  const testTemplate = `import { render, screen${isContainer ? ', waitFor' : ''} } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ${componentName} from '${relativePathToComponent}';
${isContainer ? 'import { QueryClient, QueryClientProvider } from \'@tanstack/react-query\';' : ''}
${isContainer ? `import { queryClient } from '${queryClientConfigPath}';` : ''}
${isContainer ? `import { NotificationProvider } from '${notificationContextPath}';` : ''}

describe('${componentName}', () => {
  ${isContainer ? 
  `const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}> {/* Use new QueryClient for test isolation */}
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </QueryClientProvider>
  );` : 
  `const defaultProps = {
    // TODO: Populate with default/mock props for ${componentName}
    // Example:
    // propName: 'mockValue',
  };

  const renderComponent = (props = {}) => {
    return render(<${componentName} {...defaultProps} {...props} />);
  };`
  }
  
  it('renders correctly', async () => {
    ${isContainer ? 
    `render(<${componentName} />, { wrapper: TestWrapper });
    // TODO: Add assertions for container initial state or loading state
    // Example:
    // expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    // await waitFor(() => expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument());` 
    : 
    `renderComponent();
    // TODO: Add assertions for presentational component
    // Example:
    // expect(screen.getByText(/some text from ${componentName}/i)).toBeInTheDocument();`
    }
  });
  
  ${isPresentational ? 
  `it('handles user interactions correctly', async () => {
    const user = userEvent.setup();
    // Example: mock a prop function
    // const mockOnClick = jest.fn();
    // renderComponent({ onClickProp: mockOnClick });
    
    // const button = screen.getByRole('button', { name: /click me/i });
    // await user.click(button);
    // expect(mockOnClick).toHaveBeenCalledTimes(1);
    
    // TODO: Add specific interaction tests for ${componentName}
  });` 
  : 
  `it('fetches and displays data correctly (if applicable)', async () => {
    // Mock your data fetching hooks (e.g., useTasks, useProfile) if this container fetches data
    // jest.mock('@/hooks/useSupabaseQuery', () => ({
    //   ...jest.requireActual('@/hooks/useSupabaseQuery'), // Import and retain default behavior
    //   useSpecificHook: jest.fn().mockReturnValue({
    //     data: [{ id: '1', name: 'Mock Data' }],
    //     isLoading: false,
    //     isError: false,
    //     error: null,
    //   }),
    // }));

    render(<${componentName} />, { wrapper: TestWrapper });
    
    // TODO: Test data loading and display
    // Example:
    // await waitFor(() => {
    //   expect(screen.getByText(/Mock Data/i)).toBeInTheDocument();
    // });
  });

  it('handles mutations and notifications correctly (if applicable)', async () => {
    // const user = userEvent.setup();
    // Mock your mutation hooks (e.g., useUpsertTask)
    // jest.mock('@/hooks/useMutations', () => ({
    //   ...jest.requireActual('@/hooks/useMutations'),
    //   useSpecificMutation: jest.fn().mockReturnValue({
    //     mutate: jest.fn((data, { onSuccess }) => onSuccess()), // Simulate success
    //     isPending: false,
    //   }),
    // }));
    // const mockAddNotification = jest.fn();
    // jest.mock('@/context/NotificationContext', () => ({
    //   ...jest.requireActual('@/context/NotificationContext'),
    //   useNotification: () => ({ addNotification: mockAddNotification }),
    // }));

    render(<${componentName} />, { wrapper: TestWrapper });

    // TODO: Simulate action that triggers mutation
    // Example:
    // const submitButton = screen.getByRole('button', { name: /submit/i });
    // await user.click(submitButton);

    // await waitFor(() => {
    //   expect(mockAddNotification).toHaveBeenCalledWith('success', expect.any(String));
    // });
  });`
  }
});
`;
  
  // Schrijf test file
  try {
    // Ensure directory exists
    const testDir = path.dirname(testFile);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(testFile, testTemplate);
    console.log(`Generated test template for ${componentName} at ${testFile}`);
  } catch (err) {
    console.error(`Failed to write test template for ${componentFile}:`, err);
  }
});

console.log(`\nProcessed ${allComponentFiles.length} component files.`);
console.log(`Generated ${componentsWithoutTests.length} new test templates.`);
if (componentsWithoutTests.length > 0) {
  console.log("Please review and complete the TODOs in the generated test files.");
}
