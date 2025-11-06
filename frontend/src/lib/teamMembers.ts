export const teamMembers = [
  { id: 'TM-001', name: 'Emma Wilson', email: 'emma.wilson@company.com', role: 'Product Manager' },
  { id: 'TM-002', name: 'Mike Johnson', email: 'mike.johnson@company.com', role: 'Technical Lead' },
  { id: 'TM-003', name: 'Sarah Chen', email: 'sarah.chen@company.com', role: 'Business Analyst' },
  { id: 'TM-004', name: 'David Rodriguez', email: 'david.rodriguez@company.com', role: 'Software Engineer' },
  { id: 'TM-005', name: 'Lisa Anderson', email: 'lisa.anderson@company.com', role: 'UX Designer' },
  { id: 'TM-006', name: 'James Kim', email: 'james.kim@company.com', role: 'QA Engineer' },
  { id: 'TM-007', name: 'Maria Garcia', email: 'maria.garcia@company.com', role: 'Project Manager' },
  { id: 'TM-008', name: 'Robert Taylor', email: 'robert.taylor@company.com', role: 'Architect' }
];

export type TeamMember = typeof teamMembers[number];
