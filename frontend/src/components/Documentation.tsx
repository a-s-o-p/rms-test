import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, FileText, Eye, Edit2, Save, X, ArrowLeft, Search, Trash2, Filter, ArrowUpDown } from 'lucide-react';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { useData, Document } from '../utils/DataContext';
import { toast } from 'sonner';

const documentTypes = [
  'PLANNING_DOCUMENTS',
  'REQUIREMENTS_DOCUMENTS',
  'DESIGN_DOCUMENTS',
  'TECHNICAL_DOCUMENTS',
  'TESTING_DOCUMENTS',
  'MANAGEMENT_REPORTS',
  'MEETING_NOTES',
  'CONTRACT_DOCUMENTS',
  'USER_GUIDES',
  'RELEASE_NOTES'
];

export function Documentation() {
  const { documents, addDocument, updateDocument, deleteDocument, teamMembers } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterOwner, setFilterOwner] = useState('all');
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'updatedAt'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDocument, setEditedDocument] = useState<Document | null>(null);
  // Initialize with preselected values
  const getInitialDocumentState = (): Omit<Document, 'id'> => ({
    title: '',
    text: '',
    owner: teamMembers.length > 0 ? teamMembers[0].fullName : '',
    type: documentTypes[0] || ''
  });

  const [newDocument, setNewDocument] = useState<Omit<Document, 'id'>>(getInitialDocumentState());

  // Update preselected owner when teamMembers changes
  useEffect(() => {
    if (teamMembers.length > 0 && (!newDocument.owner || newDocument.owner === '')) {
      setNewDocument(prev => ({ ...prev, owner: teamMembers[0].fullName }));
    }
  }, [teamMembers.length]);

  const handleAddDocument = async () => {
    if (!newDocument.type || !newDocument.owner) {
      toast.error('Please select document type and owner');
      return;
    }

    try {
      const doc: Document = {
        id: `DOC-${String(documents.length + 1).padStart(3, '0')}`,
        ...newDocument
      };
      await addDocument(doc);
      toast.success('Document added successfully');
      setNewDocument(getInitialDocumentState());
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to add document', {
        description: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  };

  const handleOpenDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setEditedDocument(doc);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (editedDocument) {
      await updateDocument(editedDocument);
      setSelectedDocument(editedDocument);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedDocument(selectedDocument);
    setIsEditing(false);
  };

  const handleDeleteDocument = async () => {
    if (selectedDocument) {
      await deleteDocument(selectedDocument.id);
      setSelectedDocument(null);
      setEditedDocument(null);
      setIsEditing(false);
    }
  };

  const uniqueOwners = Array.from(new Set(documents.map(doc => doc.owner))).sort();

  const filteredDocuments = documents
    .filter(doc => {
      // Search filter
      const matchesSearch = 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Type filter
      if (filterType !== 'all' && doc.type !== filterType) return false;

      // Owner filter
      if (filterOwner !== 'all' && doc.owner !== filterOwner) return false;

      return true;
    })
    .sort((a, b) => {
      let aValue: string = '';
      let bValue: string = '';

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
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

      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

  const formatTypeForDisplay = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'PLANNING_DOCUMENTS': 'bg-blue-100 text-blue-800',
      'REQUIREMENTS_DOCUMENTS': 'bg-green-100 text-green-800',
      'DESIGN_DOCUMENTS': 'bg-purple-100 text-purple-800',
      'TECHNICAL_DOCUMENTS': 'bg-indigo-100 text-indigo-800',
      'TESTING_DOCUMENTS': 'bg-yellow-100 text-yellow-800',
      'MANAGEMENT_REPORTS': 'bg-orange-100 text-orange-800',
      'MEETING_NOTES': 'bg-pink-100 text-pink-800',
      'CONTRACT_DOCUMENTS': 'bg-red-100 text-red-800',
      'USER_GUIDES': 'bg-cyan-100 text-cyan-800',
      'RELEASE_NOTES': 'bg-teal-100 text-teal-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (selectedDocument) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start mb-4">
            <Button variant="ghost" onClick={() => setSelectedDocument(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Documents
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
                  <Button variant="destructive" onClick={handleDeleteDocument}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
          {!isEditing ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-gray-900">{selectedDocument.title}</h1>
                <Badge className={getTypeColor(selectedDocument.type)}>{formatTypeForDisplay(selectedDocument.type)}</Badge>
              </div>
              <p className="text-gray-600">
                {selectedDocument.id} • Owner: {selectedDocument.owner}
                {selectedDocument.createdAt && (
                  <> • Created: {selectedDocument.createdAt}</>
                )}
                {selectedDocument.updatedAt && selectedDocument.updatedAt !== selectedDocument.createdAt && (
                  <> • Updated: {selectedDocument.updatedAt}</>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input
                  value={editedDocument?.title || ''}
                  onChange={(e) => setEditedDocument(editedDocument ? { ...editedDocument, title: e.target.value } : null)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select 
                    value={editedDocument?.type || ''} 
                    onValueChange={(value) => setEditedDocument(editedDocument ? { ...editedDocument, type: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type} value={type}>{formatTypeForDisplay(type)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Owner</Label>
                  <Select 
                    value={editedDocument?.owner || ''} 
                    onValueChange={(value) => setEditedDocument(editedDocument ? { ...editedDocument, owner: value } : null)}
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
              </div>
            </div>
          )}
        </div>
        <ScrollArea className="flex-1 px-6 py-6">
          {!isEditing ? (
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">{selectedDocument.text}</p>
            </div>
          ) : (
            <div>
              <Label>Content</Label>
              <Textarea
                value={editedDocument?.text || ''}
                onChange={(e) => setEditedDocument(editedDocument ? { ...editedDocument, text: e.target.value } : null)}
                rows={25}
                className="font-mono"
              />
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-gray-900 mb-1">Documentation</h2>
          <p className="text-gray-600">Project documentation and reference materials</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Document</DialogTitle>
              <DialogDescription>Create a new documentation entry for your project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  placeholder="Enter document title"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newDocument.type} onValueChange={(value) => setNewDocument({ ...newDocument, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>{formatTypeForDisplay(type)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Owner</Label>
                <Select value={newDocument.owner} onValueChange={(value) => setNewDocument({ ...newDocument, owner: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.fullName}>{member.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={newDocument.text}
                  onChange={(e) => setNewDocument({ ...newDocument, text: e.target.value })}
                  placeholder="Enter document content"
                  rows={8}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddDocument}>Add Document</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filters:</span>
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {documentTypes.map((type) => (
                <SelectItem key={type} value={type}>{formatTypeForDisplay(type)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterOwner} onValueChange={setFilterOwner}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {uniqueOwners.map((owner) => (
                <SelectItem key={owner} value={owner}>{owner}</SelectItem>
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
                <SelectItem value="title">Title</SelectItem>
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
          Showing {filteredDocuments.length} of {documents.length} documents
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOpenDocument(doc)}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-gray-900">{doc.title || doc.id}</CardTitle>
                    <Badge className={getTypeColor(doc.type)}>{formatTypeForDisplay(doc.type)}</Badge>
                  </div>
                  <CardDescription>
                    <span className="text-gray-600">{doc.id}</span>
                    <span className="mx-2">•</span>
                    <span className="text-gray-600">Owner: {doc.owner}</span>
                    {doc.createdAt && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-gray-500 text-xs">Created: {doc.createdAt}</span>
                      </>
                    )}
                    {doc.updatedAt && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-gray-500 text-xs">Updated: {doc.updatedAt}</span>
                      </>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 line-clamp-2">{doc.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
