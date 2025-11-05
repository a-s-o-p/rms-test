import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, ArrowRight, ExternalLink, ArrowLeft, Edit2, Save, X, Search, Sparkles } from 'lucide-react';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { teamMembers } from '../lib/teamMembers';
import { toast } from 'sonner';

interface ChangeRequest {
  id: string;
  requirementId: string;
  stakeholder: string;
  status: string;
  baseVersion: string;
  nextVersion: string;
  cost: string;
  benefit: string;
  summary: string;
}

// Mock requirements data - in real app, this would come from shared state
interface Requirement {
  id: string;
  stakeholder: string;
  versions: { version: string; title: string; description: string; isCurrent: boolean }[];
}

const mockRequirements: Requirement[] = [
  {
    id: 'REQ-001',
    stakeholder: 'Emma Wilson',
    versions: [
      { version: '1.0', title: 'User Authentication System', description: 'Basic auth', isCurrent: false },
      { version: '1.1', title: 'User Authentication System', description: 'With biometric', isCurrent: true },
      { version: '1.2', title: 'User Authentication System', description: 'Advanced features', isCurrent: false }
    ]
  },
  {
    id: 'REQ-002',
    stakeholder: 'Mike Johnson',
    versions: [
      { version: '1.0', title: 'API Response Time Optimization', description: 'Optimize APIs', isCurrent: true },
      { version: '1.1', title: 'API Response Time Optimization', description: 'Enhanced optimization', isCurrent: false }
    ]
  },
  {
    id: 'REQ-003',
    stakeholder: 'Sarah Chen',
    versions: [
      { version: '1.0', title: 'GDPR Compliance Module', description: 'GDPR compliance', isCurrent: true },
      { version: '1.1', title: 'GDPR Compliance Module', description: 'Extended compliance', isCurrent: false }
    ]
  }
];

const statuses = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Implemented'];

export function ChangeRequests() {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([
    {
      id: 'CR-001',
      requirementId: 'REQ-001',
      stakeholder: 'Emma Wilson',
      status: 'Under Review',
      baseVersion: '1.1',
      nextVersion: '1.2',
      cost: 'Medium development effort (2-3 weeks). Requires additional security testing and third-party integration setup. Estimated cost: $15,000',
      benefit: 'Improved user experience with faster login. Reduced support tickets for login issues. Enhanced security posture. Expected 30% increase in user satisfaction.',
      summary: 'Add biometric authentication support and social login options to the existing authentication system. This will provide users with more convenient login methods while maintaining security.'
    },
    {
      id: 'CR-002',
      requirementId: 'REQ-002',
      stakeholder: 'Mike Johnson',
      status: 'Approved',
      baseVersion: '1.0',
      nextVersion: '1.1',
      cost: 'High complexity. Requires database optimization, caching layer implementation, and load testing. Estimated 4-5 weeks of development. Cost: $25,000',
      benefit: 'Significant performance improvement. Better user experience with faster page loads. Reduced server costs due to more efficient resource usage. Competitive advantage.',
      summary: 'Reduce API response time from 200ms to under 100ms for all standard endpoints. Implement Redis caching, optimize database queries, and add CDN support.'
    },
    {
      id: 'CR-003',
      requirementId: 'REQ-003',
      stakeholder: 'Sarah Chen',
      status: 'Pending',
      baseVersion: '1.0',
      nextVersion: '1.1',
      cost: 'Low to medium effort. Mainly UI updates and documentation. Legal review required. Estimated 1-2 weeks. Cost: $8,000',
      benefit: 'Full GDPR compliance reduces legal risk. Builds customer trust. Enables expansion to EU markets. Avoids potential fines.',
      summary: 'Add user-facing privacy dashboard where users can view, export, and delete their personal data. Includes consent management interface and data retention controls.'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedChangeRequest, setSelectedChangeRequest] = useState<ChangeRequest | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedChangeRequest, setEditedChangeRequest] = useState<ChangeRequest | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    requirementId: '',
    currentVersion: '',
    nextVersion: ''
  });
  const [newChangeRequest, setNewChangeRequest] = useState({
    requirementId: '',
    stakeholder: '',
    status: 'Pending',
    baseVersion: '',
    nextVersion: '',
    cost: '',
    benefit: '',
    summary: ''
  });

  // Get available versions for selected requirements
  const getRequirementVersions = (reqId: string) => {
    const req = mockRequirements.find(r => r.id === reqId);
    return req?.versions || [];
  };

  const selectedRequirementForGenerate = mockRequirements.find(r => r.id === generateForm.requirementId);
  const selectedRequirementForAdd = mockRequirements.find(r => r.id === newChangeRequest.requirementId);

  const handleAddChangeRequest = () => {
    const cr: ChangeRequest = {
      id: `CR-${String(changeRequests.length + 1).padStart(3, '0')}`,
      ...newChangeRequest
    };
    setChangeRequests([...changeRequests, cr]);
    setNewChangeRequest({
      requirementId: '',
      stakeholder: '',
      status: 'Pending',
      baseVersion: '',
      nextVersion: '',
      cost: '',
      benefit: '',
      summary: ''
    });
    setIsDialogOpen(false);
  };

  const handleGenerateChangeRequest = () => {
    if (!generateForm.requirementId || !generateForm.currentVersion || !generateForm.nextVersion) {
      toast.error('Please fill in all fields');
      return;
    }

    // Find the selected requirement
    const selectedReq = mockRequirements.find(req => req.id === generateForm.requirementId);
    if (!selectedReq) {
      toast.error('Requirement not found');
      return;
    }

    // Create the change request
    const cr: ChangeRequest = {
      id: `CR-${String(changeRequests.length + 1).padStart(3, '0')}`,
      requirementId: generateForm.requirementId,
      stakeholder: selectedReq.stakeholder,
      status: 'Pending',
      baseVersion: generateForm.currentVersion,
      nextVersion: generateForm.nextVersion,
      cost: 'To be determined through analysis',
      benefit: 'To be determined through analysis',
      summary: `Change request for ${generateForm.requirementId} from version ${generateForm.currentVersion} to ${generateForm.nextVersion}`
    };

    setChangeRequests([...changeRequests, cr]);
    setGenerateForm({
      requirementId: '',
      currentVersion: '',
      nextVersion: ''
    });
    setIsGenerateDialogOpen(false);
    toast.success('Change request generated successfully');
  };

  const handleOpenChangeRequest = (cr: ChangeRequest) => {
    setSelectedChangeRequest(cr);
    setEditedChangeRequest(cr);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (editedChangeRequest) {
      setChangeRequests(changeRequests.map(cr => 
        cr.id === editedChangeRequest.id ? editedChangeRequest : cr
      ));
      setSelectedChangeRequest(editedChangeRequest);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedChangeRequest(selectedChangeRequest);
    setIsEditing(false);
  };

  const filteredChangeRequests = changeRequests.filter(cr =>
    cr.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cr.requirementId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cr.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cr.stakeholder.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cr.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Under Review': 'bg-blue-100 text-blue-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Implemented': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (selectedChangeRequest) {
    const currentCR = isEditing ? editedChangeRequest : selectedChangeRequest;
    if (!currentCR) return null;

    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start mb-4">
            <Button variant="ghost" onClick={() => setSelectedChangeRequest(null)}>
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
        </div>
        <ScrollArea className="flex-1 px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {!isEditing ? (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h1 className="text-gray-900">{currentCR.id}</h1>
                    <Badge className={getStatusColor(currentCR.status)}>{currentCR.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center gap-1 text-blue-600">
                      <ExternalLink className="w-3 h-3" />
                      {currentCR.requirementId}
                    </span>
                    <span className="mx-1 text-gray-400">•</span>
                    <span className="flex items-center gap-2">
                      <span className="text-gray-600">v{currentCR.baseVersion}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">v{currentCR.nextVersion}</span>
                    </span>
                  </div>
                  <p className="text-gray-600">Stakeholder: {currentCR.stakeholder}</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{currentCR.summary}</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-900">Cost Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-700 whitespace-pre-wrap">{currentCR.cost}</p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-900">Expected Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-700 whitespace-pre-wrap">{currentCR.benefit}</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Requirement ID</Label>
                    <Select
                      value={currentCR.requirementId}
                      onValueChange={(value) => {
                        const req = mockRequirements.find(r => r.id === value);
                        setEditedChangeRequest(currentCR ? { 
                          ...currentCR, 
                          requirementId: value,
                          stakeholder: req?.stakeholder || currentCR.stakeholder,
                          baseVersion: '',
                          nextVersion: ''
                        } : null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mockRequirements.map((req) => (
                          <SelectItem key={req.id} value={req.id}>
                            {req.id} - {req.versions.find(v => v.isCurrent)?.title || req.versions[0]?.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Stakeholder</Label>
                    <Select 
                      value={currentCR.stakeholder} 
                      onValueChange={(value) => setEditedChangeRequest(currentCR ? { ...currentCR, stakeholder: value } : null)}
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
                  <div>
                    <Label>Base Version</Label>
                    <Select
                      value={currentCR.baseVersion}
                      onValueChange={(value) => setEditedChangeRequest(currentCR ? { ...currentCR, baseVersion: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select base version" />
                      </SelectTrigger>
                      <SelectContent>
                        {getRequirementVersions(currentCR.requirementId).map((v) => (
                          <SelectItem key={v.version} value={v.version}>
                            v{v.version} {v.isCurrent ? '(Current)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Next Version</Label>
                    <Select
                      value={currentCR.nextVersion}
                      onValueChange={(value) => setEditedChangeRequest(currentCR ? { ...currentCR, nextVersion: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select next version" />
                      </SelectTrigger>
                      <SelectContent>
                        {getRequirementVersions(currentCR.requirementId).map((v) => (
                          <SelectItem key={v.version} value={v.version}>
                            v{v.version} {v.isCurrent ? '(Current)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Status</Label>
                    <Select value={currentCR.status} onValueChange={(value) => setEditedChangeRequest(currentCR ? { ...currentCR, status: value } : null)}>
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
                </div>
                <div>
                  <Label>Summary</Label>
                  <Textarea
                    value={currentCR.summary}
                    onChange={(e) => setEditedChangeRequest(currentCR ? { ...currentCR, summary: e.target.value } : null)}
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Cost</Label>
                  <Textarea
                    value={currentCR.cost}
                    onChange={(e) => setEditedChangeRequest(currentCR ? { ...currentCR, cost: e.target.value } : null)}
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Benefit</Label>
                  <Textarea
                    value={currentCR.benefit}
                    onChange={(e) => setEditedChangeRequest(currentCR ? { ...currentCR, benefit: e.target.value } : null)}
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-gray-900 mb-1">Change Requests</h2>
          <p className="text-gray-600">Manage requirement version change requests</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Change Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate Change Request</DialogTitle>
                <DialogDescription>Select a requirement and specify version details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Requirement</Label>
                  <Select 
                    value={generateForm.requirementId} 
                    onValueChange={(value) => setGenerateForm({ requirementId: value, currentVersion: '', nextVersion: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a requirement" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockRequirements.map((req) => (
                        <SelectItem key={req.id} value={req.id}>
                          {req.id} - {req.versions.find(v => v.isCurrent)?.title || req.versions[0]?.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Current Version</Label>
                  <Select
                    value={generateForm.currentVersion}
                    onValueChange={(value) => setGenerateForm({ ...generateForm, currentVersion: value })}
                    disabled={!generateForm.requirementId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select current version" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedRequirementForGenerate?.versions.map((v) => (
                        <SelectItem key={v.version} value={v.version}>
                          v{v.version} {v.isCurrent ? '(Current)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Next Version</Label>
                  <Select
                    value={generateForm.nextVersion}
                    onValueChange={(value) => setGenerateForm({ ...generateForm, nextVersion: value })}
                    disabled={!generateForm.requirementId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select next version" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedRequirementForGenerate?.versions.map((v) => (
                        <SelectItem key={v.version} value={v.version}>
                          v{v.version} {v.isCurrent ? '(Current)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateChangeRequest}>
                    Generate Change Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Change Request
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Change Request</DialogTitle>
              <DialogDescription>Submit a request to change a requirement version</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Requirement ID</Label>
                  <Select 
                    value={newChangeRequest.requirementId} 
                    onValueChange={(value) => {
                      const req = mockRequirements.find(r => r.id === value);
                      setNewChangeRequest({ 
                        ...newChangeRequest, 
                        requirementId: value,
                        stakeholder: req?.stakeholder || '',
                        baseVersion: '',
                        nextVersion: ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select requirement" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockRequirements.map((req) => (
                        <SelectItem key={req.id} value={req.id}>
                          {req.id} - {req.versions.find(v => v.isCurrent)?.title || req.versions[0]?.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Stakeholder</Label>
                  <Select value={newChangeRequest.stakeholder} onValueChange={(value) => setNewChangeRequest({ ...newChangeRequest, stakeholder: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stakeholder" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.name}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Base Version</Label>
                  <Select
                    value={newChangeRequest.baseVersion}
                    onValueChange={(value) => setNewChangeRequest({ ...newChangeRequest, baseVersion: value })}
                    disabled={!newChangeRequest.requirementId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select base version" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedRequirementForAdd?.versions.map((v) => (
                        <SelectItem key={v.version} value={v.version}>
                          v{v.version} {v.isCurrent ? '(Current)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Next Version</Label>
                  <Select
                    value={newChangeRequest.nextVersion}
                    onValueChange={(value) => setNewChangeRequest({ ...newChangeRequest, nextVersion: value })}
                    disabled={!newChangeRequest.requirementId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select next version" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedRequirementForAdd?.versions.map((v) => (
                        <SelectItem key={v.version} value={v.version}>
                          v{v.version} {v.isCurrent ? '(Current)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Status</Label>
                  <Select value={newChangeRequest.status} onValueChange={(value) => setNewChangeRequest({ ...newChangeRequest, status: value })}>
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
                <div className="col-span-2">
                  <Label>Summary</Label>
                  <Textarea
                    value={newChangeRequest.summary}
                    onChange={(e) => setNewChangeRequest({ ...newChangeRequest, summary: e.target.value })}
                    placeholder="Brief summary of the change"
                    rows={3}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Cost</Label>
                  <Textarea
                    value={newChangeRequest.cost}
                    onChange={(e) => setNewChangeRequest({ ...newChangeRequest, cost: e.target.value })}
                    placeholder="Describe the cost implications (time, resources, money)"
                    rows={3}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Benefit</Label>
                  <Textarea
                    value={newChangeRequest.benefit}
                    onChange={(e) => setNewChangeRequest({ ...newChangeRequest, benefit: e.target.value })}
                    placeholder="Describe the expected benefits"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddChangeRequest}>Add Change Request</Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search change requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredChangeRequests.map((cr) => (
          <Card key={cr.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOpenChangeRequest(cr)}>
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-gray-900">{cr.id}</CardTitle>
                    <Badge className={getStatusColor(cr.status)}>{cr.status}</Badge>
                  </div>
                  <CardDescription>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-blue-600">
                        <ExternalLink className="w-3 h-3" />
                        {cr.requirementId}
                      </span>
                      <span className="mx-1 text-gray-400">•</span>
                      <span className="flex items-center gap-2">
                        <span className="text-gray-600">v{cr.baseVersion}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">v{cr.nextVersion}</span>
                      </span>
                      <span className="mx-1 text-gray-400">•</span>
                      <span className="text-gray-600">Stakeholder: {cr.stakeholder}</span>
                    </div>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-gray-900 mb-2">Summary</h4>
                <p className="text-gray-700">{cr.summary}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-red-900 mb-2">Cost</h4>
                  <p className="text-red-700 line-clamp-2">{cr.cost}</p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-green-900 mb-2">Benefit</h4>
                  <p className="text-green-700 line-clamp-2">{cr.benefit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredChangeRequests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No change requests found</p>
        </div>
      )}
    </div>
  );
}
