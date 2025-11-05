import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  ChangeRequest,
  ChangeRequestCreatePayload,
  ChangeRequestUpdatePayload,
  Document,
  DocumentCreatePayload,
  DocumentUpdatePayload,
  Idea,
  IdeaCreatePayload,
  IdeaUpdatePayload,
  Project,
  ProjectUpdatePayload,
  Requirement,
  RequirementCreatePayload,
  RequirementVersion,
  RequirementVersionBase,
  Stakeholder,
  StakeholderCreatePayload,
  StakeholderUpdatePayload,
  fetchChangeRequests,
  fetchDocuments,
  fetchIdeas,
  fetchProjects,
  fetchRequirement,
  fetchRequirementVersions,
  fetchRequirements,
  fetchStakeholders,
  updateProject,
  createStakeholder as apiCreateStakeholder,
  updateStakeholder as apiUpdateStakeholder,
  createDocument as apiCreateDocument,
  updateDocument as apiUpdateDocument,
  createIdea as apiCreateIdea,
  updateIdea as apiUpdateIdea,
  createRequirement as apiCreateRequirement,
  createRequirementVersion as apiCreateRequirementVersion,
  createChangeRequest as apiCreateChangeRequest,
  updateChangeRequest as apiUpdateChangeRequest,
  generateIdeasFromText,
  generateRequirementsFromIdeas,
} from './api';

interface RmsDataContextValue {
  loading: boolean;
  error: string | null;
  projects: Project[];
  activeProject: Project | null;
  updateProject: (id: string, payload: ProjectUpdatePayload) => Promise<Project>;
  stakeholders: Stakeholder[];
  documents: Document[];
  ideas: Idea[];
  requirements: Requirement[];
  requirementVersions: Record<string, RequirementVersion[]>;
  changeRequests: ChangeRequest[];
  refreshAll: () => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  createStakeholder: (payload: StakeholderCreatePayload) => Promise<Stakeholder>;
  updateStakeholder: (id: string, payload: StakeholderUpdatePayload) => Promise<Stakeholder>;
  createDocument: (payload: DocumentCreatePayload) => Promise<Document>;
  updateDocument: (id: string, payload: DocumentUpdatePayload) => Promise<Document>;
  createIdea: (payload: IdeaCreatePayload) => Promise<Idea>;
  updateIdea: (id: string, payload: IdeaUpdatePayload) => Promise<Idea>;
  generateIdeas: (text: string) => Promise<Idea[]>;
  createRequirement: (payload: RequirementCreatePayload) => Promise<Requirement>;
  createRequirementVersion: (
    requirementId: string,
    stakeholderId: string,
    payload: RequirementVersionBase,
  ) => Promise<RequirementVersion>;
  generateRequirements: (ideaIds: string[]) => Promise<Requirement[]>;
  createChangeRequest: (payload: ChangeRequestCreatePayload) => Promise<ChangeRequest>;
  updateChangeRequest: (id: string, payload: ChangeRequestUpdatePayload) => Promise<ChangeRequest>;
}

const RmsDataContext = createContext<RmsDataContextValue | undefined>(undefined);

export function useRmsData(): RmsDataContextValue {
  const context = useContext(RmsDataContext);
  if (!context) {
    throw new Error('useRmsData must be used within a RmsDataProvider');
  }
  return context;
}

interface RmsDataProviderProps {
  children: React.ReactNode;
}

export function RmsDataProvider({ children }: RmsDataProviderProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [requirementVersions, setRequirementVersions] = useState<Record<string, RequirementVersion[]>>({});
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);

  const activeProject = useMemo(
    () => (activeProjectId ? projects.find((project) => project.id === activeProjectId) ?? null : null),
    [activeProjectId, projects],
  );

  const loadStakeholders = useCallback(async (projectId: string) => {
    const data = await fetchStakeholders(projectId);
    setStakeholders(data);
  }, []);

  const loadDocuments = useCallback(async (projectId: string) => {
    const data = await fetchDocuments(projectId);
    setDocuments(data);
  }, []);

  const loadIdeas = useCallback(async (projectId: string) => {
    const data = await fetchIdeas(projectId);
    setIdeas(data);
  }, []);

  const loadRequirements = useCallback(async (projectId: string) => {
    const data = await fetchRequirements(projectId);
    setRequirements(data);

    const versionEntries = await Promise.all(
      data.map(async (requirement) => {
        const versions = await fetchRequirementVersions(requirement.id);
        return [requirement.id, versions] as const;
      }),
    );

    setRequirementVersions(Object.fromEntries(versionEntries));
  }, []);

  const loadChangeRequests = useCallback(async () => {
    const data = await fetchChangeRequests();
    setChangeRequests(data);
  }, []);

  const loadProjectData = useCallback(
    async (projectId: string) => {
      await Promise.all([
        loadStakeholders(projectId),
        loadDocuments(projectId),
        loadIdeas(projectId),
        loadRequirements(projectId),
      ]);
      await loadChangeRequests();
    },
    [loadChangeRequests, loadDocuments, loadIdeas, loadRequirements, loadStakeholders],
  );

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const projectData = await fetchProjects();
      setProjects(projectData);

      if (projectData.length > 0) {
        const projectId = projectData[0].id;
        setActiveProjectId(projectId);
        await loadProjectData(projectId);
      } else {
        setActiveProjectId(null);
        setStakeholders([]);
        setDocuments([]);
        setIdeas([]);
        setRequirements([]);
        setRequirementVersions({});
        setChangeRequests([]);
      }

      setError(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loadProjectData]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const selectProject = useCallback(
    async (projectId: string) => {
      setActiveProjectId(projectId);
      await loadProjectData(projectId);
    },
    [loadProjectData],
  );

  const updateProjectDetails = useCallback(
    async (id: string, payload: ProjectUpdatePayload) => {
      const project = await updateProject(id, payload);
      setProjects((prev) => prev.map((item) => (item.id === id ? project : item)));
      if (activeProjectId === id) {
        await loadProjectData(id);
      }
      return project;
    },
    [activeProjectId, loadProjectData],
  );

  const createStakeholder = useCallback(
    async (payload: StakeholderCreatePayload) => {
      const stakeholder = await apiCreateStakeholder(payload);
      await loadStakeholders(payload.project_id);
      return stakeholder;
    },
    [loadStakeholders],
  );

  const updateStakeholder = useCallback(
    async (id: string, payload: StakeholderUpdatePayload) => {
      if (!activeProjectId) {
        throw new Error('No active project');
      }
      const stakeholder = await apiUpdateStakeholder(id, payload);
      await loadStakeholders(activeProjectId);
      return stakeholder;
    },
    [activeProjectId, loadStakeholders],
  );

  const createDocument = useCallback(
    async (payload: DocumentCreatePayload) => {
      const document = await apiCreateDocument(payload);
      await loadDocuments(payload.project_id);
      return document;
    },
    [loadDocuments],
  );

  const updateDocument = useCallback(
    async (id: string, payload: DocumentUpdatePayload) => {
      if (!activeProjectId) {
        throw new Error('No active project');
      }
      const document = await apiUpdateDocument(id, payload);
      await loadDocuments(activeProjectId);
      return document;
    },
    [activeProjectId, loadDocuments],
  );

  const createIdea = useCallback(
    async (payload: IdeaCreatePayload) => {
      const idea = await apiCreateIdea(payload);
      await loadIdeas(payload.project_id);
      return idea;
    },
    [loadIdeas],
  );

  const updateIdea = useCallback(
    async (id: string, payload: IdeaUpdatePayload) => {
      if (!activeProjectId) {
        throw new Error('No active project');
      }
      const idea = await apiUpdateIdea(id, payload);
      await loadIdeas(activeProjectId);
      return idea;
    },
    [activeProjectId, loadIdeas],
  );

  const generateIdeas = useCallback(
    async (text: string) => {
      if (!activeProjectId) {
        throw new Error('No active project');
      }
      const ideas = await generateIdeasFromText(text);
      await loadIdeas(activeProjectId);
      return ideas;
    },
    [activeProjectId, loadIdeas],
  );

  const createRequirement = useCallback(
    async (payload: RequirementCreatePayload) => {
      const requirement = await apiCreateRequirement(payload);
      await loadRequirements(payload.project_id);
      return requirement;
    },
    [loadRequirements],
  );

  const refreshRequirement = useCallback(
    async (requirementId: string) => {
      const requirement = await fetchRequirement(requirementId);
      setRequirements((prev) => prev.map((item) => (item.id === requirement.id ? requirement : item)));
      const versions = await fetchRequirementVersions(requirementId);
      setRequirementVersions((prev) => ({
        ...prev,
        [requirementId]: versions,
      }));
    },
    [],
  );

  const createRequirementVersion = useCallback(
    async (requirementId: string, stakeholderId: string, payload: RequirementVersionBase) => {
      const version = await apiCreateRequirementVersion(requirementId, stakeholderId, payload);
      await refreshRequirement(requirementId);
      return version;
    },
    [refreshRequirement],
  );

  const generateRequirements = useCallback(
    async (ideaIds: string[]) => {
      if (!activeProjectId) {
        throw new Error('No active project');
      }
      const requirements = await generateRequirementsFromIdeas(ideaIds);
      await loadRequirements(activeProjectId);
      return requirements;
    },
    [activeProjectId, loadRequirements],
  );

  const createChangeRequest = useCallback(
    async (payload: ChangeRequestCreatePayload) => {
      const changeRequest = await apiCreateChangeRequest(payload);
      await loadChangeRequests();
      return changeRequest;
    },
    [loadChangeRequests],
  );

  const updateChangeRequest = useCallback(
    async (id: string, payload: ChangeRequestUpdatePayload) => {
      const changeRequest = await apiUpdateChangeRequest(id, payload);
      await loadChangeRequests();
      return changeRequest;
    },
    [loadChangeRequests],
  );

  const value = useMemo<RmsDataContextValue>(
    () => ({
      loading,
      error,
      projects,
      activeProject,
      stakeholders,
      documents,
      ideas,
      requirements,
      requirementVersions,
      changeRequests,
      refreshAll,
      selectProject,
      updateProject: updateProjectDetails,
      createStakeholder,
      updateStakeholder,
      createDocument,
      updateDocument,
      createIdea,
      updateIdea,
      generateIdeas,
      createRequirement,
      createRequirementVersion,
      generateRequirements,
      createChangeRequest,
      updateChangeRequest,
    }),
    [
      activeProject,
      changeRequests,
      createChangeRequest,
      createDocument,
      createIdea,
      createRequirement,
      createRequirementVersion,
      updateProjectDetails,
      createStakeholder,
      documents,
      error,
      generateIdeas,
      generateRequirements,
      ideas,
      loading,
      projects,
      refreshAll,
      requirementVersions,
      requirements,
      selectProject,
      stakeholders,
      updateChangeRequest,
      updateDocument,
      updateIdea,
      updateStakeholder,
    ],
  );

  return <RmsDataContext.Provider value={value}>{children}</RmsDataContext.Provider>;
}
