import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Dashboard } from './components/Dashboard';
import { Documentation } from './components/Documentation';
import { Ideas } from './components/Ideas';
import { Requirements } from './components/Requirements';
import { ChangeRequests } from './components/ChangeRequests';
import { TeamManagement } from './components/TeamManagement';
import { SmartSearch } from './components/SmartSearch';
import { Toaster } from './components/ui/sonner';
import { LayoutDashboard, FileText, Lightbulb, ListChecks, GitPullRequest, Users, Sparkles, AlertCircle, X } from 'lucide-react';
import { DataProvider, useData } from './utils/DataContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [smartSearchOpen, setSmartSearchOpen] = useState(false);
  const { backendError, initializeData, clearBackendError, hasProject, isLoading } = useData();

  // Force dashboard tab if no project exists (blocking setup)
  useEffect(() => {
    if (!isLoading && !hasProject) {
      setActiveTab('dashboard');
    }
  }, [hasProject, isLoading]);

  return (
    <div className="min-h-screen bg-gray-50">
      {backendError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Backend Connection Error</p>
                <p className="text-sm text-red-600">{backendError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={initializeData}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                Retry
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearBackendError}
                className="text-red-700 hover:bg-red-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-gray-900">Requirements Management System</h1>
            <Button 
              onClick={() => setSmartSearchOpen(true)} 
              variant="outline"
              disabled={!hasProject}
              title={!hasProject ? "Please complete project setup first" : ""}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Smart Search
            </Button>
          </div>
        </header>
        
        <SmartSearch open={smartSearchOpen} onOpenChange={setSmartSearchOpen} />
      
      <Tabs value={activeTab} onValueChange={(value) => {
        // Block navigation to other tabs if no project exists
        if (!hasProject && value !== 'dashboard') {
          return;
        }
        setActiveTab(value);
      }} className="w-full">
        <div className="bg-white border-b border-gray-200">
          <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="dashboard" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="documentation"
              disabled={!hasProject}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasProject ? "Please complete project setup first" : ""}
            >
              <FileText className="w-4 h-4 mr-2" />
              Documentation
            </TabsTrigger>
            <TabsTrigger 
              value="ideas"
              disabled={!hasProject}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasProject ? "Please complete project setup first" : ""}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Ideas
            </TabsTrigger>
            <TabsTrigger 
              value="requirements"
              disabled={!hasProject}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasProject ? "Please complete project setup first" : ""}
            >
              <ListChecks className="w-4 h-4 mr-2" />
              Requirements
            </TabsTrigger>
            <TabsTrigger 
              value="change-requests"
              disabled={!hasProject}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasProject ? "Please complete project setup first" : ""}
            >
              <GitPullRequest className="w-4 h-4 mr-2" />
              Change Requests
            </TabsTrigger>
            <TabsTrigger 
              value="team"
              disabled={!hasProject}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasProject ? "Please complete project setup first" : ""}
            >
              <Users className="w-4 h-4 mr-2" />
              Team Management
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="mt-0">
          <Dashboard />
        </TabsContent>
        
        <TabsContent value="documentation" className="mt-0">
          {!hasProject ? (
            <div className="p-6 max-w-7xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-yellow-900 mb-2">Project Setup Required</h2>
                <p className="text-yellow-800 mb-4">Please complete the project setup on the Dashboard tab before accessing this section.</p>
                <Button onClick={() => setActiveTab('dashboard')} variant="outline">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <Documentation />
          )}
        </TabsContent>
        
        <TabsContent value="ideas" className="mt-0">
          {!hasProject ? (
            <div className="p-6 max-w-7xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-yellow-900 mb-2">Project Setup Required</h2>
                <p className="text-yellow-800 mb-4">Please complete the project setup on the Dashboard tab before accessing this section.</p>
                <Button onClick={() => setActiveTab('dashboard')} variant="outline">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <Ideas />
          )}
        </TabsContent>
        
        <TabsContent value="requirements" className="mt-0">
          {!hasProject ? (
            <div className="p-6 max-w-7xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-yellow-900 mb-2">Project Setup Required</h2>
                <p className="text-yellow-800 mb-4">Please complete the project setup on the Dashboard tab before accessing this section.</p>
                <Button onClick={() => setActiveTab('dashboard')} variant="outline">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <Requirements />
          )}
        </TabsContent>
        
        <TabsContent value="change-requests" className="mt-0">
          {!hasProject ? (
            <div className="p-6 max-w-7xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-yellow-900 mb-2">Project Setup Required</h2>
                <p className="text-yellow-800 mb-4">Please complete the project setup on the Dashboard tab before accessing this section.</p>
                <Button onClick={() => setActiveTab('dashboard')} variant="outline">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <ChangeRequests />
          )}
        </TabsContent>
        
        <TabsContent value="team" className="mt-0">
          {!hasProject ? (
            <div className="p-6 max-w-7xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-yellow-900 mb-2">Project Setup Required</h2>
                <p className="text-yellow-800 mb-4">Please complete the project setup on the Dashboard tab before accessing this section.</p>
                <Button onClick={() => setActiveTab('dashboard')} variant="outline">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <TeamManagement />
          )}
        </TabsContent>
      </Tabs>
      
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
