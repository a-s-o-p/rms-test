import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode
} from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type UUIDString = string;

type DocumentTypeValue = string;
type IdeaStatusValue = 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'IMPLEMENTED';
type IdeaPriorityValue = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type RequirementTypeValue = 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'CONSTRAINT';
type RequirementStatusValue = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';
type RequirementPriorityValue = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type ChangeRequestStatusValue = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';

// Interfaces
export interface Document {
  id: string;
  title: string;
  text: string;
  owner: string;
  type: string;
  stakeholderId?: string;
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
  stakeholderId?: string;
}

export interface RequirementVersion {
  version: string;
  title: string;
  description: string;
  isCurrent: boolean;
  createdAt: string;
  backendId?: string;
  versionNumber?: number;
  stakeholderId?: string;
  conflicts?: string;
  dependencies?: string;
  category?: string;
  type?: string;
  status?: string;
  priority?: string;
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

// Backend interfaces
interface BackendProject {
  id: UUIDString;
  title: string;
  description: string;
  key: string;
}

interface BackendStakeholder {
  id: UUIDString;
  project_id: UUIDString;
  name: string;
  email: string;
  role: string;
}

interface BackendDocument {
  id: UUIDString;
  project_id: UUIDString;
  type: string;
  title: string;
  text: string;
  stakeholder_id?: UUIDString | null;
  created_at?: string;
}

interface BackendIdea {
  id: UUIDString;
  project_id: UUIDString;
  stakeholder_id: UUIDString;
  title: string;
  description: string;
  category: string;
  status: IdeaStatusValue;
  priority: IdeaPriorityValue;
  impact?: number | null;
  confidence?: number | null;
  effort?: number | null;
  conflicts?: string | null;
  dependencies?: string | null;
  ice_score?: number | null;
}

interface BackendRequirement {
  id: UUIDString;
  project_id: UUIDString;
  current_version_id?: UUIDString | null;
}

interface BackendRequirementVersion {
  id: UUIDString;
  requirement_id: UUIDString;
  stakeholder_id: UUIDString;
  version_number: number;
  title: string;
  description: string;
  conflicts?: string | null;
  dependencies?: string | null;
  category: string;
  type: RequirementTypeValue | string;
  status: RequirementStatusValue | string;
  priority: number;
  created_at?: string;
}

interface BackendChangeRequest {
  id: UUIDString;
  requirement_id: UUIDString;
  stakeholder_id: UUIDString;
  status: ChangeRequestStatusValue;
  base_version_id: UUIDString;
  next_version_id: UUIDString | null;
  cost?: string | null;
  benefit?: string | null;
  summary: string;
}

interface BackendAISearchResponse {
  query: string;
  response: string;
}

// Context Type
interface DataContextType {
  projectInfo: ProjectInfo;
  updateProjectInfo: (info: ProjectInfo) => Promise<void>;
  teamMembers: TeamMember[];
  addTeamMember: (member: TeamMember) => Promise<void>;
  updateTeamMember: (member: TeamMember) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  documents: Document[];
  addDocument: (document: Document) => Promise<void>;
  updateDocument: (document: Document) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  ideas: Idea[];
  addIdea: (idea: Idea) => Promise<void>;
  updateIdea: (idea: Idea) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  bulkAddIdeas: (ideas: Idea[]) => Promise<void>;
  generateIdeasWithAI: (prompt: string) => Promise<Idea[]>;
  requirements: Requirement[];
  addRequirement: (requirement: Requirement) => Promise<void>;
  updateRequirement: (requirement: Requirement) => Promise<void>;
  deleteRequirement: (id: string) => Promise<void>;
  generateRequirementsWithAI: (ideas: Idea[]) => Promise<Requirement[]>;
  changeRequests: ChangeRequest[];
  addChangeRequest: (changeRequest: ChangeRequest) => Promise<void>;
  updateChangeRequest: (changeRequest: ChangeRequest) => Promise<void>;
  deleteChangeRequest: (id: string) => Promise<void>;
  generateChangeRequestWithAI: (input: {
    requirementId: string;
    baseVersion: string;
    nextVersion: string;
  }) => Promise<ChangeRequest>;
  aiSearch: (query: string) => Promise<string>;
  isLoading: boolean;
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
    priority: 'CRITICAL',
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
    priority: 'HIGH'
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
    priority: 'CRITICAL'
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

const PROJECT_DEFAULT: ProjectInfo = {
  title: 'E-Commerce Platform Modernization',
  description: 'A comprehensive project to modernize our legacy e-commerce platform, implementing modern architecture patterns, improving user experience, and enhancing system scalability.'
};
const requirementPriorityFromNumber = (priority?: number | null): RequirementPriorityValue => {
  if (!priority) return 'MEDIUM';
  if (priority >= 5) return 'CRITICAL';
  if (priority === 4) return 'HIGH';
  if (priority === 1) return 'LOW';
  return 'MEDIUM';
};

const requirementPriorityToNumber = (priority?: string): number => {
  if (!priority) return 3;
  const value = priority.toUpperCase();
  if (value === 'CRITICAL') return 5;
  if (value === 'HIGH') return 4;
  if (value === 'LOW') return 1;
  return 3;
};

const normalizeEnumValue = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const parts = value.split('.');
  return parts[parts.length - 1];
};

const formatDate = (value?: string | null): string => {
  if (!value) return new Date().toISOString().split('T')[0];
  try {
    return new Date(value).toISOString().split('T')[0];
  } catch {
    return value.split('T')[0];
  }
};

const formatVersionLabel = (versionNumber?: number): string => {
  if (versionNumber === undefined || versionNumber === null) return '1.0';
  return `1.${Math.max(versionNumber - 1, 0)}`;
};

const isUUID = (value?: string | null): value is string => {
  if (!value) return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
};

const calculateIceScore = (impact?: number | null, confidence?: number | null, effort?: number | null): number => {
  if (!impact || !confidence || !effort || effort === 0) {
    return 0;
  }
  return Number(((impact * confidence) / effort).toFixed(1));
};

const mapTeamMemberFromBackend = (stakeholder: BackendStakeholder): TeamMember => ({
  id: stakeholder.id,
  fullName: stakeholder.name ?? 'Unnamed Stakeholder',
  email: stakeholder.email ?? '',
  role: stakeholder.role ?? 'Contributor'
});

const mapDocumentFromBackend = (doc: BackendDocument, stakeholderMap: Map<string, BackendStakeholder>): Document => ({
  id: doc.id,
  title: doc.title ?? 'Untitled Document',
  text: doc.text ?? '',
  owner: doc.stakeholder_id ? (stakeholderMap.get(doc.stakeholder_id)?.name ?? 'Unassigned') : 'Unassigned',
  type: normalizeEnumValue(doc.type) ?? 'SPECIFICATION',
  stakeholderId: doc.stakeholder_id ?? undefined
});

const mapIdeaFromBackend = (idea: BackendIdea, stakeholderMap: Map<string, BackendStakeholder>): Idea => {
  const impact = idea.impact ?? 0;
  const confidence = idea.confidence ?? 0;
  const effort = idea.effort ?? 1;
  const iceScore = idea.ice_score ?? calculateIceScore(impact, confidence, effort);

  return {
    id: idea.id,
    title: idea.title ?? 'Untitled Idea',
    description: idea.description ?? '',
    stakeholder: stakeholderMap.get(idea.stakeholder_id)?.name ?? 'Unassigned',
    conflict: idea.conflicts ?? 'None',
    dependencies: idea.dependencies ?? 'None',
    category: idea.category ?? 'General',
    status: idea.status ?? 'PROPOSED',
    priority: idea.priority ?? 'MEDIUM',
    impact,
    confidence,
    effort,
    iceScore,
    stakeholderId: idea.stakeholder_id
  };
};

const mapRequirementFromBackend = (
  requirement: BackendRequirement,
  versions: BackendRequirementVersion[],
  stakeholderMap: Map<string, BackendStakeholder>,
  versionIndex: Map<string, { requirementId: string; label: string; stakeholderId?: string }>
): Requirement => {
  const mappedVersions = versions
    .map((version) => {
      const label = formatVersionLabel(version.version_number);
      versionIndex.set(version.id, {
        requirementId: requirement.id,
        label,
        stakeholderId: version.stakeholder_id
      });

      return {
        backendId: version.id,
        versionNumber: version.version_number,
        version: label,
        title: version.title ?? 'Untitled Requirement',
        description: version.description ?? '',
        isCurrent: requirement.current_version_id ? version.id === requirement.current_version_id : false,
        createdAt: formatDate(version.created_at),
        stakeholderId: version.stakeholder_id ?? undefined,
        conflicts: version.conflicts ?? 'None',
        dependencies: version.dependencies ?? 'None',
        category: normalizeEnumValue(version.category) ?? 'Functional',
        type: normalizeEnumValue(version.type) ?? 'FUNCTIONAL',
        status: normalizeEnumValue(version.status) ?? 'DRAFT',
        priority: requirementPriorityFromNumber(version.priority)
      } satisfies RequirementVersion;
    })
    .sort((a, b) => (a.versionNumber ?? 0) - (b.versionNumber ?? 0));

  if (mappedVersions.length > 0 && !mappedVersions.some((version) => version.isCurrent)) {
    mappedVersions[mappedVersions.length - 1].isCurrent = true;
  }

  const currentVersion = mappedVersions.find((version) => version.isCurrent) ?? mappedVersions[mappedVersions.length - 1];
  const stakeholderName = currentVersion?.stakeholderId
    ? stakeholderMap.get(currentVersion.stakeholderId)?.name
    : undefined;

  return {
    id: requirement.id,
    stakeholder: stakeholderName ?? 'Unassigned',
    versions: mappedVersions,
    conflicts: currentVersion?.conflicts ?? 'None',
    dependencies: currentVersion?.dependencies ?? 'None',
    category: currentVersion?.category ?? 'Functional',
    type: currentVersion?.type ?? 'FUNCTIONAL',
    status: currentVersion?.status ?? 'DRAFT',
    priority: currentVersion?.priority ?? 'MEDIUM',
    basedOnExpectation: undefined
  };
};

const mapChangeRequestFromBackend = (
  changeRequest: BackendChangeRequest,
  versionIndex: Map<string, { requirementId: string; label: string; stakeholderId?: string }>,
  stakeholderMap: Map<string, BackendStakeholder>,
  requirements: Requirement[]
): ChangeRequest => {
  const baseVersionInfo = versionIndex.get(changeRequest.base_version_id);
  const nextVersionInfo = changeRequest.next_version_id
    ? versionIndex.get(changeRequest.next_version_id)
    : undefined;
  const requirement = requirements.find((req) => req.id === changeRequest.requirement_id);
  const fallbackVersion = requirement?.versions.find((version) => version.isCurrent)?.version;

  return {
    id: changeRequest.id,
    requirementId: requirement?.id ?? changeRequest.requirement_id,
    stakeholder: stakeholderMap.get(changeRequest.stakeholder_id)?.name ?? 'Unassigned',
    status: changeRequest.status ?? 'PENDING',
    baseVersion: baseVersionInfo?.label ?? fallbackVersion ?? 'Undefined',
    nextVersion: nextVersionInfo?.label ?? 'Undefined',
    cost: changeRequest.cost ?? 'Undefined',
    benefit: changeRequest.benefit ?? 'Undefined',
    summary: changeRequest.summary ?? ''
  };
};

const fetchJson = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const finalInit: RequestInit = init ? { ...init } : {};
  if (finalInit.method && finalInit.method !== 'GET') {
    finalInit.headers = {
      'Content-Type': 'application/json',
      ...(finalInit.headers as Record<string, string> | undefined)
    };
  }

  const response = await fetch(`${API_BASE_URL}${path}`, finalInit);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  if (response.status === 204) {
    return null as T;
  }
  return (await response.json()) as T;
};
// Provider Component
export function DataProvider({ children }: { children: ReactNode }) {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>(PROJECT_DEFAULT);
  const [projectId, setProjectId] = useState<string | null>(null);

  const [stakeholders, setStakeholders] = useState<BackendStakeholder[]>([]);
  const stakeholdersRef = useRef<BackendStakeholder[]>([]);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [requirements, setRequirements] = useState<Requirement[]>(initialRequirements);
  const requirementsRef = useRef<Requirement[]>(initialRequirements);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(initialChangeRequests);
  const [isLoading, setIsLoading] = useState(true);

  const versionIndexRef = useRef<Map<string, { requirementId: string; label: string; stakeholderId?: string }>>(new Map());

  useEffect(() => {
    requirementsRef.current = requirements;
  }, [requirements]);

  const applyStakeholders = (items: BackendStakeholder[]) => {
    stakeholdersRef.current = items;
    setStakeholders(items);
    if (items.length > 0) {
      setTeamMembers(items.map(mapTeamMemberFromBackend));
    } else {
      setTeamMembers(initialTeamMembers);
    }
  };

  const buildStakeholderMap = () => new Map(stakeholdersRef.current.map((stakeholder) => [stakeholder.id, stakeholder] as const));

  const findStakeholderIdByName = (name?: string): string | null => {
    if (!name) {
      return stakeholdersRef.current[0]?.id ?? null;
    }
    const lower = name.toLowerCase();
    const match = stakeholdersRef.current.find((stakeholder) => stakeholder.name?.toLowerCase() === lower);
    return match?.id ?? stakeholdersRef.current[0]?.id ?? null;
  };

  const refreshRequirement = async (requirementId: string): Promise<Requirement | null> => {
    try {
      const requirementData = await fetchJson<BackendRequirement>(`/requirements/${requirementId}`);
      const versionsData = await fetchJson<BackendRequirementVersion[]>(`/requirements/${requirementId}/versions`);
      const stakeholderMap = buildStakeholderMap();
      const updatedRequirement = mapRequirementFromBackend(
        requirementData,
        versionsData,
        stakeholderMap,
        versionIndexRef.current
      );

      setRequirements((prevRequirements) => {
        const exists = prevRequirements.some((requirement) => requirement.id === requirementId);
        const nextRequirements = exists
          ? prevRequirements.map((requirement) =>
              requirement.id === requirementId ? updatedRequirement : requirement
            )
          : [...prevRequirements, updatedRequirement];
        requirementsRef.current = nextRequirements;
        return nextRequirements;
      });

      return updatedRequirement;
    } catch (error) {
      console.error('Error refreshing requirement from backend:', error);
      return null;
    }
  };
  const initializeData = async () => {
    setIsLoading(true);
    versionIndexRef.current = new Map();

    try {
      let activeProjectId: string | null = null;

      try {
        const projects = await fetchJson<BackendProject[]>('/projects');
        if (projects && projects.length > 0) {
          const project = projects[0];
          activeProjectId = project.id;
          setProjectInfo({
            title: project.title ?? PROJECT_DEFAULT.title,
            description: project.description ?? PROJECT_DEFAULT.description
          });
        } else {
          const createdProject = await fetchJson<BackendProject>('/projects', {
            method: 'POST',
            body: JSON.stringify({
              key: 'DEFAULT',
              title: PROJECT_DEFAULT.title,
              description: PROJECT_DEFAULT.description,
              project_status: 'ACTIVE'
            })
          });
          activeProjectId = createdProject.id;
          setProjectInfo({
            title: createdProject.title ?? PROJECT_DEFAULT.title,
            description: createdProject.description ?? PROJECT_DEFAULT.description
          });
        }
      } catch (error) {
        console.error('Error fetching projects from backend:', error);
        setProjectInfo(PROJECT_DEFAULT);
      }

      setProjectId(activeProjectId);

      const stakeholderPath = activeProjectId ? `/stakeholders?project_id=${activeProjectId}` : '/stakeholders';
      try {
        const stakeholderData = await fetchJson<BackendStakeholder[]>(stakeholderPath);
        applyStakeholders(stakeholderData);
      } catch (error) {
        console.error('Error fetching stakeholders:', error);
        applyStakeholders([]);
      }

      const stakeholderMap = buildStakeholderMap();

      const documentPath = activeProjectId ? `/documents?project_id=${activeProjectId}` : '/documents';
      try {
        const documentData = await fetchJson<BackendDocument[]>(documentPath);
        if (documentData.length > 0) {
          setDocuments(documentData.map((document) => mapDocumentFromBackend(document, stakeholderMap)));
        } else {
          setDocuments(initialDocuments);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        setDocuments(initialDocuments);
      }

      const ideasPath = activeProjectId ? `/ideas?project_id=${activeProjectId}` : '/ideas';
      try {
        const ideaData = await fetchJson<BackendIdea[]>(ideasPath);
        if (ideaData.length > 0) {
          setIdeas(ideaData.map((idea) => mapIdeaFromBackend(idea, stakeholderMap)));
        } else {
          setIdeas(initialIdeas);
        }
      } catch (error) {
        console.error('Error fetching ideas:', error);
        setIdeas(initialIdeas);
      }

      const requirementsPath = activeProjectId ? `/requirements?project_id=${activeProjectId}` : '/requirements';
      try {
        const requirementData = await fetchJson<BackendRequirement[]>(requirementsPath);
        if (requirementData.length > 0) {
          const mappedRequirements: Requirement[] = [];
          for (const requirement of requirementData) {
            try {
              const versions = await fetchJson<BackendRequirementVersion[]>(`/requirements/${requirement.id}/versions`);
              mappedRequirements.push(
                mapRequirementFromBackend(requirement, versions, stakeholderMap, versionIndexRef.current)
              );
            } catch (error) {
              console.error('Error fetching requirement versions:', error);
            }
          }

          if (mappedRequirements.length > 0) {
            setRequirements(mappedRequirements);
            requirementsRef.current = mappedRequirements;
          } else {
            setRequirements(initialRequirements);
            requirementsRef.current = initialRequirements;
          }
        } else {
          setRequirements(initialRequirements);
          requirementsRef.current = initialRequirements;
        }
      } catch (error) {
        console.error('Error fetching requirements:', error);
        setRequirements(initialRequirements);
        requirementsRef.current = initialRequirements;
      }

      const changeRequestPath = activeProjectId ? `/change-requests` : '/change-requests';
      try {
        const changeRequestData = await fetchJson<BackendChangeRequest[]>(changeRequestPath);
        if (changeRequestData.length > 0) {
          const mapped = changeRequestData.map((changeRequest) =>
            mapChangeRequestFromBackend(changeRequest, versionIndexRef.current, stakeholderMap, requirementsRef.current)
          );
          setChangeRequests(mapped);
        } else {
          setChangeRequests(initialChangeRequests);
        }
      } catch (error) {
        console.error('Error fetching change requests:', error);
        setChangeRequests(initialChangeRequests);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);
  const updateProjectInfo = async (info: ProjectInfo) => {
    setProjectInfo(info);

    if (!projectId) {
      return;
    }

    try {
      await fetchJson(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: info.title,
          description: info.description
        })
      });
    } catch (error) {
      console.error('Error updating project info:', error);
      throw error;
    }
  };
  const addTeamMember = async (member: TeamMember) => {
    const newMember = { ...member };

    if (!projectId) {
      setTeamMembers((prev) => [...prev, newMember]);
      return;
    }

    if (stakeholdersRef.current.length === 0) {
      setTeamMembers((prev) => [...prev, newMember]);
      return;
    }

    try {
      const createdStakeholder = await fetchJson<BackendStakeholder>('/stakeholders', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          name: member.fullName,
          email: member.email,
          role: member.role
        })
      });

      applyStakeholders([...stakeholdersRef.current, createdStakeholder]);
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  };

  const updateTeamMember = async (member: TeamMember) => {
    setTeamMembers((prev) => prev.map((item) => (item.id === member.id ? member : item)));

    if (!projectId) {
      return;
    }

    const targetStakeholder = stakeholdersRef.current.find((stakeholder) => stakeholder.id === member.id);
    if (!targetStakeholder) {
      return;
    }

    try {
      await fetchJson(`/stakeholders/${member.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: member.fullName,
          email: member.email,
          role: member.role
        })
      });

      const updatedStakeholders = stakeholdersRef.current.map((stakeholder) =>
        stakeholder.id === member.id
          ? { ...stakeholder, name: member.fullName, email: member.email, role: member.role }
          : stakeholder
      );
      applyStakeholders(updatedStakeholders);
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  };

  const deleteTeamMember = async (id: string) => {
    setTeamMembers((prev) => prev.filter((member) => member.id !== id));

    if (!projectId) {
      return;
    }

    const targetStakeholder = stakeholdersRef.current.find((stakeholder) => stakeholder.id === id);
    if (!targetStakeholder) {
      return;
    }

    try {
      await fetchJson(`/stakeholders/${id}`, { method: 'DELETE' });
      applyStakeholders(stakeholdersRef.current.filter((stakeholder) => stakeholder.id !== id));
    } catch (error) {
      console.error('Error deleting team member:', error);
      throw error;
    }
  };
  const addDocument = async (document: Document) => {
    if (!projectId || stakeholdersRef.current.length === 0) {
      setDocuments((prev) => [...prev, document]);
      return;
    }

    try {
      const stakeholderId = findStakeholderIdByName(document.owner);
      const createdDocument = await fetchJson<BackendDocument>('/documents', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          type: document.type as DocumentTypeValue,
          title: document.title,
          text: document.text,
          stakeholder_id: stakeholderId ?? undefined
        })
      });

      const stakeholderMap = buildStakeholderMap();
      setDocuments((prev) => [...prev, mapDocumentFromBackend(createdDocument, stakeholderMap)]);
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  };

  const updateDocument = async (document: Document) => {
    setDocuments((prev) => prev.map((item) => (item.id === document.id ? document : item)));

    if (!projectId || stakeholdersRef.current.length === 0) {
      return;
    }

    try {
      const stakeholderId = findStakeholderIdByName(document.owner);
      await fetchJson(`/documents/${document.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: document.title,
          text: document.text,
          type: document.type as DocumentTypeValue,
          stakeholder_id: stakeholderId ?? undefined
        })
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  };

  const deleteDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((document) => document.id !== id));

    try {
      await fetchJson(`/documents/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };
  const addIdea = async (idea: Idea) => {
    const calculate = calculateIceScore(idea.impact, idea.confidence, idea.effort);

    if (!projectId || stakeholdersRef.current.length === 0) {
      setIdeas((prev) => [...prev, { ...idea, iceScore: calculate }]);
      return;
    }

    try {
      const stakeholderId = findStakeholderIdByName(idea.stakeholder);
      if (!stakeholderId) {
        setIdeas((prev) => [...prev, { ...idea, iceScore: calculate }]);
        return;
      }

      const createdIdea = await fetchJson<BackendIdea>('/ideas', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          stakeholder_id: stakeholderId,
          title: idea.title,
          description: idea.description,
          category: idea.category,
          status: idea.status as IdeaStatusValue,
          priority: idea.priority as IdeaPriorityValue,
          impact: idea.impact,
          confidence: idea.confidence,
          effort: idea.effort,
          conflicts: idea.conflict === 'None' ? null : idea.conflict,
          dependencies: idea.dependencies === 'None' ? null : idea.dependencies
        })
      });

      const stakeholderMap = buildStakeholderMap();
      setIdeas((prev) => [...prev, mapIdeaFromBackend(createdIdea, stakeholderMap)]);
    } catch (error) {
      console.error('Error adding idea:', error);
      throw error;
    }
  };

  const updateIdea = async (idea: Idea) => {
    const iceScore = calculateIceScore(idea.impact, idea.confidence, idea.effort);
    setIdeas((prev) => prev.map((item) => (item.id === idea.id ? { ...idea, iceScore } : item)));

    if (!projectId || stakeholdersRef.current.length === 0) {
      return;
    }

    try {
      const stakeholderId = findStakeholderIdByName(idea.stakeholder);
      if (!stakeholderId) {
        return;
      }

      await fetchJson(`/ideas/${idea.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: idea.title,
          description: idea.description,
          category: idea.category,
          status: idea.status as IdeaStatusValue,
          priority: idea.priority as IdeaPriorityValue,
          impact: idea.impact,
          confidence: idea.confidence,
          effort: idea.effort,
          conflicts: idea.conflict === 'None' ? null : idea.conflict,
          dependencies: idea.dependencies === 'None' ? null : idea.dependencies,
          stakeholder_id: stakeholderId
        })
      });
    } catch (error) {
      console.error('Error updating idea:', error);
      throw error;
    }
  };

  const deleteIdea = async (id: string) => {
    setIdeas((prev) => prev.filter((idea) => idea.id !== id));

    try {
      await fetchJson(`/ideas/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting idea:', error);
      throw error;
    }
  };

  const bulkAddIdeas = async (newIdeas: Idea[]) => {
    for (const idea of newIdeas) {
      await addIdea(idea);
    }
  };

  const generateIdeasWithAI = async (prompt: string): Promise<Idea[]> => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const response = await fetchJson<BackendIdea[]>('/ai/generate-ideas', {
        method: 'POST',
        body: JSON.stringify({ text: trimmed })
      });

      if (!Array.isArray(response) || response.length === 0) {
        return [];
      }

      const stakeholderMap = buildStakeholderMap();
      const mappedIdeas = response.map((idea) => mapIdeaFromBackend(idea, stakeholderMap));

      setIdeas((prev) => {
        const existing = new Map(prev.map((idea) => [idea.id, idea] as const));
        const next = [...prev];

        mappedIdeas.forEach((idea) => {
          if (existing.has(idea.id)) {
            const index = next.findIndex((item) => item.id === idea.id);
            if (index >= 0) {
              next[index] = idea;
            }
          } else {
            next.push(idea);
          }
        });

        return next;
      });

      return mappedIdeas;
    } catch (error) {
      console.error('Error generating ideas with AI:', error);
      throw error;
    }
  };
  const addRequirement = async (requirement: Requirement) => {
    if (!projectId || stakeholdersRef.current.length === 0) {
      setRequirements((prev) => [...prev, requirement]);
      requirementsRef.current = [...requirementsRef.current, requirement];
      return;
    }

    try {
      const stakeholderId = findStakeholderIdByName(requirement.stakeholder);
      if (!stakeholderId) {
        setRequirements((prev) => [...prev, requirement]);
        requirementsRef.current = [...requirementsRef.current, requirement];
        return;
      }

      const initialVersion = requirement.versions[0];
      const payload = {
        project_id: projectId,
        stakeholder_id: stakeholderId,
        initial_version: {
          title: initialVersion?.title ?? requirement.id,
          description: initialVersion?.description ?? '',
          category: requirement.category || 'Functional',
          type: (requirement.type || 'FUNCTIONAL') as RequirementTypeValue,
          status: (requirement.status || 'DRAFT') as RequirementStatusValue,
          priority: requirementPriorityToNumber(requirement.priority),
          conflicts: requirement.conflicts === 'None' ? null : requirement.conflicts,
          dependencies: requirement.dependencies === 'None' ? null : requirement.dependencies
        }
      };

      const createdRequirement = await fetchJson<BackendRequirement>('/requirements', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      await refreshRequirement(createdRequirement.id);
    } catch (error) {
      console.error('Error adding requirement:', error);
      throw error;
    }
  };

  const updateRequirement = async (requirement: Requirement) => {
    if (!projectId || stakeholdersRef.current.length === 0) {
      setRequirements((prev) => prev.map((item) => (item.id === requirement.id ? requirement : item)));
      requirementsRef.current = requirementsRef.current.map((item) =>
        item.id === requirement.id ? requirement : item
      );
      return;
    }

    try {
      const stakeholderId = findStakeholderIdByName(requirement.stakeholder);
      if (!stakeholderId) {
        setRequirements((prev) => prev.map((item) => (item.id === requirement.id ? requirement : item)));
        requirementsRef.current = requirementsRef.current.map((item) =>
          item.id === requirement.id ? requirement : item
        );
        return;
      }

      const currentVersion = requirement.versions.find((version) => version.isCurrent) ?? requirement.versions[requirement.versions.length - 1];

      if (currentVersion) {
        await fetchJson<BackendRequirementVersion>(`/requirements/${requirement.id}/versions?stakeholder_id=${stakeholderId}`, {
          method: 'POST',
          body: JSON.stringify({
            title: currentVersion.title,
            description: currentVersion.description,
            category: requirement.category || currentVersion.category || 'Functional',
            type: ((requirement.type || currentVersion.type || 'FUNCTIONAL') as RequirementTypeValue),
            status: ((requirement.status || currentVersion.status || 'DRAFT') as RequirementStatusValue),
            priority: requirementPriorityToNumber(requirement.priority || currentVersion.priority),
            conflicts: requirement.conflicts === 'None' ? null : requirement.conflicts,
            dependencies: requirement.dependencies === 'None' ? null : requirement.dependencies
          })
        });
      }

      await refreshRequirement(requirement.id);
    } catch (error) {
      console.error('Error updating requirement:', error);
      throw error;
    }
  };

  const deleteRequirement = async (id: string) => {
    setRequirements((prev) => prev.filter((requirement) => requirement.id !== id));
    requirementsRef.current = requirementsRef.current.filter((requirement) => requirement.id !== id);

    try {
      await fetchJson(`/requirements/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting requirement:', error);
      throw error;
    }
  };

  const generateRequirementsWithAI = async (ideasToConvert: Idea[]): Promise<Requirement[]> => {
    if (ideasToConvert.length === 0) {
      return [];
    }

    const fallback = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const generatedRequirements = ideasToConvert.map((idea, index) => {
        const localId = `REQ-LOCAL-${Date.now()}-${index}`;
        return {
          id: localId,
          stakeholder: idea.stakeholder || 'Unassigned',
          versions: [
            {
              version: '1.0',
              title: idea.title,
              description: idea.description,
              isCurrent: true,
              createdAt: today
            }
          ],
          conflicts: idea.conflict || 'None',
          dependencies: idea.dependencies || 'None',
          category: idea.category || 'Functional',
          type: (idea.category === 'Feature' ? 'FUNCTIONAL' : 'NON_FUNCTIONAL') as RequirementTypeValue,
          status: 'DRAFT',
          priority: idea.priority || 'MEDIUM',
          basedOnExpectation: `Based on ${idea.id}: ${idea.title}`
        } satisfies Requirement;
      });

      setRequirements((prev) => {
        const updated = [...prev, ...generatedRequirements];
        requirementsRef.current = updated;
        return updated;
      });

      return generatedRequirements;
    };

    const validIdeas = ideasToConvert.filter((idea) => isUUID(idea.id));

    if (validIdeas.length === 0) {
      return fallback();
    }

    try {
      const response = await fetchJson<BackendRequirement[]>(
        '/ai/generate-requirements',
        {
          method: 'POST',
          body: JSON.stringify({ idea_ids: validIdeas.map((idea) => idea.id) })
        }
      );

      const generated: Requirement[] = [];
      for (const requirement of response) {
        const refreshed = await refreshRequirement(requirement.id);
        if (refreshed) {
          generated.push(refreshed);
        }
      }

      if (generated.length === 0) {
        return fallback();
      }

      return generated;
    } catch (error) {
      console.error('Error generating requirements with AI:', error);
      return fallback();
    }
  };
  const addChangeRequest = async (changeRequest: ChangeRequest) => {
    if (!projectId || stakeholdersRef.current.length === 0) {
      setChangeRequests((prev) => [...prev, changeRequest]);
      return;
    }

    try {
      const requirement = requirementsRef.current.find((req) => req.id === changeRequest.requirementId) ?? requirementsRef.current[0];
      if (!requirement) {
        setChangeRequests((prev) => [...prev, changeRequest]);
        return;
      }

      const stakeholderId = findStakeholderIdByName(changeRequest.stakeholder) ?? findStakeholderIdByName(requirement.stakeholder);
      if (!stakeholderId) {
        setChangeRequests((prev) => [...prev, changeRequest]);
        return;
      }

      const baseVersion =
        requirement.versions.find((version) => version.version === changeRequest.baseVersion) ??
        requirement.versions.find((version) => version.isCurrent);
      const proposedVersion =
        requirement.versions.find((version) => version.version === changeRequest.nextVersion) ?? baseVersion;

      if (!baseVersion?.backendId || !proposedVersion?.backendId) {
        setChangeRequests((prev) => [...prev, changeRequest]);
        return;
      }

      const response = await fetchJson<BackendChangeRequest>('/change-requests', {
        method: 'POST',
        body: JSON.stringify({
          requirement_id: requirement.id,
          stakeholder_id: stakeholderId,
          base_version_id: baseVersion?.backendId,
          next_version_id: proposedVersion?.backendId,
          summary: changeRequest.summary,
          cost: changeRequest.cost || undefined,
          benefit: changeRequest.benefit || undefined,
          status: (changeRequest.status || 'PENDING') as ChangeRequestStatusValue
        })
      });

      const stakeholderMap = buildStakeholderMap();
      await refreshRequirement(response.requirement_id);
      const mapped = mapChangeRequestFromBackend(response, versionIndexRef.current, stakeholderMap, requirementsRef.current);
      setChangeRequests((prev) => [...prev, { ...mapped, nextVersion: changeRequest.nextVersion || mapped.nextVersion }]);
    } catch (error) {
      console.error('Error adding change request:', error);
      throw error;
    }
  };

  const updateChangeRequest = async (changeRequest: ChangeRequest) => {
    setChangeRequests((prev) => prev.map((item) => (item.id === changeRequest.id ? changeRequest : item)));

    try {
      const updated = await fetchJson<BackendChangeRequest>(`/change-requests/${changeRequest.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          summary: changeRequest.summary,
          cost: changeRequest.cost || undefined,
          benefit: changeRequest.benefit || undefined,
          status: (changeRequest.status || 'PENDING') as ChangeRequestStatusValue
        })
      });

      const stakeholderMap = buildStakeholderMap();
      await refreshRequirement(updated.requirement_id);
      const mapped = mapChangeRequestFromBackend(updated, versionIndexRef.current, stakeholderMap, requirementsRef.current);
      setChangeRequests((prev) =>
        prev.map((item) => (item.id === changeRequest.id ? { ...mapped, nextVersion: changeRequest.nextVersion || mapped.nextVersion } : item))
      );
    } catch (error) {
      console.error('Error updating change request:', error);
      throw error;
    }
  };

  const deleteChangeRequest = async (id: string) => {
    setChangeRequests((prev) => prev.filter((changeRequest) => changeRequest.id !== id));

    try {
      await fetchJson(`/change-requests/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting change request:', error);
      throw error;
    }
  };

  const generateChangeRequestWithAI = async ({
    requirementId,
    baseVersion,
    nextVersion
  }: {
    requirementId: string;
    baseVersion: string;
    nextVersion: string;
  }): Promise<ChangeRequest> => {
    const requirement = requirementsRef.current.find((req) => req.id === requirementId);

    const fallback = () => {
      const fallbackChangeRequest: ChangeRequest = {
        id: `CR-LOCAL-${Date.now()}`,
        requirementId,
        stakeholder: requirement?.stakeholder ?? 'Unassigned',
        status: 'PENDING',
        baseVersion,
        nextVersion,
        cost: 'Undefined',
        benefit: 'Undefined',
        summary: `Change request for ${requirementId} from version ${baseVersion} to ${nextVersion}`
      };

      setChangeRequests((prev) => [...prev, fallbackChangeRequest]);
      return fallbackChangeRequest;
    };

    if (!requirement) {
      return fallback();
    }

    const base = requirement.versions.find(
      (version) => version.version === baseVersion || version.backendId === baseVersion
    );
    const next = requirement.versions.find(
      (version) => version.version === nextVersion || version.backendId === nextVersion
    );

    if (!base || !next || !base.backendId || !next.backendId) {
      return fallback();
    }

    try {
      const response = await fetchJson<BackendChangeRequest>('/ai/generate-change-request', {
        method: 'POST',
        body: JSON.stringify({
          base_version_id: base.backendId,
          next_version_id: next.backendId
        })
      });

      const stakeholderMap = buildStakeholderMap();
      await refreshRequirement(response.requirement_id);
      const mapped = mapChangeRequestFromBackend(
        response,
        versionIndexRef.current,
        stakeholderMap,
        requirementsRef.current
      );

      setChangeRequests((prev) => [...prev, mapped]);
      return mapped;
    } catch (error) {
      console.error('Error generating change request with AI:', error);
      return fallback();
    }
  };

  const aiSearch = async (query: string): Promise<string> => {
    const trimmed = query.trim();
    if (!trimmed) {
      return '';
    }

    try {
      const response = await fetchJson<BackendAISearchResponse>('/ai/search', {
        method: 'POST',
        body: JSON.stringify({ query: trimmed })
      });

      return response.response ?? '';
    } catch (error) {
      console.error('Error performing AI search:', error);
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
    generateIdeasWithAI,
    requirements,
    addRequirement,
    updateRequirement,
    deleteRequirement,
    generateRequirementsWithAI,
    changeRequests,
    addChangeRequest,
    updateChangeRequest,
    deleteChangeRequest,
    generateChangeRequestWithAI,
    aiSearch,
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
