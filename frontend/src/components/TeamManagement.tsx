import { useState } from 'react';
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
import { useData, TeamMember } from '../utils/DataContext';

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

export function TeamManagement() {
  const { teamMembers, addTeamMember, updateTeamMember } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMember, setEditedMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState({
    fullName: '',
    email: '',
    role: ''
  });

  const handleAddMember = async () => {
    const member: TeamMember = {
      id: `TM-${String(teamMembers.length + 1).padStart(3, '0')}`,
      ...newMember
    };
    await addTeamMember(member);
    setNewMember({ fullName: '', email: '', role: '' });
    setIsDialogOpen(false);
  };

  const handleOpenMember = (member: TeamMember) => {
    setSelectedMember(member);
    setEditedMember(member);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (editedMember) {
      await updateTeamMember(editedMember);
      setSelectedMember(editedMember);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedMember(selectedMember);
    setIsEditing(false);
  };

  const filteredMembers = teamMembers.filter(member =>
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
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
                    <h1 className="text-gray-900 mb-2">{currentMember.fullName}</h1>
                    <Badge className={getRoleColor(currentMember.role)}>{currentMember.role}</Badge>
                    <p className="text-gray-600 mt-2">{currentMember.id}</p>
                  </>
                ) : null}
              </div>
            </div>

            {!isEditing ? (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-gray-600 text-xs mb-1">Email</div>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail className="w-4 h-4" />
                      {currentMember.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-xs mb-1">Role</div>
                    <div className="text-gray-900">{currentMember.role}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-xs mb-1">Member ID</div>
                    <div className="text-gray-900">{currentMember.id}</div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Member Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={currentMember.fullName}
                      onChange={(e) => setEditedMember(currentMember ? { ...currentMember, fullName: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={currentMember.email}
                      onChange={(e) => setEditedMember(currentMember ? { ...currentMember, email: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select value={currentMember.role} onValueChange={(value) => setEditedMember(currentMember ? { ...currentMember, role: value } : null)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
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
          <h2 className="text-gray-900 mb-1">Team Management</h2>
          <p className="text-gray-600">Manage project team members and their roles</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
              <DialogDescription>Add a new member to the project team</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={newMember.fullName}
                  onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="email@company.com"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={newMember.role} onValueChange={(value) => setNewMember({ ...newMember, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddMember}>Add Member</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow 
                  key={member.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleOpenMember(member)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {getInitials(member.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-gray-900">{member.fullName}</div>
                        <div className="text-gray-500 text-xs">{member.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      {member.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(member.role)}>{member.role}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{teamMembers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">{new Set(teamMembers.map(m => m.role)).size}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-900">1</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
