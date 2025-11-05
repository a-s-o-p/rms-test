import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Plus, Loader2 } from 'lucide-react';
import { Label } from './ui/label';
import { toast } from 'sonner';
import {
  api,
  RequirementResponse,
  RequirementVersionResponse,
  StakeholderResponse,
  formatEnumValue
} from '../lib/api';

interface RequirementsProps {
  projectId: string | null;
}

interface NewVersionForm {
  title: string;
  description: string;
  stakeholderId: string;
  category: string;
  type: string;
  status: string;
  priority: number;
  conflicts: string;
  dependencies: string;
}

const requirementTypes = ['FUNCTIONAL', 'NON_FUNCTIONAL', 'CONSTRAINT'];
const requirementStatuses = ['DRAFT', 'REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED'];
const priorityOptions = [1, 2, 3, 4, 5];

export function Requirements({ projectId }: RequirementsProps) {
  const [requirements, setRequirements] = useState<RequirementResponse[]>([]);
  const [stakeholders, setStakeholders] = useState<StakeholderResponse[]>([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [versionsByRequirement, setVersionsByRequirement] = useState<Record<string, RequirementVersionResponse[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [newVersion, setNewVersion] = useState<NewVersionForm>({
    title: '',
    description: '',
    stakeholderId: '',
    category: '',
    type: 'FUNCTIONAL',
    status: 'DRAFT',
    priority: 3,
    conflicts: '',
    dependencies: ''
  });
  const [savingVersion, setSavingVersion] = useState(false);

  const stakeholderMap = useMemo(() => {
    const map = new Map<string, StakeholderResponse>();
    stakeholders.forEach((stakeholder) => map.set(stakeholder.id, stakeholder));
    return map;
  }, [stakeholders]);

  useEffect(() => {
    if (!projectId) {
      setRequirements([]);
      setStakeholders([]);
      setSelectedRequirementId(null);
      setVersionsByRequirement({});
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([api.requirements.list(projectId), api.stakeholders.list(projectId)])
      .then(([reqData, stakeholderData]) => {
        if (!isMounted) return;
        setRequirements(reqData);
        setStakeholders(stakeholderData);
        if (reqData.length) {
          setSelectedRequirementId(reqData[0].id);
        }
      })
      .catch((error: Error) => {
        if (!isMounted) return;
        setError(error.message);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (!selectedRequirementId || versionsByRequirement[selectedRequirementId]) return;

    let isMounted = true;
    setLoadingVersions(true);

    api.requirements
      .versions(selectedRequirementId)
      .then((versions) => {
        if (!isMounted) return;
        setVersionsByRequirement((prev) => ({ ...prev, [selectedRequirementId]: versions }));
        if (versions.length) {
          const latest = versions[0];
          setNewVersion((form) => ({
            ...form,
            title: latest.title,
            description: latest.description,
            category: latest.category,
            stakeholderId: latest.stakeholder_id
          }));
        }
      })
      .catch((error: Error) => {
        if (!isMounted) return;
        toast.error('Failed to load requirement versions', { description: error.message });
      })
      .finally(() => {
        if (isMounted) {
          setLoadingVersions(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRequirementId, versionsByRequirement]);

  const selectedRequirement = useMemo(
    () => requirements.find((req) => req.id === selectedRequirementId) ?? null,
    [requirements, selectedRequirementId]
  );

  const selectedVersions = selectedRequirementId
    ? versionsByRequirement[selectedRequirementId] ?? []
    : [];

  const handleCreateVersion = () => {
    if (!selectedRequirementId) return;

    setSavingVersion(true);
    api.requirements
      .createVersion(selectedRequirementId, {
        stakeholder_id: newVersion.stakeholderId,
        title: newVersion.title,
        description: newVersion.description,
        category: newVersion.category,
        type: newVersion.type,
        status: newVersion.status,
        priority: newVersion.priority,
        conflicts: newVersion.conflicts || null,
        dependencies: newVersion.dependencies || null
      })
      .then((version) => {
        setVersionsByRequirement((prev) => ({
          ...prev,
          [selectedRequirementId]: [version, ...(prev[selectedRequirementId] ?? [])]
        }));
        toast.success('Requirement version added');
      })
      .catch((error: Error) => {
        toast.error('Failed to add version', { description: error.message });
      })
      .finally(() => setSavingVersion(false));
  };

  if (!projectId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Select a project</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Choose a project to view and manage requirements.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        <Card className="lg:w-96">
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>
              {loading ? 'Loading requirements…' : `${requirements.length} item(s)`}
            </CardDescription>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[520px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map((requirement) => (
                    <TableRow
                      key={requirement.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedRequirementId(requirement.id)}
                    >
                      <TableCell>
                        {requirement.current_version?.title ?? 'Untitled'}
                      </TableCell>
                      <TableCell>
                        {requirement.current_version ? (
                          <Badge>{formatEnumValue(requirement.current_version.status)}</Badge>
                        ) : (
                          <Badge variant="outline">No version</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && !requirements.length && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-gray-500 py-6">
                        No requirements available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex-1">
          {selectedRequirement ? (
            <>
              <CardHeader>
                <CardTitle>{selectedRequirement.current_version?.title ?? 'Requirement'}</CardTitle>
                <CardDescription>
                  {selectedRequirement.current_version
                    ? formatEnumValue(selectedRequirement.current_version.type)
                    : 'No versions yet'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-gray-900">Current Version</h3>
                  {selectedRequirement.current_version ? (
                    <div className="rounded border border-gray-200 p-4 space-y-2">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedRequirement.current_version.description}
                      </p>
                      <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <span>
                          Status: {formatEnumValue(selectedRequirement.current_version.status)}
                        </span>
                        <span>
                          Priority: {selectedRequirement.current_version.priority}
                        </span>
                        <span>
                          Stakeholder: {stakeholderMap.get(selectedRequirement.current_version.stakeholder_id)?.name ?? 'Unknown'}
                        </span>
                        <span>
                          Updated: {new Date(selectedRequirement.current_version.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">No versions available yet.</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-900">Version History</h3>
                    {loadingVersions && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
                  </div>
                  <ScrollArea className="max-h-72">
                    <div className="space-y-3">
                      {selectedVersions.map((version) => (
                        <div key={version.id} className="border border-gray-200 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-800">
                              {version.title}
                            </div>
                            <Badge>{formatEnumValue(version.status)}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap mb-2">
                            {version.description}
                          </p>
                          <div className="text-xs text-gray-500 flex gap-4 flex-wrap">
                            <span>Priority: {version.priority}</span>
                            <span>Type: {formatEnumValue(version.type)}</span>
                            <span>
                              Stakeholder:{' '}
                              {stakeholderMap.get(version.stakeholder_id)?.name ?? 'Unknown'}
                            </span>
                            <span>
                              Updated: {new Date(version.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      {!selectedVersions.length && !loadingVersions && (
                        <p className="text-sm text-gray-500">No versions recorded yet.</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-4">
                  <h3 className="text-gray-900">Create New Version</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={newVersion.title}
                        onChange={(e) => setNewVersion({ ...newVersion, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Stakeholder</Label>
                      <Select
                        value={newVersion.stakeholderId}
                        onValueChange={(value) => setNewVersion({ ...newVersion, stakeholderId: value })}
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
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      rows={6}
                      value={newVersion.description}
                      onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={newVersion.category}
                        onChange={(e) => setNewVersion({ ...newVersion, category: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={newVersion.type}
                        onValueChange={(value) => setNewVersion({ ...newVersion, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {requirementTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {formatEnumValue(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={newVersion.status}
                        onValueChange={(value) => setNewVersion({ ...newVersion, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {requirementStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {formatEnumValue(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={String(newVersion.priority)}
                        onValueChange={(value) => setNewVersion({ ...newVersion, priority: Number(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((priority) => (
                            <SelectItem key={priority} value={String(priority)}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Conflicts</Label>
                      <Input
                        value={newVersion.conflicts}
                        onChange={(e) => setNewVersion({ ...newVersion, conflicts: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Dependencies</Label>
                      <Input
                        value={newVersion.dependencies}
                        onChange={(e) => setNewVersion({ ...newVersion, dependencies: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateVersion}
                    disabled={
                      !newVersion.title || !newVersion.description || !newVersion.stakeholderId || savingVersion
                    }
                  >
                    {savingVersion ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add Version
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardHeader>
              <CardTitle>Select a requirement</CardTitle>
              <CardDescription>Choose a requirement from the list to view its versions.</CardDescription>
            </CardHeader>
          )}
        </Card>
      </div>
    </div>
  );
}

