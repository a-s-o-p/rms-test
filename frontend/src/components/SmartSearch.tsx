import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Search, ArrowLeft, FileText, Lightbulb, ListChecks, GitPullRequest, Users } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { useRmsData } from '../lib/rms-data';

type SearchResultType = 'document' | 'idea' | 'requirement' | 'changeRequest' | 'stakeholder';

interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  description: string;
  metadata: string;
  relevance: number;
}

interface SmartSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons: Record<SearchResultType, JSX.Element> = {
  document: <FileText className="w-4 h-4" />,
  idea: <Lightbulb className="w-4 h-4" />,
  requirement: <ListChecks className="w-4 h-4" />,
  changeRequest: <GitPullRequest className="w-4 h-4" />,
  stakeholder: <Users className="w-4 h-4" />,
};

export function SmartSearch({ open, onOpenChange }: SmartSearchProps) {
  const { documents, ideas, requirements, changeRequests, stakeholders, requirementVersions, loading } = useRmsData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const dataset = useMemo(() => {
    const requirementLookup = requirements.reduce<Record<string, string>>((map, requirement) => {
      map[requirement.id] = requirement.current_version?.title ?? 'Requirement';
      return map;
    }, {});

    return {
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        text: doc.text,
        owner: doc.stakeholder_id ? stakeholders.find((s) => s.id === doc.stakeholder_id)?.name ?? 'Unassigned' : 'Unassigned',
        type: doc.type,
      })),
      ideas: ideas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        stakeholder: stakeholders.find((s) => s.id === idea.stakeholder_id)?.name ?? 'Unknown',
        category: idea.category,
        status: idea.status,
        priority: idea.priority,
      })),
      requirements: requirements.map((requirement) => ({
        id: requirement.id,
        title: requirement.current_version?.title ?? 'Requirement',
        description: requirement.current_version?.description ?? '',
        stakeholder: requirement.current_version
          ? stakeholders.find((s) => s.id === requirement.current_version?.stakeholder_id)?.name ?? 'Unknown'
          : 'Unknown',
        category: requirement.current_version?.category ?? '',
        status: requirement.current_version?.status ?? 'DRAFT',
      })),
      changeRequests: changeRequests.map((cr) => ({
        id: cr.id,
        requirement: requirementLookup[cr.requirement_id] ?? 'Requirement',
        summary: cr.summary,
        stakeholder: stakeholders.find((s) => s.id === cr.stakeholder_id)?.name ?? 'Unknown',
        status: cr.status,
      })),
      stakeholders: stakeholders.map((stakeholder) => ({
        id: stakeholder.id,
        name: stakeholder.name,
        email: stakeholder.email,
        role: stakeholder.role,
      })),
    };
  }, [changeRequests, documents, ideas, requirementVersions, requirements, stakeholders]);

  const performSearch = () => {
    setIsSearching(true);
    setHasSearched(false);

    setTimeout(() => {
      const query = searchQuery.toLowerCase().trim();
      const searchResults: SearchResult[] = [];

      if (!query) {
        setResults([]);
        setIsSearching(false);
        setHasSearched(true);
        return;
      }

      dataset.documents.forEach((doc) => {
        const titleMatch = doc.title.toLowerCase().includes(query);
        const textMatch = doc.text.toLowerCase().includes(query);
        const ownerMatch = doc.owner.toLowerCase().includes(query);
        if (titleMatch || textMatch || ownerMatch) {
          searchResults.push({
            type: 'document',
            id: doc.id,
            title: doc.title,
            description: doc.text.slice(0, 240),
            metadata: `${doc.type} • Owner: ${doc.owner}`,
            relevance: titleMatch ? 3 : textMatch ? 2 : 1,
          });
        }
      });

      dataset.ideas.forEach((idea) => {
        const titleMatch = idea.title.toLowerCase().includes(query);
        const descMatch = idea.description.toLowerCase().includes(query);
        const stakeholderMatch = idea.stakeholder.toLowerCase().includes(query);
        if (titleMatch || descMatch || stakeholderMatch) {
          searchResults.push({
            type: 'idea',
            id: idea.id,
            title: idea.title,
            description: idea.description.slice(0, 240),
            metadata: `${idea.category} • ${idea.status} • ${idea.priority}`,
            relevance: titleMatch ? 3 : descMatch ? 2 : 1,
          });
        }
      });

      dataset.requirements.forEach((requirement) => {
        const titleMatch = requirement.title.toLowerCase().includes(query);
        const descMatch = requirement.description.toLowerCase().includes(query);
        const stakeholderMatch = requirement.stakeholder.toLowerCase().includes(query);
        if (titleMatch || descMatch || stakeholderMatch) {
          searchResults.push({
            type: 'requirement',
            id: requirement.id,
            title: requirement.title,
            description: requirement.description.slice(0, 240),
            metadata: `${requirement.category} • ${requirement.status}`,
            relevance: titleMatch ? 3 : descMatch ? 2 : 1,
          });
        }
      });

      dataset.changeRequests.forEach((cr) => {
        const summaryMatch = cr.summary.toLowerCase().includes(query);
        const stakeholderMatch = cr.stakeholder.toLowerCase().includes(query);
        const requirementMatch = cr.requirement.toLowerCase().includes(query);
        if (summaryMatch || stakeholderMatch || requirementMatch) {
          searchResults.push({
            type: 'changeRequest',
            id: cr.id,
            title: cr.requirement,
            description: cr.summary.slice(0, 240),
            metadata: `${cr.status} • ${cr.stakeholder}`,
            relevance: summaryMatch ? 3 : stakeholderMatch ? 2 : 1,
          });
        }
      });

      dataset.stakeholders.forEach((stakeholder) => {
        const nameMatch = stakeholder.name.toLowerCase().includes(query);
        const emailMatch = stakeholder.email.toLowerCase().includes(query);
        const roleMatch = stakeholder.role.toLowerCase().includes(query);
        if (nameMatch || emailMatch || roleMatch) {
          searchResults.push({
            type: 'stakeholder',
            id: stakeholder.id,
            title: stakeholder.name,
            description: stakeholder.email,
            metadata: stakeholder.role,
            relevance: nameMatch ? 3 : emailMatch ? 2 : 1,
          });
        }
      });

      searchResults.sort((a, b) => b.relevance - a.relevance);
      setResults(searchResults);
      setIsSearching(false);
      setHasSearched(true);
    }, 200);
  };

  const resetState = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
    setIsSearching(false);
  };

  return (
    <Dialog open={open} onOpenChange={(openState) => {
      if (!openState) {
        resetState();
      }
      onOpenChange(openState);
    }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Smart Search</DialogTitle>
          <DialogDescription>Search across documents, ideas, requirements, change requests, and team members.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Input
              className="pl-10"
              placeholder="Search the workspace..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  performSearch();
                }
              }}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={performSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Search
            </Button>
            <Button variant="ghost" size="sm" onClick={resetState}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
          <ScrollArea className="max-h-[24rem]">
            <div className="space-y-3">
              {!loading && results.length === 0 && hasSearched && (
                <Card className="border border-dashed">
                  <CardContent className="py-10 text-center text-gray-500">No results found. Try refining your query.</CardContent>
                </Card>
              )}
              {!hasSearched && !isSearching && (
                <Card className="border border-dashed">
                  <CardContent className="py-10 text-center text-gray-500">
                    Enter a keyword to search across the workspace.
                  </CardContent>
                </Card>
              )}
              {results.map((result) => (
                <Card key={`${result.type}-${result.id}`} className="border border-gray-200">
                  <CardHeader className="flex items-center gap-3 pb-2">
                    <div className="flex items-center gap-2 text-gray-500">
                      {typeIcons[result.type]}
                      <span className="text-xs uppercase font-semibold">{result.type}</span>
                    </div>
                    <CardTitle className="text-base text-gray-900">{result.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm text-gray-600 whitespace-pre-wrap mb-2">
                      {result.description}
                    </CardDescription>
                    <Badge variant="outline">{result.metadata}</Badge>
                  </CardContent>
                </Card>
              ))}
              {isSearching && (
                <Card>
                  <CardContent className="py-10 flex flex-col items-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    Searching across workspace...
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
