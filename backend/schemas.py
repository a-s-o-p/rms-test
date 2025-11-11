from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
import enum


class ProjectStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ARCHIVED = "ARCHIVED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class DocumentType(str, enum.Enum):
    PLANNING_DOCUMENTS = "PLANNING_DOCUMENTS"
    REQUIREMENTS_DOCUMENTS = "REQUIREMENTS_DOCUMENTS"
    DESIGN_DOCUMENTS = "DESIGN_DOCUMENTS"
    TECHNICAL_DOCUMENTS = "TECHNICAL_DOCUMENTS"
    TESTING_DOCUMENTS = "TESTING_DOCUMENTS"
    MANAGEMENT_REPORTS = "MANAGEMENT_REPORTS"
    MEETING_NOTES = "MEETING_NOTES"
    CONTRACT_DOCUMENTS = "CONTRACT_DOCUMENTS"
    USER_GUIDES = "USER_GUIDES"
    RELEASE_NOTES = "RELEASE_NOTES"


class IdeaStatus(str, enum.Enum):
    PROPOSED = "PROPOSED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    IMPLEMENTED = "IMPLEMENTED"
    ARCHIVED = "ARCHIVED"


class IdeaPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RequirementType(str, enum.Enum):
    BUSINESS = "BUSINESS"
    STAKEHOLDER = "STAKEHOLDER"
    FUNCTIONAL = "FUNCTIONAL"
    NON_FUNCTIONAL = "NON_FUNCTIONAL"
    SYSTEM = "SYSTEM"
    TRANSITION = "TRANSITION"
    INTERFACE = "INTERFACE"
    USER = "USER"
    REGULATORY = "REGULATORY"
    OPERATIONAL = "OPERATIONAL"
    SECURITY = "SECURITY"
    PERFORMANCE = "PERFORMANCE"


class RequirementStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    REVIEW = "REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    IMPLEMENTED = "IMPLEMENTED"
    ARCHIVED = "ARCHIVED"
    DEPRECATED = "DEPRECATED"


class ChangeRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    IMPLEMENTED = "IMPLEMENTED"
    ARCHIVED = "ARCHIVED"


class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: datetime


class StatusHistoryResponse(BaseModel):
    id: UUID
    entity_type: str
    old_status: Optional[str] = None
    new_status: str
    changed_by_stakeholder_id: Optional[UUID] = None
    changed_at: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    title: str = Field(..., description="Project title")
    description: str = Field(default="", description="Project description")
    project_status: ProjectStatus = ProjectStatus.ACTIVE
    
    @field_validator('description', mode='before')
    @classmethod
    def ensure_description_string(cls, v):
        return v if v is not None else ""


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_status: Optional[ProjectStatus] = None


class ProjectResponse(ProjectBase, TimestampMixin):
    id: UUID
    embedding: Optional[List[float]] = None

    class Config:
        from_attributes = True


class StakeholderBase(BaseModel):
    name: str = Field(..., description="Stakeholder full name")
    email: str = Field(..., description="Stakeholder email address")
    role: str = Field(..., description="Stakeholder role in the project")


class StakeholderCreate(StakeholderBase):
    project_id: UUID


class StakeholderUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


class StakeholderResponse(StakeholderBase, TimestampMixin):
    id: UUID
    project_id: UUID
    embedding: Optional[List[float]] = None

    class Config:
        from_attributes = True


class DocumentBase(BaseModel):
    type: DocumentType = Field(..., description="Type of document")
    title: Optional[str] = Field(None, description="Document title")
    text: Optional[str] = Field(None, description="Document content")
    stakeholder_id: Optional[UUID] = None
    
    @field_validator('type', mode='before')
    @classmethod
    def validate_type(cls, v):
        if isinstance(v, str):
            try:
                return DocumentType(v)
            except ValueError:
                old_to_new = {
                    "SPECIFICATION": DocumentType.REQUIREMENTS_DOCUMENTS,
                    "EMAIL": DocumentType.MEETING_NOTES,
                    "REPORT": DocumentType.MANAGEMENT_REPORTS,
                    "OTHER": DocumentType.TECHNICAL_DOCUMENTS
                }
                if v in old_to_new:
                    return old_to_new[v]
                return DocumentType.MEETING_NOTES
        return v


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


class IdeaBase(BaseModel):
    title: Optional[str] = Field(None, description="Idea title")
    description: Optional[str] = Field(None, description="Detailed description of the idea")
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


class RequirementVersionBase(BaseModel):
    title: Optional[str] = Field(None, description="Requirement title")
    description: Optional[str] = Field(None, description="Detailed requirement description")
    conflicts: Optional[str] = Field(None, description="Potential conflicts")
    dependencies: Optional[str] = Field(None, description="Dependencies")
    category: str = Field(..., description="Requirement category")
    type: RequirementType = Field(..., description="Requirement type")
    status: RequirementStatus = RequirementStatus.DRAFT
    priority: int = Field(3, ge=1, le=5, description="Priority level (1-5)")
    
    @field_validator('type', mode='before')
    @classmethod
    def validate_type(cls, v):
        if isinstance(v, str):
            try:
                return RequirementType(v)
            except ValueError:
                if v == "CONSTRAINT":
                    return RequirementType.FUNCTIONAL
                return RequirementType.FUNCTIONAL
        return v


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
    stakeholder_id: Optional[UUID] = None


class RequirementVersionResponse(RequirementVersionBase, TimestampMixin):
    id: UUID
    requirement_id: UUID
    stakeholder_id: UUID
    version_number: int
    embedding: Optional[List[float]] = None

    class Config:
        from_attributes = True


class RequirementCreate(BaseModel):
    project_id: UUID
    initial_version: RequirementVersionBase
    stakeholder_id: UUID


class RequirementResponse(TimestampMixin):
    id: UUID
    project_id: UUID
    current_version_id: Optional[UUID] = None
    current_version: Optional[RequirementVersionResponse] = None
    ideas: List["IdeaResponse"] = Field(default_factory=list, description="Linked ideas")

    class Config:
        from_attributes = True


class ChangeRequestBase(BaseModel):
    title: Optional[str] = Field(None, description="Title of the change request")
    cost: Optional[str] = Field(None, description="Cost analysis of the change")
    benefit: Optional[str] = Field(None, description="Expected benefits")
    summary: Optional[str] = Field(..., description="Summary of the change request")
    status: ChangeRequestStatus = ChangeRequestStatus.PENDING


class ChangeRequestCreate(ChangeRequestBase):
    requirement_id: UUID
    stakeholder_id: UUID
    base_version_id: UUID
    next_version_id: UUID


class ChangeRequestUpdate(BaseModel):
    title: Optional[str] = None
    cost: Optional[str] = None
    benefit: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[ChangeRequestStatus] = None


class ChangeRequestResponse(ChangeRequestBase, TimestampMixin):
    id: UUID
    requirement_id: UUID
    stakeholder_id: UUID
    base_version_id: UUID
    next_version_id: Optional[UUID] = None
    embedding: Optional[List[float]] = None

    class Config:
        from_attributes = True


class AISearchRequest(BaseModel):
    query: str


class AIGenerateIdeasRequest(BaseModel):
    text: str


class AIGenerateRequirementsRequest(BaseModel):
    idea_ids: List[UUID]


class AIGenerateChangeRequestRequest(BaseModel):
    requirement_id: UUID
    base_version_id: UUID
    next_version_id: UUID


class ExtractedIdea(BaseModel):
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
    ideas: List[ExtractedIdea] = Field(..., description="List of extracted ideas from the document")


class ExtractedRequirement(BaseModel):
    title: str = Field(..., description="Clear, concise requirement title")
    description: str = Field(..., description="Detailed requirement description")
    category: str = Field(..., description="Requirement category")
    type: RequirementType = Field(..., description="Type of requirement")
    conflicts: Optional[str] = Field(None, description="Potential conflicts")
    dependencies: Optional[str] = Field(None, description="Dependencies on other requirements")
    priority: int = Field(3, ge=1, le=5, description="Priority level (1-5)")
    status: RequirementStatus = Field(RequirementStatus.DRAFT, description="Initial status")


class ExtractedRequirements(BaseModel):
    requirements: List[ExtractedRequirement] = Field(..., description="List of extracted requirements")


class ExtractedChangeRequest(BaseModel):
    title: str = Field(..., description="Title of the change request")
    cost: str = Field(..., description="Cost analysis of the change")
    benefit: str = Field(..., description="Expected benefits")
    summary: str = Field(..., description="Summary of the change request")
