const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function fetchJson<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export type ProjectStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ARCHIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export interface Project {
  id: string;
  key: string;
  title: string;
  project_status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectUpdatePayload {
  key?: string;
  title?: string;
  project_status?: ProjectStatus;
}

export type DocumentType =
  | 'SPECIFICATION'
  | 'MEETING_NOTES'
  | 'EMAIL'
  | 'REPORT'
  | 'OTHER';

export interface Stakeholder {
  id: string;
  project_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface StakeholderCreatePayload {
  project_id: string;
  name: string;
  email: string;
  role: string;
}

export interface StakeholderUpdatePayload {
  name?: string;
  email?: string;
  role?: string;
}

export interface Document {
  id: string;
  project_id: string;
  type: DocumentType;
  title: string;
  text: string;
  stakeholder_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreatePayload {
  project_id: string;
  type: DocumentType;
  title: string;
  text: string;
  stakeholder_id?: string | null;
}

export interface DocumentUpdatePayload {
  type?: DocumentType;
  title?: string;
  text?: string;
  stakeholder_id?: string | null;
}

export type IdeaStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'IMPLEMENTED';
export type IdeaPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Idea {
  id: string;
  project_id: string;
  stakeholder_id: string;
  title: string;
  description: string;
  conflicts: string | null;
  dependencies: string | null;
  category: string;
  status: IdeaStatus;
  priority: IdeaPriority;
  impact: number | null;
  confidence: number | null;
  effort: number | null;
  ice_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface IdeaCreatePayload {
  project_id: string;
  stakeholder_id: string;
  title: string;
  description: string;
  category: string;
  status: IdeaStatus;
  priority: IdeaPriority;
  impact?: number | null;
  confidence?: number | null;
  effort?: number | null;
  conflicts?: string | null;
  dependencies?: string | null;
}

export interface IdeaUpdatePayload {
  title?: string;
  description?: string;
  category?: string;
  status?: IdeaStatus;
  priority?: IdeaPriority;
  impact?: number | null;
  confidence?: number | null;
  effort?: number | null;
  conflicts?: string | null;
  dependencies?: string | null;
}

export type RequirementType = 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'CONSTRAINT';
export type RequirementStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';

export interface RequirementVersion {
  id: string;
  requirement_id: string;
  stakeholder_id: string;
  version_number: number;
  title: string;
  description: string;
  conflicts: string | null;
  dependencies: string | null;
  category: string;
  type: RequirementType;
  status: RequirementStatus;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface Requirement {
  id: string;
  project_id: string;
  current_version_id: string | null;
  current_version: RequirementVersion | null;
  created_at: string;
  updated_at: string;
}

export interface RequirementVersionBase {
  title: string;
  description: string;
  conflicts?: string | null;
  dependencies?: string | null;
  category: string;
  type: RequirementType;
  status: RequirementStatus;
  priority: number;
}

export interface RequirementCreatePayload {
  project_id: string;
  stakeholder_id: string;
  initial_version: RequirementVersionBase;
}

export interface ChangeRequest {
  id: string;
  requirement_id: string;
  stakeholder_id: string;
  base_version_id: string;
  next_version_id: string | null;
  summary: string;
  cost: string | null;
  benefit: string | null;
  status: ChangeRequestStatus;
  created_at: string;
  updated_at: string;
}

export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';

export interface ChangeRequestCreatePayload {
  requirement_id: string;
  stakeholder_id: string;
  base_version_id: string;
  summary: string;
  cost?: string | null;
  benefit?: string | null;
  status?: ChangeRequestStatus;
  proposed_changes: RequirementVersionBase;
}

export interface ChangeRequestUpdatePayload {
  summary?: string;
  cost?: string | null;
  benefit?: string | null;
  status?: ChangeRequestStatus;
}

export async function fetchProjects(): Promise<Project[]> {
  return fetchJson<Project[]>('/projects');
}

export async function updateProject(id: string, payload: ProjectUpdatePayload): Promise<Project> {
  return fetchJson<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function fetchStakeholders(projectId?: string): Promise<Stakeholder[]> {
  const query = projectId ? `?project_id=${projectId}` : '';
  return fetchJson<Stakeholder[]>(`/stakeholders${query}`);
}

export async function createStakeholder(payload: StakeholderCreatePayload): Promise<Stakeholder> {
  return fetchJson<Stakeholder>('/stakeholders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateStakeholder(id: string, payload: StakeholderUpdatePayload): Promise<Stakeholder> {
  return fetchJson<Stakeholder>(`/stakeholders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function fetchDocuments(projectId?: string): Promise<Document[]> {
  const query = projectId ? `?project_id=${projectId}` : '';
  return fetchJson<Document[]>(`/documents${query}`);
}

export async function createDocument(payload: DocumentCreatePayload): Promise<Document> {
  return fetchJson<Document>('/documents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateDocument(id: string, payload: DocumentUpdatePayload): Promise<Document> {
  return fetchJson<Document>(`/documents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function fetchIdeas(projectId?: string): Promise<Idea[]> {
  const query = projectId ? `?project_id=${projectId}` : '';
  return fetchJson<Idea[]>(`/ideas${query}`);
}

export async function createIdea(payload: IdeaCreatePayload): Promise<Idea> {
  return fetchJson<Idea>('/ideas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateIdea(id: string, payload: IdeaUpdatePayload): Promise<Idea> {
  return fetchJson<Idea>(`/ideas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function fetchRequirements(projectId?: string): Promise<Requirement[]> {
  const query = projectId ? `?project_id=${projectId}` : '';
  return fetchJson<Requirement[]>(`/requirements${query}`);
}

export async function fetchRequirement(requirementId: string): Promise<Requirement> {
  return fetchJson<Requirement>(`/requirements/${requirementId}`);
}

export async function fetchRequirementVersions(requirementId: string): Promise<RequirementVersion[]> {
  return fetchJson<RequirementVersion[]>(`/requirements/${requirementId}/versions`);
}

export async function createRequirement(payload: RequirementCreatePayload): Promise<Requirement> {
  return fetchJson<Requirement>('/requirements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createRequirementVersion(
  requirementId: string,
  stakeholderId: string,
  payload: RequirementVersionBase,
): Promise<RequirementVersion> {
  return fetchJson<RequirementVersion>(`/requirements/${requirementId}/versions`, {
    method: 'POST',
    body: JSON.stringify({
      stakeholder_id: stakeholderId,
      version: payload,
    }),
  });
}

export async function fetchChangeRequests(requirementId?: string): Promise<ChangeRequest[]> {
  const query = requirementId ? `?requirement_id=${requirementId}` : '';
  return fetchJson<ChangeRequest[]>(`/change-requests${query}`);
}

export async function createChangeRequest(payload: ChangeRequestCreatePayload): Promise<ChangeRequest> {
  return fetchJson<ChangeRequest>('/change-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateChangeRequest(id: string, payload: ChangeRequestUpdatePayload): Promise<ChangeRequest> {
  return fetchJson<ChangeRequest>(`/change-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function generateIdeasFromText(text: string): Promise<Idea[]> {
  return fetchJson<Idea[]>('/ai/generate-ideas', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function generateRequirementsFromIdeas(ideaIds: string[]): Promise<Requirement[]> {
  return fetchJson<Requirement[]>('/ai/generate-requirements', {
    method: 'POST',
    body: JSON.stringify({ idea_ids: ideaIds }),
  });
}

export async function generateChangeRequest(
  changeRequestId: string,
  nextVersionId: string,
): Promise<{ message: string; id: string }> {
  return fetchJson<{ message: string; id: string }>(`/change-requests/${changeRequestId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ next_version_id: nextVersionId }),
  });
}

export async function rejectChangeRequest(changeRequestId: string): Promise<{ message: string; id: string }> {
  return fetchJson<{ message: string; id: string }>(`/change-requests/${changeRequestId}/reject`, {
    method: 'POST',
  });
}

export { ApiError, API_BASE_URL };
