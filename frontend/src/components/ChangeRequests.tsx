import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ArrowLeft, Edit2, Save, X, Search } from 'lucide-react';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { useRmsData } from '../lib/rms-data';
import type { ChangeRequestStatus } from '../lib/api';
import { toast } from 'sonner';

const statusOptions: ChangeRequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'IMPLEMENTED'];

export function ChangeRequests() {
  const { changeRequests, stakeholders, requirements, requirementVersions, updateChangeRequest } = useRmsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChangeRequestId, setSelectedChangeRequestId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedChangeRequest, setEditedChangeRequest] = useState({ summary: '', cost: '', benefit: '', status: 'PENDING' as ChangeRequestStatus });
  const [isSaving, setIsSaving] = useState(false);

  const stakeholderLookup = useMemo(
    () =>
      stakeholders.reduce<Record<string, string>>((map, stakeholder) => {
        map[stakeholder.id] = stakeholder.name;
        return map;
      }, {}),
    [stakeholders],
  );

  const requirementLookup = useMemo(
    () =>
      requirements.reduce<Record<string, string>>((map, requirement) => {
        const currentTitle = requirement.current_version?.title ?? 'Requirement';
        map[requirement.id] = currentTitle;
        return map;
      }, {}),
    [requirements],
  );

  const filteredChangeRequests = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return changeRequests.filter((cr) => {
      const stakeholderName = stakeholderLookup[cr.stakeholder_id] ?? '';
      const requirementTitle = requirementLookup[cr.requirement_id] ?? '';
      return (
        cr.summary.toLowerCase().includes(query) ||
        stakeholderName.toLowerCase().includes(query) ||
        requirementTitle.toLowerCase().includes(query) ||
        cr.status.toLowerCase().includes(query)
      );
    });
  }, [changeRequests, requirementLookup, searchTerm, stakeholderLookup]);

  const selectedChangeRequest = selectedChangeRequestId
    ? changeRequests.find((cr) => cr.id === selectedChangeRequestId) ?? null
    : null;

  const openChangeRequest = (changeRequestId: string) => {
    const changeRequest = changeRequests.find((cr) => cr.id === changeRequestId);
    if (!changeRequest) return;
    setSelectedChangeRequestId(changeRequest.id);
    setEditedChangeRequest({
      summary: changeRequest.summary,
      cost: changeRequest.cost ?? '',
      benefit: changeRequest.benefit ?? '',
      status: changeRequest.status,
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedChangeRequestId) return;

    setIsSaving(true);
    try {
      await updateChangeRequest(selectedChangeRequestId, {
        summary: editedChangeRequest.summary,
        cost: editedChangeRequest.cost || null,
        benefit: editedChangeRequest.benefit || null,
        status: editedChangeRequest.status,
      });
      toast.success('Change request updated');
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update change request';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!selectedChangeRequest) return;
    setEditedChangeRequest({
      summary: selectedChangeRequest.summary,
      cost: selectedChangeRequest.cost ?? '',
      benefit: selectedChangeRequest.benefit ?? '',
      status: selectedChangeRequest.status,
    });
    setIsEditing(false);
  };

  if (selectedChangeRequest) {
    const stakeholderName = stakeholderLookup[selectedChangeRequest.stakeholder_id] ?? 'Unknown stakeholder';
    const requirementTitle = requirementLookup[selectedChangeRequest.requirement_id] ?? 'Requirement';
    const baseVersion = requirementVersions[selectedChangeRequest.requirement_id]?.find(
      (version) => version.id === selectedChangeRequest.base_version_id,
    );
    const nextVersion = selectedChangeRequest.next_version_id
      ? requirementVersions[selectedChangeRequest.requirement_id]?.find((version) => version.id === selectedChangeRequest.next_version_id)
      : undefined;

    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start mb-4">
            <Button variant="ghost" onClick={() => setSelectedChangeRequestId(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Change Requests
            </Button>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button onClick={handleSaveEdit} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-gray-900">{requirementTitle}</h1>
              <Badge>{selectedChangeRequest.status}</Badge>
            </div>
            <p className="text-gray-600">
              Stakeholder: {stakeholderName} • Created: {new Date(selectedChangeRequest.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <ScrollArea className="flex-1 px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-6 text-gray-700">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <p className="whitespace-pre-wrap text-gray-700">{selectedChangeRequest.summary}</p>
                ) : (
                  <Textarea
                    rows={6}
                    value={editedChangeRequest.summary}
                    onChange={(event) => setEditedChangeRequest((prev) => ({ ...prev, summary: event.target.value }))}
                  />
                )}
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  {!isEditing ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedChangeRequest.cost ?? '—'}</p>
                  ) : (
                    <Textarea
                      rows={4}
                      value={editedChangeRequest.cost}
                      onChange={(event) => setEditedChangeRequest((prev) => ({ ...prev, cost: event.target.value }))}
                    />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Benefit</CardTitle>
                </CardHeader>
                <CardContent>
                  {!isEditing ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedChangeRequest.benefit ?? '—'}</p>
                  ) : (
                    <Textarea
                      rows={4}
                      value={editedChangeRequest.benefit}
                      onChange={(event) => setEditedChangeRequest((prev) => ({ ...prev, benefit: event.target.value }))}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Status</CardTitle>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <Badge>{selectedChangeRequest.status}</Badge>
                ) : (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      className="border border-gray-200 rounded-md px-3 py-2 text-sm"
                      value={editedChangeRequest.status}
                      onChange={(event) => setEditedChangeRequest((prev) => ({ ...prev, status: event.target.value as ChangeRequestStatus }))}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Versions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h3 className="text-gray-700 font-medium">Base Version</h3>
                  {baseVersion ? (
                    <p className="text-gray-600">
                      v{baseVersion.version_number}: {baseVersion.title} — {baseVersion.status}
                    </p>
                  ) : (
                    <p className="text-gray-500">Unknown</p>
                  )}
                </div>
                <div>
                  <h3 className="text-gray-700 font-medium">Proposed Version</h3>
                  {nextVersion ? (
                    <p className="text-gray-600">
                      v{nextVersion.version_number}: {nextVersion.title} — {nextVersion.status}
                    </p>
                  ) : (
                    <p className="text-gray-500">Not linked</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Change Requests</CardTitle>
            <CardDescription>Track proposed updates to requirements.</CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search by summary, stakeholder, or status"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[32rem]">
            <div className="space-y-3">
              {filteredChangeRequests.map((changeRequest) => (
                <Card key={changeRequest.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge>{changeRequest.status}</Badge>
                          <span className="text-xs text-gray-400">{new Date(changeRequest.created_at).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-gray-900 text-lg font-semibold">
                          {requirementLookup[changeRequest.requirement_id] ?? 'Requirement change'}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{changeRequest.summary}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Stakeholder: {stakeholderLookup[changeRequest.stakeholder_id] ?? 'Unknown'}</span>
                          <span>Requirement: {requirementLookup[changeRequest.requirement_id] ?? '—'}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openChangeRequest(changeRequest.id)}>
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredChangeRequests.length === 0 && (
                <Card className="border border-dashed">
                  <CardContent className="py-12 text-center text-gray-500">
                    No change requests found.
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
