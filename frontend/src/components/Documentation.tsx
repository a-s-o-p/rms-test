import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Plus, Eye, Edit2, Save, X } from 'lucide-react';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { api, DocumentResponse, StakeholderResponse } from '../lib/api';

interface DocumentationProps {
  projectId: string | null;
}

interface DocumentForm {
  title: string;
  text: string;
  type: string;
  stakeholderId: string;
}

const documentTypeOptions = [
  { value: 'SPECIFICATION', label: 'Specification' },
  { value: 'MEETING_NOTES', label: 'Meeting Notes' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'REPORT', label: 'Report' },
  { value: 'OTHER', label: 'Other' }
];

function getDocumentTypeLabel(value: string) {
  return documentTypeOptions.find((option) => option.value === value)?.label ?? value;
}

export function Documentation({ projectId }: DocumentationProps) {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [stakeholders, setStakeholders] = useState<StakeholderResponse[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newDocument, setNewDocument] = useState<DocumentForm>({
    title: '',
    text: '',
    type: documentTypeOptions[0].value,
    stakeholderId: ''
  });
  const [editDocument, setEditDocument] = useState<DocumentForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const stakeholderMap = useMemo(() => {
    const map = new Map<string, StakeholderResponse>();
    stakeholders.forEach((stakeholder) => map.set(stakeholder.id, stakeholder));
    return map;
  }, [stakeholders]);

  useEffect(() => {
    if (!projectId) {
      setDocuments([]);
      setStakeholders([]);
      setSelectedDocumentId(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([api.documents.list(projectId), api.stakeholders.list(projectId)])
      .then(([documentData, stakeholderData]) => {
        if (!isMounted) return;
        setDocuments(documentData);
        setStakeholders(stakeholderData);
        if (documentData.length) {
          setSelectedDocumentId(documentData[0].id);
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

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId]
  );

  const handleAddDocument = () => {
    if (!projectId) {
      toast.error('Select a project before adding documents');
      return;
    }

    setSaving(true);
    api.documents
      .create({
        project_id: projectId,
        stakeholder_id: newDocument.stakeholderId || null,
        type: newDocument.type,
        title: newDocument.title,
        text: newDocument.text
      })
      .then((document) => {
        setDocuments((docs) => [document, ...docs]);
        setSelectedDocumentId(document.id);
        setIsDialogOpen(false);
        setNewDocument({ title: '', text: '', type: documentTypeOptions[0].value, stakeholderId: '' });
        toast.success('Document created');
      })
      .catch((error: Error) => {
        toast.error('Failed to create document', { description: error.message });
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleStartEditing = () => {
    if (!selectedDocument) return;
    setEditDocument({
      title: selectedDocument.title,
      text: selectedDocument.text,
      type: selectedDocument.type,
      stakeholderId: selectedDocument.stakeholder_id ?? ''
    });
    setIsEditing(true);
  };

  const handleUpdateDocument = () => {
    if (!selectedDocument || !editDocument) return;

    setSaving(true);
    api.documents
      .update(selectedDocument.id, {
        title: editDocument.title,
        text: editDocument.text,
        type: editDocument.type,
        stakeholder_id: editDocument.stakeholderId || null
      })
      .then((updated) => {
        setDocuments((docs) =>
          docs.map((doc) => (doc.id === updated.id ? { ...doc, ...updated } : doc))
        );
        setIsEditing(false);
        toast.success('Document updated');
      })
      .catch((error: Error) => {
        toast.error('Failed to update document', { description: error.message });
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
            <p className="text-gray-600">Choose a project to view and manage documentation.</p>
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
            <CardTitle>Project Documents</CardTitle>
            <CardDescription>
              {loading ? 'Loading documents…' : `${documents.length} document(s) available`}
            </CardDescription>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  New Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add document</DialogTitle>
                  <DialogDescription>Store project knowledge and research in one place.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="doc-title">Title</Label>
                    <Input
                      id="doc-title"
                      value={newDocument.title}
                      onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="doc-type">Type</Label>
                    <Select
                      value={newDocument.type}
                      onValueChange={(value) => setNewDocument({ ...newDocument, type: value })}
                    >
                      <SelectTrigger id="doc-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="doc-owner">Owner</Label>
                    <Select
                      value={newDocument.stakeholderId}
                      onValueChange={(value) => setNewDocument({ ...newDocument, stakeholderId: value })}
                    >
                      <SelectTrigger id="doc-owner">
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
                    <Label htmlFor="doc-text">Content</Label>
                    <Textarea
                      id="doc-text"
                      rows={6}
                      value={newDocument.text}
                      onChange={(e) => setNewDocument({ ...newDocument, text: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={handleAddDocument}
                    disabled={!newDocument.title || !newDocument.text || saving}
                  >
                    Save Document
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[520px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} className="cursor-pointer" onClick={() => setSelectedDocumentId(doc.id)}>
                      <TableCell>{doc.title}</TableCell>
                      <TableCell>
                        <Badge>{getDocumentTypeLabel(doc.type)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Eye className="w-4 h-4 text-gray-500 inline" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && !documents.length && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-6">
                        No documents yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex-1">
          {selectedDocument ? (
            <>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{selectedDocument.title}</CardTitle>
                  <CardDescription>
                    {getDocumentTypeLabel(selectedDocument.type)} •
                    {' '}
                    {selectedDocument.stakeholder_id
                      ? stakeholderMap.get(selectedDocument.stakeholder_id)?.name ?? 'Unassigned'
                      : 'Unassigned'}
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button variant="outline" onClick={handleStartEditing}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateDocument} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditDocument(null);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                    {selectedDocument.text}
                  </div>
                ) : (
                  editDocument && (
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={editDocument.title}
                          onChange={(e) => setEditDocument({ ...editDocument, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={editDocument.type}
                          onValueChange={(value) => setEditDocument({ ...editDocument, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Owner</Label>
                        <Select
                          value={editDocument.stakeholderId}
                          onValueChange={(value) => setEditDocument({ ...editDocument, stakeholderId: value })}
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
                        <Label>Content</Label>
                        <Textarea
                          rows={12}
                          value={editDocument.text}
                          onChange={(e) => setEditDocument({ ...editDocument, text: e.target.value })}
                        />
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </>
          ) : (
            <CardHeader>
              <CardTitle>Select a document</CardTitle>
              <CardDescription>Choose a document from the list to view its contents.</CardDescription>
            </CardHeader>
          )}
        </Card>
      </div>
    </div>
  );
}

