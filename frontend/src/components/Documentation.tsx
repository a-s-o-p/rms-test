import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, FileText, Eye, Edit2, Save, X, ArrowLeft, Search } from 'lucide-react';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { teamMembers } from '../lib/teamMembers';

interface Document {
  id: string;
  title: string;
  text: string;
  owner: string;
  type: string;
}

const documentTypes = [
  'Glossary',
  'Research',
  'System Architecture',
  'User Guide',
  'Technical Specification',
  'API Documentation',
  'Design Document'
];

export function Documentation() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'DOC-001',
      title: 'System Architecture Overview',
      text: 'This document outlines the high-level architecture of the e-commerce platform, including microservices structure, database design, and integration patterns.\n\nThe system follows a microservices architecture pattern with the following key components:\n\n1. API Gateway\n- Handles all incoming requests\n- Performs authentication and authorization\n- Routes requests to appropriate services\n\n2. User Service\n- Manages user accounts and profiles\n- Handles authentication and authorization\n- Stores user preferences\n\n3. Product Service\n- Manages product catalog\n- Handles inventory tracking\n- Provides product search functionality\n\n4. Order Service\n- Processes customer orders\n- Manages order lifecycle\n- Integrates with payment gateway\n\n5. Payment Service\n- Handles payment processing\n- Integrates with third-party payment providers\n- Manages transaction records\n\nDatabase Design:\n- PostgreSQL for transactional data\n- Redis for caching and session management\n- Elasticsearch for product search\n\nIntegration Patterns:\n- Event-driven architecture using message queues\n- REST APIs for synchronous communication\n- gRPC for inter-service communication',
      owner: 'Sarah Chen',
      type: 'System Architecture'
    },
    {
      id: 'DOC-002',
      title: 'API Glossary',
      text: 'Comprehensive glossary of all API endpoints, parameters, and response formats used throughout the system.',
      owner: 'Mike Johnson',
      type: 'Glossary'
    },
    {
      id: 'DOC-003',
      title: 'User Research Findings Q4 2024',
      text: 'Summary of user research conducted in Q4 2024, including pain points, feature requests, and usability improvements.',
      owner: 'Emma Wilson',
      type: 'Research'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDocument, setEditedDocument] = useState<Document | null>(null);
  const [newDocument, setNewDocument] = useState<Omit<Document, 'id'>>({
    title: '',
    text: '',
    owner: '',
    type: ''
  });

  const handleAddDocument = () => {
    const doc: Document = {
      id: `DOC-${String(documents.length + 1).padStart(3, '0')}`,
      ...newDocument
    };
    setDocuments([...documents, doc]);
    setNewDocument({ title: '', text: '', owner: '', type: '' });
    setIsDialogOpen(false);
  };

  const handleOpenDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setEditedDocument(doc);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (editedDocument) {
      setDocuments(documents.map(doc => 
        doc.id === editedDocument.id ? editedDocument : doc
      ));
      setSelectedDocument(editedDocument);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedDocument(selectedDocument);
    setIsEditing(false);
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Glossary': 'bg-blue-100 text-blue-800',
      'Research': 'bg-purple-100 text-purple-800',
      'System Architecture': 'bg-green-100 text-green-800',
      'User Guide': 'bg-yellow-100 text-yellow-800',
      'Technical Specification': 'bg-red-100 text-red-800',
      'API Documentation': 'bg-indigo-100 text-indigo-800',
      'Design Document': 'bg-pink-100 text-pink-800'
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
                </>
              )}
            </div>
          </div>
          {!isEditing ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-gray-900">{selectedDocument.title}</h1>
                <Badge className={getTypeColor(selectedDocument.type)}>{selectedDocument.type}</Badge>
              </div>
              <p className="text-gray-600">
                {selectedDocument.id} • Owner: {selectedDocument.owner}
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
                        <SelectItem key={type} value={type}>{type}</SelectItem>
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
                        <SelectItem key={member.id} value={member.name}>{member.name}</SelectItem>
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
                      <SelectItem key={type} value={type}>{type}</SelectItem>
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
                      <SelectItem key={member.id} value={member.name}>{member.name}</SelectItem>
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

      <div className="mb-6">
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
                    <CardTitle className="text-gray-900">{doc.title}</CardTitle>
                    <Badge className={getTypeColor(doc.type)}>{doc.type}</Badge>
                  </div>
                  <CardDescription>
                    <span className="text-gray-600">{doc.id}</span>
                    <span className="mx-2">•</span>
                    <span className="text-gray-600">Owner: {doc.owner}</span>
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDocument(doc);
                }}>
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
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
