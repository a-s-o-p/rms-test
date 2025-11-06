from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
import enum


# Enums (matching SQLAlchemy enums)
class ProjectStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ARCHIVED = "ARCHIVED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class DocumentType(str, enum.Enum):
    SPECIFICATION = "SPECIFICATION"
    MEETING_NOTES = "MEETING_NOTES"
    EMAIL = "EMAIL"
    REPORT = "REPORT"
    OTHER = "OTHER"


class IdeaStatus(str, enum.Enum):
    PROPOSED = "PROPOSED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    IMPLEMENTED = "IMPLEMENTED"


class IdeaPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RequirementType(str, enum.Enum):
    FUNCTIONAL = "FUNCTIONAL"
    NON_FUNCTIONAL = "NON_FUNCTIONAL"
    CONSTRAINT = "CONSTRAINT"


class RequirementStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    REVIEW = "REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    IMPLEMENTED = "IMPLEMENTED"


class ChangeRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    IMPLEMENTED = "IMPLEMENTED"


# Base Pydantic Models (for shared fields)
class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: datetime


# Project Models
class ProjectBase(BaseModel):
    key: str = Field(..., description="Unique project key identifier")
    title: str = Field(..., description="Project title")
    description: str = Field(..., description="Project description")
    project_status: ProjectStatus = ProjectStatus.ACTIVE


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    key: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    project_status: Optional[ProjectStatus] = None


class ProjectResponse(ProjectBase, TimestampMixin):
    id: UUID
    embedding: Optional[List[float]] = None

    class Config:
        from_attributes = True


# Stakeholder Models
class StakeholderBase(BaseModel):
    name: str = Field(..., description="Stakeholder full name")
    email: EmailStr = Field(..., description="Stakeholder email address")
    role: str = Field(..., description="Stakeholder role in the project")


class StakeholderCreate(StakeholderBase):
    project_id: UUID


class StakeholderUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None


class StakeholderResponse(StakeholderBase, TimestampMixin):
    id: UUID
    project_id: UUID
    embedding: Optional[List[float]] = None

    class Config:
        from_attributes = True


# Document Models
class DocumentBase(BaseModel):
    type: DocumentType = Field(..., description="Type of document")
    title: str = Field(..., description="Document title")
    text: str = Field(..., description="Document content")
    stakeholder_id: Optional[UUID] = None


class DocumentCreate(DocumentBase):
    project_id: UUID


class DocumentUpdate(BaseModel):
    type: Optional[DocumentType] = None
    title: Optional[str] = None
    text: Optional[str] = None
    stakeholder_id: Optional[UUID] = None


class DocumentResponse(DocumentBase, TimestampMixin):
    id: UUID
    project_id: UUID
    embedding: Optional[List[float]] = None

    class Config:
        from_attributes = True


# Idea Models
class IdeaBase(BaseModel):
    title: str = Field(..., description="Idea title")
    description: str = Field(..., description="Detailed description of the idea")
    conflicts: Optional[str] = Field(None, description="Potential conflicts with other ideas or requirements")
    dependencies: Optional[str] = Field(None, description="Dependencies on other ideas or requirements")
    category: str = Field(..., description="Idea category")
    status: IdeaStatus = IdeaStatus.PROPOSED
    priority: IdeaPriority = IdeaPriority.MEDIUM
    impact: Optional[int] = Field(None, ge=0, le=10, description="Impact score (0-10)")
    confidence: Optional[int] = Field(None, ge=0, le=10, description="Confidence score (0-10)")
    effort: Optional[int] = Field(None, gt=0, le=10, description="Effort score (1-10)")


class IdeaCreate(IdeaBase):
    project_id: UUID
    stakeholder_id: UUID


class IdeaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    conflicts: Optional[str] = None
    dependencies: Optional[str] = None
    category: Optional[str] = None
    status: Optional[IdeaStatus] = None
    priority: Optional[IdeaPriority] = None
    impact: Optional[int] = Field(None, ge=0, le=10)
    confidence: Optional[int] = Field(None, ge=0, le=10)
    effort: Optional[int] = Field(None, gt=0, le=10)


class IdeaResponse(IdeaBase, TimestampMixin):
    id: UUID
    project_id: UUID
    stakeholder_id: UUID
    ice_score: Optional[float] = None
    embedding: Optional[List[float]] = None

    class Config:
        from_attributes = True


# Requirement Version Models
class RequirementVersionBase(BaseModel):
    title: str = Field(..., description="Requirement title")
    description: str = Field(..., description="Detailed requirement description")
    conflicts: Optional[str] = Field(None, description="Potential conflicts")
    dependencies: Optional[str] = Field(None, description="Dependencies")
    category: str = Field(..., description="Requirement category")
    type: RequirementType = Field(..., description="Requirement type")
    status: RequirementStatus = RequirementStatus.DRAFT
    priority: int = Field(3, ge=1, le=5, description="Priority level (1-5)")


class RequirementVersionCreate(RequirementVersionBase):
    requirement_id: UUID
    stakeholder_id: UUID
    version_number: int


class RequirementVersionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    conflicts: Optional[str] = None
    dependencies: Optional[str] = None
    category: Optional[str] = None
    type: Optional[RequirementType] = None
    status: Optional[RequirementStatus] = None
    priority: Optional[int] = Field(None, ge=1, le=5)


class RequirementVersionResponse(RequirementVersionBase, TimestampMixin):
    id: UUID
    requirement_id: UUID
    stakeholder_id: UUID
    version_number: int
    embedding: Optional[List[float]] = None

    class Config:
        from_attributes = True


# Requirement Models
class RequirementCreate(BaseModel):
    project_id: UUID
    initial_version: RequirementVersionBase
    stakeholder_id: UUID


class RequirementResponse(TimestampMixin):
    id: UUID
    project_id: UUID
    current_version_id: Optional[UUID] = None
    current_version: Optional[RequirementVersionResponse] = None

    class Config:
        from_attributes = True


# Change Request Models
class ChangeRequestBase(BaseModel):
    cost: Optional[str] = Field(None, description="Cost analysis of the change")
    benefit: Optional[str] = Field(None, description="Expected benefits")
    summary: str = Field(..., description="Summary of the change request")
    status: ChangeRequestStatus = ChangeRequestStatus.PENDING


class ChangeRequestCreate(ChangeRequestBase):
    requirement_id: UUID
    stakeholder_id: UUID
    base_version_id: UUID
    next_version_id: UUID


class ChangeRequestUpdate(BaseModel):
    cost: Optional[str] = None
    benefit: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[ChangeRequestStatus] = None


class ChangeRequestResponse(ChangeRequestBase, TimestampMixin):
    id: UUID
    requirement_id: UUID
    stakeholder_id: UUID
    base_version_id: UUID
    next_version_id: UUID
    embedding: Optional[List[float]] = None

    class Config:
        from_attributes = True


# ============================================
# AI SERVICE REQUEST/RESPONSE MODELS
# ============================================


class AISearchRequest(BaseModel):
    """Request payload for AI-powered natural language search"""

    query: str


class AIGenerateIdeasRequest(BaseModel):
    """Request payload for AI-backed idea generation"""

    text: str


class AIGenerateRequirementsRequest(BaseModel):
    """Request payload for AI-backed requirement generation"""

    idea_ids: List[UUID]


class AIGenerateChangeRequestRequest(BaseModel):
    """Request payload for AI-backed change request generation"""

    base_version_id: UUID
    next_version_id: UUID


# ============================================
# INSTRUCTOR MODELS (for GPT structured output)
# ============================================


class ExtractedIdea(BaseModel):
    """Model for extracting ideas from text using GPT with Instructor"""
    title: str = Field(..., description="Clear, concise title for the idea")
    description: str = Field(..., description="Detailed description of the idea")
    category: str = Field(..., description="Category this idea belongs to")
    conflicts: Optional[str] = Field(None, description="Potential conflicts identified")
    dependencies: Optional[str] = Field(None, description="Dependencies identified")
    priority: IdeaPriority = Field(IdeaPriority.MEDIUM, description="Suggested priority level")
    impact: int = Field(..., ge=0, le=10, description="Estimated impact (0-10)")
    confidence: int = Field(..., ge=0, le=10, description="Confidence in the idea (0-10)")
    effort: int = Field(..., gt=0, le=10, description="Estimated effort required (1-10)")


class ExtractedIdeas(BaseModel):
    """Container for multiple extracted ideas"""
    ideas: List[ExtractedIdea] = Field(..., description="List of extracted ideas from the document")


class ExtractedRequirement(BaseModel):
    """Model for extracting requirements from text using GPT with Instructor"""
    title: str = Field(..., description="Clear, concise requirement title")
    description: str = Field(..., description="Detailed requirement description")
    category: str = Field(..., description="Requirement category")
    type: RequirementType = Field(..., description="Type of requirement")
    conflicts: Optional[str] = Field(None, description="Potential conflicts")
    dependencies: Optional[str] = Field(None, description="Dependencies on other requirements")
    priority: int = Field(3, ge=1, le=5, description="Priority level (1-5)")
    status: RequirementStatus = Field(RequirementStatus.DRAFT, description="Initial status")


class ExtractedRequirements(BaseModel):
    """Container for multiple extracted requirements"""
    requirements: List[ExtractedRequirement] = Field(..., description="List of extracted requirements")


class DocumentAnalysis(BaseModel):
    """Model for comprehensive document analysis using GPT"""
    summary: str = Field(..., description="Concise summary of the document")
    key_points: List[str] = Field(..., description="List of key points from the document")
    stakeholder_concerns: List[str] = Field(default_factory=list, description="Identified stakeholder concerns")
    action_items: List[str] = Field(default_factory=list, description="Action items identified")
    ideas: List[ExtractedIdea] = Field(default_factory=list, description="Ideas extracted from the document")
    requirements: List[ExtractedRequirement] = Field(default_factory=list, description="Requirements extracted")


class ConflictAnalysis(BaseModel):
    """Model for analyzing conflicts between requirements/ideas"""
    has_conflict: bool = Field(..., description="Whether a conflict exists")
    conflict_description: Optional[str] = Field(None, description="Description of the conflict")
    severity: Optional[str] = Field(None, description="Conflict severity: low, medium, high")
    resolution_suggestions: List[str] = Field(default_factory=list, description="Suggested resolutions")


class DependencyAnalysis(BaseModel):
    """Model for analyzing dependencies between requirements/ideas"""
    has_dependency: bool = Field(..., description="Whether a dependency exists")
    dependency_description: Optional[str] = Field(None, description="Description of the dependency")
    dependency_type: Optional[str] = Field(None, description="Type: hard, soft, optional")
    affected_items: List[str] = Field(default_factory=list, description="List of affected requirement/idea IDs")


class ChangeImpactAnalysis(BaseModel):
    """Model for analyzing the impact of requirement changes"""
    impact_summary: str = Field(..., description="Summary of the change impact")
    affected_requirements: List[str] = Field(default_factory=list, description="IDs of affected requirements")
    affected_ideas: List[str] = Field(default_factory=list, description="IDs of affected ideas")
    estimated_effort: int = Field(..., gt=0, le=10, description="Estimated effort for the change (1-10)")
    risks: List[str] = Field(default_factory=list, description="Identified risks")
    benefits: List[str] = Field(default_factory=list, description="Expected benefits")
    recommendation: str = Field(..., description="Recommendation: approve, reject, or modify")


class RequirementQualityCheck(BaseModel):
    """Model for checking requirement quality using GPT"""
    is_clear: bool = Field(..., description="Is the requirement clearly stated?")
    is_testable: bool = Field(..., description="Is the requirement testable?")
    is_complete: bool = Field(..., description="Is the requirement complete?")
    is_consistent: bool = Field(..., description="Is the requirement consistent?")
    quality_score: int = Field(..., ge=0, le=10, description="Overall quality score (0-10)")
    improvement_suggestions: List[str] = Field(..., description="Suggestions for improvement")
    rewritten_requirement: Optional[str] = Field(None, description="AI-improved version if needed")
