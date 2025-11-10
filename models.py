"""
SQLAlchemy Models for Database Tables
"""

from sqlalchemy import (
    Column, String, Integer, Float, Text, Enum, ForeignKey,
    Table, CheckConstraint, TypeDecorator
)
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship, DeclarativeBase
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import enum
import uuid


class Base(DeclarativeBase):
    """Base class for all models"""
    pass


# Enums
class ProjectStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ARCHIVED = "ARCHIVED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class DocumentType(enum.Enum):
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


class IdeaStatus(enum.Enum):
    PROPOSED = "PROPOSED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    IMPLEMENTED = "IMPLEMENTED"


class IdeaPriority(enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RequirementType(enum.Enum):
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


class FlexibleEnum(TypeDecorator):
    """Custom type that handles invalid enum values gracefully"""
    impl = Text
    cache_ok = True
    
    def __init__(self, enum_class, default_value, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enum_class = enum_class
        self.default_value = default_value
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, self.enum_class):
            return value.value
        if isinstance(value, str):
            try:
                return self.enum_class(value).value
            except ValueError:
                return self.default_value.value
        return str(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, self.enum_class):
            return value
        try:
            return self.enum_class(value)
        except ValueError:
            # Map old values to new ones
            if value == "CONSTRAINT":
                return RequirementType.FUNCTIONAL
            # Return default for any unknown value
            return self.default_value


class RequirementStatus(enum.Enum):
    DRAFT = "DRAFT"
    REVIEW = "REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    IMPLEMENTED = "IMPLEMENTED"


class ChangeRequestStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    IMPLEMENTED = "IMPLEMENTED"


# Association table for many-to-many relationship
requirement_ideas = Table(
    'requirement_ideas',
    Base.metadata,
    Column('requirement_id', UUID(as_uuid=True), ForeignKey('requirements.id', ondelete='CASCADE'), primary_key=True),
    Column('idea_id', UUID(as_uuid=True), ForeignKey('ideas.id', ondelete='CASCADE'), primary_key=True),
    Column('created_at', TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
)


class Project(Base):
    __tablename__ = 'projects'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(Text, unique=True, nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    project_status = Column(Enum(ProjectStatus, native_enum=False), nullable=False, default=ProjectStatus.ACTIVE)
    embedding = Column(Vector(1536))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    stakeholders = relationship("Stakeholder", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    ideas = relationship("Idea", back_populates="project", cascade="all, delete-orphan")
    requirements = relationship("Requirement", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project(id={self.id}, key={self.key}, title={self.title})>"


class Stakeholder(Base):
    __tablename__ = 'stakeholders'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    role = Column(Text, nullable=False)
    embedding = Column(Vector(1536))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="stakeholders")
    documents = relationship("Document", back_populates="stakeholder")
    ideas = relationship("Idea", back_populates="stakeholder")
    requirement_versions = relationship("RequirementVersion", back_populates="stakeholder")
    change_requests = relationship("ChangeRequest", back_populates="stakeholder")

    def __repr__(self):
        return f"<Stakeholder(id={self.id}, name={self.name}, role={self.role})>"


class Document(Base):
    __tablename__ = 'documents'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    type = Column(Enum(DocumentType, native_enum=False), nullable=False)
    title = Column(Text, nullable=False)
    text = Column(Text, nullable=False)
    stakeholder_id = Column(UUID(as_uuid=True), ForeignKey('stakeholders.id', ondelete='SET NULL'))
    embedding = Column(Vector(1536))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="documents")
    stakeholder = relationship("Stakeholder", back_populates="documents")

    def __repr__(self):
        return f"<Document(id={self.id}, title={self.title}, type={self.type})>"


class Idea(Base):
    __tablename__ = 'ideas'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    stakeholder_id = Column(UUID(as_uuid=True), ForeignKey('stakeholders.id', ondelete='CASCADE'), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    conflicts = Column(Text)
    dependencies = Column(Text)
    category = Column(Text, nullable=False)
    status = Column(Enum(IdeaStatus, native_enum=False), nullable=False, default=IdeaStatus.PROPOSED)
    priority = Column(Enum(IdeaPriority, native_enum=False), nullable=False, default=IdeaPriority.MEDIUM)
    impact = Column(Integer, CheckConstraint('impact >= 0 AND impact <= 10'))
    confidence = Column(Integer, CheckConstraint('confidence >= 0 AND confidence <= 10'))
    effort = Column(Integer, CheckConstraint('effort > 0 AND effort <= 10'))
    ice_score = Column(Float)
    embedding = Column(Vector(1536))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="ideas")
    stakeholder = relationship("Stakeholder", back_populates="ideas")
    requirements = relationship("Requirement", secondary=requirement_ideas, back_populates="ideas")

    def calculate_ice_score(self):
        """Calculate ICE score"""
        if self.effort and self.effort > 0:
            self.ice_score = (self.impact * self.confidence) / self.effort
        else:
            self.ice_score = 0

    def __repr__(self):
        return f"<Idea(id={self.id}, title={self.title}, ice_score={self.ice_score})>"


class Requirement(Base):
    __tablename__ = 'requirements'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    current_version_id = Column(UUID(as_uuid=True), ForeignKey('requirement_versions.id', ondelete='SET NULL'))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="requirements")
    versions = relationship("RequirementVersion", back_populates="requirement", 
                          foreign_keys="RequirementVersion.requirement_id",
                          cascade="all, delete-orphan")
    current_version = relationship("RequirementVersion", 
                                  foreign_keys=[current_version_id],
                                  post_update=True)
    change_requests = relationship("ChangeRequest", back_populates="requirement", cascade="all, delete-orphan")
    ideas = relationship("Idea", secondary=requirement_ideas, back_populates="requirements")

    def __repr__(self):
        return f"<Requirement(id={self.id}, current_version_id={self.current_version_id})>"


class RequirementVersion(Base):
    __tablename__ = 'requirement_versions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requirement_id = Column(UUID(as_uuid=True), ForeignKey('requirements.id', ondelete='CASCADE'), nullable=False)
    stakeholder_id = Column(UUID(as_uuid=True), ForeignKey('stakeholders.id', ondelete='CASCADE'), nullable=False)
    version_number = Column(Integer, nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    conflicts = Column(Text)
    dependencies = Column(Text)
    category = Column(Text, nullable=False)
    type = Column(FlexibleEnum(RequirementType, RequirementType.FUNCTIONAL), nullable=False)
    status = Column(Enum(RequirementStatus, native_enum=False), nullable=False, default=RequirementStatus.DRAFT)
    priority = Column(Integer, nullable=False, default=3)
    embedding = Column(Vector(1536))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    requirement = relationship("Requirement", back_populates="versions", 
                             foreign_keys=[requirement_id])
    stakeholder = relationship("Stakeholder", back_populates="requirement_versions")
    base_change_requests = relationship("ChangeRequest", 
                                       foreign_keys="ChangeRequest.base_version_id",
                                       back_populates="base_version")
    next_change_requests = relationship("ChangeRequest", 
                                       foreign_keys="ChangeRequest.next_version_id",
                                       back_populates="next_version")

    def __repr__(self):
        return f"<RequirementVersion(id={self.id}, version={self.version_number}, title={self.title})>"


class ChangeRequest(Base):
    __tablename__ = 'change_requests'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requirement_id = Column(UUID(as_uuid=True), ForeignKey('requirements.id', ondelete='CASCADE'), nullable=False)
    stakeholder_id = Column(UUID(as_uuid=True), ForeignKey('stakeholders.id', ondelete='CASCADE'), nullable=False)
    status = Column(Enum(ChangeRequestStatus, native_enum=False), nullable=False, default=ChangeRequestStatus.PENDING)
    base_version_id = Column(UUID(as_uuid=True), ForeignKey('requirement_versions.id', ondelete='CASCADE'), nullable=False)
    next_version_id = Column(UUID(as_uuid=True), ForeignKey('requirement_versions.id', ondelete='SET NULL'))
    cost = Column(Text)
    benefit = Column(Text)
    summary = Column(Text, nullable=False)
    embedding = Column(Vector(1536))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    requirement = relationship("Requirement", back_populates="change_requests")
    stakeholder = relationship("Stakeholder", back_populates="change_requests")
    base_version = relationship("RequirementVersion", foreign_keys=[base_version_id], back_populates="base_change_requests")
    next_version = relationship("RequirementVersion", foreign_keys=[next_version_id], back_populates="next_change_requests")

    def __repr__(self):
        return f"<ChangeRequest(id={self.id}, status={self.status}, summary={self.summary[:50]})>"
