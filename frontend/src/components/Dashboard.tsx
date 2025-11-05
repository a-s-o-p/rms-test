import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Edit2, Save, X, FileText, Lightbulb, ListChecks, GitPullRequest } from 'lucide-react';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { api, ProjectResponse, formatEnumValue } from '../lib/api';

interface DashboardProps {
  project: ProjectResponse | null;
  loading: boolean;
  projectError: string | null;
}

export function Dashboard({ project, loading, projectError }: DashboardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [projectDescriptions, setProjectDescriptions] = useState<Record<string, string>>({});
  const [projectInfo, setProjectInfo] = useState({ title: '', description: '' });
  const [editedInfo, setEditedInfo] = useState({ title: '', description: '' });
  const [entityCounts, setEntityCounts] = useState({
    documents: 0,
    ideas: 0,
    requirements: 0,
    changeRequests: 0
  });
  const [countsLoading, setCountsLoading] = useState(false);

  useEffect(() => {
    if (!project) {
      setProjectInfo({ title: '', description: '' });
      setEditedInfo({ title: '', description: '' });
      return;
    }

    setProjectInfo({
      title: project.title,
      description: projectDescriptions[project.id] ?? ''
    });
    setEditedInfo({
      title: project.title,
      description: projectDescriptions[project.id] ?? ''
    });
  }, [project, projectDescriptions]);

  useEffect(() => {
    if (!project) {
      setEntityCounts({ documents: 0, ideas: 0, requirements: 0, changeRequests: 0 });
      return;
    }

    let isMounted = true;
    setCountsLoading(true);

    Promise.all([
      api.documents.list(project.id),
      api.ideas.list(project.id),
      api.requirements.list(project.id),
      api.changeRequests.list()
    ])
      .then(([documents, ideas, requirements, changeRequests]) => {
        if (!isMounted) return;
        const requirementIds = new Set(requirements.map((req) => req.id));
        setEntityCounts({
          documents: documents.length,
          ideas: ideas.length,
          requirements: requirements.length,
          changeRequests: changeRequests.filter((cr) => requirementIds.has(cr.requirement_id)).length
        });
      })
      .catch((error: Error) => {
        if (!isMounted) return;
        toast.error('Unable to load dashboard data', { description: error.message });
      })
      .finally(() => {
        if (isMounted) {
          setCountsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [project?.id]);

  const handleSave = async () => {
    if (!project) return;

    try {
      if (editedInfo.title !== project.title) {
        await api.projects.update(project.id, { title: editedInfo.title });
      }

      setProjectDescriptions((prev) => ({
        ...prev,
        [project.id]: editedInfo.description
      }));

      setProjectInfo(editedInfo);
      setIsEditing(false);
      toast.success('Project updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to update project', { description: message });
    }
  };

  const handleCancel = () => {
    setEditedInfo(projectInfo);
    setIsEditing(false);
  };

  const projectStatus = useMemo(() => {
    if (!project) return null;
    return formatEnumValue(project.project_status);
  }, [project]);

  const metrics = [
    {
      title: 'Time to Requirement',
      value: '3.2 days',
      description: 'Average time from idea to requirement',
      progress: 68,
      color: 'bg-blue-600'
    },
    {
      title: 'Approval Lead Time',
      value: '1.8 days',
      description: 'Average time for requirement approval',
      progress: 82,
      color: 'bg-green-600'
    },
    {
      title: 'Conversion Rate',
      value: '76%',
      description: 'Ideas converted to requirements',
      progress: 76,
      color: 'bg-purple-600'
    },
    {
      title: 'Volatility Index',
      value: '0.24',
      description: 'Requirements change frequency',
      progress: 24,
      color: 'bg-orange-600'
    },
    {
      title: 'Completeness Rate',
      value: '89%',
      description: 'Requirements with all fields filled',
      progress: 89,
      color: 'bg-teal-600'
    },
    {
      title: 'Conflict Rate',
      value: '12%',
      description: 'Requirements with conflicts',
      progress: 12,
      color: 'bg-red-600'
    },
    {
      title: 'Stakeholder Satisfaction',
      value: '4.3/5.0',
      description: 'Average satisfaction score',
      progress: 86,
      color: 'bg-indigo-600'
    }
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Loading project…</CardTitle>
            <CardDescription>Please wait while we load your project information.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>No project selected</CardTitle>
            <CardDescription>
              {projectError
                ? projectError
                : 'Select a project to view documentation, ideas, requirements, and more.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Documents</CardDescription>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">
              {countsLoading ? '—' : entityCounts.documents}
            </div>
            <p className="text-xs text-gray-500 mt-1">Documents for this project</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Ideas</CardDescription>
              <Lightbulb className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">
              {countsLoading ? '—' : entityCounts.ideas}
            </div>
            <p className="text-xs text-gray-500 mt-1">Ideas contributed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Requirements</CardDescription>
              <ListChecks className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">
              {countsLoading ? '—' : entityCounts.requirements}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active requirements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Change Requests</CardDescription>
              <GitPullRequest className="w-4 h-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">
              {countsLoading ? '—' : entityCounts.changeRequests}
            </div>
            <p className="text-xs text-gray-500 mt-1">Change requests in scope</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Overview of the current project</CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-gray-700 mb-1">Project Title</h3>
                <p className="text-gray-900">{projectInfo.title}</p>
              </div>
              <div>
                <h3 className="text-gray-700 mb-1">Project Key</h3>
                <p className="text-gray-600">{project.key}</p>
              </div>
              <div>
                <h3 className="text-gray-700 mb-1">Status</h3>
                <p className="text-gray-600">{projectStatus}</p>
              </div>
              <div>
                <h3 className="text-gray-700 mb-1">Description</h3>
                <p className="text-gray-600">{projectInfo.description}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-gray-700 mb-2 block">Project Title</label>
                <Input
                  value={editedInfo.title}
                  onChange={(e) => setEditedInfo({ ...editedInfo, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-gray-700 mb-2 block">Status</label>
                <Input value={projectStatus ?? ''} disabled />
              </div>
              <div>
                <label className="text-gray-700 mb-2 block">Description</label>
                <Textarea
                  value={editedInfo.description}
                  onChange={(e) => setEditedInfo({ ...editedInfo, description: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-4">
        <h2 className="text-gray-900 mb-2">Project Requirements Health</h2>
        <p className="text-gray-600">Key metrics tracking the health and efficiency of your requirements management process</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-gray-900">{metric.title}</CardTitle>
              <CardDescription>{metric.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-gray-900">{metric.value}</div>
                <div className="space-y-2">
                  <Progress value={metric.progress} className="h-2" />
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
