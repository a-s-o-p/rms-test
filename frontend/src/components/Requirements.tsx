import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, GitBranch, CheckCircle2, History, ArrowLeft, Edit2, Save, X, Search, Sparkles, Loader2, ArrowUpDown } from 'lucide-react';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { teamMembers } from '../lib/teamMembers';

interface RequirementVersion {
  version: string;
  title: string;
  description: string;
  isCurrent: boolean;
  createdAt: string;
}

interface Requirement {
  id: string;
  stakeholder: string;
  versions: RequirementVersion[];
  conflicts: string;
  dependencies: string;
  category: string;
  type: string;
  status: string;
  priority: string;
  basedOnExpectation?: string;
}

interface Idea {
  id: string;
  title: string;
  description: string;
  stakeholder: string;
  category: string;
  status: string;
  priority: string;
  iceScore: number;
}

const categories = ['Functional', 'Non-Functional', 'Business', 'Technical', 'Security'];
const types = ['Feature', 'Enhancement', 'Bug Fix', 'Performance', 'Compliance'];
const statuses = ['Draft', 'Under Review', 'Approved', 'In Development', 'Completed'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];

export function Requirements() {
  const [requirements, setRequirements] = useState<Requirement[]>([
    {
      id: 'REQ-001',
      stakeholder: 'Emma Wilson',
      versions: [
        {
          version: '1.0',
          title: 'User Authentication System',
          description: 'Implement secure user authentication with OAuth2.0 support and multi-factor authentication.',
          isCurrent: false,
          createdAt: '2024-09-15'
        },
        {
          version: '1.1',
          title: 'User Authentication System',
          description: 'Implement secure user authentication with OAuth2.0 support, multi-factor authentication, and biometric login options.',
          isCurrent: true,
          createdAt: '2024-10-01'
        }
      ],
      conflicts: 'None',
      dependencies: 'Identity provider integration',
      category: 'Functional',
      type: 'Feature',
      status: 'In Development',
      priority: 'Critical',
      basedOnExpectation: 'EXP-005: Users need secure and convenient login'
    },
    {
      id: 'REQ-002',
      stakeholder: 'Mike Johnson',
      versions: [
        {
          version: '1.0',
          title: 'API Response Time Optimization',
          description: 'Reduce API response time to under 200ms for all standard endpoints.',
          isCurrent: true,
          createdAt: '2024-09-20'
        }
      ],
      conflicts: 'May conflict with REQ-008 (data validation requirements)',
      dependencies: 'Database indexing, Caching layer',
      category: 'Non-Functional',
      type: 'Performance',
      status: 'Approved',
      priority: 'High'
    },
    {
      id: 'REQ-003',
      stakeholder: 'Sarah Chen',
      versions: [
        {
          version: '1.0',
          title: 'GDPR Compliance Module',
          description: 'Implement GDPR-compliant data handling including right to be forgotten, data portability, and consent management.',
          isCurrent: true,
          createdAt: '2024-10-05'
        }
      ],
      conflicts: 'None',
      dependencies: 'Legal review, Data audit system',
      category: 'Business',
      type: 'Compliance',
      status: 'Under Review',
      priority: 'Critical',
      basedOnExpectation: 'EXP-012: System must comply with EU regulations'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRequirement, setEditedRequirement] = useState<Requirement | null>(null);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [newVersion, setNewVersion] = useState({ title: '', description: '' });
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedIdeas, setSelectedIdeas] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [sortColumn, setSortColumn] = useState<'title' | 'priority' | 'status' | 'iceScore'>('iceScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [newRequirement, setNewRequirement] = useState({
    stakeholder: '',
    title: '',
    description: '',
    conflicts: 'None',
    dependencies: 'None',
    category: '',
    type: '',
    status: 'Draft',
    priority: 'Medium',
    basedOnExpectation: ''
  });

  // Mock ideas data - in real app, this would come from your state management
  const availableIdeas: Idea[] = [
    {
      id: 'IDEA-001',
      title: 'One-Click Checkout',
      description: 'Implement a streamlined one-click checkout process for returning customers to reduce cart abandonment.',
      stakeholder: 'Emma Wilson',
      category: 'Feature',
      status: 'Under Review',
      priority: 'High',
      iceScore: 10.3
    },
    {
      id: 'IDEA-002',
      title: 'AI-Powered Product Recommendations',
      description: 'Use machine learning to provide personalized product recommendations based on user behavior and purchase history.',
      stakeholder: 'Mike Johnson',
      category: 'Enhancement',
      status: 'Approved',
      priority: 'Medium',
      iceScore: 5.3
    },
    {
      id: 'IDEA-003',
      title: 'Real-time Inventory Sync',
      description: 'Synchronize inventory levels in real-time across all sales channels to prevent overselling.',
      stakeholder: 'Sarah Chen',
      category: 'Integration',
      status: 'New',
      priority: 'Critical',
      iceScore: 15.0
    },
    {
      id: 'IDEA-004',
      title: 'Progressive Web App Implementation',
      description: 'Convert the e-commerce platform into a Progressive Web App to enable offline browsing, push notifications, and app-like experience on mobile devices.',
      stakeholder: 'Emma Wilson',
      category: 'Enhancement',
      status: 'New',
      priority: 'Medium',
      iceScore: 9.3
    },
    {
      id: 'IDEA-005',
      title: 'Voice Search Integration',
      description: 'Implement voice search functionality allowing users to search for products using voice commands, improving accessibility and user convenience.',
      stakeholder: 'Mike Johnson',
      category: 'Feature',
      status: 'New',
      priority: 'Low',
      iceScore: 4.3
    }
  ];

  const handleAddRequirement = () => {
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
      basedOnExpectation: newRequirement.basedOnExpectation || undefined
    };
    setRequirements([...requirements, requirement]);
    setNewRequirement({
      stakeholder: '',
      title: '',
      description: '',
      conflicts: 'None',
      dependencies: 'None',
      category: '',
      type: '',
      status: 'Draft',
      priority: 'Medium',
      basedOnExpectation: ''
    });
    setIsDialogOpen(false);
  };

  const handleGenerateRequirements = () => {
    if (selectedIdeas.size === 0) return;

    setIsGenerating(true);

    // Simulate generation process
    setTimeout(() => {
      const ideasToConvert = availableIdeas.filter(idea => selectedIdeas.has(idea.id));
      
      const newRequirements: Requirement[] = ideasToConvert.map((idea, index) => ({
        id: `REQ-${String(requirements.length + index + 1).padStart(3, '0')}`,
        stakeholder: idea.stakeholder,
        versions: [
          {
            version: '1.0',
            title: idea.title,
            description: idea.description,
            isCurrent: true,
            createdAt: new Date().toISOString().split('T')[0]
          }
        ],
        conflicts: 'None',
        dependencies: 'To be determined',
        category: idea.category === 'Feature' || idea.category === 'Enhancement' ? 'Functional' : 'Technical',
        type: idea.category === 'Feature' ? 'Feature' : 'Enhancement',
        status: 'Draft',
        priority: idea.priority,
        basedOnExpectation: `Based on ${idea.id}: ${idea.title}`
      }));

      setRequirements([...requirements, ...newRequirements]);
      setIsGenerating(false);
      setIsGenerateDialogOpen(false);
      setSelectedIdeas(new Set());
      
      toast.success('Requirements Generated!', {
        description: `Successfully generated ${newRequirements.length} requirement${newRequirements.length !== 1 ? 's' : ''} from selected ideas.`
      });
    }, 2000);
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
    let aValue: string | number = a[sortColumn];
    let bValue: string | number = b[sortColumn];

    if (sortColumn === 'iceScore') {
      aValue = a.iceScore;
      bValue = b.iceScore;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
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
  };

  const handleSaveEdit = () => {
    if (editedRequirement) {
      setRequirements(requirements.map(req => 
        req.id === editedRequirement.id ? editedRequirement : req
      ));
      setSelectedRequirement(editedRequirement);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedRequirement(selectedRequirement);
    setIsEditing(false);
  };

  const handleAddVersion = () => {
    if (!selectedRequirement) return;

    const nextVersion = `1.${selectedRequirement.versions.length}`;
    const updatedReq = {
      ...selectedRequirement,
      versions: [
        ...selectedRequirement.versions,
        {
          version: nextVersion,
          title: newVersion.title,
          description: newVersion.description,
          isCurrent: false,
          createdAt: new Date().toISOString().split('T')[0]
        }
      ]
    };

    setRequirements(requirements.map(req => 
      req.id === selectedRequirement.id ? updatedReq : req
    ));
    setSelectedRequirement(updatedReq);
    setEditedRequirement(updatedReq);
    setNewVersion({ title: '', description: '' });
    setIsVersionDialogOpen(false);
  };

  const setCurrentVersion = (versionNumber: string) => {
    if (!selectedRequirement) return;

    const updatedReq = {
      ...selectedRequirement,
      versions: selectedRequirement.versions.map(v => ({
        ...v,
        isCurrent: v.version === versionNumber
      }))
    };

    setRequirements(requirements.map(req => 
      req.id === selectedRequirement.id ? updatedReq : req
    ));
    setSelectedRequirement(updatedReq);
    setEditedRequirement(updatedReq);
  };

  const getCurrentVersion = (req: Requirement) => {
    return req.versions.find(v => v.isCurrent) || req.versions[0];
  };

  const filteredRequirements = requirements.filter(req => {
    const currentVersion = getCurrentVersion(req);
    return (
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currentVersion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currentVersion.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.stakeholder.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-blue-100 text-blue-800',
      'High': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Under Review': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'In Development': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-purple-100 text-purple-800',
      'New': 'bg-purple-100 text-purple-800',
      'Rejected': 'bg-red-100 text-red-800',
      'In Progress': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (selectedRequirement) {
    const currentVersion = getCurrentVersion(isEditing ? editedRequirement! : selectedRequirement);
    const displayReq = isEditing ? editedRequirement! : selectedRequirement;

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
                    <h1 className="text-gray-900">{currentVersion.title}</h1>
                    {displayReq.versions.length > 1 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        {displayReq.versions.length} versions
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mb-3">
                    <Badge className={getStatusColor(displayReq.status)}>{displayReq.status}</Badge>
                    <Badge className={getPriorityColor(displayReq.priority)}>{displayReq.priority}</Badge>
                    <Badge variant="outline">{displayReq.category}</Badge>
                    <Badge variant="outline">{displayReq.type}</Badge>
                  </div>
                  <p className="text-gray-600">
                    {displayReq.id} • v{currentVersion.version} • Stakeholder: {displayReq.stakeholder}
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{currentVersion.description}</p>
                  </CardContent>
                </Card>

                {displayReq.basedOnExpectation && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-blue-900">Based on Expectation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-blue-700">{displayReq.basedOnExpectation}</p>
                    </CardContent>
                  </Card>
                )}

                {displayReq.dependencies !== 'None' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Dependencies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{displayReq.dependencies}</p>
                    </CardContent>
                  </Card>
                )}

                {displayReq.conflicts !== 'None' && (
                  <Card className="border-orange-200">
                    <CardHeader>
                      <CardTitle className="text-orange-900">Conflicts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-orange-700">{displayReq.conflicts}</p>
                    </CardContent>
                  </Card>
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
                        <DialogContent>
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
                      <Card key={version.version}>
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
                              </div>
                              <CardDescription>Created: {version.createdAt}</CardDescription>
                            </div>
                            {!version.isCurrent && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCurrentVersion(version.version)}
                              >
                                Set as Current
                              </Button>
                            )}
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
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Stakeholder</Label>
                    <Select 
                      value={displayReq.stakeholder} 
                      onValueChange={(value) => setEditedRequirement(displayReq ? { ...displayReq, stakeholder: value } : null)}
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
                    <Label>Category</Label>
                    <Select value={displayReq.category} onValueChange={(value) => setEditedRequirement(displayReq ? { ...displayReq, category: value } : null)}>
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
                    <Select value={displayReq.type} onValueChange={(value) => setEditedRequirement(displayReq ? { ...displayReq, type: value } : null)}>
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
                    <Select value={displayReq.status} onValueChange={(value) => setEditedRequirement(displayReq ? { ...displayReq, status: value } : null)}>
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
                    <Select value={displayReq.priority} onValueChange={(value) => setEditedRequirement(displayReq ? { ...displayReq, priority: value } : null)}>
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
                  <Label>Based on Expectation (Optional)</Label>
                  <Input
                    value={displayReq.basedOnExpectation || ''}
                    onChange={(e) => setEditedRequirement(displayReq ? { ...displayReq, basedOnExpectation: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label>Conflicts</Label>
                  <Input
                    value={displayReq.conflicts}
                    onChange={(e) => setEditedRequirement(displayReq ? { ...displayReq, conflicts: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label>Dependencies</Label>
                  <Input
                    value={displayReq.dependencies}
                    onChange={(e) => setEditedRequirement(displayReq ? { ...displayReq, dependencies: e.target.value } : null)}
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
            <DialogContent className="max-w-5xl max-h-[85vh]">
              <DialogHeader>
                <DialogTitle>Generate Requirements from Ideas</DialogTitle>
                <DialogDescription>
                  Select ideas to convert into requirements. Click column headers to sort.
                </DialogDescription>
              </DialogHeader>
              {!isGenerating ? (
                <div className="space-y-4">
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
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
                        Generate {selectedIdeas.size > 0 ? selectedIdeas.size : ''} Requirement{selectedIdeas.size !== 1 ? 's' : ''}
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
                        <SelectItem key={member.id} value={member.name}>{member.name}</SelectItem>
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
                  <Label>Based on Expectation (Optional)</Label>
                  <Input
                    value={newRequirement.basedOnExpectation}
                    onChange={(e) => setNewRequirement({ ...newRequirement, basedOnExpectation: e.target.value })}
                    placeholder="e.g., EXP-001: Description"
                  />
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

      <div className="mb-6">
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
                      <CardTitle className="text-gray-900">{currentVersion.title}</CardTitle>
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
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">{currentVersion.description}</p>
                {req.basedOnExpectation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-gray-600 text-xs mb-1">Based on Expectation</div>
                    <div className="text-blue-700">{req.basedOnExpectation}</div>
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
