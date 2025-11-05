import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Search } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import {
  api,
  DocumentResponse,
  IdeaResponse,
  RequirementResponse,
  RequirementVersionResponse,
  ChangeRequestResponse,
  StakeholderResponse,
  formatEnumValue
} from '../lib/api';

interface SmartSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
}

interface SearchResult {
  type: 'Document' | 'Idea' | 'Requirement' | 'Change Request' | 'Stakeholder';
  title: string;
  description: string;
  metadata: string;
}

export function SmartSearch({ open, onOpenChange, projectId }: SmartSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [ideas, setIdeas] = useState<IdeaResponse[]>([]);
  const [requirements, setRequirements] = useState<RequirementResponse[]>([]);
  const [versions, setVersions] = useState<Record<string, RequirementVersionResponse>>({});
  const [changeRequests, setChangeRequests] = useState<ChangeRequestResponse[]>([]);
  const [stakeholders, setStakeholders] = useState<StakeholderResponse[]>([]);

  useEffect(() => {
    if (!projectId) {
      setDocuments([]);
      setIdeas([]);
      setRequirements([]);
      setVersions({});
      setChangeRequests([]);
      setStakeholders([]);
      return;
    }

    let isMounted = true;
    setLoadingData(true);

    Promise.all([
      api.documents.list(projectId),
      api.ideas.list(projectId),
      api.requirements.list(projectId),
      api.changeRequests.list(),
      api.stakeholders.list(projectId)
    ])
      .then(async ([docData, ideaData, requirementData, changeRequestData, stakeholderData]) => {
        if (!isMounted) return;
        setDocuments(docData);
        setIdeas(ideaData);
        setRequirements(requirementData);
        setStakeholders(stakeholderData);

        const requirementIds = new Set(requirementData.map((req) => req.id));
        setChangeRequests(changeRequestData.filter((cr) => requirementIds.has(cr.requirement_id)));

        const versionEntries: [string, RequirementVersionResponse][] = [];
        await Promise.all(
          requirementData.map(async (req) => {
            const reqVersions = await api.requirements.versions(req.id);
            reqVersions.forEach((version) => {
              versionEntries.push([version.id, version]);
            });
          })
        );
        if (!isMounted) return;
        setVersions(Object.fromEntries(versionEntries));
      })
      .finally(() => {
        if (isMounted) {
          setLoadingData(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, open]);

  const stakeholderMap = useMemo(() => {
    const map = new Map<string, StakeholderResponse>();
    stakeholders.forEach((stakeholder) => map.set(stakeholder.id, stakeholder));
    return map;
  }, [stakeholders]);

  const requirementMap = useMemo(() => {
    const map = new Map<string, RequirementResponse>();
    requirements.forEach((req) => map.set(req.id, req));
    return map;
  }, [requirements]);

  const performSearch = () => {
    if (!projectId) {
      setResults([]);
      setHasSearched(true);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    const query = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    documents.forEach((doc) => {
      const text = `${doc.title} ${doc.text}`.toLowerCase();
      if (text.includes(query)) {
        searchResults.push({
          type: 'Document',
          title: doc.title,
          description: doc.text.slice(0, 200),
          metadata: `${doc.type} • ${doc.stakeholder_id ? stakeholderMap.get(doc.stakeholder_id)?.name ?? 'Unassigned' : 'Unassigned'}`
        });
      }
    });

    ideas.forEach((idea) => {
      const text = `${idea.title} ${idea.description} ${idea.conflicts ?? ''} ${idea.dependencies ?? ''}`.toLowerCase();
      if (text.includes(query)) {
        searchResults.push({
          type: 'Idea',
          title: idea.title,
          description: idea.description.slice(0, 200),
          metadata: `${formatEnumValue(idea.status)} • ${stakeholderMap.get(idea.stakeholder_id)?.name ?? 'Unknown'} • ${formatEnumValue(idea.priority)} priority`
        });
      }
    });

    requirements.forEach((req) => {
      const version = req.current_version;
      if (!version) return;
      const text = `${version.title} ${version.description} ${version.conflicts ?? ''} ${version.dependencies ?? ''}`.toLowerCase();
      if (text.includes(query)) {
        searchResults.push({
          type: 'Requirement',
          title: version.title,
          description: version.description.slice(0, 200),
          metadata: `${formatEnumValue(version.status)} • ${stakeholderMap.get(version.stakeholder_id)?.name ?? 'Unknown'}`
        });
      }
    });

    changeRequests.forEach((cr) => {
      const text = `${cr.summary} ${cr.cost ?? ''} ${cr.benefit ?? ''}`.toLowerCase();
      if (text.includes(query)) {
        const requirementTitle = requirementMap.get(cr.requirement_id)?.current_version?.title ?? 'Requirement';
        searchResults.push({
          type: 'Change Request',
          title: requirementTitle,
          description: cr.summary.slice(0, 200),
          metadata: `${formatEnumValue(cr.status)} • Stakeholder: ${stakeholderMap.get(cr.stakeholder_id)?.name ?? 'Unknown'}`
        });
      }
    });

    stakeholders.forEach((stakeholder) => {
      const text = `${stakeholder.name} ${stakeholder.email} ${stakeholder.role}`.toLowerCase();
      if (text.includes(query)) {
        searchResults.push({
          type: 'Stakeholder',
          title: stakeholder.name,
          description: stakeholder.role,
          metadata: stakeholder.email
        });
      }
    });

    setResults(searchResults);
    setIsSearching(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Smart Search</DialogTitle>
          <DialogDescription>Search across documents, ideas, requirements, and more.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={projectId ? 'Search keywords, stakeholders, or requirement IDs' : 'Select a project to search'}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!projectId || loadingData}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={performSearch} disabled={!projectId || !searchQuery.trim() || loadingData}>
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}Search
            </Button>
          </div>

          {!projectId && <p className="text-sm text-gray-600">Select a project to enable search.</p>}
          {projectId && loadingData && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" /> Preparing data…
            </div>
          )}

          {projectId && hasSearched && !isSearching && (
            <div>
              <h3 className="text-gray-900 mb-3">Results</h3>
              {results.length ? (
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {results.map((result, index) => (
                      <Card key={`${result.type}-${index}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Badge variant="outline">{result.type}</Badge>
                            {result.title}
                          </CardTitle>
                          <CardDescription>{result.metadata}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-gray-500">No results found for “{searchQuery}”.</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

