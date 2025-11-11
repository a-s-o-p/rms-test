import {useMemo, useState, useEffect} from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Edit2, Save, X, FileText, Lightbulb, ListChecks, GitPullRequest, Plus, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { CategoryInput } from './CategoryInput';
import { useData } from '../utils/DataContext';
import { toast } from 'sonner';

interface StatusHistoryEntry {
  id: string;
  entity_type: string;
  old_status: string | null;
  new_status: string;
  changed_by_stakeholder_id: string | null;
  changed_at: string;
  notes: string | null;
}

// Helper to get badge variant and label for quality status
const getQualityBadge = (status: 'good' | 'fair' | 'poor' | null) => {
  if (!status) return null;
  
  const config = {
    good: { label: 'Good', className: 'bg-green-100 text-green-800 border-green-200' },
    fair: { label: 'Fair', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    poor: { label: 'Poor', className: 'bg-red-100 text-red-800 border-red-200' }
  };
  
  const { label, className } = config[status];
  return { label, className };
};

interface MetricScaleSettings {
  timeToRequirement: number;
  changeLeadTime: number;
  conflictRate: number;
  reworkRate: number;
}

const DEFAULT_SCALE_SETTINGS: MetricScaleSettings = {
  timeToRequirement: 30,
  changeLeadTime: 14,
  conflictRate: 100,
  reworkRate: 100
};

const roles = [
  'Product Manager',
  'Business Analyst',
  'Software Engineer',
  'QA Engineer',
  'UX Designer',
  'Project Manager',
  'Stakeholder',
  'Technical Lead',
  'Architect'
];

export function Dashboard() {
  const { projectInfo, updateProjectInfo, createProject, hasProject, documents, ideas, requirements, changeRequests, isLoading, teamMembers, addTeamMember } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState(projectInfo);
  const [statusHistoryCache, setStatusHistoryCache] = useState<Map<string, StatusHistoryEntry[]>>(new Map());
  const [isEditingScales, setIsEditingScales] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  // Determine initial setup step: start with project creation, then user creation
  const [setupStep, setSetupStep] = useState<'user' | 'project'>(() => {
    // This will be set correctly in useEffect
    return 'project';
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', role: roles[0] || '' });

  // Update setup step based on current state
  useEffect(() => {
    if (!isLoading) {
      if (!hasProject) {
        setSetupStep('project');
      } else if (teamMembers.length === 0) {
        setSetupStep('user');
      }
    }
  }, [teamMembers.length, hasProject, isLoading]);

  // Sync editedInfo with projectInfo when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditedInfo(projectInfo);
    }
  }, [projectInfo, isEditing]);
  
  // Load scale settings from localStorage or use defaults
  const [scaleSettings, setScaleSettings] = useState<MetricScaleSettings>(() => {
    const saved = localStorage.getItem('metricScaleSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SCALE_SETTINGS;
  });

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

  const handleSaveScales = () => {
    localStorage.setItem('metricScaleSettings', JSON.stringify(scaleSettings));
    setIsEditingScales(false);
  };

  const handleCancelScales = () => {
    const saved = localStorage.getItem('metricScaleSettings');
    setScaleSettings(saved ? JSON.parse(saved) : DEFAULT_SCALE_SETTINGS);
    setIsEditingScales(false);
  };

  const handleCreateUser = async () => {
    if (!newUser.fullName.trim() || !newUser.email.trim() || !newUser.role.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsCreatingUser(true);
      const member = {
        id: `TM-${String(teamMembers.length + 1).padStart(3, '0')}`,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role
      };
      await addTeamMember(member);
      setNewUser({ fullName: '', email: '', role: roles[0] || '' });
      setIsCreatingUser(false);
      toast.success('User created successfully! Setup complete.');
      // Setup is complete - page will automatically show dashboard when needsSetup becomes false
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user. Please try again.');
      setIsCreatingUser(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) {
      toast.error('Please enter a project title');
      return;
    }

    try {
      setIsCreatingProject(true);
      await createProject(
        { title: newProject.title, description: newProject.description },
        newProject.title.toLowerCase().replace(/\s+/g, '-').substring(0, 20)
      );
      setNewProject({ title: '', description: '' });
      setIsCreatingProject(false);
      // Move to user creation step if no users exist
      if (teamMembers.length === 0) {
        setSetupStep('user');
        toast.success('Project created successfully! Now create your first user.');
      } else {
        toast.success('Project created successfully!');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
      setIsCreatingProject(false);
    }
  };

  // Determine if setup modal should be shown
  const needsSetup = !isLoading && (teamMembers.length === 0 || !hasProject);

  // Fetch status history for requirement versions and change requests
  useEffect(() => {
    const fetchStatusHistory = async () => {
      const cache = new Map<string, StatusHistoryEntry[]>();
      
      // Fetch status history for all requirement versions
      for (const requirement of requirements) {
        for (const version of requirement.versions) {
          if (version.backendId) {
            try {
              const history = await fetch(`/requirements/${requirement.id}/versions/${version.backendId}/status-history`)
                .then(res => res.ok ? res.json() : [])
                .catch(() => []);
              cache.set(`requirement_version_${version.backendId}`, history);
            } catch (error) {
              console.error(`Error fetching status history for requirement version ${version.backendId}:`, error);
            }
          }
        }
      }
      
      // Fetch status history for all change requests
      for (const changeRequest of changeRequests) {
        try {
          const history = await fetch(`/change-requests/${changeRequest.id}/status-history`)
            .then(res => res.ok ? res.json() : [])
            .catch(() => []);
          cache.set(`change_request_${changeRequest.id}`, history);
        } catch (error) {
          console.error(`Error fetching status history for change request ${changeRequest.id}:`, error);
        }
      }
      
      setStatusHistoryCache(cache);
    };
    
    if (requirements.length > 0 || changeRequests.length > 0) {
      fetchStatusHistory();
    }
  }, [requirements, changeRequests]);

  // Helper function to get first approval time from status history
  const getFirstApprovalTime = (history: StatusHistoryEntry[]): Date | null => {
    if (!history || history.length === 0) return null;
    
    // Find the first entry where new_status is APPROVED, sorted by changed_at ascending
    const approvalEntry = history
      .filter(entry => entry.new_status?.toUpperCase() === 'APPROVED')
      .sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime())[0];
    
    if (!approvalEntry) return null;
    
    const approvalDate = new Date(approvalEntry.changed_at);
    return Number.isNaN(approvalDate.getTime()) ? null : approvalDate;
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

        // Find the first version that reached APPROVED status
        const approvedVersion = requirement.versions
          .filter((version) => {
            const status = version.status?.toUpperCase?.();
            return status === 'APPROVED' || status === 'IMPLEMENTED';
          })
          .sort((a, b) => {
            // Try to get approval time from status history, fallback to createdAt
            const aHistory = a.backendId ? statusHistoryCache.get(`requirement_version_${a.backendId}`) : null;
            const bHistory = b.backendId ? statusHistoryCache.get(`requirement_version_${b.backendId}`) : null;
            const aApprovalTime = aHistory ? getFirstApprovalTime(aHistory) : parseDate(a.createdAt);
            const bApprovalTime = bHistory ? getFirstApprovalTime(bHistory) : parseDate(b.createdAt);
            if (!aApprovalTime || !bApprovalTime) return 0;
            return aApprovalTime.getTime() - bApprovalTime.getTime();
          })[0];

        if (!approvedVersion) {
          return null;
        }

        const ideaCreated = parseDate(linkedIdea.createdAt);
        if (!ideaCreated) {
          return null;
        }

        // Get approval time from status history if available, otherwise use version createdAt
        let approvedAt: Date | null = null;
        if (approvedVersion.backendId) {
          const history = statusHistoryCache.get(`requirement_version_${approvedVersion.backendId}`);
          if (history) {
            approvedAt = getFirstApprovalTime(history);
          }
        }
        
        // Fallback to version createdAt if no status history available
        if (!approvedAt) {
          const fallbackDate = parseDate(approvedVersion.createdAt);
          approvedAt = fallbackDate || null;
        }

        if (!approvedAt) {
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
    // Conflict Rate: count of requirements where conflicts field is not none or not empty
    const conflictCount = requirements.filter((requirement) => {
      const currentVersion = requirement.versions.find((v) => v.isCurrent) || requirement.versions[requirement.versions.length - 1];
      const conflicts = currentVersion?.conflicts || requirement.conflicts;
      // Check if conflicts is not none and not empty
      return conflicts && conflicts.trim().toLowerCase() !== 'none' && conflicts.trim() !== '';
    }).length;
    const conflictRate = totalRequirements > 0 ? (conflictCount / totalRequirements) * 100 : null;

    // Change Lead Time: time from change request creation to first status approved
    const approvedChangeRequests = changeRequests.filter((changeRequest) => {
      const status = changeRequest.status?.toUpperCase?.();
      return status === 'APPROVED' || status === 'IMPLEMENTED';
    });
    const changeLeadDurations = approvedChangeRequests
      .map((changeRequest) => {
        const createdAt = parseDate(changeRequest.createdAt);
        if (!createdAt) {
          return null;
        }
        
        // Get first approval time from status history
        let approvedAt: Date | null = null;
        const history = statusHistoryCache.get(`change_request_${changeRequest.id}`);
        if (history && history.length > 0) {
          approvedAt = getFirstApprovalTime(history);
        }
        
        // Fallback to updated_at if status history not available (updated_at changes when status changes)
        if (!approvedAt && changeRequest.updatedAt) {
          const updatedAt = parseDate(changeRequest.updatedAt);
          if (updatedAt) {
            approvedAt = updatedAt;
          }
        }
        
        // If still no approval time, skip this change request
        if (!approvedAt) {
          return null;
        }
        
        const duration = daysBetween(createdAt, approvedAt);
        return Number.isFinite(duration) ? Math.max(0, duration) : null;
      })
      .filter((value): value is number => value !== null && Number.isFinite(value));

    const averageChangeLeadTime = changeLeadDurations.length
      ? changeLeadDurations.reduce((sum, value) => sum + value, 0) / changeLeadDurations.length
      : null;

    // Rework Rate: percentage of requirements where number of versions more than 1
    const reworkCount = requirements.filter((requirement) => requirement.versions.length > 1).length;
    const reworkRate = totalRequirements > 0 ? (reworkCount / totalRequirements) * 100 : null;

    const formatDaysValue = (value: number | null) => (value !== null ? `${daysFormatter.format(value)} days` : 'N/A');
    const formatPercentValue = (value: number | null) => (value !== null ? `${percentFormatter.format(value)}%` : 'N/A');

    const pluralize = (count: number, singular: string, plural?: string) =>
      `${count} ${count === 1 ? singular : plural ?? `${singular}s`}`;

    // Use user-defined scale settings or calculate from data
    const maxTimeToRequirement = scaleSettings.timeToRequirement;
    const maxChangeLeadTime = scaleSettings.changeLeadTime;
    const maxConflictRate = scaleSettings.conflictRate;
    const maxReworkRate = scaleSettings.reworkRate;

    // Calculate progress for days-based metrics: show actual value as percentage of max
    // Progress = (actual / max) * 100, clamped to 100%
    const timeToRequirementProgress = averageTimeToRequirement !== null
      ? clamp((averageTimeToRequirement / maxTimeToRequirement) * 100)
      : 0;
    
    const changeLeadTimeProgress = averageChangeLeadTime !== null
      ? clamp((averageChangeLeadTime / maxChangeLeadTime) * 100)
      : 0;

    // Calculate progress for percentage-based metrics: show actual value as percentage of max
    // Progress = (actual / max) * 100, clamped to 100%
    const conflictRateProgress = conflictRate !== null
      ? clamp((conflictRate / maxConflictRate) * 100)
      : 0;
    const reworkRateProgress = reworkRate !== null
      ? clamp((reworkRate / maxReworkRate) * 100)
      : 0;

    // Helper function to determine quality status based on ranges
    // Returns: 'good' | 'fair' | 'poor'
    const getQualityStatus = (
      value: number | null,
      thresholds: { good: number; fair: number },
      lowerIsBetter: boolean = true
    ): 'good' | 'fair' | 'poor' | null => {
      if (value === null) return null;
      
      if (lowerIsBetter) {
        if (value <= thresholds.good) return 'good';
        if (value <= thresholds.fair) return 'fair';
        return 'poor';
      } else {
        if (value >= thresholds.good) return 'good';
        if (value >= thresholds.fair) return 'fair';
        return 'poor';
      }
    };

    // Determine quality status for each metric based on custom max values
    // Thresholds are calculated as percentages of max: Good = 33%, Fair = 66%
    const timeToRequirementStatus = getQualityStatus(
      averageTimeToRequirement,
      { 
        good: maxTimeToRequirement * 0.33, 
        fair: maxTimeToRequirement * 0.66 
      },
      true // lower is better
    );
    
    const changeLeadTimeStatus = getQualityStatus(
      averageChangeLeadTime,
      { 
        good: maxChangeLeadTime * 0.33, 
        fair: maxChangeLeadTime * 0.66 
      },
      true // lower is better
    );
    
    const conflictRateStatus = getQualityStatus(
      conflictRate,
      { 
        good: maxConflictRate * 0.33, 
        fair: maxConflictRate * 0.66 
      },
      true // lower is better
    );
    
    const reworkRateStatus = getQualityStatus(
      reworkRate,
      { 
        good: maxReworkRate * 0.33, 
        fair: maxReworkRate * 0.66 
      },
      true // lower is better
    );

    return [
      {
        key: 'time-to-requirement',
        title: 'Time-to-Requirement (TTR)',
        value: formatDaysValue(averageTimeToRequirement),
        description: 'Average time from idea creation to ready requirement',
        progress: timeToRequirementProgress,
        qualityStatus: timeToRequirementStatus,
        detail:
          timeDurations.length > 0
            ? `${pluralize(timeDurations.length, 'requirement')} with approved or implemented versions linked to ideas`
            : 'No approved or implemented requirement versions with linked ideas yet.',
        scale: { min: '0 days', max: `${maxTimeToRequirement} days` },
        isDays: true
      },
      {
        key: 'conflict-rate',
        title: 'Conflict Rate (CR)',
        value: formatPercentValue(conflictRate),
        description: 'Share of requirements with duplication or contradictions',
        progress: conflictRateProgress,
        qualityStatus: conflictRateStatus,
        detail:
          totalRequirements > 0
            ? `${conflictCount} of ${totalRequirements} requirements have conflicts`
            : 'No requirements available.',
        scale: { min: '0%', max: `${maxConflictRate}%` },
        isDays: false
      },
      {
        key: 'change-lead-time',
        title: 'Change Lead Time (CLT)',
        value: formatDaysValue(averageChangeLeadTime),
        description: 'Average time for change request execution',
        progress: changeLeadTimeProgress,
        qualityStatus: changeLeadTimeStatus,
        detail:
          changeLeadDurations.length > 0
            ? `${pluralize(changeLeadDurations.length, 'approved or implemented change request')}`
            : 'No approved or implemented change requests yet.',
        scale: { min: '0 days', max: `${maxChangeLeadTime} days` },
        isDays: true
      },
      {
        key: 'rework-rate',
        title: 'Rework Rate (RDR)',
        value: formatPercentValue(reworkRate),
        description: 'Share of requirements that required re-editing',
        progress: reworkRateProgress,
        qualityStatus: reworkRateStatus,
        detail:
          totalRequirements > 0
            ? `${reworkCount} of ${totalRequirements} requirements include rework`
            : 'No requirements available.',
        scale: { min: '0%', max: `${maxReworkRate}%` },
        isDays: false
      }
    ];
  }, [changeRequests, ideas, requirements, statusHistoryCache, scaleSettings]);

  // Show setup page if no users or no project exists
  if (needsSetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl mb-2">Project Setup</CardTitle>
              <CardDescription className="text-base">
                {setupStep === 'project' 
                  ? 'Create your first project to manage documents, ideas, requirements, and change requests'
                  : 'Create your first user to get started. This step is required and cannot be skipped.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Progress Indicator */}
              <div className="flex items-center gap-2 mb-8">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${setupStep === 'project' ? 'w-full bg-blue-600' : 'w-full bg-blue-600'}`}></div>
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${setupStep === 'user' ? 'w-full bg-blue-600' : 'w-0 bg-gray-400'}`}></div>
                </div>
              </div>

              {setupStep === 'project' ? (
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Project Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g., My Awesome Project"
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      disabled={isCreatingProject}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isCreatingProject && newProject.title.trim()) {
                          handleCreateProject();
                        }
                      }}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Description
                    </Label>
                    <Textarea
                      placeholder="Describe your project..."
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      rows={4}
                      disabled={isCreatingProject}
                    />
                  </div>
                  <Button
                    onClick={handleCreateProject}
                    disabled={isCreatingProject || !newProject.title.trim()}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {isCreatingProject ? (
                      <>Creating...</>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g., John Doe"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                      disabled={isCreatingUser}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isCreatingUser && newUser.fullName.trim() && newUser.email.trim()) {
                          handleCreateUser();
                        }
                      }}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      placeholder="email@company.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      disabled={isCreatingUser}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isCreatingUser && newUser.fullName.trim() && newUser.email.trim()) {
                          handleCreateUser();
                        }
                      }}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <CategoryInput
                      value={newUser.role}
                      onChange={(value) => setNewUser({ ...newUser, role: value })}
                      categories={roles}
                      placeholder="Select from list or type custom role"
                    />
                  </div>
                  <Button
                    onClick={handleCreateUser}
                    disabled={isCreatingUser || !newUser.fullName.trim() || !newUser.email.trim() || !newUser.role.trim()}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {isCreatingUser ? (
                      <>Creating User...</>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      {hasProject && (
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
              <Button onClick={() => {
                setEditedInfo(projectInfo);
                setIsEditing(true);
              }} variant="outline" size="sm">
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-gray-900 mb-2">Project Requirements Health</h2>
            <p className="text-gray-600">Key metrics tracking the health and efficiency of your requirements management process</p>
          </div>
          {!isEditingScales ? (
            <Button onClick={() => setIsEditingScales(true)} variant="outline" size="sm">
              <Edit2 className="w-4 h-4 mr-2" />
              Customize Scales
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSaveScales} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Scales
              </Button>
              <Button onClick={handleCancelScales} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {isEditingScales && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customize Metric Scales</CardTitle>
            <CardDescription>Adjust the maximum values for each metric to match your project's targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Time-to-Requirement Max (days)</label>
                <Input
                  type="number"
                  min="1"
                  value={scaleSettings.timeToRequirement}
                  onChange={(e) => setScaleSettings({ ...scaleSettings, timeToRequirement: Math.max(1, parseInt(e.target.value) || 30) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Change Lead Time Max (days)</label>
                <Input
                  type="number"
                  min="1"
                  value={scaleSettings.changeLeadTime}
                  onChange={(e) => setScaleSettings({ ...scaleSettings, changeLeadTime: Math.max(1, parseInt(e.target.value) || 14) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Conflict Rate Max (%)</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={scaleSettings.conflictRate}
                  onChange={(e) => setScaleSettings({ ...scaleSettings, conflictRate: Math.max(1, Math.min(100, parseInt(e.target.value) || 100)) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Rework Rate Max (%)</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={scaleSettings.reworkRate}
                  onChange={(e) => setScaleSettings({ ...scaleSettings, reworkRate: Math.max(1, Math.min(100, parseInt(e.target.value) || 100)) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-gray-900">{metric.title}</CardTitle>
              <CardDescription>{metric.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-gray-900 text-2xl font-semibold">{metric.value}</div>
                  {metric.qualityStatus && (() => {
                    const badge = getQualityBadge(metric.qualityStatus);
                    return badge ? (
                      <Badge variant="outline" className={badge.className}>
                        {badge.label}
                      </Badge>
                    ) : null;
                  })()}
                </div>
                <div className="space-y-2">
                  <Progress value={metric.progress} className="h-2" />
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>{metric.scale?.min || '0%'}</span>
                    <span>{metric.scale?.max || '100%'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
      )}
    </>
  );
}
