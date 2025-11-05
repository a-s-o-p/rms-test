import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Edit2, Save, X, FileText, Lightbulb, ListChecks, GitPullRequest } from 'lucide-react';
import { Progress } from './ui/progress';
import { useRmsData } from '../lib/rms-data';
import { toast } from 'sonner';

export function Dashboard() {
  const { activeProject, documents, ideas, requirements, changeRequests, updateProject, loading } = useRmsData();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeProject) {
      setEditedTitle(activeProject.title);
    }
  }, [activeProject]);

  const entityCounts = useMemo(
    () => ({
      documents: documents.length,
      ideas: ideas.length,
      requirements: requirements.length,
      changeRequests: changeRequests.length,
    }),
    [changeRequests.length, documents.length, ideas.length, requirements.length],
  );

  const handleSave = async () => {
    if (!activeProject) return;
    setIsSaving(true);
    try {
      await updateProject(activeProject.id, { title: editedTitle });
      toast.success('Project updated');
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (activeProject) {
      setEditedTitle(activeProject.title);
    }
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
      color: 'bg-blue-600',
    },
    {
      title: 'Approval Lead Time',
      value: '1.8 days',
      description: 'Average time for requirement approval',
      progress: 82,
      color: 'bg-green-600',
    },
    {
      title: 'Conversion Rate',
      value: '76%',
      description: 'Ideas converted to requirements',
      progress: 76,
      color: 'bg-purple-600',
    },
    {
      title: 'Volatility Index',
      value: '0.24',
      description: 'Requirements change frequency',
      progress: 24,
      color: 'bg-orange-600',
    },
    {
      title: 'Completeness Rate',
      value: '89%',
      description: 'Requirements with all fields filled',
      progress: 89,
      color: 'bg-teal-600',
    },
    {
      title: 'Conflict Rate',
      value: '12%',
      description: 'Requirements with conflicts',
      progress: 12,
      color: 'bg-red-600',
    },
    {
      title: 'Stakeholder Satisfaction',
      value: '4.3/5.0',
      description: 'Average satisfaction score',
      progress: 86,
      color: 'bg-indigo-600',
    },
  ];

  if (!activeProject && !loading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>No projects available</CardTitle>
            <CardDescription>Create a project through the API to begin.</CardDescription>
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
            {activeProject && (
              !isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm" disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm" disabled={isSaving}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-gray-700 mb-1">Project Title</h3>
                <p className="text-gray-900">{activeProject?.title ?? 'Loading...'}</p>
              </div>
              <div>
                <h3 className="text-gray-700 mb-1">Project Key</h3>
                <p className="text-gray-600">{activeProject?.key ?? '—'}</p>
              </div>
              <div>
                <h3 className="text-gray-700 mb-1">Status</h3>
                <p className="text-gray-600">{activeProject?.project_status ?? '—'}</p>
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
                <p className="text-gray-600">
                  {localDescription || 'Maintain project context locally here. Backend stores core project metadata such as title, key, and status.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-gray-700 mb-2 block">Project Title</label>
                <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-gray-700 mb-2 block">Status</label>
                <Input value={projectStatus ?? ''} disabled />
              </div>
              <div>
                <label className="text-gray-700 mb-2 block">Description</label>
                <Textarea value={localDescription} onChange={(e) => setLocalDescription(e.target.value)} rows={4} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">{metric.title}</CardTitle>
              <CardDescription>{metric.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-gray-900 mb-3">{metric.value}</div>
              <Progress value={metric.progress} className="h-2 bg-gray-100" indicatorClassName={metric.color} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
