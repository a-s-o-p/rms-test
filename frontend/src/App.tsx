import { useState } from 'react';
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
import { LayoutDashboard, FileText, Lightbulb, ListChecks, GitPullRequest, Users, Sparkles } from 'lucide-react';
import { DataProvider } from './utils/DataContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [smartSearchOpen, setSmartSearchOpen] = useState(false);

  return (
    <DataProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-gray-900">Requirements Management System</h1>
            <Button onClick={() => setSmartSearchOpen(true)} variant="outline">
              <Sparkles className="w-4 h-4 mr-2" />
              Smart Search
            </Button>
          </div>
        </header>
        
        <SmartSearch open={smartSearchOpen} onOpenChange={setSmartSearchOpen} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3"
            >
              <FileText className="w-4 h-4 mr-2" />
              Documentation
            </TabsTrigger>
            <TabsTrigger 
              value="ideas"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Ideas
            </TabsTrigger>
            <TabsTrigger 
              value="requirements"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3"
            >
              <ListChecks className="w-4 h-4 mr-2" />
              Requirements
            </TabsTrigger>
            <TabsTrigger 
              value="change-requests"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3"
            >
              <GitPullRequest className="w-4 h-4 mr-2" />
              Change Requests
            </TabsTrigger>
            <TabsTrigger 
              value="team"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3"
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
          <Documentation />
        </TabsContent>
        
        <TabsContent value="ideas" className="mt-0">
          <Ideas />
        </TabsContent>
        
        <TabsContent value="requirements" className="mt-0">
          <Requirements />
        </TabsContent>
        
        <TabsContent value="change-requests" className="mt-0">
          <ChangeRequests />
        </TabsContent>
        
        <TabsContent value="team" className="mt-0">
          <TeamManagement />
        </TabsContent>
      </Tabs>
      
      <Toaster />
      </div>
    </DataProvider>
  );
}
