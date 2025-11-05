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
import { Plus, Edit2, Save, X } from 'lucide-react';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { api, IdeaResponse, StakeholderResponse, formatEnumValue } from '../lib/api';

interface IdeasProps {
  projectId: string | null;
}

interface IdeaForm {
  title: string;
  description: string;
  stakeholderId: string;
  conflicts: string;
  dependencies: string;
  category: string;
  status: string;
  priority: string;
  impact: number;
  confidence: number;
  effort: number;
}

const statusOptions = ['PROPOSED', 'ACCEPTED', 'REJECTED', 'IMPLEMENTED'];
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function Ideas({ projectId }: IdeasProps) {
  const [ideas, setIdeas] = useState<IdeaResponse[]>([]);
  const [stakeholders, setStakeholders] = useState<StakeholderResponse[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editIdea, setEditIdea] = useState<IdeaForm | null>(null);
  const [newIdea, setNewIdea] = useState<IdeaForm>({
    title: '',
    description: '',
    stakeholderId: '',
    conflicts: '',
    dependencies: '',
    category: 'General',
    status: 'PROPOSED',
    priority: 'MEDIUM',
    impact: 5,
    confidence: 5,
    effort: 5
  });

  const stakeholderMap = useMemo(() => {
    const map = new Map<string, StakeholderResponse>();
    stakeholders.forEach((stakeholder) => map.set(stakeholder.id, stakeholder));
    return map;
  }, [stakeholders]);

  useEffect(() => {
    if (!projectId) {
      setIdeas([]);
      setStakeholders([]);
      setSelectedIdeaId(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([api.ideas.list(projectId), api.stakeholders.list(projectId)])
      .then(([ideaData, stakeholderData]) => {
        if (!isMounted) return;
        setIdeas(ideaData);
        setStakeholders(stakeholderData);
        if (ideaData.length) {
          setSelectedIdeaId(ideaData[0].id);
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

  const selectedIdea = useMemo(
    () => ideas.find((idea) => idea.id === selectedIdeaId) ?? null,
    [ideas, selectedIdeaId]
  );

  const handleAddIdea = () => {
    if (!projectId) {
      toast.error('Select a project before adding ideas');
      return;
    }

    setSaving(true);
    api.ideas
      .create({
        project_id: projectId,
        stakeholder_id: newIdea.stakeholderId,
        title: newIdea.title,
        description: newIdea.description,
        conflicts: newIdea.conflicts || null,
        dependencies: newIdea.dependencies || null,
        category: newIdea.category,
        status: newIdea.status,
        priority: newIdea.priority,
        impact: newIdea.impact,
        confidence: newIdea.confidence,
        effort: newIdea.effort
      })
      .then((idea) => {
        setIdeas((prev) => [idea, ...prev]);
        setSelectedIdeaId(idea.id);
        setIsDialogOpen(false);
        setNewIdea({
          title: '',
          description: '',
          stakeholderId: '',
          conflicts: '',
          dependencies: '',
          category: 'General',
          status: 'PROPOSED',
          priority: 'MEDIUM',
          impact: 5,
          confidence: 5,
          effort: 5
        });
        toast.success('Idea created');
      })
      .catch((error: Error) => {
        toast.error('Failed to create idea', { description: error.message });
      })
      .finally(() => setSaving(false));
  };

  const handleStartEditing = () => {
    if (!selectedIdea) return;
    setEditIdea({
      title: selectedIdea.title,
      description: selectedIdea.description,
      stakeholderId: selectedIdea.stakeholder_id,
      conflicts: selectedIdea.conflicts ?? '',
      dependencies: selectedIdea.dependencies ?? '',
      category: selectedIdea.category,
      status: selectedIdea.status,
      priority: selectedIdea.priority,
      impact: selectedIdea.impact ?? 5,
      confidence: selectedIdea.confidence ?? 5,
      effort: selectedIdea.effort ?? 5
    });
    setIsEditing(true);
  };

  const handleUpdateIdea = () => {
    if (!selectedIdea || !editIdea) return;

    setSaving(true);
    api.ideas
      .update(selectedIdea.id, {
        title: editIdea.title,
        description: editIdea.description,
        stakeholder_id: editIdea.stakeholderId,
        conflicts: editIdea.conflicts,
        dependencies: editIdea.dependencies,
        category: editIdea.category,
        status: editIdea.status,
        priority: editIdea.priority,
        impact: editIdea.impact,
        confidence: editIdea.confidence,
        effort: editIdea.effort
      })
      .then((updated) => {
        setIdeas((prev) => prev.map((idea) => (idea.id === updated.id ? { ...idea, ...updated } : idea)));
        setIsEditing(false);
        toast.success('Idea updated');
      })
      .catch((error: Error) => {
        toast.error('Failed to update idea', { description: error.message });
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
            <p className="text-gray-600">Choose a project to view and manage ideas.</p>
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
            <CardTitle>Ideas Backlog</CardTitle>
            <CardDescription>
              {loading ? 'Loading ideas…' : `${ideas.length} idea(s) captured`}
            </CardDescription>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  New Idea
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Capture new idea</DialogTitle>
                  <DialogDescription>Document stakeholder insights and opportunities.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="idea-title">Title</Label>
                    <Input
                      id="idea-title"
                      value={newIdea.title}
                      onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="idea-stakeholder">Stakeholder</Label>
                    <Select
                      value={newIdea.stakeholderId}
                      onValueChange={(value) => setNewIdea({ ...newIdea, stakeholderId: value })}
                    >
                      <SelectTrigger id="idea-stakeholder">
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
                    <Label htmlFor="idea-description">Description</Label>
                    <Textarea
                      id="idea-description"
                      rows={6}
                      value={newIdea.description}
                      onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={newIdea.status}
                        onValueChange={(value) => setNewIdea({ ...newIdea, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {formatEnumValue(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={newIdea.priority}
                        onValueChange={(value) => setNewIdea({ ...newIdea, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {formatEnumValue(priority)}
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
                        onChange={(e) => setNewIdea({ ...newIdea, impact: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Confidence</Label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={newIdea.confidence}
                        onChange={(e) => setNewIdea({ ...newIdea, confidence: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Effort</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={newIdea.effort}
                        onChange={(e) => setNewIdea({ ...newIdea, effort: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={newIdea.category}
                        onChange={(e) => setNewIdea({ ...newIdea, category: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Conflicts</Label>
                      <Input
                        value={newIdea.conflicts}
                        onChange={(e) => setNewIdea({ ...newIdea, conflicts: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Dependencies</Label>
                      <Input
                        value={newIdea.dependencies}
                        onChange={(e) => setNewIdea({ ...newIdea, dependencies: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddIdea}
                    disabled={!newIdea.title || !newIdea.description || !newIdea.stakeholderId || saving}
                  >
                    Save Idea
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
                    <TableHead>Stakeholder</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ideas.map((idea) => (
                    <TableRow key={idea.id} className="cursor-pointer" onClick={() => setSelectedIdeaId(idea.id)}>
                      <TableCell>{idea.title}</TableCell>
                      <TableCell>
                        {stakeholderMap.get(idea.stakeholder_id)?.name ?? 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge>{formatEnumValue(idea.status)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && !ideas.length && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-6">
                        No ideas captured yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex-1">
          {selectedIdea ? (
            <>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{selectedIdea.title}</CardTitle>
                  <CardDescription>
                    Submitted by {stakeholderMap.get(selectedIdea.stakeholder_id)?.name ?? 'Unknown'} •
                    {' '}
                    {formatEnumValue(selectedIdea.priority)} priority
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button variant="outline" onClick={handleStartEditing}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateIdea} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditIdea(null);
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
                  <div className="space-y-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedIdea.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium text-gray-800">Status:</span> {formatEnumValue(selectedIdea.status)}
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">ICE score:</span> {selectedIdea.ice_score ?? '—'}
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">Conflicts:</span> {selectedIdea.conflicts ?? 'None'}
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">Dependencies:</span> {selectedIdea.dependencies ?? 'None'}
                      </div>
                    </div>
                  </div>
                ) : (
                  editIdea && (
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={editIdea.title}
                          onChange={(e) => setEditIdea({ ...editIdea, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          rows={10}
                          value={editIdea.description}
                          onChange={(e) => setEditIdea({ ...editIdea, description: e.target.value })}
                        />
                      </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Status</Label>
                          <Select
                            value={editIdea.status}
                            onValueChange={(value) => setEditIdea({ ...editIdea, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {formatEnumValue(status)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      <div>
                        <Label>Priority</Label>
                          <Select
                            value={editIdea.priority}
                            onValueChange={(value) => setEditIdea({ ...editIdea, priority: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {priorityOptions.map((priority) => (
                                <SelectItem key={priority} value={priority}>
                                  {formatEnumValue(priority)}
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
                            value={editIdea.impact}
                            onChange={(e) => setEditIdea({ ...editIdea, impact: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Confidence</Label>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            value={editIdea.confidence}
                            onChange={(e) => setEditIdea({ ...editIdea, confidence: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Effort</Label>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            value={editIdea.effort}
                            onChange={(e) => setEditIdea({ ...editIdea, effort: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Category</Label>
                          <Input
                            value={editIdea.category}
                            onChange={(e) => setEditIdea({ ...editIdea, category: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Stakeholder</Label>
                          <Select
                            value={editIdea.stakeholderId}
                            onValueChange={(value) => setEditIdea({ ...editIdea, stakeholderId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
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
                          <Label>Conflicts</Label>
                          <Input
                            value={editIdea.conflicts}
                            onChange={(e) => setEditIdea({ ...editIdea, conflicts: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Dependencies</Label>
                          <Input
                            value={editIdea.dependencies}
                            onChange={(e) => setEditIdea({ ...editIdea, dependencies: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </>
          ) : (
            <CardHeader>
              <CardTitle>Select an idea</CardTitle>
              <CardDescription>Choose an idea from the list to review details.</CardDescription>
            </CardHeader>
          )}
        </Card>
      </div>
    </div>
  );
}

