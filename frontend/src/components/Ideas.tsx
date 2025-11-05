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
import { Plus, Edit2, Save, X } from 'lucide-react';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { useRmsData } from '../lib/rms-data';
import type { IdeaPriority, IdeaStatus } from '../lib/api';

const categories = ['Feature', 'Enhancement', 'Integration', 'Performance', 'Security', 'UX/UI'];

const statusOptions: { value: IdeaStatus; label: string }[] = [
  { value: 'PROPOSED', label: 'Proposed' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'IMPLEMENTED', label: 'Implemented' },
];

const priorityOptions: { value: IdeaPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const badgeColors: Record<IdeaPriority, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-purple-100 text-purple-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export function Ideas() {
  const { ideas, stakeholders, activeProject, createIdea, updateIdea, generateIdeas } = useRmsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedIdea, setEditedIdea] = useState({
    title: '',
    description: '',
    stakeholderId: '',
    category: categories[0],
    status: 'PROPOSED' as IdeaStatus,
    priority: 'MEDIUM' as IdeaPriority,
    impact: 5,
    confidence: 5,
    effort: 5,
    conflicts: '',
    dependencies: '',
  });
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    stakeholderId: '',
    category: categories[0],
    status: 'PROPOSED' as IdeaStatus,
    priority: 'MEDIUM' as IdeaPriority,
    impact: 5,
    confidence: 5,
    effort: 5,
    conflicts: '',
    dependencies: '',
  });
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const stakeholderLookup = useMemo(
    () =>
      stakeholders.reduce<Record<string, string>>((map, stakeholder) => {
        map[stakeholder.id] = stakeholder.name;
        return map;
      }, {}),
    [stakeholders],
  );

  const filteredIdeas = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return ideas.filter((idea) => {
      const stakeholderName = stakeholderLookup[idea.stakeholder_id] ?? '';
      return (
        idea.title.toLowerCase().includes(query) ||
        idea.description.toLowerCase().includes(query) ||
        stakeholderName.toLowerCase().includes(query) ||
        idea.category.toLowerCase().includes(query)
      );
    });
  }, [ideas, searchTerm, stakeholderLookup]);

  const selectedIdea = selectedIdeaId ? ideas.find((idea) => idea.id === selectedIdeaId) ?? null : null;

  const openIdea = (ideaId: string) => {
    const idea = ideas.find((item) => item.id === ideaId);
    if (!idea) return;
    setSelectedIdeaId(idea.id);
    setEditedIdea({
      title: idea.title,
      description: idea.description,
      stakeholderId: idea.stakeholder_id,
      category: idea.category,
      status: idea.status,
      priority: idea.priority,
      impact: idea.impact ?? 5,
      confidence: idea.confidence ?? 5,
      effort: idea.effort ?? 5,
      conflicts: idea.conflicts ?? '',
      dependencies: idea.dependencies ?? '',
    });
    setIsEditing(false);
  };

  const handleAddIdea = async () => {
    if (!activeProject) {
      toast.error('No project available');
      return;
    }
    if (!newIdea.title || !newIdea.description || !newIdea.stakeholderId) {
      toast.error('Title, description, and stakeholder are required');
      return;
    }

    setIsSaving(true);
    try {
      await createIdea({
        project_id: activeProject.id,
        stakeholder_id: newIdea.stakeholderId,
        title: newIdea.title,
        description: newIdea.description,
        category: newIdea.category,
        status: newIdea.status,
        priority: newIdea.priority,
        impact: newIdea.impact,
        confidence: newIdea.confidence,
        effort: newIdea.effort,
        conflicts: newIdea.conflicts || null,
        dependencies: newIdea.dependencies || null,
      });
      toast.success('Idea added');
      setNewIdea({
        title: '',
        description: '',
        stakeholderId: '',
        category: categories[0],
        status: 'PROPOSED',
        priority: 'MEDIUM',
        impact: 5,
        confidence: 5,
        effort: 5,
        conflicts: '',
        dependencies: '',
      });
      setIsDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add idea';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedIdeaId) return;
    if (!editedIdea.title || !editedIdea.description) {
      toast.error('Title and description are required');
      return;
    }

    setIsSaving(true);
    try {
      await updateIdea(selectedIdeaId, {
        title: editedIdea.title,
        description: editedIdea.description,
        category: editedIdea.category,
        status: editedIdea.status,
        priority: editedIdea.priority,
        impact: editedIdea.impact,
        confidence: editedIdea.confidence,
        effort: editedIdea.effort,
        conflicts: editedIdea.conflicts || null,
        dependencies: editedIdea.dependencies || null,
      });
      toast.success('Idea updated');
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update idea';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }

  const handleCancelEdit = () => {
    if (!selectedIdea) return;
    setEditedIdea({
      title: selectedIdea.title,
      description: selectedIdea.description,
      stakeholderId: selectedIdea.stakeholder_id,
      category: selectedIdea.category,
      status: selectedIdea.status,
      priority: selectedIdea.priority,
      impact: selectedIdea.impact ?? 5,
      confidence: selectedIdea.confidence ?? 5,
      effort: selectedIdea.effort ?? 5,
      conflicts: selectedIdea.conflicts ?? '',
      dependencies: selectedIdea.dependencies ?? '',
    });
    setIsEditing(false);
  };

  const handleGenerateIdeas = async () => {
    if (!generatePrompt.trim()) {
      toast.error('Please provide context for idea generation');
      return;
    }
    setIsGenerating(true);
    try {
      const generated = await generateIdeas(generatePrompt);
      toast.success(`Generated ${generated.length} ideas using AI`);
      setIsGenerateDialogOpen(false);
      setGeneratePrompt('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate ideas';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (selectedIdea) {
    const isCurrentEditing = isEditing;
    const stakeholderName = stakeholderLookup[selectedIdea.stakeholder_id] ?? 'Unknown stakeholder';

    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start mb-4">
            <Button variant="ghost" onClick={() => setSelectedIdeaId(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Ideas
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
                <h1 className="text-gray-900">{selectedIdea.title}</h1>
                {selectedIdea.priority && (
                  <Badge className={badgeColors[selectedIdea.priority]}>{selectedIdea.priority}</Badge>
                )}
              </div>
              <p className="text-gray-600">
                Stakeholder: {stakeholderName} • Status: {selectedIdea.status} • Category: {selectedIdea.category}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={editedIdea.title} onChange={(event) => setEditedIdea((prev) => ({ ...prev, title: event.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editedIdea.description}
                  onChange={(event) => setEditedIdea((prev) => ({ ...prev, description: event.target.value }))}
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Stakeholder</Label>
                  <Input value={stakeholderLookup[editedIdea.stakeholderId] ?? 'Unknown stakeholder'} disabled />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={editedIdea.category} onValueChange={(value) => setEditedIdea((prev) => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editedIdea.status} onValueChange={(value: IdeaStatus) => setEditedIdea((prev) => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={editedIdea.priority} onValueChange={(value: IdeaPriority) => setEditedIdea((prev) => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Impact</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={editedIdea.impact}
                    onChange={(event) => setEditedIdea((prev) => ({ ...prev, impact: Number(event.target.value) }))}
                  />
                </div>
                <div>
                  <Label>Confidence</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={editedIdea.confidence}
                    onChange={(event) => setEditedIdea((prev) => ({ ...prev, confidence: Number(event.target.value) }))}
                  />
                </div>
                <div>
                  <Label>Effort</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={editedIdea.effort}
                    onChange={(event) => setEditedIdea((prev) => ({ ...prev, effort: Number(event.target.value) }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Conflicts</Label>
                  <Textarea
                    value={editedIdea.conflicts}
                    onChange={(event) => setEditedIdea((prev) => ({ ...prev, conflicts: event.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Dependencies</Label>
                  <Textarea
                    value={editedIdea.dependencies}
                    onChange={(event) => setEditedIdea((prev) => ({ ...prev, dependencies: event.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <ScrollArea className="flex-1 px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-4 text-gray-700">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Description</CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">
                {selectedIdea.description}
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase text-gray-500">Impact</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-gray-900">
                  {selectedIdea.impact ?? '—'}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase text-gray-500">Confidence</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-gray-900">
                  {selectedIdea.confidence ?? '—'}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase text-gray-500">Effort</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-gray-900">
                  {selectedIdea.effort ?? '—'}
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">ICE Score</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-blue-500" />
                <span className="text-2xl font-semibold text-gray-900">{selectedIdea.ice_score?.toFixed(1) ?? '—'}</span>
              </CardContent>
            </Card>
            {selectedIdea.conflicts && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Conflicts</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedIdea.conflicts}
                </CardContent>
              </Card>
            )}
            {selectedIdea.dependencies && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Dependencies</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedIdea.dependencies}
                </CardContent>
              </Card>
            )}
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
            <CardTitle>Idea Backlog</CardTitle>
            <CardDescription>Capture and prioritize ideas from stakeholders.</CardDescription>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search by title, category, or stakeholder"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Ideas</DialogTitle>
                  <DialogDescription>Provide meeting notes or context to generate new ideas.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    rows={6}
                    placeholder="Paste meeting notes or problem statements..."
                    value={generatePrompt}
                    onChange={(event) => setGeneratePrompt(event.target.value)}
                  />
                  <Button onClick={handleGenerateIdeas} disabled={isGenerating}>
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                      </span>
                    ) : (
                      'Generate Ideas'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!activeProject}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Idea
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Idea</DialogTitle>
                  <DialogDescription>Add a new proposal to the backlog.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="idea-title">Title</Label>
                    <Input
                      id="idea-title"
                      placeholder="Real-time Inventory Sync"
                      value={newIdea.title}
                      onChange={(event) => setNewIdea((prev) => ({ ...prev, title: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idea-description">Description</Label>
                    <Textarea
                      id="idea-description"
                      rows={6}
                      placeholder="Describe the opportunity or problem this idea addresses"
                      value={newIdea.description}
                      onChange={(event) => setNewIdea((prev) => ({ ...prev, description: event.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Stakeholder</Label>
                      <Select
                        value={newIdea.stakeholderId}
                        onValueChange={(value) => setNewIdea((prev) => ({ ...prev, stakeholderId: value }))}
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
                      <Label>Category</Label>
                      <Select
                        value={newIdea.category}
                        onValueChange={(value) => setNewIdea((prev) => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={newIdea.status}
                        onValueChange={(value: IdeaStatus) => setNewIdea((prev) => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={newIdea.priority}
                        onValueChange={(value: IdeaPriority) => setNewIdea((prev) => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Impact</Label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={newIdea.impact}
                        onChange={(event) => setNewIdea((prev) => ({ ...prev, impact: Number(event.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label>Confidence</Label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={newIdea.confidence}
                        onChange={(event) => setNewIdea((prev) => ({ ...prev, confidence: Number(event.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label>Effort</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={newIdea.effort}
                        onChange={(event) => setNewIdea((prev) => ({ ...prev, effort: Number(event.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Conflicts</Label>
                      <Textarea
                        value={newIdea.conflicts}
                        onChange={(event) => setNewIdea((prev) => ({ ...prev, conflicts: event.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Dependencies</Label>
                      <Textarea
                        value={newIdea.dependencies}
                        onChange={(event) => setNewIdea((prev) => ({ ...prev, dependencies: event.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddIdea} disabled={isSaving}>
                    Save Idea
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[32rem]">
            <div className="grid grid-cols-1 gap-4">
              {filteredIdeas.map((idea) => (
                <Card key={idea.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={badgeColors[idea.priority]}>{idea.priority}</Badge>
                          <span className="text-xs text-gray-400">{idea.status}</span>
                        </div>
                        <h3 className="text-gray-900 text-lg font-semibold">{idea.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{idea.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Stakeholder: {stakeholderLookup[idea.stakeholder_id] ?? 'Unknown'}</span>
                          <span>Category: {idea.category}</span>
                          <span>ICE: {idea.ice_score?.toFixed(1) ?? '—'}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openIdea(idea.id)}>
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredIdeas.length === 0 && (
                <Card className="border border-dashed">
                  <CardContent className="py-12 text-center text-gray-500">
                    No ideas found. Add one or generate new ideas with AI.
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

