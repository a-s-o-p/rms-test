import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c5097d42`;

// Interfaces
export interface Document {
  id: string;
  title: string;
  text: string;
  owner: string;
  type: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  stakeholder: string;
  conflict: string;
  dependencies: string;
  category: string;
  status: string;
  priority: string;
  impact: number;
  confidence: number;
  effort: number;
  iceScore: number;
}

export interface RequirementVersion {
  version: string;
  title: string;
  description: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface Requirement {
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

export interface ChangeRequest {
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

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface ProjectInfo {
  title: string;
  description: string;
}

// Context Type
interface DataContextType {
  // Project Info
  projectInfo: ProjectInfo;
  updateProjectInfo: (info: ProjectInfo) => Promise<void>;
  
  // Team Members
  teamMembers: TeamMember[];
  addTeamMember: (member: TeamMember) => Promise<void>;
  updateTeamMember: (member: TeamMember) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  
  // Documents
  documents: Document[];
  addDocument: (document: Document) => Promise<void>;
  updateDocument: (document: Document) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  
  // Ideas
  ideas: Idea[];
  addIdea: (idea: Idea) => Promise<void>;
  updateIdea: (idea: Idea) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  bulkAddIdeas: (ideas: Idea[]) => Promise<void>;
  
  // Requirements
  requirements: Requirement[];
  addRequirement: (requirement: Requirement) => Promise<void>;
  updateRequirement: (requirement: Requirement) => Promise<void>;
  deleteRequirement: (id: string) => Promise<void>;
  
  // Change Requests
  changeRequests: ChangeRequest[];
  addChangeRequest: (changeRequest: ChangeRequest) => Promise<void>;
  updateChangeRequest: (changeRequest: ChangeRequest) => Promise<void>;
  deleteChangeRequest: (id: string) => Promise<void>;
  
  // Loading state
  isLoading: boolean;
  
  // Initialization
  initializeData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial data
const initialTeamMembers: TeamMember[] = [
  { id: 'TM-001', fullName: 'Emma Wilson', email: 'emma.wilson@company.com', role: 'Product Manager' },
  { id: 'TM-002', fullName: 'Mike Johnson', email: 'mike.johnson@company.com', role: 'Technical Lead' },
  { id: 'TM-003', fullName: 'Sarah Chen', email: 'sarah.chen@company.com', role: 'Business Analyst' },
  { id: 'TM-004', fullName: 'David Rodriguez', email: 'david.rodriguez@company.com', role: 'Software Engineer' },
  { id: 'TM-005', fullName: 'Lisa Anderson', email: 'lisa.anderson@company.com', role: 'UX Designer' },
  { id: 'TM-006', fullName: 'James Kim', email: 'james.kim@company.com', role: 'QA Engineer' },
  { id: 'TM-007', fullName: 'Maria Garcia', email: 'maria.garcia@company.com', role: 'Project Manager' },
  { id: 'TM-008', fullName: 'Robert Taylor', email: 'robert.taylor@company.com', role: 'Architect' }
];

const initialDocuments: Document[] = [
  {
    id: 'DOC-001',
    title: 'System Architecture Overview',
    text: 'This document outlines the high-level architecture of the e-commerce platform, including microservices structure, database design, and integration patterns.\n\nThe system follows a microservices architecture pattern with the following key components:\n\n1. API Gateway\n- Handles all incoming requests\n- Performs authentication and authorization\n- Routes requests to appropriate services\n\n2. User Service\n- Manages user accounts and profiles\n- Handles authentication and authorization\n- Stores user preferences\n\n3. Product Service\n- Manages product catalog\n- Handles inventory tracking\n- Provides product search functionality\n\n4. Order Service\n- Processes customer orders\n- Manages order lifecycle\n- Integrates with payment gateway\n\n5. Payment Service\n- Handles payment processing\n- Integrates with third-party payment providers\n- Manages transaction records\n\nDatabase Design:\n- PostgreSQL for transactional data\n- Redis for caching and session management\n- Elasticsearch for product search\n\nIntegration Patterns:\n- Event-driven architecture using message queues\n- REST APIs for synchronous communication\n- gRPC for inter-service communication',
    owner: 'Sarah Chen',
    type: 'SPECIFICATION'
  },
  {
    id: 'DOC-002',
    title: 'API Glossary',
    text: 'Comprehensive glossary of all API endpoints, parameters, and response formats used throughout the system.',
    owner: 'Mike Johnson',
    type: 'REPORT'
  },
  {
    id: 'DOC-003',
    title: 'User Research Findings Q4 2024',
    text: 'Summary of user research conducted in Q4 2024, including pain points, feature requests, and usability improvements.',
    owner: 'Emma Wilson',
    type: 'REPORT'
  }
];

const initialIdeas: Idea[] = [
  {
    id: 'IDEA-001',
    title: 'One-Click Checkout',
    description: 'Implement a streamlined one-click checkout process for returning customers to reduce cart abandonment.',
    stakeholder: 'Emma Wilson',
    conflict: 'May conflict with fraud detection requirements',
    dependencies: 'Payment gateway integration, User authentication system',
    category: 'Feature',
    status: 'PROPOSED',
    priority: 'HIGH',
    impact: 9,
    confidence: 8,
    effort: 7,
    iceScore: 10.3
  },
  {
    id: 'IDEA-002',
    title: 'AI-Powered Product Recommendations',
    description: 'Use machine learning to provide personalized product recommendations based on user behavior and purchase history.',
    stakeholder: 'Mike Johnson',
    conflict: 'None',
    dependencies: 'ML infrastructure, User tracking system',
    category: 'Enhancement',
    status: 'ACCEPTED',
    priority: 'MEDIUM',
    impact: 8,
    confidence: 6,
    effort: 9,
    iceScore: 5.3
  },
  {
    id: 'IDEA-003',
    title: 'Real-time Inventory Sync',
    description: 'Synchronize inventory levels in real-time across all sales channels to prevent overselling.',
    stakeholder: 'Sarah Chen',
    conflict: 'None',
    dependencies: 'Warehouse management system API',
    category: 'Integration',
    status: 'PROPOSED',
    priority: 'CRITICAL',
    impact: 10,
    confidence: 9,
    effort: 6,
    iceScore: 15.0
  }
];

const initialRequirements: Requirement[] = [
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
    type: 'FUNCTIONAL',
    status: 'IMPLEMENTED',
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
    type: 'NON_FUNCTIONAL',
    status: 'APPROVED',
    priority: 'High'
  },
  {
    id: 'REQ-003',
    stakeholder: 'Sarah Chen',
    versions: [
      {
        version: '1.0',
        title: 'GDPR Compliance Module',
        description: 'Implement comprehensive GDPR compliance features including data export, deletion, and consent management.',
        isCurrent: true,
        createdAt: '2024-09-25'
      }
    ],
    conflicts: 'None',
    dependencies: 'Legal framework documentation',
    category: 'Business',
    type: 'CONSTRAINT',
    status: 'REVIEW',
    priority: 'Critical'
  }
];

const initialChangeRequests: ChangeRequest[] = [
  {
    id: 'CR-001',
    requirementId: 'REQ-001',
    stakeholder: 'Emma Wilson',
    status: 'PENDING',
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
    status: 'APPROVED',
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
    status: 'PENDING',
    baseVersion: '1.0',
    nextVersion: '1.1',
    cost: 'Low to medium effort. Mainly UI updates and documentation. Legal review required. Estimated 1-2 weeks. Cost: $8,000',
    benefit: 'Full GDPR compliance reduces legal risk. Builds customer trust. Enables expansion to EU markets. Avoids potential fines.',
    summary: 'Add user-facing privacy dashboard where users can view, export, and delete their personal data. Includes consent management interface and data retention controls.'
  }
];

// Provider Component
export function DataProvider({ children }: { children: ReactNode }) {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    title: 'E-Commerce Platform Modernization',
    description: 'A comprehensive project to modernize our legacy e-commerce platform, implementing modern architecture patterns, improving user experience, and enhancing system scalability.'
  });
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`
  };

  // Initialize data on mount
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setIsLoading(true);
    try {
      // Fetch all data from backend
      const [
        projectInfoRes,
        teamMembersRes,
        documentsRes,
        ideasRes,
        requirementsRes,
        changeRequestsRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/project-info`, { headers }),
        fetch(`${API_BASE_URL}/team-members`, { headers }),
        fetch(`${API_BASE_URL}/documents`, { headers }),
        fetch(`${API_BASE_URL}/ideas`, { headers }),
        fetch(`${API_BASE_URL}/requirements`, { headers }),
        fetch(`${API_BASE_URL}/change-requests`, { headers })
      ]);

      const projectInfoData = await projectInfoRes.json();
      const teamMembersData = await teamMembersRes.json();
      const documentsData = await documentsRes.json();
      const ideasData = await ideasRes.json();
      const requirementsData = await requirementsRes.json();
      const changeRequestsData = await changeRequestsRes.json();

      // If no data exists, initialize with default data
      if (teamMembersData.length === 0) {
        await fetch(`${API_BASE_URL}/initialize-data`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ entity: 'team-members', data: initialTeamMembers })
        });
        setTeamMembers(initialTeamMembers);
      } else {
        setTeamMembers(teamMembersData);
      }

      if (documentsData.length === 0) {
        await fetch(`${API_BASE_URL}/initialize-data`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ entity: 'documents', data: initialDocuments })
        });
        setDocuments(initialDocuments);
      } else {
        setDocuments(documentsData);
      }

      if (ideasData.length === 0) {
        await fetch(`${API_BASE_URL}/initialize-data`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ entity: 'ideas', data: initialIdeas })
        });
        setIdeas(initialIdeas);
      } else {
        setIdeas(ideasData);
      }

      if (requirementsData.length === 0) {
        await fetch(`${API_BASE_URL}/initialize-data`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ entity: 'requirements', data: initialRequirements })
        });
        setRequirements(initialRequirements);
      } else {
        setRequirements(requirementsData);
      }

      if (changeRequestsData.length === 0) {
        await fetch(`${API_BASE_URL}/initialize-data`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ entity: 'change-requests', data: initialChangeRequests })
        });
        setChangeRequests(initialChangeRequests);
      } else {
        setChangeRequests(changeRequestsData);
      }

      setProjectInfo(projectInfoData);
    } catch (error) {
      console.error('Error initializing data from backend:', error);
      // Fallback to initial data if backend fails
      setTeamMembers(initialTeamMembers);
      setDocuments(initialDocuments);
      setIdeas(initialIdeas);
      setRequirements(initialRequirements);
      setChangeRequests(initialChangeRequests);
    } finally {
      setIsLoading(false);
    }
  };

  // Project Info
  const updateProjectInfo = async (info: ProjectInfo) => {
    try {
      const response = await fetch(`${API_BASE_URL}/project-info`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(info)
      });
      if (!response.ok) throw new Error('Failed to update project info');
      setProjectInfo(info);
    } catch (error) {
      console.error('Error updating project info:', error);
      throw error;
    }
  };

  // Team Members
  const addTeamMember = async (member: TeamMember) => {
    try {
      const response = await fetch(`${API_BASE_URL}/team-members`, {
        method: 'POST',
        headers,
        body: JSON.stringify(member)
      });
      if (!response.ok) throw new Error('Failed to add team member');
      setTeamMembers([...teamMembers, member]);
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  };

  const updateTeamMember = async (member: TeamMember) => {
    try {
      const response = await fetch(`${API_BASE_URL}/team-members/${member.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(member)
      });
      if (!response.ok) throw new Error('Failed to update team member');
      setTeamMembers(teamMembers.map(m => m.id === member.id ? member : m));
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  };

  const deleteTeamMember = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/team-members/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!response.ok) throw new Error('Failed to delete team member');
      setTeamMembers(teamMembers.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting team member:', error);
      throw error;
    }
  };

  // Documents
  const addDocument = async (document: Document) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers,
        body: JSON.stringify(document)
      });
      if (!response.ok) throw new Error('Failed to add document');
      setDocuments([...documents, document]);
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  };

  const updateDocument = async (document: Document) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${document.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(document)
      });
      if (!response.ok) throw new Error('Failed to update document');
      setDocuments(documents.map(d => d.id === document.id ? document : d));
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!response.ok) throw new Error('Failed to delete document');
      setDocuments(documents.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  // Ideas
  const addIdea = async (idea: Idea) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ideas`, {
        method: 'POST',
        headers,
        body: JSON.stringify(idea)
      });
      if (!response.ok) throw new Error('Failed to add idea');
      setIdeas([...ideas, idea]);
    } catch (error) {
      console.error('Error adding idea:', error);
      throw error;
    }
  };

  const bulkAddIdeas = async (newIdeas: Idea[]) => {
    try {
      for (const idea of newIdeas) {
        await fetch(`${API_BASE_URL}/ideas`, {
          method: 'POST',
          headers,
          body: JSON.stringify(idea)
        });
      }
      setIdeas([...ideas, ...newIdeas]);
    } catch (error) {
      console.error('Error bulk adding ideas:', error);
      throw error;
    }
  };

  const updateIdea = async (idea: Idea) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ideas/${idea.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(idea)
      });
      if (!response.ok) throw new Error('Failed to update idea');
      setIdeas(ideas.map(i => i.id === idea.id ? idea : i));
    } catch (error) {
      console.error('Error updating idea:', error);
      throw error;
    }
  };

  const deleteIdea = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ideas/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!response.ok) throw new Error('Failed to delete idea');
      setIdeas(ideas.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting idea:', error);
      throw error;
    }
  };

  // Requirements
  const addRequirement = async (requirement: Requirement) => {
    try {
      const response = await fetch(`${API_BASE_URL}/requirements`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requirement)
      });
      if (!response.ok) throw new Error('Failed to add requirement');
      setRequirements([...requirements, requirement]);
    } catch (error) {
      console.error('Error adding requirement:', error);
      throw error;
    }
  };

  const updateRequirement = async (requirement: Requirement) => {
    try {
      const response = await fetch(`${API_BASE_URL}/requirements/${requirement.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(requirement)
      });
      if (!response.ok) throw new Error('Failed to update requirement');
      setRequirements(requirements.map(r => r.id === requirement.id ? requirement : r));
    } catch (error) {
      console.error('Error updating requirement:', error);
      throw error;
    }
  };

  const deleteRequirement = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/requirements/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!response.ok) throw new Error('Failed to delete requirement');
      setRequirements(requirements.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting requirement:', error);
      throw error;
    }
  };

  // Change Requests
  const addChangeRequest = async (changeRequest: ChangeRequest) => {
    try {
      const response = await fetch(`${API_BASE_URL}/change-requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(changeRequest)
      });
      if (!response.ok) throw new Error('Failed to add change request');
      setChangeRequests([...changeRequests, changeRequest]);
    } catch (error) {
      console.error('Error adding change request:', error);
      throw error;
    }
  };

  const updateChangeRequest = async (changeRequest: ChangeRequest) => {
    try {
      const response = await fetch(`${API_BASE_URL}/change-requests/${changeRequest.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(changeRequest)
      });
      if (!response.ok) throw new Error('Failed to update change request');
      setChangeRequests(changeRequests.map(cr => cr.id === changeRequest.id ? changeRequest : cr));
    } catch (error) {
      console.error('Error updating change request:', error);
      throw error;
    }
  };

  const deleteChangeRequest = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/change-requests/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!response.ok) throw new Error('Failed to delete change request');
      setChangeRequests(changeRequests.filter(cr => cr.id !== id));
    } catch (error) {
      console.error('Error deleting change request:', error);
      throw error;
    }
  };

  const value: DataContextType = {
    projectInfo,
    updateProjectInfo,
    teamMembers,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    ideas,
    addIdea,
    updateIdea,
    deleteIdea,
    bulkAddIdeas,
    requirements,
    addRequirement,
    updateRequirement,
    deleteRequirement,
    changeRequests,
    addChangeRequest,
    updateChangeRequest,
    deleteChangeRequest,
    isLoading,
    initializeData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
