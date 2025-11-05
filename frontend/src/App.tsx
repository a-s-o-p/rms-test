import { useEffect, useMemo, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { api, ProjectResponse } from './lib/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [smartSearchOpen, setSmartSearchOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setProjectsLoading(true);
    setProjectsError(null);
    api.projects
      .list()
      .then((data) => {
        if (!isMounted) return;
        setProjects(data);
        if (data.length && !activeProjectId) {
          setActiveProjectId(data[0].id);
        }
      })
      .catch((error: Error) => {
        if (!isMounted) return;
        setProjectsError(error.message);
      })
      .finally(() => {
        if (isMounted) {
          setProjectsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-gray-900">Requirements Management System</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Active project</span>
              <Select
                value={activeProjectId ?? ''}
                onValueChange={(value) => setActiveProjectId(value)}
                disabled={projectsLoading || !projects.length}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder={projectsLoading ? 'Loading projects…' : 'Select project'} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title} ({project.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {projectsError && (
              <p className="text-sm text-red-600">Failed to load projects: {projectsError}</p>
            )}
          </div>
          <Button onClick={() => setSmartSearchOpen(true)} variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            Smart Search
          </Button>
        </div>
      </header>

      <SmartSearch open={smartSearchOpen} onOpenChange={setSmartSearchOpen} projectId={activeProjectId} />

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
          <Dashboard
            project={activeProject}
            loading={projectsLoading}
            projectError={projectsError}
          />
        </TabsContent>

        <TabsContent value="documentation" className="mt-0">
          <Documentation projectId={activeProjectId} />
        </TabsContent>

        <TabsContent value="ideas" className="mt-0">
          <Ideas projectId={activeProjectId} />
        </TabsContent>

        <TabsContent value="requirements" className="mt-0">
          <Requirements projectId={activeProjectId} />
        </TabsContent>

        <TabsContent value="change-requests" className="mt-0">
          <ChangeRequests projectId={activeProjectId} />
        </TabsContent>

        <TabsContent value="team" className="mt-0">
          <TeamManagement projectId={activeProjectId} />
        </TabsContent>
      </Tabs>

      <Toaster />
    </div>
  );
}
