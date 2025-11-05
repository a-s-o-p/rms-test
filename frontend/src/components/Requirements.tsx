import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useRmsData } from '../lib/rms-data';
import type { RequirementStatus, RequirementType } from '../lib/api';
import { toast } from 'sonner';

const requirementTypeOptions: { value: RequirementType; label: string }[] = [
  { value: 'FUNCTIONAL', label: 'Functional' },
  { value: 'NON_FUNCTIONAL', label: 'Non-Functional' },
  { value: 'CONSTRAINT', label: 'Constraint' },
];

const requirementStatusOptions: { value: RequirementStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'REVIEW', label: 'In Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'IMPLEMENTED', label: 'Implemented' },
];

const priorityOptions = [1, 2, 3, 4, 5];

export function Requirements() {
  const {
    requirements,
    requirementVersions,
    stakeholders,
    createRequirement,
    createRequirementVersion,
    activeProject,
  } = useRmsData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRequirement, setNewRequirement] = useState({
    stakeholderId: '',
    title: '',
    description: '',
    category: 'General',
    type: 'FUNCTIONAL' as RequirementType,
    status: 'DRAFT' as RequirementStatus,
    priority: 3,
    conflicts: '',
    dependencies: '',
  });
  const [newVersion, setNewVersion] = useState({
    stakeholderId: '',
    title: '',
    description: '',
    category: 'General',
    type: 'FUNCTIONAL' as RequirementType,
    status: 'DRAFT' as RequirementStatus,
    priority: 3,
    conflicts: '',
    dependencies: '',
  });

  const stakeholderLookup = useMemo(
    () =>
      stakeholders.reduce<Record<string, string>>((map, stakeholder) => {
        map[stakeholder.id] = stakeholder.name;
        return map;
      }, {}),
    [stakeholders],
  );

  const filteredRequirements = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return requirements.filter((requirement) => {
      const current = requirement.current_version;
      if (!current) return false;
      const stakeholderName = current ? stakeholderLookup[current.stakeholder_id] ?? '' : '';
      return (
        current.title.toLowerCase().includes(query) ||
        current.description.toLowerCase().includes(query) ||
        stakeholderName.toLowerCase().includes(query) ||
        current.category.toLowerCase().includes(query)
      );
    });
  }, [requirements, searchTerm, stakeholderLookup]);

  const selectedRequirement = selectedRequirementId
    ? requirements.find((requirement) => requirement.id === selectedRequirementId) ?? null
    : null;
  const selectedVersions = selectedRequirement ? requirementVersions[selectedRequirement.id] ?? [] : [];

  const handleCreateRequirement = async () => {
    if (!activeProject) {
      toast.error('No project available');
      return;
    }
    if (!newRequirement.title || !newRequirement.description || !newRequirement.stakeholderId) {
      toast.error('Title, description, and stakeholder are required');
      return;
    }

    setIsSaving(true);
    try {
      await createRequirement({
        project_id: activeProject.id,
        stakeholder_id: newRequirement.stakeholderId,
        initial_version: {
          title: newRequirement.title,
          description: newRequirement.description,
          category: newRequirement.category,
          type: newRequirement.type,
          status: newRequirement.status,
          priority: newRequirement.priority,
          conflicts: newRequirement.conflicts || null,
          dependencies: newRequirement.dependencies || null,
        },
      });
      toast.success('Requirement created');
      setNewRequirement({
        stakeholderId: '',
        title: '',
        description: '',
        category: 'General',
        type: 'FUNCTIONAL',
        status: 'DRAFT',
        priority: 3,
        conflicts: '',
        dependencies: '',
      });
      setIsCreateDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create requirement';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedRequirement) {
      toast.error('Select a requirement first');
      return;
    }
    if (!newVersion.title || !newVersion.description || !newVersion.stakeholderId) {
      toast.error('Title, description, and stakeholder are required');
      return;
    }

    setIsSaving(true);
    try {
      await createRequirementVersion(selectedRequirement.id, newVersion.stakeholderId, {
        title: newVersion.title,
        description: newVersion.description,
        category: newVersion.category,
        type: newVersion.type,
        status: newVersion.status,
        priority: newVersion.priority,
        conflicts: newVersion.conflicts || null,
        dependencies: newVersion.dependencies || null,
      });
      toast.success('Requirement version created');
      setIsVersionDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create version';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const openRequirement = (requirementId: string) => {
    const requirement = requirements.find((req) => req.id === requirementId);
    if (!requirement) return;
    setSelectedRequirementId(requirement.id);
    const current = requirement.current_version;
    if (current) {
      setNewVersion({
        stakeholderId: current.stakeholder_id,
        title: current.title,
        description: current.description,
        category: current.category,
        type: current.type,
        status: current.status,
        priority: current.priority,
        conflicts: current.conflicts ?? '',
        dependencies: current.dependencies ?? '',
      });
    }
  };

  if (selectedRequirement && selectedRequirement.current_version) {
    const current = selectedRequirement.current_version;
    const stakeholderName = stakeholderLookup[current.stakeholder_id] ?? 'Unknown stakeholder';

    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start mb-4">
            <Button variant="ghost" onClick={() => setSelectedRequirementId(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Requirements
            </Button>
            <Button onClick={() => setIsVersionDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Version
            </Button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-gray-900 text-2xl font-semibold">{current.title}</h1>
              <Badge>{current.status}</Badge>
              <Badge variant="outline">Priority {current.priority}</Badge>
            </div>
            <p className="text-gray-600 text-sm">
              Stakeholder: {stakeholderName} • Category: {current.category} • Type: {current.type}
            </p>
          </div>
        </div>
        <ScrollArea className="flex-1 px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-6 text-gray-700">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Description</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">{current.description}</CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Conflicts</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 whitespace-pre-wrap">{current.conflicts ?? 'None'}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Dependencies</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 whitespace-pre-wrap">{current.dependencies ?? 'None'}</CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Version History</CardTitle>
                <CardDescription>Latest versions are shown first.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stakeholder</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedVersions.map((version) => (
                      <TableRow key={version.id}>
                        <TableCell>v{version.version_number}</TableCell>
                        <TableCell>{version.title}</TableCell>
                        <TableCell>{version.status}</TableCell>
                        <TableCell>{stakeholderLookup[version.stakeholder_id] ?? 'Unknown'}</TableCell>
                        <TableCell>{new Date(version.updated_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Version</DialogTitle>
              <DialogDescription>Capture updates to this requirement.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Stakeholder</Label>
                  <Select
                    value={newVersion.stakeholderId}
                    onValueChange={(value) => setNewVersion((prev) => ({ ...prev, stakeholderId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stakeholder" />
                    </SelectTrigger>
                    <SelectContent>
                      {stakeholders.map((stakeholder) => (
                        <SelectItem key={stakeholder.id} value={stakeholder.id}>
                          {stakeholder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={newVersion.priority.toString()}
                    onValueChange={(value) => setNewVersion((prev) => ({ ...prev, priority: Number(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority} value={priority.toString()}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={newVersion.type} onValueChange={(value: RequirementType) => setNewVersion((prev) => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {requirementTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={newVersion.status} onValueChange={(value: RequirementStatus) => setNewVersion((prev) => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {requirementStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newVersion.title} onChange={(event) => setNewVersion((prev) => ({ ...prev, title: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={6}
                  value={newVersion.description}
                  onChange={(event) => setNewVersion((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Input value={newVersion.category} onChange={(event) => setNewVersion((prev) => ({ ...prev, category: event.target.value }))} />
                </div>
                <div>
                  <Label>Conflicts</Label>
                  <Textarea
                    rows={3}
                    value={newVersion.conflicts}
                    onChange={(event) => setNewVersion((prev) => ({ ...prev, conflicts: event.target.value }))}
                  />
                </div>
                <div>
                  <Label>Dependencies</Label>
                  <Textarea
                    rows={3}
                    value={newVersion.dependencies}
                    onChange={(event) => setNewVersion((prev) => ({ ...prev, dependencies: event.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleCreateVersion} disabled={isSaving}>
                Save Version
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>Trace functional and non-functional requirements.</CardDescription>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search by title, stakeholder, or category"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!activeProject}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Requirement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Requirement</DialogTitle>
                  <DialogDescription>Define the initial version of a new requirement.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Stakeholder</Label>
                      <Select
                        value={newRequirement.stakeholderId}
                        onValueChange={(value) => setNewRequirement((prev) => ({ ...prev, stakeholderId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stakeholder" />
                        </SelectTrigger>
                        <SelectContent>
                          {stakeholders.map((stakeholder) => (
                            <SelectItem key={stakeholder.id} value={stakeholder.id}>
                              {stakeholder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={newRequirement.priority.toString()}
                        onValueChange={(value) => setNewRequirement((prev) => ({ ...prev, priority: Number(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((priority) => (
                            <SelectItem key={priority} value={priority.toString()}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={newRequirement.type}
                        onValueChange={(value: RequirementType) => setNewRequirement((prev) => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {requirementTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={newRequirement.status}
                        onValueChange={(value: RequirementStatus) => setNewRequirement((prev) => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {requirementStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={newRequirement.title} onChange={(event) => setNewRequirement((prev) => ({ ...prev, title: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      rows={6}
                      value={newRequirement.description}
                      onChange={(event) => setNewRequirement((prev) => ({ ...prev, description: event.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Input value={newRequirement.category} onChange={(event) => setNewRequirement((prev) => ({ ...prev, category: event.target.value }))} />
                    </div>
                    <div>
                      <Label>Conflicts</Label>
                      <Textarea
                        rows={3}
                        value={newRequirement.conflicts}
                        onChange={(event) => setNewRequirement((prev) => ({ ...prev, conflicts: event.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Dependencies</Label>
                      <Textarea
                        rows={3}
                        value={newRequirement.dependencies}
                        onChange={(event) => setNewRequirement((prev) => ({ ...prev, dependencies: event.target.value }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateRequirement} disabled={isSaving}>
                    Save Requirement
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[32rem]">
            <div className="grid grid-cols-1 gap-4">
              {filteredRequirements.map((requirement) => {
                const current = requirement.current_version;
                if (!current) return null;
                return (
                  <Card key={requirement.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge>{current.status}</Badge>
                            <Badge variant="outline">Priority {current.priority}</Badge>
                          </div>
                          <h3 className="text-gray-900 text-lg font-semibold">{current.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{current.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Stakeholder: {stakeholderLookup[current.stakeholder_id] ?? 'Unknown'}</span>
                            <span>Category: {current.category}</span>
                            <span>Type: {current.type}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => openRequirement(requirement.id)}>
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredRequirements.length === 0 && (
                <Card className="border border-dashed">
                  <CardContent className="py-12 text-center text-gray-500">
                    No requirements found. Add one to get started.
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

