import { useMemo, useState } from 'react';
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
import { ScrollArea } from './ui/scroll-area';
import { useRmsData } from '../lib/rms-data';
import type { DocumentType } from '../lib/api';
import { toast } from 'sonner';

const documentTypeOptions: { value: DocumentType; label: string }[] = [
  { value: 'SPECIFICATION', label: 'Specification' },
  { value: 'MEETING_NOTES', label: 'Meeting Notes' },
  { value: 'REPORT', label: 'Report' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'OTHER', label: 'Other' },
];

const typeColors: Record<DocumentType, string> = {
  SPECIFICATION: 'bg-blue-100 text-blue-800',
  MEETING_NOTES: 'bg-green-100 text-green-800',
  REPORT: 'bg-purple-100 text-purple-800',
  EMAIL: 'bg-yellow-100 text-yellow-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export function Documentation() {
  const { documents, stakeholders, activeProject, createDocument, updateDocument } = useRmsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedDocument, setEditedDocument] = useState({
    title: '',
    text: '',
    type: 'SPECIFICATION' as DocumentType,
    stakeholderId: '' as string | null,
  });
  const [newDocument, setNewDocument] = useState({
    title: '',
    text: '',
    type: 'SPECIFICATION' as DocumentType,
    stakeholderId: '' as string | null,
  });
  const [editDocument, setEditDocument] = useState<DocumentForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const stakeholderLookup = useMemo(
    () =>
      stakeholders.reduce<Record<string, string>>((map, stakeholder) => {
        map[stakeholder.id] = stakeholder.name;
        return map;
      }, {}),
    [stakeholders],
  );

  const filteredDocuments = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return documents.filter((document) => {
      const ownerName = document.stakeholder_id ? stakeholderLookup[document.stakeholder_id] ?? '' : '';
      return (
        document.title.toLowerCase().includes(query) ||
        document.text.toLowerCase().includes(query) ||
        ownerName.toLowerCase().includes(query) ||
        document.type.toLowerCase().includes(query)
      );
    });
  }, [documents, searchTerm, stakeholderLookup]);

  const selectedDocument = selectedDocumentId
    ? documents.find((document) => document.id === selectedDocumentId) ?? null
    : null;

  const openDocument = (documentId: string) => {
    const document = documents.find((doc) => doc.id === documentId);
    if (!document) return;
    setSelectedDocumentId(documentId);
    setEditedDocument({
      title: document.title,
      text: document.text,
      type: document.type,
      stakeholderId: document.stakeholder_id,
    });
    setIsEditing(false);
  };

  const handleAddDocument = async () => {
    if (!activeProject) {
      toast.error('No project available');
      return;
    }
    if (!newDocument.title || !newDocument.text) {
      toast.error('Title and content are required');
      return;
    }

    setIsSaving(true);
    try {
      await createDocument({
        project_id: activeProject.id,
        title: newDocument.title,
        text: newDocument.text,
        type: newDocument.type,
        stakeholder_id: newDocument.stakeholderId || null,
      });
      toast.success('Document created');
      setNewDocument({ title: '', text: '', type: 'SPECIFICATION', stakeholderId: '' });
      setIsDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create document';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedDocumentId) return;
    if (!editedDocument.title || !editedDocument.text) {
      toast.error('Title and content are required');
      return;
    }

    setIsSaving(true);
    try {
      await updateDocument(selectedDocumentId, {
        title: editedDocument.title,
        text: editedDocument.text,
        type: editedDocument.type,
        stakeholder_id: editedDocument.stakeholderId || null,
      });
      toast.success('Document updated');
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update document';
      toast.error(message);
    } finally {
      setIsSaving(false);
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

  const handleCancelEdit = () => {
    if (!selectedDocument) return;
    setEditedDocument({
      title: selectedDocument.title,
      text: selectedDocument.text,
      type: selectedDocument.type,
      stakeholderId: selectedDocument.stakeholder_id,
    });
    setIsEditing(false);
  };

  if (selectedDocument) {
    const isCurrentEditing = isEditing;
    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start mb-4">
            <Button variant="ghost" onClick={() => setSelectedDocumentId(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Documents
            </Button>
            <div className="flex gap-2">
              {!isCurrentEditing ? (
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
          {!isCurrentEditing ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-gray-900">{selectedDocument.title}</h1>
                <Badge className={typeColors[selectedDocument.type]}>{selectedDocument.type}</Badge>
              </div>
              <p className="text-gray-600">
                {selectedDocument.id} • Owner:{' '}
                {selectedDocument.stakeholder_id ? stakeholderLookup[selectedDocument.stakeholder_id] ?? 'Unassigned' : 'Unassigned'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input value={editedDocument.title} onChange={(event) => setEditedDocument((prev) => ({ ...prev, title: event.target.value }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={editedDocument.type} onValueChange={(value: DocumentType) => setEditedDocument((prev) => ({ ...prev, type: value }))}>
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
                    value={editedDocument.stakeholderId ?? ''}
                    onValueChange={(value) =>
                      setEditedDocument((prev) => ({ ...prev, stakeholderId: value === '' ? null : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
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
                <Label>Content</Label>
                <Textarea
                  value={editedDocument.text}
                  onChange={(event) => setEditedDocument((prev) => ({ ...prev, text: event.target.value }))}
                  rows={12}
                />
              </div>
            </div>
          )}
        </div>
        <ScrollArea className="flex-1 px-6 py-6">
          {!isCurrentEditing ? (
            <article className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {selectedDocument.text}
            </article>
          ) : (
            <p className="text-sm text-gray-500">Editing mode enabled. Update the content above.</p>
          )}
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Project Documents</CardTitle>
            <CardDescription>Reference specifications, meeting notes, and supporting materials.</CardDescription>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search by title, content, or owner"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!activeProject}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Document</DialogTitle>
                  <DialogDescription>Store the latest version of your project documentation.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="doc-title">Title</Label>
                      <Input
                        id="doc-title"
                        placeholder="System Architecture Overview"
                        value={newDocument.title}
                        onChange={(event) => setNewDocument((prev) => ({ ...prev, title: event.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="doc-type">Type</Label>
                      <Select
                        value={newDocument.type}
                        onValueChange={(value: DocumentType) => setNewDocument((prev) => ({ ...prev, type: value }))}
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
                        value={newDocument.stakeholderId ?? ''}
                        onValueChange={(value) =>
                          setNewDocument((prev) => ({ ...prev, stakeholderId: value === '' ? null : value }))
                        }
                      >
                        <SelectTrigger id="doc-owner">
                          <SelectValue placeholder="Assign owner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
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
                    <Label htmlFor="doc-content">Content</Label>
                    <Textarea
                      id="doc-content"
                      placeholder="Provide the latest information..."
                      rows={10}
                      value={newDocument.text}
                      onChange={(event) => setNewDocument((prev) => ({ ...prev, text: event.target.value }))}
                    />
                  </div>
                  <Button onClick={handleAddDocument} disabled={isSaving}>
                    Save Document
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[32rem]">
            <div className="space-y-3">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={typeColors[document.type]}>{document.type}</Badge>
                          <span className="text-xs text-gray-400">{document.id}</span>
                        </div>
                        <h3 className="text-gray-900 text-lg font-medium">{document.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{document.text}</p>
                        <p className="text-xs text-gray-400">
                          Owner:{' '}
                          {document.stakeholder_id ? stakeholderLookup[document.stakeholder_id] ?? 'Unassigned' : 'Unassigned'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openDocument(document.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredDocuments.length === 0 && (
                <div className="text-center text-gray-500 py-10 border border-dashed rounded-lg">
                  <FileText className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm">No documents found. Add one to get started.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

