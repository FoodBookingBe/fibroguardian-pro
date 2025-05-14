import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar'; // Assuming Topbar is created
import { ReactNode } from 'react'; // Import ReactNode

export default function DashboardLayout({
  children,
}: {
  children: ReactNode // Type children
}) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900"> {/* Added dark mode bg */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col md:ml-64"> {/* Ensure ml-64 matches sidebar width */}
        <Topbar />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"> {/* Responsive padding */}
          <div className="max-w-7xl mx-auto"> {/* Optional: Max width container for content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}