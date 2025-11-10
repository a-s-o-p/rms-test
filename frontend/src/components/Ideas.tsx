import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, TrendingUp, ArrowLeft, Edit2, Save, X, Search, Sparkles, Loader2, Trash2, Filter, ArrowUpDown } from 'lucide-react';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { useData, Idea } from '../utils/DataContext';

const categories = ['USER INTERFACE', 'APPLICATION LOGIC', 'API INTEGRATION', 'DATA MANAGEMENT', 'SECURITY', 'PERFORMANCE', 'INFRASTRUCTURE', 'OPERATIONS', 'COMPLIANCE', 'USABILITY', 'AVAILABILITY', 'MAINTAINABILITY'];
const statuses = ['PROPOSED', 'ACCEPTED', 'REJECTED', 'IMPLEMENTED'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function Ideas() {
  const { ideas, addIdea, updateIdea, deleteIdea, generateIdeasWithAI, teamMembers } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'iceScore' | 'priority'>('iceScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedIdea, setEditedIdea] = useState<Idea | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newIdea, setNewIdea] = useState<Omit<Idea, 'id' | 'iceScore'>>({
    title: '',
    description: '',
    stakeholder: '',
    conflict: 'None',
    dependencies: 'None',
    category: '',
    status: 'PROPOSED',
    priority: 'MEDIUM',
    impact: 5,
    confidence: 5,
    effort: 5
  });

  const calculateICEScore = (impact: number, confidence: number, effort: number) => {
    return effort > 0 ? Number(((impact * confidence) / effort).toFixed(1)) : 0;
  };

  const handleAddIdea = async () => {
    const idea: Idea = {
      id: `IDEA-${String(ideas.length + 1).padStart(3, '0')}`,
      ...newIdea,
      iceScore: calculateICEScore(newIdea.impact, newIdea.confidence, newIdea.effort)
    };
    await addIdea(idea);
    setNewIdea({
      title: '',
      description: '',
      stakeholder: '',
      conflict: 'None',
      dependencies: 'None',
      category: '',
      status: 'PROPOSED',
      priority: 'MEDIUM',
      impact: 5,
      confidence: 5,
      effort: 5
    });
    setIsDialogOpen(false);
  };

  const handleGenerateIdeas = async () => {
    if (!generatePrompt.trim()) {
      toast.error('Please provide some context for idea generation');
      return;
    }

    setIsGenerating(true);

    try {
      const generatedIdeas = await generateIdeasWithAI(generatePrompt);

      if (generatedIdeas.length > 0) {
        toast.success('Ideas Generated!', {
          description: `Successfully generated ${generatedIdeas.length} new idea${generatedIdeas.length === 1 ? '' : 's'} based on your input.`
        });
      } else {
        toast.info('No new ideas generated', {
          description: 'The AI could not suggest additional ideas. Try refining your prompt.'
        });
      }

      setIsGenerateDialogOpen(false);
      setGeneratePrompt('');
    } catch (error) {
      toast.error('Failed to generate ideas', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred while contacting the AI service.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setEditedIdea(idea);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (editedIdea) {
      const updatedIdea = {
        ...editedIdea,
        iceScore: calculateICEScore(editedIdea.impact, editedIdea.confidence, editedIdea.effort)
      };
      await updateIdea(updatedIdea);
      setSelectedIdea(updatedIdea);
      setEditedIdea(updatedIdea);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedIdea(selectedIdea);
    setIsEditing(false);
  };

  const handleDeleteIdea = async () => {
    if (selectedIdea) {
      await deleteIdea(selectedIdea.id);
      setSelectedIdea(null);
      setEditedIdea(null);
      setIsEditing(false);
    }
  };

  const filteredIdeas = ideas
    .filter(idea => {
      // Search filter
      const matchesSearch = 
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.stakeholder.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Category filter
      if (filterCategory !== 'all' && idea.category !== filterCategory) return false;

      // Status filter
      if (filterStatus !== 'all' && idea.status !== filterStatus) return false;

      // Priority filter
      if (filterPriority !== 'all' && idea.priority !== filterPriority) return false;

      return true;
    })
    .sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortBy) {
        case 'iceScore':
          aValue = a.iceScore ?? 0;
          bValue = b.iceScore ?? 0;
          break;
        case 'priority':
          const priorityOrder = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 0;
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

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortOrder === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'LOW': 'bg-gray-100 text-gray-800',
      'MEDIUM': 'bg-blue-100 text-blue-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'PROPOSED': 'bg-purple-100 text-purple-800',
      'ACCEPTED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'IMPLEMENTED': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'USER INTERFACE': 'bg-blue-100 text-blue-800',
      'APPLICATION LOGIC': 'bg-green-100 text-green-800',
      'API INTEGRATION': 'bg-purple-100 text-purple-800',
      'DATA MANAGEMENT': 'bg-indigo-100 text-indigo-800',
      'SECURITY': 'bg-red-100 text-red-800',
      'PERFORMANCE': 'bg-orange-100 text-orange-800',
      'INFRASTRUCTURE': 'bg-yellow-100 text-yellow-800',
      'OPERATIONS': 'bg-teal-100 text-teal-800',
      'COMPLIANCE': 'bg-pink-100 text-pink-800',
      'USABILITY': 'bg-cyan-100 text-cyan-800',
      'AVAILABILITY': 'bg-lime-100 text-lime-800',
      'MAINTAINABILITY': 'bg-amber-100 text-amber-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (selectedIdea) {
    const currentIdea = isEditing ? editedIdea : selectedIdea;
    if (!currentIdea) return null;

    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start mb-4">
            <Button variant="ghost" onClick={() => setSelectedIdea(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Ideas
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
                  <Button variant="destructive" onClick={handleDeleteIdea}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
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
                  <h1 className="text-gray-900 mb-3">{currentIdea.title}</h1>
                  <div className="flex gap-2 mb-3">
                    <Badge className={getStatusColor(currentIdea.status)}>{currentIdea.status}</Badge>
                    <Badge className={getPriorityColor(currentIdea.priority)}>{currentIdea.priority}</Badge>
                    <Badge className={getCategoryColor(currentIdea.category)}>{currentIdea.category}</Badge>
                  </div>
                  <p className="text-gray-600">{currentIdea.id} • Stakeholder: {currentIdea.stakeholder}</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{currentIdea.description}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>ICE Score Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>                    
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-gray-600 text-xs mb-1">Impact</div>
                        <div className="text-gray-900">{currentIdea.impact}/10</div>
                      </div>
                      <div>
                        <div className="text-gray-600 text-xs mb-1">Confidence</div>
                        <div className="text-gray-900">{currentIdea.confidence}/10</div>
                      </div>
                      <div>
                        <div className="text-gray-600 text-xs mb-1">Effort</div>
                        <div className="text-gray-900">{currentIdea.effort}/10</div>
                      </div>
                      <div>
                        <div className="text-gray-600 text-xs mb-1">ICE Score</div>
                        <div className="text-gray-900">{currentIdea.iceScore}/10</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {currentIdea.dependencies !== 'None' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Dependencies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{currentIdea.dependencies}</p>
                    </CardContent>
                  </Card>
                )}

                {currentIdea.conflict !== 'None' && (
                  <Card className="border-orange-200">
                    <CardHeader>
                      <CardTitle className="text-orange-900">Conflicts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-orange-700">{currentIdea.conflict}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={currentIdea.title}
                    onChange={(e) => setEditedIdea(currentIdea ? { ...currentIdea, title: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={currentIdea.description}
                    onChange={(e) => setEditedIdea(currentIdea ? { ...currentIdea, description: e.target.value } : null)}
                    rows={6}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Stakeholder</Label>
                    <Select
                      value={currentIdea.stakeholder}
                      onValueChange={(value) => setEditedIdea(currentIdea ? { ...currentIdea, stakeholder: value } : null)}
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
                  <div>
                    <Label>Category</Label>
                    <Select value={currentIdea.category} onValueChange={(value) => setEditedIdea(currentIdea ? { ...currentIdea, category: value } : null)}>
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
                    <Label>Status</Label>
                    <Select value={currentIdea.status} onValueChange={(value) => setEditedIdea(currentIdea ? { ...currentIdea, status: value } : null)}>
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
                    <Select value={currentIdea.priority} onValueChange={(value) => setEditedIdea(currentIdea ? { ...currentIdea, priority: value } : null)}>
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
                  <Label>Conflicts</Label>
                  <Input
                    value={currentIdea.conflict}
                    onChange={(e) => setEditedIdea(currentIdea ? { ...currentIdea, conflict: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label>Dependencies</Label>
                  <Input
                    value={currentIdea.dependencies}
                    onChange={(e) => setEditedIdea(currentIdea ? { ...currentIdea, dependencies: e.target.value } : null)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Impact (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={currentIdea.impact}
                      onChange={(e) => setEditedIdea(currentIdea ? { ...currentIdea, impact: Number(e.target.value) } : null)}
                    />
                  </div>
                  <div>
                    <Label>Confidence (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={currentIdea.confidence}
                      onChange={(e) => setEditedIdea(currentIdea ? { ...currentIdea, confidence: Number(e.target.value) } : null)}
                    />
                  </div>
                  <div>
                    <Label>Effort (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={currentIdea.effort}
                      onChange={(e) => setEditedIdea(currentIdea ? { ...currentIdea, effort: Number(e.target.value) } : null)}
                    />
                  </div>
                </div>
                <div>
                  <Label>ICE Score (Calculated)</Label>
                  <Input
                    value={calculateICEScore(currentIdea.impact, currentIdea.confidence, currentIdea.effort)}
                    disabled
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
          <h2 className="text-gray-900 mb-1">Ideas</h2>
          <p className="text-gray-600">Track and evaluate ideas from stakeholders</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Ideas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate Ideas with AI</DialogTitle>
                <DialogDescription>
                  Describe your project context or goals, and we'll generate relevant ideas for you
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Project Context / Goals</Label>
                  <Textarea
                    value={generatePrompt}
                    onChange={(e) => setGeneratePrompt(e.target.value)}
                    placeholder="Describe what you're trying to achieve, challenges you're facing, or areas where you need innovation..."
                    rows={6}
                    disabled={isGenerating}
                  />
                </div>
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-900 mb-2">Analyzing your input...</p>
                    <p className="text-gray-600 text-sm">Generating innovative ideas for your project</p>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleGenerateIdeas} disabled={!generatePrompt.trim() || isGenerating}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyse
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Idea
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Idea</DialogTitle>
              <DialogDescription>Submit a new idea for consideration</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Title</Label>
                  <Input
                    value={newIdea.title}
                    onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                    placeholder="Idea title"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newIdea.description}
                    onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                    placeholder="Detailed description"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Stakeholder</Label>
                  <Select value={newIdea.stakeholder} onValueChange={(value) => setNewIdea({ ...newIdea, stakeholder: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stakeholder" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.fullName}>{member.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={newIdea.category} onValueChange={(value) => setNewIdea({ ...newIdea, category: value })}>
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
                  <Label>Status</Label>
                  <Select value={newIdea.status} onValueChange={(value) => setNewIdea({ ...newIdea, status: value })}>
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
                  <Select value={newIdea.priority} onValueChange={(value) => setNewIdea({ ...newIdea, priority: value })}>
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
                  <Label>Conflicts</Label>
                  <Input
                    value={newIdea.conflict}
                    onChange={(e) => setNewIdea({ ...newIdea, conflict: e.target.value })}
                    placeholder="Any conflicts with other requirements"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Dependencies</Label>
                  <Input
                    value={newIdea.dependencies}
                    onChange={(e) => setNewIdea({ ...newIdea, dependencies: e.target.value })}
                    placeholder="Dependencies on other systems or features"
                  />
                </div>
                <div>
                  <Label>Impact (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newIdea.impact}
                    onChange={(e) => setNewIdea({ ...newIdea, impact: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Confidence (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newIdea.confidence}
                    onChange={(e) => setNewIdea({ ...newIdea, confidence: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Effort (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newIdea.effort}
                    onChange={(e) => setNewIdea({ ...newIdea, effort: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>ICE Score (Calculated)</Label>
                  <Input
                    value={calculateICEScore(newIdea.impact, newIdea.confidence, newIdea.effort)}
                    disabled
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddIdea}>Add Idea</Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filters:</span>
          </div>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
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
                <SelectItem value="iceScore">ICE Score</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
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
          Showing {filteredIdeas.length} of {ideas.length} ideas
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search ideas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredIdeas.map((idea) => (
          <Card key={idea.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOpenIdea(idea)}>
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <CardTitle className="text-gray-900 mb-2">{idea.title || idea.id}</CardTitle>
                  <div className="flex gap-2 mb-2">
                    <Badge className={getStatusColor(idea.status)}>{idea.status}</Badge>
                    <Badge className={getPriorityColor(idea.priority)}>{idea.priority}</Badge>
                    <Badge className={getCategoryColor(idea.category)}>{idea.category}</Badge>
                  </div>
                  <CardDescription>
                    <span className="text-gray-600">{idea.id}</span>
                    <span className="mx-2">•</span>
                    <span className="text-gray-600">Stakeholder: {idea.stakeholder}</span>
                    {idea.createdAt && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-gray-500 text-xs">Created: {idea.createdAt}</span>
                      </>
                    )}
                    {idea.updatedAt && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-gray-500 text-xs">Updated: {idea.updatedAt}</span>
                      </>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700">{idea.description}</p>
              <div className="grid grid-cols-4 gap-4 pt-3 border-t">
                <div>
                  <div className="text-gray-600 text-xs mb-1">Impact</div>
                  <div className="text-gray-900">{idea.impact}/10</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs mb-1">Confidence</div>
                  <div className="text-gray-900">{idea.confidence}/10</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs mb-1">Effort</div>
                  <div className="text-gray-900">{idea.effort}/10</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs mb-1">ICE Score</div>
                  <div className="text-gray-900">{idea.iceScore}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}