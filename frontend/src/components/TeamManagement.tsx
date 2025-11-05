import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
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
import { toast } from 'sonner';
import { api, StakeholderResponse } from '../lib/api';

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

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
  'Architect'
];

export function TeamManagement({ projectId }: TeamManagementProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMember, setEditedMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    fullName: '',
    email: '',
    role: ''
  });

  useEffect(() => {
    if (!projectId) {
      setTeamMembers([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    api.stakeholders
      .list(projectId)
      .then((data) => {
        if (!isMounted) return;
        setTeamMembers(data.map(mapStakeholderToTeamMember));
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

  const mapStakeholderToTeamMember = (stakeholder: StakeholderResponse): TeamMember => ({
    id: stakeholder.id,
    fullName: stakeholder.name,
    email: stakeholder.email,
    role: stakeholder.role
  });

  const handleAddMember = () => {
    if (!projectId) {
      toast.error('Select a project before adding team members');
      return;
    }

    api.stakeholders
      .create({
        project_id: projectId,
        name: newMember.fullName,
        email: newMember.email,
        role: newMember.role
      })
      .then((stakeholder) => {
        setTeamMembers((members) => [...members, mapStakeholderToTeamMember(stakeholder)]);
        setNewMember({ fullName: '', email: '', role: '' });
        setIsDialogOpen(false);
        toast.success('Team member added');
      })
      .catch((error: Error) => {
        toast.error('Unable to add team member', { description: error.message });
      });
  };

  const handleOpenMember = (member: TeamMember) => {
    setSelectedMember(member);
    setEditedMember(member);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!editedMember) return;

    api.stakeholders
      .update(editedMember.id, {
        name: editedMember.fullName,
        email: editedMember.email,
        role: editedMember.role
      })
      .then(() => {
        setTeamMembers((members) =>
          members.map((member) => (member.id === editedMember.id ? editedMember : member))
        );
        setSelectedMember(editedMember);
        setIsEditing(false);
        toast.success('Team member updated');
      })
      .catch((error: Error) => {
        toast.error('Failed to update team member', { description: error.message });
      });
  };

  const handleCancelEdit = () => {
    setEditedMember(selectedMember);
    setIsEditing(false);
  };

  const filteredMembers = useMemo(
    () =>
      teamMembers.filter(member =>
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [teamMembers, searchTerm]
  );

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
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
      'Stakeholder': 'bg-yellow-100 text-yellow-800',
      'Technical Lead': 'bg-red-100 text-red-800',
      'Architect': 'bg-teal-100 text-teal-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (!projectId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Select a project</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Choose a project to manage team members.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedMember) {
    const currentMember = isEditing ? editedMember : selectedMember;
    if (!currentMember) return null;

    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start mb-4">
            <Button variant="ghost" onClick={() => setSelectedMember(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
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
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
                  {getInitials(currentMember.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                {!isEditing ? (
                  <>
                    <h2 className="text-gray-900">{currentMember.fullName}</h2>
                    <p className="text-gray-600">{currentMember.email}</p>
                    <Badge className={getRoleColor(currentMember.role)}>{currentMember.role}</Badge>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        value={editedMember?.fullName || ''}
                        onChange={(e) =>
                          setEditedMember(editedMember ? { ...editedMember, fullName: e.target.value } : null)
                        }
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editedMember?.email || ''}
                        onChange={(e) =>
                          setEditedMember(editedMember ? { ...editedMember, email: e.target.value } : null)
                        }
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Select
                        value={editedMember?.role || ''}
                        onValueChange={(value) =>
                          setEditedMember(editedMember ? { ...editedMember, role: value } : null)
                        }
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

            {!isEditing ? (
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-gray-900">{currentMember.email}</p>
                      <p className="text-gray-500 text-sm">Primary email</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>
                    Stakeholder notes can be documented in project documentation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-sm">
                    Keeping detailed notes helps provide context for requirements and change requests.
                  </p>
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-900">Team Directory</h2>
            <p className="text-gray-600">Manage stakeholders and collaborators involved in the requirements process.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Stakeholder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>Capture stakeholder contact information for this project.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="member-name">Full Name</Label>
                  <Input
                    id="member-name"
                    value={newMember.fullName}
                    onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="member-email">Email</Label>
                  <Input
                    id="member-email"
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="member-role">Role</Label>
                  <Select
                    value={newMember.role}
                    onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                  >
                    <SelectTrigger id="member-role">
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
                <Button onClick={handleAddMember} disabled={!newMember.fullName || !newMember.email || !newMember.role}>
                  Add Member
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or role"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <p className="text-gray-600 text-sm">
            {loading ? 'Loading team members…' : `${filteredMembers.length} members`}
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[520px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} className="cursor-pointer" onClick={() => handleOpenMember(member)}>
                    <TableCell className="font-medium flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {getInitials(member.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-gray-900">{member.fullName}</div>
                        <div className="text-gray-500 text-sm flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Stakeholder
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(member.role)}>{member.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && !filteredMembers.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-6">
                      No team members yet.
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

