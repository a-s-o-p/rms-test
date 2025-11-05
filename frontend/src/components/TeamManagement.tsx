import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Plus, Mail, User, ArrowLeft, Edit2, Save, X, Search } from 'lucide-react';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { useRmsData } from '../lib/rms-data';
import { toast } from 'sonner';

interface TeamManagementProps {
  projectId: string | null;
}

const roles = [
  'Product Manager',
  'Business Analyst',
  'Software Engineer',
  'QA Engineer',
  'UX Designer',
  'Project Manager',
  'Stakeholder',
  'Technical Lead',
  'Architect',
];

export function TeamManagement() {
  const { stakeholders, activeProject, createStakeholder, updateStakeholder } = useRmsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStakeholder, setEditedStakeholder] = useState({ name: '', email: '', role: '' });
  const [newStakeholder, setNewStakeholder] = useState({ name: '', email: '', role: roles[0] ?? '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedStakeholder = useMemo(
    () => stakeholders.find((stakeholder) => stakeholder.id === selectedStakeholderId) ?? null,
    [selectedStakeholderId, stakeholders],
  );

  const filteredStakeholders = useMemo(
    () =>
      stakeholders.filter((stakeholder) => {
        const query = searchTerm.toLowerCase();
        return (
          stakeholder.name.toLowerCase().includes(query) ||
          stakeholder.email.toLowerCase().includes(query) ||
          stakeholder.role.toLowerCase().includes(query)
        );
      }),
    [searchTerm, stakeholders],
  );

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((segment) => segment[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'Product Manager': 'bg-purple-100 text-purple-800',
      'Business Analyst': 'bg-blue-100 text-blue-800',
      'Software Engineer': 'bg-green-100 text-green-800',
      'QA Engineer': 'bg-orange-100 text-orange-800',
      'UX Designer': 'bg-pink-100 text-pink-800',
      'Project Manager': 'bg-indigo-100 text-indigo-800',
      Stakeholder: 'bg-yellow-100 text-yellow-800',
      'Technical Lead': 'bg-red-100 text-red-800',
      Architect: 'bg-teal-100 text-teal-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const handleAddStakeholder = async () => {
    if (!activeProject) {
      toast.error('No project available to assign stakeholder');
      return;
    }
    if (!newStakeholder.name || !newStakeholder.email) {
      toast.error('Name and email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await createStakeholder({
        project_id: activeProject.id,
        name: newStakeholder.name,
        email: newStakeholder.email,
        role: newStakeholder.role,
      });
      toast.success('Stakeholder added');
      setNewStakeholder({ name: '', email: '', role: roles[0] ?? '' });
      setIsDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add stakeholder';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenStakeholder = (stakeholderId: string) => {
    const stakeholder = stakeholders.find((item) => item.id === stakeholderId);
    if (!stakeholder) return;
    setSelectedStakeholderId(stakeholder.id);
    setEditedStakeholder({ name: stakeholder.name, email: stakeholder.email, role: stakeholder.role });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedStakeholderId) return;
    if (!editedStakeholder.name || !editedStakeholder.email) {
      toast.error('Name and email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateStakeholder(selectedStakeholderId, {
        name: editedStakeholder.name,
        email: editedStakeholder.email,
        role: editedStakeholder.role,
      });
      toast.success('Stakeholder updated');
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update stakeholder';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    if (!selectedStakeholder) return;
    setEditedStakeholder({
      name: selectedStakeholder.name,
      email: selectedStakeholder.email,
      role: selectedStakeholder.role,
    });
    setIsEditing(false);
  };

  if (selectedStakeholder) {
    const isCurrentEditing = isEditing;
    const stakeholderDetails = isCurrentEditing ? editedStakeholder : selectedStakeholder;

    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start mb-4">
            <Button variant="ghost" onClick={() => setSelectedStakeholderId(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
            <div className="flex gap-2">
              {!isCurrentEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button onClick={handleSaveEdit} disabled={isSubmitting}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1 px-6 py-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
                  {getInitials(stakeholderDetails.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                {!isCurrentEditing ? (
                  <>
                    <h2 className="text-gray-900 text-2xl font-semibold">{stakeholderDetails.name}</h2>
                    <p className="text-gray-500">{stakeholderDetails.email}</p>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={stakeholderDetails.name}
                        onChange={(event) => setEditedStakeholder((prev) => ({ ...prev, name: event.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={stakeholderDetails.email}
                        onChange={(event) => setEditedStakeholder((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Select
                        value={stakeholderDetails.role}
                        onValueChange={(value) => setEditedStakeholder((prev) => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!isCurrentEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-700">Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      {stakeholderDetails.email}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      {stakeholderDetails.role}
                    </div>
                  </CardContent>
                </Card>
              </div>
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
            <CardTitle>Stakeholder Directory</CardTitle>
            <CardDescription>Manage the people collaborating on this project.</CardDescription>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search by name, email, or role"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!activeProject}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stakeholder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Stakeholder</DialogTitle>
                  <DialogDescription>Capture contact information for a new collaborator.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stakeholder-name">Full Name</Label>
                    <Input
                      id="stakeholder-name"
                      placeholder="Jane Smith"
                      value={newStakeholder.name}
                      onChange={(event) => setNewStakeholder((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stakeholder-email">Email</Label>
                    <Input
                      id="stakeholder-email"
                      type="email"
                      placeholder="jane.smith@company.com"
                      value={newStakeholder.email}
                      onChange={(event) => setNewStakeholder((prev) => ({ ...prev, email: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stakeholder-role">Role</Label>
                    <Select
                      value={newStakeholder.role}
                      onValueChange={(value) => setNewStakeholder((prev) => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger id="stakeholder-role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={handleAddStakeholder} disabled={isSubmitting}>
                    Add Stakeholder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[32rem]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStakeholders.map((stakeholder) => (
                  <TableRow key={stakeholder.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getInitials(stakeholder.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{stakeholder.name}</div>
                          <div className="text-sm text-gray-500">{stakeholder.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(stakeholder.role)}>{stakeholder.role}</Badge>
                    </TableCell>
                    <TableCell>{stakeholder.email}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenStakeholder(stakeholder.id)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStakeholders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No stakeholders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

