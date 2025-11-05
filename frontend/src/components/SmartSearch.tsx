import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Search, ArrowLeft, FileText, Lightbulb, ListChecks, GitPullRequest, Users } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  // Mock data - in real app, this would come from your state management or API
  const allData = {
    documents: [
      {
        id: 'DOC-001',
        title: 'System Architecture Overview',
        text: 'This document outlines the high-level architecture of the e-commerce platform, including microservices structure, database design, and integration patterns.',
        owner: 'Sarah Chen',
        type: 'System Architecture'
      },
      {
        id: 'DOC-002',
        title: 'API Glossary',
        text: 'Comprehensive glossary of all API endpoints, parameters, and response formats used throughout the system.',
        owner: 'Mike Johnson',
        type: 'Glossary'
      },
      {
        id: 'DOC-003',
        title: 'User Research Findings Q4 2024',
        text: 'Summary of user research conducted in Q4 2024, including pain points, feature requests, and usability improvements.',
        owner: 'Emma Wilson',
        type: 'Research'
      }
    ],
    ideas: [
      {
        id: 'IDEA-001',
        title: 'One-Click Checkout',
        description: 'Implement a streamlined one-click checkout process for returning customers to reduce cart abandonment.',
        stakeholder: 'Emma Wilson',
        category: 'Feature',
        status: 'Under Review',
        priority: 'High'
      },
      {
        id: 'IDEA-002',
        title: 'AI-Powered Product Recommendations',
        description: 'Use machine learning to provide personalized product recommendations based on user behavior and purchase history.',
        stakeholder: 'Mike Johnson',
        category: 'Enhancement',
        status: 'Approved',
        priority: 'Medium'
      },
      {
        id: 'IDEA-003',
        title: 'Real-time Inventory Sync',
        description: 'Synchronize inventory levels in real-time across all sales channels to prevent overselling.',
        stakeholder: 'Sarah Chen',
        category: 'Integration',
        status: 'New',
        priority: 'Critical'
      }
    ],
    requirements: [
      {
        id: 'REQ-001',
        title: 'User Authentication System',
        description: 'Implement secure user authentication with OAuth2.0 support, multi-factor authentication, and biometric login options.',
        stakeholder: 'Emma Wilson',
        category: 'Functional',
        status: 'In Development'
      },
      {
        id: 'REQ-002',
        title: 'API Response Time Optimization',
        description: 'Reduce API response time to under 200ms for all standard endpoints.',
        stakeholder: 'Mike Johnson',
        category: 'Non-Functional',
        status: 'Approved'
      },
      {
        id: 'REQ-003',
        title: 'GDPR Compliance Module',
        description: 'Implement GDPR-compliant data handling including right to be forgotten, data portability, and consent management.',
        stakeholder: 'Sarah Chen',
        category: 'Business',
        status: 'Under Review'
      }
    ],
    changeRequests: [
      {
        id: 'CR-001',
        requirementId: 'REQ-001',
        summary: 'Add biometric authentication support and social login options to the existing authentication system.',
        stakeholder: 'Emma Wilson',
        status: 'Under Review'
      },
      {
        id: 'CR-002',
        requirementId: 'REQ-002',
        summary: 'Reduce API response time from 200ms to under 100ms for all standard endpoints. Implement Redis caching, optimize database queries, and add CDN support.',
        stakeholder: 'Mike Johnson',
        status: 'Approved'
      }
    ],
    teamMembers: [
      {
        id: 'TM-001',
        fullName: 'Emma Wilson',
        email: 'emma.wilson@company.com',
        role: 'Product Manager'
      },
      {
        id: 'TM-002',
        fullName: 'Mike Johnson',
        email: 'mike.johnson@company.com',
        role: 'Technical Lead'
      },
      {
        id: 'TM-003',
        fullName: 'Sarah Chen',
        email: 'sarah.chen@company.com',
        role: 'Business Analyst'
      }
    ]
  };

  const performSearch = () => {
    setIsSearching(true);
    setHasSearched(false);

    // Simulate API call
    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const searchResults: SearchResult[] = [];

      // Search documents
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

      // Search ideas
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

      // Search requirements
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

      // Search change requests
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

      // Search team members
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

      // Sort by relevance
      searchResults.sort((a, b) => b.relevance - a.relevance);

      setResults(searchResults);
      setIsSearching(false);
      setHasSearched(true);
    }, 1500);
  };

  const handleBack = () => {
    setHasSearched(false);
    setResults([]);
    setSearchQuery('');
  };

  const handleClose = () => {
    setHasSearched(false);
    setResults([]);
    setSearchQuery('');
    setIsSearching(false);
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
                    performSearch();
                  }
                }}
                disabled={isSearching}
                className="flex-1"
              />
              <Button 
                onClick={performSearch} 
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
