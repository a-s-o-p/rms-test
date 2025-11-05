const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions extends RequestInit {
  method?: HttpMethod;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      if (body?.detail) {
        message = Array.isArray(body.detail)
          ? body.detail.map((entry: { msg?: string }) => entry.msg).join(', ')
          : body.detail;
      }
    } catch (error) {
      // ignore JSON parsing errors and fall back to status text
    }
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) {
    // @ts-expect-error intentionally returning undefined for no-content responses
    return undefined;
  }

  return response.json();
}

export interface ProjectResponse {
  id: string;
  key: string;
  title: string;
  project_status: string;
  created_at: string;
  updated_at: string;
}

export interface StakeholderResponse {
  id: string;
  project_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentResponse {
  id: string;
  project_id: string;
  stakeholder_id: string | null;
  type: string;
  title: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface IdeaResponse {
  id: string;
  project_id: string;
  stakeholder_id: string;
  title: string;
  description: string;
  conflicts: string | null;
  dependencies: string | null;
  category: string;
  status: string;
  priority: string;
  impact: number | null;
  confidence: number | null;
  effort: number | null;
  ice_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface RequirementVersionResponse {
  id: string;
  requirement_id: string;
  stakeholder_id: string;
  version_number: number;
  title: string;
  description: string;
  conflicts: string | null;
  dependencies: string | null;
  category: string;
  type: string;
  status: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface RequirementResponse {
  id: string;
  project_id: string;
  current_version_id: string | null;
  current_version: RequirementVersionResponse | null;
  created_at: string;
  updated_at: string;
}

export interface ChangeRequestResponse {
  id: string;
  requirement_id: string;
  stakeholder_id: string;
  base_version_id: string;
  next_version_id: string | null;
  cost: string | null;
  benefit: string | null;
  summary: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const api = {
  projects: {
    list: () => request<ProjectResponse[]>('/projects'),
    update: (id: string, payload: Partial<{ key: string; title: string; project_status: string }>) =>
      request<ProjectResponse>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
  },
  stakeholders: {
    list: (projectId?: string) => {
      const query = projectId ? `?project_id=${projectId}` : '';
      return request<StakeholderResponse[]>(`/stakeholders${query}`);
    },
    create: (payload: { project_id: string; name: string; email: string; role: string }) =>
      request<StakeholderResponse>('/stakeholders', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    update: (id: string, payload: Partial<{ name: string; email: string; role: string }>) =>
      request<StakeholderResponse>(`/stakeholders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
    remove: (id: string) =>
      request<void>(`/stakeholders/${id}`, { method: 'DELETE' })
  },
  documents: {
    list: (projectId?: string) => {
      const query = projectId ? `?project_id=${projectId}` : '';
      return request<DocumentResponse[]>(`/documents${query}`);
    },
    create: (payload: {
      project_id: string;
      stakeholder_id?: string | null;
      type: string;
      title: string;
      text: string;
    }) =>
      request<DocumentResponse>('/documents', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          stakeholder_id: payload.stakeholder_id ?? null
        })
      }),
    update: (id: string, payload: Partial<{ stakeholder_id: string | null; type: string; title: string; text: string }>) =>
      request<DocumentResponse>(`/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
    remove: (id: string) => request<void>(`/documents/${id}`, { method: 'DELETE' })
  },
  ideas: {
    list: (projectId?: string) => {
      const query = projectId ? `?project_id=${projectId}` : '';
      return request<IdeaResponse[]>(`/ideas${query}`);
    },
    create: (payload: {
      project_id: string;
      stakeholder_id: string;
      title: string;
      description: string;
      conflicts?: string | null;
      dependencies?: string | null;
      category: string;
      status: string;
      priority: string;
      impact?: number | null;
      confidence?: number | null;
      effort?: number | null;
    }) =>
      request<IdeaResponse>('/ideas', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          conflicts: payload.conflicts ?? null,
          dependencies: payload.dependencies ?? null,
          impact: payload.impact ?? null,
          confidence: payload.confidence ?? null,
          effort: payload.effort ?? null
        })
      }),
    update: (id: string, payload: Partial<IdeaResponse>) =>
      request<IdeaResponse>(`/ideas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
    remove: (id: string) => request<void>(`/ideas/${id}`, { method: 'DELETE' })
  },
  requirements: {
    list: (projectId?: string) => {
      const query = projectId ? `?project_id=${projectId}` : '';
      return request<RequirementResponse[]>(`/requirements${query}`);
    },
    versions: (requirementId: string) =>
      request<RequirementVersionResponse[]>(`/requirements/${requirementId}/versions`),
    createVersion: (requirementId: string, payload: {
      stakeholder_id: string;
      title: string;
      description: string;
      conflicts?: string | null;
      dependencies?: string | null;
      category: string;
      type: string;
      status: string;
      priority: number;
    }) =>
      request<RequirementVersionResponse>(`/requirements/${requirementId}/versions`, {
        method: 'POST',
        body: JSON.stringify({
          stakeholder_id: payload.stakeholder_id,
          title: payload.title,
          description: payload.description,
          conflicts: payload.conflicts ?? null,
          dependencies: payload.dependencies ?? null,
          category: payload.category,
          type: payload.type,
          status: payload.status,
          priority: payload.priority
        })
      }),
    remove: (requirementId: string) =>
      request<void>(`/requirements/${requirementId}`, { method: 'DELETE' })
  },
  changeRequests: {
    list: (requirementId?: string) => {
      const query = requirementId ? `?requirement_id=${requirementId}` : '';
      return request<ChangeRequestResponse[]>(`/change-requests${query}`);
    },
    create: (payload: {
      requirement_id: string;
      stakeholder_id: string;
      base_version_id: string;
      summary: string;
      cost?: string | null;
      benefit?: string | null;
      status?: string;
      proposed_changes: {
        title: string;
        description: string;
        conflicts?: string | null;
        dependencies?: string | null;
        category: string;
        type: string;
        status: string;
        priority: number;
      };
    }) =>
      request<ChangeRequestResponse>('/change-requests', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          cost: payload.cost ?? null,
          benefit: payload.benefit ?? null,
          status: payload.status ?? undefined,
          proposed_changes: {
            title: payload.proposed_changes.title,
            description: payload.proposed_changes.description,
            conflicts: payload.proposed_changes.conflicts ?? null,
            dependencies: payload.proposed_changes.dependencies ?? null,
            category: payload.proposed_changes.category,
            type: payload.proposed_changes.type,
            status: payload.proposed_changes.status,
            priority: payload.proposed_changes.priority
          }
        })
      }),
    update: (id: string, payload: Partial<{ cost: string | null; benefit: string | null; summary: string; status: string }>) =>
      request<ChangeRequestResponse>(`/change-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
    remove: (id: string) => request<void>(`/change-requests/${id}`, { method: 'DELETE' })
  }
};

export function formatEnumValue(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

