import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Search, ArrowLeft, FileText, Lightbulb, ListChecks, GitPullRequest, Users, Sparkles } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { useData } from '../utils/DataContext';

interface SearchResult {
  type: 'document' | 'idea' | 'requirement' | 'changeRequest' | 'teamMember';
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

export function SmartSearch({ open, onOpenChange }: SmartSearchProps) {
  const { documents, ideas, requirements, changeRequests, teamMembers, aiSearch } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiAnswer, setAIAnswer] = useState<string | null>(null);
  const [aiError, setAIError] = useState<string | null>(null);
  const [isAISearching, setIsAISearching] = useState(false);

  const allData = {
    documents: documents,
    ideas: ideas,
    requirements: requirements.map(req => ({
      id: req.id,
      title: req.versions.find(v => v.isCurrent)?.title || req.versions[0]?.title || '',
      description: req.versions.find(v => v.isCurrent)?.description || req.versions[0]?.description || '',
      stakeholder: req.stakeholder,
      category: req.category,
      status: req.status
    })),
    changeRequests: changeRequests,
    teamMembers: teamMembers
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    setAIAnswer(null);
    setAIError(null);

    const query = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    allData.documents.forEach(doc => {
      const titleMatch = doc.title.toLowerCase().includes(query);
      const textMatch = doc.text.toLowerCase().includes(query);
      const ownerMatch = doc.owner.toLowerCase().includes(query);

      if (titleMatch || textMatch || ownerMatch) {
        searchResults.push({
          type: 'document',
          id: doc.id,
          title: doc.title,
          description: doc.text,
          metadata: `${doc.type} • Owner: ${doc.owner}`,
          relevance: titleMatch ? 3 : textMatch ? 2 : 1
        });
      }
    });

    allData.ideas.forEach(idea => {
      const titleMatch = idea.title.toLowerCase().includes(query);
      const descMatch = idea.description.toLowerCase().includes(query);
      const stakeholderMatch = idea.stakeholder.toLowerCase().includes(query);

      if (titleMatch || descMatch || stakeholderMatch) {
        searchResults.push({
          type: 'idea',
          id: idea.id,
          title: idea.title,
          description: idea.description,
          metadata: `${idea.category} • ${idea.status} • ${idea.priority} Priority`,
          relevance: titleMatch ? 3 : descMatch ? 2 : 1
        });
      }
    });

    allData.requirements.forEach(req => {
      const titleMatch = req.title.toLowerCase().includes(query);
      const descMatch = req.description.toLowerCase().includes(query);
      const stakeholderMatch = req.stakeholder.toLowerCase().includes(query);

      if (titleMatch || descMatch || stakeholderMatch) {
        searchResults.push({
          type: 'requirement',
          id: req.id,
          title: req.title,
          description: req.description,
          metadata: `${req.category} • ${req.status} • Stakeholder: ${req.stakeholder}`,
          relevance: titleMatch ? 3 : descMatch ? 2 : 1
        });
      }
    });

    allData.changeRequests.forEach(cr => {
      const summaryMatch = cr.summary.toLowerCase().includes(query);
      const stakeholderMatch = cr.stakeholder.toLowerCase().includes(query);

      if (summaryMatch || stakeholderMatch) {
        searchResults.push({
          type: 'changeRequest',
          id: cr.id,
          title: cr.id,
          description: cr.summary,
          metadata: `${cr.requirementId} • ${cr.status} • Stakeholder: ${cr.stakeholder}`,
          relevance: summaryMatch ? 2 : 1
        });
      }
    });

    allData.teamMembers.forEach(member => {
      const nameMatch = member.fullName.toLowerCase().includes(query);
      const emailMatch = member.email.toLowerCase().includes(query);
      const roleMatch = member.role.toLowerCase().includes(query);

      if (nameMatch || emailMatch || roleMatch) {
        searchResults.push({
          type: 'teamMember',
          id: member.id,
          title: member.fullName,
          description: member.email,
          metadata: member.role,
          relevance: nameMatch ? 3 : emailMatch ? 2 : 1
        });
      }
    });

    searchResults.sort((a, b) => b.relevance - a.relevance);

    setResults(searchResults);
    setIsSearching(false);
    setHasSearched(true);

    setIsAISearching(true);
    try {
      const response = await aiSearch(searchQuery);
      setAIAnswer(response);
    } catch (error) {
      console.error('Error fetching AI search insights:', error);
      setAIError(error instanceof Error ? error.message : 'Unable to retrieve AI insights.');
    } finally {
      setIsAISearching(false);
    }
  };

  const handleBack = () => {
    setHasSearched(false);
    setResults([]);
    setSearchQuery('');
    setIsSearching(false);
    setAIAnswer(null);
    setAIError(null);
    setIsAISearching(false);
  };

  const handleClose = () => {
    setHasSearched(false);
    setResults([]);
    setSearchQuery('');
    setIsSearching(false);
    setAIAnswer(null);
    setAIError(null);
    setIsAISearching(false);
    onOpenChange(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'idea':
        return <Lightbulb className="w-4 h-4" />;
      case 'requirement':
        return <ListChecks className="w-4 h-4" />;
      case 'changeRequest':
        return <GitPullRequest className="w-4 h-4" />;
      case 'teamMember':
        return <Users className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      document: 'bg-blue-100 text-blue-800',
      idea: 'bg-purple-100 text-purple-800',
      requirement: 'bg-green-100 text-green-800',
      changeRequest: 'bg-orange-100 text-orange-800',
      teamMember: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      document: 'Document',
      idea: 'Idea',
      requirement: 'Requirement',
      changeRequest: 'Change Request',
      teamMember: 'Team Member'
    };
    return labels[type] || type;
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Smart Search</DialogTitle>
          <DialogDescription>
            Search across all documents, ideas, requirements, change requests, and team members
          </DialogDescription>
        </DialogHeader>

        {!hasSearched ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter your search query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    void performSearch();
                  }
                }}
                disabled={isSearching}
                className="flex-1"
              />
              <Button
                onClick={() => void performSearch()}
                disabled={!searchQuery.trim() || isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {isSearching && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Searching across all system data...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  New Search
                </Button>
                <span className="text-gray-600">|</span>
                <span className="text-gray-600">
                  Found {results.length} result{results.length !== 1 ? 's' : ''} for "{searchQuery}"
                </span>
              </div>
            </div>

            <Card className="border-blue-100 bg-blue-50/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Sparkles className="w-4 h-4" />
                  AI Insight
                </CardTitle>
                <CardDescription>Natural language answer generated from project context</CardDescription>
              </CardHeader>
              <CardContent>
                {isAISearching ? (
                  <div className="flex items-center gap-2 text-blue-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing query with AI...</span>
                  </div>
                ) : aiError ? (
                  <p className="text-red-600 text-sm">{aiError}</p>
                ) : aiAnswer ? (
                  <p className="whitespace-pre-line text-gray-700">{aiAnswer}</p>
                ) : (
                  <p className="text-gray-500 text-sm">No AI insights available for this query yet.</p>
                )}
              </CardContent>
            </Card>

            <ScrollArea className="h-[500px]">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Search className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-600">No results found</p>
                  <p className="text-gray-500 text-sm">Try adjusting your search terms</p>
                </div>
              ) : (
                <div className="space-y-6 pr-4">
                  {Object.entries(groupedResults).map(([type, items]) => (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-3">
                        {getTypeIcon(type)}
                        <h3 className="text-gray-900">{getTypeLabel(type)}s</h3>
                        <Badge variant="outline">{items.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {items.map((result) => (
                          <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CardTitle className="text-gray-900">{result.title}</CardTitle>
                                    <Badge className={getTypeBadgeColor(result.type)}>
                                      {result.id}
                                    </Badge>
                                  </div>
                                  <CardDescription>{result.metadata}</CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-600 line-clamp-2">{result.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
