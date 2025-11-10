import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, GitBranch, CheckCircle2, History, ArrowLeft, Edit2, Save, X, Search, Sparkles, Loader2, ArrowUpDown, Trash2, Filter } from 'lucide-react';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { useData, Requirement, RequirementVersion, Idea } from '../utils/DataContext';

// Categories match seed data from backend
const categories = ['USER INTERFACE', 'APPLICATION LOGIC', 'API INTEGRATION', 'DATA MANAGEMENT', 'SECURITY', 'PERFORMANCE', 'INFRASTRUCTURE', 'OPERATIONS', 'COMPLIANCE', 'USABILITY', 'AVAILABILITY', 'MAINTAINABILITY'];
const types = ['BUSINESS', 'STAKEHOLDER', 'FUNCTIONAL', 'NON_FUNCTIONAL', 'SYSTEM', 'TRANSITION', 'INTERFACE', 'USER', 'REGULATORY', 'OPERATIONAL', 'SECURITY', 'PERFORMANCE'];
const statuses = ['DRAFT', 'REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED', 'ARCHIVED', 'DEPRECATED'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function Requirements() {
  const {
    requirements,
    addRequirement,
    updateRequirement,
    addRequirementVersion,
    deleteRequirementVersion,
    setCurrentRequirementVersion,
    deleteRequirement,
    ideas: availableIdeas,
    teamMembers,
    generateRequirementsWithAI
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStakeholder, setFilterStakeholder] = useState('all');
  const [sortBy, setSortBy] = useState<'priority' | 'status' | 'category' | 'createdAt' | 'updatedAt'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRequirement, setEditedRequirement] = useState<Requirement | null>(null);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [newVersion, setNewVersion] = useState({ title: '', description: '' });
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedIdeas, setSelectedIdeas] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [sortColumn, setSortColumn] = useState<'title' | 'priority' | 'status' | 'iceScore' | 'createdAt' | 'updatedAt'>('iceScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [previewVersion, setPreviewVersion] = useState<string | null>(null);

  // Initialize with preselected values
  const getInitialRequirementState = () => ({
    stakeholder: teamMembers.length > 0 ? teamMembers[0].fullName : '',
    title: '',
    description: '',
    conflicts: 'None',
    dependencies: 'None',
    category: categories[0] || '',
    type: types[0] || 'FUNCTIONAL',
    status: 'DRAFT',
    priority: 'MEDIUM',
    linkedIdeaIds: [] as string[]
  });

  const [newRequirement, setNewRequirement] = useState(getInitialRequirementState());

  // Update preselected stakeholder when teamMembers changes
  useEffect(() => {
    if (teamMembers.length > 0 && (!newRequirement.stakeholder || newRequirement.stakeholder === '')) {
      setNewRequirement(prev => ({ ...prev, stakeholder: teamMembers[0].fullName }));
    }
  }, [teamMembers.length]);



  const handleAddRequirement = async () => {
    if (!newRequirement.stakeholder || !newRequirement.category || !newRequirement.type) {
      toast.error('Please select stakeholder, category, and type');
      return;
    }

    try {
      const requirement: Requirement = {
        id: `REQ-${String(requirements.length + 1).padStart(3, '0')}`,
        stakeholder: newRequirement.stakeholder,
        versions: [
          {
            version: '1.0',
            title: newRequirement.title,
            description: newRequirement.description,
            isCurrent: true,
            createdAt: new Date().toISOString().split('T')[0]
          }
        ],
        conflicts: newRequirement.conflicts,
        dependencies: newRequirement.dependencies,
        category: newRequirement.category,
        type: newRequirement.type,
        status: newRequirement.status,
        priority: newRequirement.priority,
        linkedIdeaIds: newRequirement.linkedIdeaIds.length > 0 ? newRequirement.linkedIdeaIds : undefined
      };
      await addRequirement(requirement);
      toast.success('Requirement added successfully');
      setNewRequirement(getInitialRequirementState());
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error adding requirement:', error);
      toast.error('Failed to add requirement', {
        description: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  };

  const handleGenerateRequirements = async () => {
    if (selectedIdeas.size === 0) return;

    setIsGenerating(true);

    const ideasToConvert = availableIdeas.filter((idea) => selectedIdeas.has(idea.id));

    try {
      const generated = await generateRequirementsWithAI(ideasToConvert);

      if (generated.length > 0) {
        toast.success('Requirements Generated!', {
          description: `Successfully generated ${generated.length} requirement${generated.length === 1 ? '' : 's'} from selected ideas.`
        });
      } else {
        toast.info('No requirements created', {
          description: 'The AI could not derive requirements from the selected ideas. Consider adjusting your selection.'
        });
      }

      setIsGenerateDialogOpen(false);
      setSelectedIdeas(new Set());
    } catch (error) {
      toast.error('Failed to generate requirements', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred while contacting the AI service.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleIdeaSelection = (ideaId: string) => {
    const newSelection = new Set(selectedIdeas);
    if (newSelection.has(ideaId)) {
      newSelection.delete(ideaId);
    } else {
      newSelection.add(ideaId);
    }
    setSelectedIdeas(newSelection);
  };

  const toggleAllIdeas = () => {
    if (selectedIdeas.size === availableIdeas.length) {
      setSelectedIdeas(new Set());
    } else {
      setSelectedIdeas(new Set(availableIdeas.map(idea => idea.id)));
    }
  };

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedIdeas = [...availableIdeas].sort((a, b) => {
    let aValue: string | number | undefined = a[sortColumn as keyof typeof a];
    let bValue: string | number | undefined = b[sortColumn as keyof typeof b];

    if (sortColumn === 'iceScore') {
      aValue = a.iceScore;
      bValue = b.iceScore;
    } else if (sortColumn === 'createdAt') {
      aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    } else if (sortColumn === 'updatedAt') {
      aValue = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      bValue = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue || '').toLowerCase();
    const bStr = String(bValue || '').toLowerCase();

    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  const handleOpenRequirement = (req: Requirement) => {
    setSelectedRequirement(req);
    setEditedRequirement(req);
    setIsEditing(false);
    const current = getCurrentVersion(req);
    setPreviewVersion(current.version);
  };

  const handleSaveEdit = async () => {
    if (editedRequirement) {
      try {
        const refreshed = await updateRequirement(editedRequirement);
        if (refreshed) {
          setSelectedRequirement(refreshed);
          setEditedRequirement(refreshed);
          if (previewVersion) {
            const exists = refreshed.versions.some((version) => version.version === previewVersion);
            if (!exists) {
              const fallback = getCurrentVersion(refreshed);
              setPreviewVersion(fallback.version);
            }
          }
        } else {
          // Fallback if refresh failed
          setSelectedRequirement(editedRequirement);
          setEditedRequirement(editedRequirement);
        }
        setIsEditing(false);
        toast.success('Requirement updated successfully');
      } catch (error) {
        console.error('Error saving requirement:', error);
        toast.error('Failed to save requirement', {
          description: error instanceof Error ? error.message : 'An error occurred while saving'
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditedRequirement(selectedRequirement);
    setIsEditing(false);
  };

  const handleDeleteRequirement = async () => {
    if (selectedRequirement) {
      await deleteRequirement(selectedRequirement.id);
      setSelectedRequirement(null);
      setEditedRequirement(null);
      setIsEditing(false);
      setPreviewVersion(null);
    }
  };

  const handleAddVersion = async () => {
    if (!selectedRequirement) return;

    const metadataSource = editedRequirement ?? selectedRequirement;
    const payloadTitle = newVersion.title || `Version ${selectedRequirement.versions.length + 1}`;
    const payloadDescription = newVersion.description || '';

    try {
      const updatedRequirement = await addRequirementVersion(selectedRequirement, {
        title: payloadTitle,
        description: payloadDescription,
        category: metadataSource.category,
        type: metadataSource.type,
        status: metadataSource.status,
        priority: metadataSource.priority,
        conflicts: metadataSource.conflicts,
        dependencies: metadataSource.dependencies
      });

      const refreshed =
        updatedRequirement ?? requirements.find((requirement) => requirement.id === selectedRequirement.id);

      if (refreshed) {
        setSelectedRequirement(refreshed);
        setEditedRequirement(refreshed);
        const latestVersion = refreshed.versions[refreshed.versions.length - 1];
        if (latestVersion) {
          setPreviewVersion(latestVersion.version);
        }
      }

      setIsVersionDialogOpen(false);
      setNewVersion({ title: '', description: '' });
    } catch (error) {
      console.error('Error adding requirement version:', error);
      toast.error('Failed to add requirement version.', {
        description: error instanceof Error ? error.message : undefined
      });
    }
  };

  const setCurrentVersion = async (versionNumber: string) => {
    if (!selectedRequirement) return;

    const version = selectedRequirement.versions.find((item) => item.version === versionNumber);
    if (!version) return;

    try {
      const updatedRequirement = await setCurrentRequirementVersion(selectedRequirement, version);
      const refreshed =
        updatedRequirement ?? requirements.find((requirement) => requirement.id === selectedRequirement.id);

      if (refreshed) {
        setSelectedRequirement(refreshed);
        setEditedRequirement(refreshed);
      }

      setPreviewVersion(versionNumber);
    } catch (error) {
      console.error('Error setting current requirement version:', error);
      toast.error('Failed to set current version.', {
        description: error instanceof Error ? error.message : undefined
      });
    }
  };

  const getCurrentVersion = (req: Requirement) => {
    return req.versions.find(v => v.isCurrent) || req.versions[0];
  };

  useEffect(() => {
    if (!selectedRequirement) {
      setPreviewVersion(null);
      return;
    }

    const hasPreview = previewVersion
      ? selectedRequirement.versions.some((version) => version.version === previewVersion)
      : false;

    if (!hasPreview) {
      const current = getCurrentVersion(selectedRequirement);
      setPreviewVersion(current.version);
    }
  }, [selectedRequirement, previewVersion]);

  const handleDeleteVersion = async (versionNumber: string) => {
    if (!selectedRequirement) return;
    if (selectedRequirement.versions.length === 1) {
      toast.error('A requirement must have at least one version.');
      return;
    }

    const version = selectedRequirement.versions.find((item) => item.version === versionNumber);
    if (!version) return;

    try {
      const updatedRequirement = await deleteRequirementVersion(selectedRequirement, version);
      const refreshed =
        updatedRequirement ?? requirements.find((requirement) => requirement.id === selectedRequirement.id);

      if (refreshed) {
        setSelectedRequirement(refreshed);
        setEditedRequirement(refreshed);

        const fallbackVersion =
          refreshed.versions.find((item) => item.isCurrent) ?? refreshed.versions[refreshed.versions.length - 1];

        if (previewVersion === versionNumber || !previewVersion) {
          setPreviewVersion(fallbackVersion.version);
        } else if (!refreshed.versions.some((item) => item.version === previewVersion)) {
          setPreviewVersion(fallbackVersion.version);
        }
      }

      toast.success('Version deleted successfully.');
    } catch (error) {
      console.error('Error deleting requirement version:', error);
      toast.error('Failed to delete requirement version.', {
        description: error instanceof Error ? error.message : undefined
      });
    }
  };

  const uniqueStakeholders = Array.from(new Set(requirements.map(req => req.stakeholder))).sort();

  const filteredRequirements = requirements
    .filter(req => {
      const currentVersion = getCurrentVersion(req);
      
      // Search filter
      const matchesSearch = 
        req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (currentVersion?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (currentVersion?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        req.stakeholder.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Category filter
      if (filterCategory !== 'all' && req.category !== filterCategory) return false;

      // Status filter
      if (filterStatus !== 'all' && currentVersion.status !== filterStatus) return false;

      // Priority filter
      if (filterPriority !== 'all' && currentVersion.priority !== filterPriority) return false;

      // Stakeholder filter
      if (filterStakeholder !== 'all' && req.stakeholder !== filterStakeholder) return false;

      return true;
    })
    .sort((a, b) => {
      const aCurrent = getCurrentVersion(a);
      const bCurrent = getCurrentVersion(b);
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
          aValue = priorityOrder[aCurrent.priority as keyof typeof priorityOrder] ?? 0;
          bValue = priorityOrder[bCurrent.priority as keyof typeof priorityOrder] ?? 0;
          break;
        case 'status':
          const statusOrder = { 'DRAFT': 1, 'REVIEW': 2, 'APPROVED': 3, 'REJECTED': 4, 'IMPLEMENTED': 5 };
          aValue = statusOrder[aCurrent.status as keyof typeof statusOrder] ?? 0;
          bValue = statusOrder[bCurrent.status as keyof typeof statusOrder] ?? 0;
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt || '';
          bValue = b.createdAt || '';
          break;
        case 'updatedAt':
          aValue = a.updatedAt || '';
          bValue = b.updatedAt || '';
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortOrder === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'LOW': 'bg-gray-100 text-gray-800',
      'MEDIUM': 'bg-blue-100 text-blue-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'REVIEW': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'IMPLEMENTED': 'bg-blue-100 text-blue-800',
      'PROPOSED': 'bg-purple-100 text-purple-800',
      'ACCEPTED': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (selectedRequirement) {
    const displayReq = isEditing ? editedRequirement! : selectedRequirement;
    const baseVersionSource = isEditing ? editedRequirement! : selectedRequirement;
    const currentVersion = getCurrentVersion(baseVersionSource);
    const displayVersion = previewVersion
      ? baseVersionSource.versions.find((version) => version.version === previewVersion) || currentVersion
      : currentVersion;
    
    // Get stakeholder name for the displayed version - prioritize version's stakeholderId
    const versionStakeholderId = displayVersion.stakeholderId;
    const displayStakeholder = versionStakeholderId
      ? teamMembers.find((m) => m.id === versionStakeholderId)?.fullName || 'Unassigned'
      : (displayReq.stakeholder || 'Unassigned');
    
    // Use version-specific fields - these are stored per version
    const displayStatus = displayVersion.status || displayReq.status || 'DRAFT';
    const displayPriority = displayVersion.priority || displayReq.priority || 'MEDIUM';
    const displayCategory = displayVersion.category || displayReq.category || 'Functional';
    const displayType = displayVersion.type || displayReq.type || 'FUNCTIONAL';
    const displayConflicts = displayVersion.conflicts !== undefined ? displayVersion.conflicts : (displayReq.conflicts || 'None');
    const displayDependencies = displayVersion.dependencies !== undefined ? displayVersion.dependencies : (displayReq.dependencies || 'None');

    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start mb-4">
            <Button variant="ghost" onClick={() => setSelectedRequirement(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Requirements
            </Button>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button onClick={handleSaveEdit}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteRequirement}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1 px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {!isEditing ? (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h1 className="text-gray-900">{displayVersion.title}</h1>
                    {displayReq.versions.length > 1 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        {displayReq.versions.length} versions
                      </Badge>
                    )}
                    {displayVersion.isCurrent && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Current Version</Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mb-3">
                    <Badge className={getStatusColor(displayStatus)}>{displayStatus}</Badge>
                    <Badge className={getPriorityColor(displayPriority)}>{displayPriority}</Badge>
                    <Badge variant="outline">{displayCategory}</Badge>
                    <Badge variant="outline">{displayType}</Badge>
                  </div>
                  <p className="text-gray-600">
                    {displayReq.id} • v{displayVersion.version} • Stakeholder: {displayStakeholder}
                    {displayReq.createdAt && (
                      <> • Created: {displayReq.createdAt}</>
                    )}
                    {displayReq.updatedAt && displayReq.updatedAt !== displayReq.createdAt && (
                      <> • Updated: {displayReq.updatedAt}</>
                    )}
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{displayVersion.description}</p>
                  </CardContent>
                </Card>

                {displayReq.linkedIdeaIds && displayReq.linkedIdeaIds.length > 0 && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-blue-900">Based on Ideas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {displayReq.linkedIdeaIds.map((ideaId) => {
                          const idea = availableIdeas.find((i) => i.id === ideaId);
                          if (!idea) return null;
                          return (
                            <div key={ideaId} className="flex items-start gap-2 p-2 bg-white rounded-md border border-blue-100">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-blue-900">{idea.id} - {idea.title}</div>
                                <div className="text-xs text-blue-600 line-clamp-1 mt-1">{idea.description}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {displayDependencies !== 'None' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Dependencies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{displayDependencies}</p>
                    </CardContent>
                  </Card>
                )}

                {displayConflicts !== 'None' && (
                  <Card className="border-orange-200">
                    <CardHeader>
                      <CardTitle className="text-orange-900">Conflicts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-orange-700">{displayConflicts}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label>Requirement Title</Label>
                    <Input
                      value={displayVersion.title}
                      onChange={(event) =>
                        setEditedRequirement((prev) => {
                          if (!prev) return prev;
                          const targetVersion = previewVersion
                            ? prev.versions.find((version) => version.version === previewVersion)
                            : getCurrentVersion(prev);
                          if (!targetVersion) return prev;

                          return {
                            ...prev,
                            versions: prev.versions.map((version) =>
                              version.version === targetVersion.version
                                ? { ...version, title: event.target.value }
                                : version
                            )
                          };
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={displayVersion.description}
                      onChange={(event) =>
                        setEditedRequirement((prev) => {
                          if (!prev) return prev;
                          const targetVersion = previewVersion
                            ? prev.versions.find((version) => version.version === previewVersion)
                            : getCurrentVersion(prev);
                          if (!targetVersion) return prev;

                          return {
                            ...prev,
                            versions: prev.versions.map((version) =>
                              version.version === targetVersion.version
                                ? { ...version, description: event.target.value }
                                : version
                            )
                          };
                        })
                      }
                      rows={6}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Stakeholder</Label>
                    <Select
                      value={displayStakeholder}
                      onValueChange={(value) => {
                        const member = teamMembers.find((m) => m.fullName === value);
                        if (!member || !displayReq) return;
                        setEditedRequirement({
                          ...displayReq,
                          versions: displayReq.versions.map((version) =>
                            version.version === displayVersion.version
                              ? { ...version, stakeholderId: member.id }
                              : version
                          )
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.fullName}>{member.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={displayCategory} onValueChange={(value) => {
                      if (!displayReq) return;
                      setEditedRequirement({
                        ...displayReq,
                        versions: displayReq.versions.map((version) =>
                          version.version === displayVersion.version
                            ? { ...version, category: value }
                            : version
                        )
                      });
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={displayType} onValueChange={(value) => {
                      if (!displayReq) return;
                      setEditedRequirement({
                        ...displayReq,
                        versions: displayReq.versions.map((version) =>
                          version.version === displayVersion.version
                            ? { ...version, type: value }
                            : version
                        )
                      });
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={displayStatus} onValueChange={(value) => {
                      if (!displayReq) return;
                      setEditedRequirement({
                        ...displayReq,
                        versions: displayReq.versions.map((version) =>
                          version.version === displayVersion.version
                            ? { ...version, status: value }
                            : version
                        )
                      });
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={displayPriority} onValueChange={(value) => {
                      if (!displayReq) return;
                      setEditedRequirement({
                        ...displayReq,
                        versions: displayReq.versions.map((version) =>
                          version.version === displayVersion.version
                            ? { ...version, priority: value }
                            : version
                        )
                      });
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Based on Ideas (Optional)</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select
                        onValueChange={(value) => {
                          const currentIds = new Set(displayReq.linkedIdeaIds || []);
                          if (!currentIds.has(value)) {
                            currentIds.add(value);
                            setEditedRequirement(displayReq ? { ...displayReq, linkedIdeaIds: Array.from(currentIds) } : null);
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select an idea to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableIdeas
                            .filter((idea) => !displayReq.linkedIdeaIds?.includes(idea.id))
                            .map((idea) => (
                              <SelectItem key={idea.id} value={idea.id}>
                                {idea.id} - {idea.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {displayReq.linkedIdeaIds && displayReq.linkedIdeaIds.length > 0 && (
                      <div className="space-y-2 border rounded-md p-2">
                        {displayReq.linkedIdeaIds.map((ideaId) => {
                          const idea = availableIdeas.find((i) => i.id === ideaId);
                          if (!idea) return null;
                          return (
                            <div key={ideaId} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{idea.id} - {idea.title}</div>
                                <div className="text-xs text-gray-500 line-clamp-1">{idea.description}</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const currentIds = new Set(displayReq.linkedIdeaIds || []);
                                  currentIds.delete(ideaId);
                                  setEditedRequirement(displayReq ? { ...displayReq, linkedIdeaIds: Array.from(currentIds) } : null);
                                }}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Conflicts</Label>
                  <Input
                    value={displayConflicts}
                    onChange={(e) => {
                      if (!displayReq) return;
                      setEditedRequirement({
                        ...displayReq,
                        versions: displayReq.versions.map((version) =>
                          version.version === displayVersion.version
                            ? { ...version, conflicts: e.target.value }
                            : version
                        )
                      });
                    }}
                  />
                </div>
                <div>
                  <Label>Dependencies</Label>
                  <Input
                    value={displayDependencies}
                    onChange={(e) => {
                      if (!displayReq) return;
                      setEditedRequirement({
                        ...displayReq,
                        versions: displayReq.versions.map((version) =>
                          version.version === displayVersion.version
                            ? { ...version, dependencies: e.target.value }
                            : version
                        )
                      });
                    }}
                  />
                </div>
              </div>
            )}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Version History</CardTitle>
                  <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Version
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[85vh]">
                      <DialogHeader>
                        <DialogTitle>Add New Version</DialogTitle>
                        <DialogDescription>Create a new version of this requirement</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={newVersion.title}
                            onChange={(e) => setNewVersion({ ...newVersion, title: e.target.value })}
                            placeholder="Version title"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={newVersion.description}
                            onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                            placeholder="Version description"
                            rows={6}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsVersionDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleAddVersion}>Add Version</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayReq.versions.map((version) => (
                  <Card
                    key={version.version}
                    className={`transition-shadow cursor-pointer ${
                      displayVersion.version === version.version
                        ? 'border-blue-500 shadow-sm'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setPreviewVersion(version.version)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-gray-900">Version {version.version}</CardTitle>
                            {version.isCurrent && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Current
                              </Badge>
                            )}
                            {displayVersion.version === version.version && !version.isCurrent && (
                              <Badge className="bg-purple-100 text-purple-800">Preview</Badge>
                            )}
                          </div>
                          <CardDescription>
                            Created: {version.createdAt}
                            {version.updatedAt && version.updatedAt !== version.createdAt && (
                              <> • Updated: {version.updatedAt}</>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {!version.isCurrent && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(event) => {
                                event.stopPropagation();
                                setCurrentVersion(version.version);
                              }}
                            >
                              Set as Current
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteVersion(version.version);
                            }}
                            disabled={displayReq.versions.length === 1}
                          >
                            <Trash2 className={`w-4 h-4 ${displayReq.versions.length === 1 ? 'text-gray-400' : 'text-red-500'}`} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h4 className="text-gray-900 mb-2">{version.title}</h4>
                      <p className="text-gray-700">{version.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-gray-900 mb-1">Requirements</h2>
          <p className="text-gray-600">Manage project requirements with version control</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Requirements
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[85vh]">
              <DialogHeader>
                <DialogTitle>Generate Requirements from Ideas</DialogTitle>
                <DialogDescription>
                  Select ideas to convert into requirements. Click column headers to sort.
                </DialogDescription>
              </DialogHeader>
              {!isGenerating ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <ScrollArea className="h-[500px]">
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedIdeas.size === availableIdeas.length}
                              onCheckedChange={toggleAllIdeas}
                            />
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                            <div className="flex items-center gap-2">
                              Title
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('priority')}>
                            <div className="flex items-center gap-2">
                              Priority
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                            <div className="flex items-center gap-2">
                              Status
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('iceScore')}>
                            <div className="flex items-center gap-2">
                              ICE Score
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                            <div className="flex items-center gap-2">
                              Created
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('updatedAt')}>
                            <div className="flex items-center gap-2">
                              Updated
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedIdeas.map((idea) => (
                          <TableRow key={idea.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIdeas.has(idea.id)}
                                onCheckedChange={() => toggleIdeaSelection(idea.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-gray-900">{idea.title}</div>
                                <div className="text-gray-500 text-xs">{idea.id}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(idea.priority)}>
                                {idea.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(idea.status)}>
                                {idea.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-gray-900">{idea.iceScore}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-gray-600 text-sm">
                                {idea.createdAt || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-gray-600 text-sm">
                                {idea.updatedAt || '-'}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </ScrollArea>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-gray-600">
                      {selectedIdeas.size} idea{selectedIdeas.size !== 1 ? 's' : ''} selected
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleGenerateRequirements}
                        disabled={selectedIdeas.size === 0}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Requirement from {selectedIdeas.size > 0 ? selectedIdeas.size : ''} Idea{selectedIdeas.size !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-900 mb-2">Generating requirements...</p>
                  <p className="text-gray-600 text-sm">Converting {selectedIdeas.size} idea{selectedIdeas.size !== 1 ? 's' : ''} into requirement{selectedIdeas.size !== 1 ? 's' : ''}</p>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Requirement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Requirement</DialogTitle>
              <DialogDescription>Create a new requirement for the project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Title</Label>
                  <Input
                    value={newRequirement.title}
                    onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                    placeholder="Requirement title"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newRequirement.description}
                    onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                    placeholder="Detailed description"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Stakeholder</Label>
                  <Select value={newRequirement.stakeholder} onValueChange={(value) => setNewRequirement({ ...newRequirement, stakeholder: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stakeholder" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.fullName}>{member.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={newRequirement.category} onValueChange={(value) => setNewRequirement({ ...newRequirement, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={newRequirement.type} onValueChange={(value) => setNewRequirement({ ...newRequirement, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={newRequirement.status} onValueChange={(value) => setNewRequirement({ ...newRequirement, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={newRequirement.priority} onValueChange={(value) => setNewRequirement({ ...newRequirement, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Based on Ideas (Optional)</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select
                        onValueChange={(value) => {
                          const currentIds = new Set(newRequirement.linkedIdeaIds);
                          if (!currentIds.has(value)) {
                            currentIds.add(value);
                            setNewRequirement({ ...newRequirement, linkedIdeaIds: Array.from(currentIds) });
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select an idea to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableIdeas
                            .filter((idea) => !newRequirement.linkedIdeaIds.includes(idea.id))
                            .map((idea) => (
                              <SelectItem key={idea.id} value={idea.id}>
                                {idea.id} - {idea.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {newRequirement.linkedIdeaIds.length > 0 && (
                      <div className="space-y-2 border rounded-md p-2">
                        {newRequirement.linkedIdeaIds.map((ideaId) => {
                          const idea = availableIdeas.find((i) => i.id === ideaId);
                          if (!idea) return null;
                          return (
                            <div key={ideaId} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{idea.id} - {idea.title}</div>
                                <div className="text-xs text-gray-500 line-clamp-1">{idea.description}</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const currentIds = new Set(newRequirement.linkedIdeaIds);
                                  currentIds.delete(ideaId);
                                  setNewRequirement({ ...newRequirement, linkedIdeaIds: Array.from(currentIds) });
                                }}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Conflicts</Label>
                  <Input
                    value={newRequirement.conflicts}
                    onChange={(e) => setNewRequirement({ ...newRequirement, conflicts: e.target.value })}
                    placeholder="Any conflicts with other requirements"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Dependencies</Label>
                  <Input
                    value={newRequirement.dependencies}
                    onChange={(e) => setNewRequirement({ ...newRequirement, dependencies: e.target.value })}
                    placeholder="Dependencies on other systems or features"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddRequirement}>Add Requirement</Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filters:</span>
          </div>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStakeholder} onValueChange={setFilterStakeholder}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Stakeholder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stakeholders</SelectItem>
              {uniqueStakeholders.map((stakeholder) => (
                <SelectItem key={stakeholder} value={stakeholder}>{stakeholder}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="updatedAt">Updated Date</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Showing {filteredRequirements.length} of {requirements.length} requirements
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search requirements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRequirements.map((req) => {
          const currentVersion = getCurrentVersion(req);
          return (
            <Card key={req.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOpenRequirement(req)}>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-gray-900">{currentVersion?.title || req.id}</CardTitle>
                      {req.versions.length > 1 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {req.versions.length} versions
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                      <Badge className={getPriorityColor(req.priority)}>{req.priority}</Badge>
                      <Badge variant="outline">{req.category}</Badge>
                      <Badge variant="outline">{req.type}</Badge>
                    </div>
                    <CardDescription>
                      <span className="text-gray-600">{req.id}</span>
                      <span className="mx-2">•</span>
                      <span className="text-gray-600">v{currentVersion.version}</span>
                      <span className="mx-2">•</span>
                      <span className="text-gray-600">Stakeholder: {req.stakeholder}</span>
                      {req.createdAt && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-gray-500 text-xs">Created: {req.createdAt}</span>
                        </>
                      )}
                      {req.updatedAt && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-gray-500 text-xs">Updated: {req.updatedAt}</span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">{currentVersion?.description || 'No description'}</p>
                {req.linkedIdeaIds && req.linkedIdeaIds.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-gray-600 text-xs mb-2 font-medium">Based on Ideas</div>
                    <div className="space-y-1.5">
                      {req.linkedIdeaIds.map((ideaId) => {
                        const idea = availableIdeas.find((i) => i.id === ideaId);
                        if (!idea) return null;
                        return (
                          <div key={ideaId} className="flex items-start gap-2 text-sm">
                            <span className="text-blue-600 font-medium">•</span>
                            <div className="flex-1">
                              <span className="text-blue-900 font-medium">{idea.id}</span>
                              <span className="text-blue-700"> - {idea.title}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}