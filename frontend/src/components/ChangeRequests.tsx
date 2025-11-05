import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Edit2, Save, X } from 'lucide-react';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import {
  api,
  ChangeRequestResponse,
  RequirementResponse,
  RequirementVersionResponse,
  StakeholderResponse,
  formatEnumValue
} from '../lib/api';

interface ChangeRequestsProps {
  projectId: string | null;
}

const changeRequestStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'IMPLEMENTED'];

export function ChangeRequests({ projectId }: ChangeRequestsProps) {
  const [requirements, setRequirements] = useState<RequirementResponse[]>([]);
  const [stakeholders, setStakeholders] = useState<StakeholderResponse[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequestResponse[]>([]);
  const [versionMap, setVersionMap] = useState<Record<string, RequirementVersionResponse>>({});
  const [selectedChangeRequestId, setSelectedChangeRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editSummary, setEditSummary] = useState('');
  const [editStatus, setEditStatus] = useState('PENDING');
  const [saving, setSaving] = useState(false);

  const stakeholderMap = useMemo(() => {
    const map = new Map<string, StakeholderResponse>();
    stakeholders.forEach((stakeholder) => map.set(stakeholder.id, stakeholder));
    return map;
  }, [stakeholders]);

  const requirementMap = useMemo(() => {
    const map = new Map<string, RequirementResponse>();
    requirements.forEach((req) => map.set(req.id, req));
    return map;
  }, [requirements]);

  useEffect(() => {
    if (!projectId) {
      setRequirements([]);
      setStakeholders([]);
      setChangeRequests([]);
      setVersionMap({});
      setSelectedChangeRequestId(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    api.requirements
      .list(projectId)
      .then(async (reqData) => {
        if (!isMounted) return;
        setRequirements(reqData);
        const [stakeholderData, changeRequestData] = await Promise.all([
          api.stakeholders.list(projectId),
          api.changeRequests.list()
        ]);

        if (!isMounted) return;

        const requirementIds = new Set(reqData.map((req) => req.id));
        const relevantChangeRequests = changeRequestData.filter((cr) => requirementIds.has(cr.requirement_id));

        setStakeholders(stakeholderData);
        setChangeRequests(relevantChangeRequests);
        if (relevantChangeRequests.length) {
          setSelectedChangeRequestId(relevantChangeRequests[0].id);
        }

        const versionEntries: [string, RequirementVersionResponse][] = [];
        await Promise.all(
          reqData.map(async (req) => {
            const versions = await api.requirements.versions(req.id);
            versions.forEach((version) => {
              versionEntries.push([version.id, version]);
            });
          })
        );

        if (!isMounted) return;
        setVersionMap(Object.fromEntries(versionEntries));
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

  const selectedChangeRequest = useMemo(
    () => changeRequests.find((cr) => cr.id === selectedChangeRequestId) ?? null,
    [changeRequests, selectedChangeRequestId]
  );

  useEffect(() => {
    if (!selectedChangeRequest) {
      setEditSummary('');
      setEditStatus('PENDING');
      setIsEditing(false);
      return;
    }

    setEditSummary(selectedChangeRequest.summary);
    setEditStatus(selectedChangeRequest.status);
  }, [selectedChangeRequest]);

  const handleSave = () => {
    if (!selectedChangeRequest) return;

    setSaving(true);
    api.changeRequests
      .update(selectedChangeRequest.id, {
        summary: editSummary,
        status: editStatus
      })
      .then((updated) => {
        setChangeRequests((prev) => prev.map((cr) => (cr.id === updated.id ? { ...cr, ...updated } : cr)));
        setIsEditing(false);
        toast.success('Change request updated');
      })
      .catch((error: Error) => {
        toast.error('Failed to update change request', { description: error.message });
      })
      .finally(() => setSaving(false));
  };

  if (!projectId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Select a project</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Choose a project to view and manage change requests.</p>
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
            <CardTitle>Change Requests</CardTitle>
            <CardDescription>
              {loading ? 'Loading change requests…' : `${changeRequests.length} request(s)`}
            </CardDescription>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[520px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Summary</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changeRequests.map((cr) => (
                    <TableRow
                      key={cr.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedChangeRequestId(cr.id)}
                    >
                      <TableCell className="max-w-[220px] truncate">
                        {cr.summary}
                      </TableCell>
                      <TableCell>
                        <Badge>{formatEnumValue(cr.status)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && !changeRequests.length && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-gray-500 py-6">
                        No change requests found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex-1">
          {selectedChangeRequest ? (
            <>
              <CardHeader className="flex flex-col gap-2">
                <CardTitle>Change Request</CardTitle>
                <CardDescription>
                  Requirement:{' '}
                  {requirementMap.get(selectedChangeRequest.requirement_id)?.current_version?.title ?? 'Unknown'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium text-gray-800">Stakeholder:</span>{' '}
                    {stakeholderMap.get(selectedChangeRequest.stakeholder_id)?.name ?? 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Status:</span>{' '}
                    {formatEnumValue(selectedChangeRequest.status)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Base version:</span>{' '}
                    {versionMap[selectedChangeRequest.base_version_id]?.title ?? 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Created:</span>{' '}
                    {new Date(selectedChangeRequest.created_at).toLocaleDateString()}
                  </div>
                </div>

                {!isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-gray-900 mb-1">Summary</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedChangeRequest.summary}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium text-gray-800">Cost:</span>{' '}
                        {selectedChangeRequest.cost ?? 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">Benefit:</span>{' '}
                        {selectedChangeRequest.benefit ?? 'Not provided'}
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Update Request
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Status</Label>
                      <Select value={editStatus} onValueChange={(value) => setEditStatus(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {changeRequestStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {formatEnumValue(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Summary</Label>
                      <Textarea
                        rows={6}
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardHeader>
              <CardTitle>Select a change request</CardTitle>
              <CardDescription>Choose a change request to review details.</CardDescription>
            </CardHeader>
          )}
        </Card>
      </div>
    </div>
  );
}

