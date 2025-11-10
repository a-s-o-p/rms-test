import {useMemo, useState} from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Edit2, Save, X, FileText, Lightbulb, ListChecks, GitPullRequest } from 'lucide-react';
import { Progress } from './ui/progress';
import { useData } from '../utils/DataContext';

export function Dashboard() {
  const { projectInfo, updateProjectInfo, documents, ideas, requirements, changeRequests } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState(projectInfo);

  // Entity counts from actual data
  const entityCounts = {
    documents: documents.length,
    ideas: ideas.length,
    requirements: requirements.length,
    changeRequests: changeRequests.length
  };

  const handleSave = async () => {
    await updateProjectInfo(editedInfo);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedInfo(projectInfo);
    setIsEditing(false);
  };

  const metrics = useMemo(() => {
    const parseDate = (value?: string) => {
      if (!value) return undefined;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const daysBetween = (start: Date, end: Date) => (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const clamp = (value: number) => Math.min(100, Math.max(0, value));

    const daysFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
    const percentFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

    const timeDurations = requirements
      .map((requirement) => {
        if (!requirement.linkedIdeaIds || requirement.linkedIdeaIds.length === 0) {
          return null;
        }

        // Use the first linked idea for the calculation
        const firstLinkedIdeaId = requirement.linkedIdeaIds[0];
        const linkedIdea = ideas.find((idea) => idea.id === firstLinkedIdeaId);
        if (!linkedIdea) {
          return null;
        }

        // Status hierarchy: draft -> implemented (implemented includes approved)
        const approvedOrImplementedVersion = requirement.versions
          .filter((version) => {
            const status = version.status?.toUpperCase?.();
            return status === 'APPROVED' || status === 'IMPLEMENTED';
          })
          .sort((a, b) => {
            const aDate = parseDate(a.createdAt);
            const bDate = parseDate(b.createdAt);
            if (!aDate || !bDate) return 0;
            return aDate.getTime() - bDate.getTime();
          })[0];

        if (!approvedOrImplementedVersion) {
          return null;
        }

        const ideaCreated = parseDate(linkedIdea.createdAt);
        // Use created_at for now - in the future, we can query status history to get actual approval time
        const approvedAt = parseDate(approvedOrImplementedVersion.createdAt);

        if (!ideaCreated || !approvedAt) {
          return null;
        }

        const difference = daysBetween(ideaCreated, approvedAt);
        return Number.isFinite(difference) ? Math.max(0, difference) : null;
      })
      .filter((value): value is number => value !== null && Number.isFinite(value));

    const averageTimeToRequirement = timeDurations.length
      ? timeDurations.reduce((sum, value) => sum + value, 0) / timeDurations.length
      : null;

    const totalRequirements = requirements.length;
    // Check conflicts in current version or requirement level
    const conflictCount = requirements.filter((requirement) => {
      const currentVersion = requirement.versions.find((v) => v.isCurrent) || requirement.versions[requirement.versions.length - 1];
      const conflicts = currentVersion?.conflicts || requirement.conflicts;
      return conflicts && conflicts.trim().toLowerCase() !== 'none' && conflicts.trim() !== '';
    }).length;
    const conflictRate = totalRequirements > 0 ? (conflictCount / totalRequirements) * 100 : null;

    // Status hierarchy: approved -> implemented (implemented includes approved)
    const approvedChangeRequests = changeRequests.filter((changeRequest) => {
      const status = changeRequest.status?.toUpperCase?.();
      return (status === 'APPROVED' || status === 'IMPLEMENTED') && changeRequest.resolvedAt;
    });
    const changeLeadDurations = approvedChangeRequests
      .map((changeRequest) => {
        const createdAt = parseDate(changeRequest.createdAt);
        const resolvedAt = parseDate(changeRequest.resolvedAt);
        if (!createdAt || !resolvedAt) {
          return null;
        }
        const duration = daysBetween(createdAt, resolvedAt);
        return Number.isFinite(duration) ? Math.max(0, duration) : null;
      })
      .filter((value): value is number => value !== null && Number.isFinite(value));

    const averageChangeLeadTime = changeLeadDurations.length
      ? changeLeadDurations.reduce((sum, value) => sum + value, 0) / changeLeadDurations.length
      : null;

    const reworkCount = requirements.filter((requirement) => requirement.versions.length > 1).length;
    const reworkRate = totalRequirements > 0 ? (reworkCount / totalRequirements) * 100 : null;

    const formatDaysValue = (value: number | null) => (value !== null ? `${daysFormatter.format(value)} days` : 'N/A');
    const formatPercentValue = (value: number | null) => (value !== null ? `${percentFormatter.format(value)}%` : 'N/A');

    const pluralize = (count: number, singular: string, plural?: string) =>
      `${count} ${count === 1 ? singular : plural ?? `${singular}s`}`;

    return [
      {
        key: 'time-to-requirement',
        title: 'Time-to-Requirement (TTR)',
        value: formatDaysValue(averageTimeToRequirement),
        description: 'Average time from idea creation to ready requirement',
        progress:
          averageTimeToRequirement !== null ? clamp((30 / Math.max(averageTimeToRequirement, 30)) * 100) : 0,
        detail:
          timeDurations.length > 0
            ? `${pluralize(timeDurations.length, 'requirement')} with approved or implemented versions linked to ideas`
            : 'No approved or implemented requirement versions with linked ideas yet.',
        scale: { min: 'Slower', max: 'Faster' }
      },
      {
        key: 'conflict-rate',
        title: 'Conflict Rate (CR)',
        value: formatPercentValue(conflictRate),
        description: 'Share of requirements with duplication or contradictions',
        progress: conflictRate !== null ? clamp(100 - conflictRate) : 0,
        detail:
          totalRequirements > 0
            ? `${conflictCount} of ${totalRequirements} requirements have conflicts`
            : 'No requirements available.',
        scale: { min: 'High risk', max: 'Healthy' }
      },
      {
        key: 'change-lead-time',
        title: 'Change Lead Time (CLT)',
        value: formatDaysValue(averageChangeLeadTime),
        description: 'Average time for change request execution',
        progress:
          averageChangeLeadTime !== null ? clamp((14 / Math.max(averageChangeLeadTime, 14)) * 100) : 0,
        detail:
          changeLeadDurations.length > 0
            ? `${pluralize(changeLeadDurations.length, 'approved or implemented change request')}`
            : 'No approved or implemented change requests yet.',
        scale: { min: 'Slower', max: 'Faster' }
      },
      {
        key: 'rework-rate',
        title: 'Rework Rate (RDR)',
        value: formatPercentValue(reworkRate),
        description: 'Share of requirements that required re-editing',
        progress: reworkRate !== null ? clamp(100 - reworkRate) : 0,
        detail:
          totalRequirements > 0
            ? `${reworkCount} of ${totalRequirements} requirements include rework`
            : 'No requirements available.',
        scale: { min: 'Frequent', max: 'Stable' }
      }
    ];
  }, [changeRequests, ideas, requirements]);

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
            <div className="text-gray-900">{entityCounts.documents}</div>
            <p className="text-xs text-gray-500 mt-1">Total documents</p>
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
            <div className="text-gray-900">{entityCounts.ideas}</div>
            <p className="text-xs text-gray-500 mt-1">Total ideas</p>
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
            <div className="text-gray-900">{entityCounts.requirements}</div>
            <p className="text-xs text-gray-500 mt-1">Total requirements</p>
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
            <div className="text-gray-900">{entityCounts.changeRequests}</div>
            <p className="text-xs text-gray-500 mt-1">Total change requests</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
