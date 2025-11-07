"""
Repository classes for database operations using SQLAlchemy
"""

from typing import List, Optional, Any
from uuid import UUID

from numpy.lib._datasource import Repository
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, selectinload, raiseload

from models import (
    Project, Stakeholder, Document, Idea, Requirement,
    RequirementVersion, ChangeRequest, requirement_ideas,
    ProjectStatus, DocumentType, IdeaStatus, IdeaPriority,
    RequirementType, RequirementStatus, ChangeRequestStatus
)


class BaseRepository:
    """Base repository with common CRUD operations"""
    
    def __init__(self, session: Session, model_class):
        self.session = session
        self.model_class = model_class
    
    def get_by_id(self, id: UUID, depth: int = 1) -> Optional[Any]:
        """Get a record by ID"""

        return self.session.get(self.model_class, id)
    
    def get_all(self, limit: int = 100, depth: int = 1, offset: int = 0) -> List[Any]:
        """Get all records with pagination"""
        query = self.session.query(self.model_class)
        
        # Eagerly load ideas for Requirement model
        if self.model_class == Requirement:
            query = query.options(selectinload(Requirement.ideas))
        
        return (
            query
            .order_by(self.model_class.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )
    
    def delete(self, id: UUID) -> bool:
        """Delete a record by ID"""
        obj = self.get_by_id(id)
        if obj:
            self.session.delete(obj)
            self.session.commit()
            return True
        return False
    
    def count(self) -> int:
        """Count total records"""
        return self.session.query(func.count(self.model_class.id)).scalar()


class ProjectRepository(BaseRepository):
    """Repository for Project operations"""
    
    def __init__(self, session: Session):
        super().__init__(session, Project)
    
    def create(
        self,
        key: str,
        title: str,
        project_status: ProjectStatus = ProjectStatus.ACTIVE,
        embedding: List[float] = None
    ) -> Project:
        """Create a new project"""
        project = Project(
            key=key,
            title=title,
            project_status=project_status,
            embedding=embedding
        )
        self.session.add(project)
        self.session.commit()
        self.session.refresh(project)
        return project
    
    def update(
        self,
        id: UUID,
        **kwargs
    ) -> Optional[Project]:
        """Update a project"""
        project = self.get_by_id(id)
        if project:
            for key, value in kwargs.items():
                if hasattr(project, key) and value is not None:
                    setattr(project, key, value)
            self.session.commit()
            self.session.refresh(project)
        return project
    
    def get_by_key(self, key: str) -> Optional[Project]:
        """Get project by key"""
        return self.session.query(Project).filter(Project.key == key).first()
    
    def get_by_status(self, status: ProjectStatus) -> List[Project]:
        """Get projects by status"""
        return (
            self.session.query(Project)
            .filter(Project.project_status == status)
            .order_by(Project.created_at.desc())
            .all()
        )
    
    def search_similar(
        self,
        embedding: List[float],
        limit: int = 5,
        distance_metric: str = "cosine"
    ) -> List[tuple]:
        """
        Find similar projects by embedding
        Returns list of tuples: (project, distance)
        """
        if distance_metric == "cosine":
            distance = Project.embedding.cosine_distance(embedding)
        elif distance_metric == "l2":
            distance = Project.embedding.l2_distance(embedding)
        else:
            distance = Project.embedding.max_inner_product(embedding)
        
        results = (
            self.session.query(Project, distance.label('distance'))
            .filter(Project.embedding.isnot(None))
            .order_by(distance)
            .limit(limit)
            .all()
        )
        return results


class StakeholderRepository(BaseRepository):
    """Repository for Stakeholder operations"""
    
    def __init__(self, session: Session):
        super().__init__(session, Stakeholder)
    
    def create(
        self,
        project_id: UUID,
        name: str,
        email: str,
        role: str,
        embedding: List[float] = None
    ) -> Stakeholder:
        """Create a new stakeholder"""
        stakeholder = Stakeholder(
            project_id=project_id,
            name=name,
            email=email,
            role=role,
            embedding=embedding
        )
        self.session.add(stakeholder)
        self.session.commit()
        self.session.refresh(stakeholder)
        return stakeholder
    
    def update(self, id: UUID, **kwargs) -> Optional[Stakeholder]:
        """Update a stakeholder"""
        stakeholder = self.get_by_id(id)
        if stakeholder:
            for key, value in kwargs.items():
                if hasattr(stakeholder, key) and value is not None:
                    setattr(stakeholder, key, value)
            self.session.commit()
            self.session.refresh(stakeholder)
        return stakeholder
    
    def get_by_project(self, project_id: UUID) -> List[Stakeholder]:
        """Get all stakeholders for a project"""
        return (
            self.session.query(Stakeholder)
            .filter(Stakeholder.project_id == project_id)
            .order_by(Stakeholder.created_at)
            .all()
        )
    
    def get_by_email(self, email: str) -> Optional[Stakeholder]:
        """Get stakeholder by email"""
        return self.session.query(Stakeholder).filter(Stakeholder.email == email).first()
    
    def get_by_role(self, project_id: UUID, role: str) -> List[Stakeholder]:
        """Get stakeholders by role in a project"""
        return (
            self.session.query(Stakeholder)
            .filter(
                and_(
                    Stakeholder.project_id == project_id,
                    Stakeholder.role == role
                )
            )
            .all()
        )

    def search_similar(
            self,
            embedding: List[float],
            limit: int = 5,
            distance_metric: str = "cosine"
    ) -> List[tuple]:
        """
        Find similar stakeholders by embedding
        Returns list of tuples: (project, distance)
        """
        if distance_metric == "cosine":
            distance = Stakeholder.embedding.cosine_distance(embedding)
        elif distance_metric == "l2":
            distance = Stakeholder.embedding.l2_distance(embedding)
        else:
            distance = Stakeholder.embedding.max_inner_product(embedding)

        results = (
            self.session.query(Stakeholder, distance.label('distance'))
            .filter(Stakeholder.embedding.isnot(None))
            .order_by(distance)
            .limit(limit)
            .all()
        )
        return results

class DocumentRepository(BaseRepository):
    """Repository for Document operations"""
    
    def __init__(self, session: Session):
        super().__init__(session, Document)
    
    def create(
        self,
        project_id: UUID,
        type: DocumentType,
        title: str,
        text: str,
        stakeholder_id: Optional[UUID] = None,
        embedding: List[float] = None
    ) -> Document:
        """Create a new document"""
        document = Document(
            project_id=project_id,
            type=type,
            title=title,
            text=text,
            stakeholder_id=stakeholder_id,
            embedding=embedding
        )
        self.session.add(document)
        self.session.commit()
        self.session.refresh(document)
        return document
    
    def update(self, id: UUID, **kwargs) -> Optional[Document]:
        """Update a document"""
        document = self.get_by_id(id)
        if document:
            for key, value in kwargs.items():
                if hasattr(document, key) and value is not None:
                    setattr(document, key, value)
            self.session.commit()
            self.session.refresh(document)
        return document
    
    def get_by_project(
        self,
        project_id: UUID,
        doc_type: DocumentType = None
    ) -> List[Document]:
        """Get documents by project and optionally by type"""
        query = self.session.query(Document).filter(Document.project_id == project_id)
        
        if doc_type:
            query = query.filter(Document.type == doc_type)
        
        return query.order_by(Document.created_at.desc()).all()
    
    def get_by_stakeholder(self, stakeholder_id: UUID) -> List[Document]:
        """Get documents by stakeholder"""
        return (
            self.session.query(Document)
            .filter(Document.stakeholder_id == stakeholder_id)
            .order_by(Document.created_at.desc())
            .all()
        )
    
    def search_similar(
        self,
        embedding: List[float],
        limit: int = 10,
        distance_metric: str = "cosine"
    ) -> List[tuple]:
        """
        Find similar documents by embedding
        Returns list of tuples: (document, distance)
        """
        if distance_metric == "cosine":
            distance = Document.embedding.cosine_distance(embedding)
        elif distance_metric == "l2":
            distance = Document.embedding.l2_distance(embedding)
        else:
            distance = Document.embedding.max_inner_product(embedding)
        
        query = (
            self.session.query(Document, distance.label('distance'))
            .filter(Document.embedding.isnot(None))
        )
        
        results = query.order_by(distance).limit(limit).all()
        return results


class IdeaRepository(BaseRepository):
    """Repository for Idea operations"""
    
    def __init__(self, session: Session):
        super().__init__(session, Idea)
    
    def create(
        self,
        project_id: UUID,
        stakeholder_id: UUID,
        title: str,
        description: str,
        category: str,
        status: IdeaStatus = IdeaStatus.PROPOSED,
        priority: IdeaPriority = IdeaPriority.MEDIUM,
        impact: int = 5,
        confidence: int = 5,
        effort: int = 5,
        embedding: List[float] = None,
        conflicts: str = None,
        dependencies: str = None
    ) -> Idea:
        """Create a new idea"""
        idea = Idea(
            project_id=project_id,
            stakeholder_id=stakeholder_id,
            title=title,
            description=description,
            category=category,
            status=status,
            priority=priority,
            impact=impact,
            confidence=confidence,
            effort=effort,
            embedding=embedding,
            conflicts=conflicts,
            dependencies=dependencies
        )
        # Calculate ICE score
        idea.calculate_ice_score()
        
        self.session.add(idea)
        self.session.commit()
        self.session.refresh(idea)
        return idea
    
    def update(self, id: UUID, **kwargs) -> Optional[Idea]:
        """Update an idea"""
        idea = self.get_by_id(id)
        if idea:
            for key, value in kwargs.items():
                if hasattr(idea, key) and value is not None:
                    setattr(idea, key, value)
            
            # Recalculate ICE score if impact, confidence, or effort changed
            if any(k in kwargs for k in ['impact', 'confidence', 'effort']):
                idea.calculate_ice_score()
            
            self.session.commit()
            self.session.refresh(idea)
        return idea
    
    def get_by_project(
        self,
        project_id: UUID,
        status: IdeaStatus = None
    ) -> List[Idea]:
        """Get ideas by project"""
        query = self.session.query(Idea).filter(Idea.project_id == project_id)
        
        if status:
            query = query.filter(Idea.status == status)
        
        return query.order_by(Idea.ice_score.desc()).all()
    
    def get_top_by_ice_score(
        self,
        project_id: UUID,
        limit: int = 10
    ) -> List[Idea]:
        """Get top ideas by ICE score"""
        return (
            self.session.query(Idea)
            .filter(Idea.project_id == project_id)
            .order_by(Idea.ice_score.desc())
            .limit(limit)
            .all()
        )
    
    def search_similar(
        self,
        embedding: List[float],
        limit: int = 10,
        distance_metric: str = "cosine"
    ) -> List[tuple]:
        """Find similar ideas by embedding"""
        if distance_metric == "cosine":
            distance = Idea.embedding.cosine_distance(embedding)
        elif distance_metric == "l2":
            distance = Idea.embedding.l2_distance(embedding)
        else:
            distance = Idea.embedding.max_inner_product(embedding)
        
        query = (
            self.session.query(Idea, distance.label('distance'))
            .filter(Idea.embedding.isnot(None))
        )
        
        results = query.order_by(distance).limit(limit).all()
        return results


class RequirementRepository(BaseRepository):
    """Repository for Requirement operations"""
    
    def __init__(self, session: Session):
        super().__init__(session, Requirement)
    
    def create_requirement(self, project_id: UUID) -> Requirement:
        """Create a new requirement"""
        requirement = Requirement(project_id=project_id)
        self.session.add(requirement)
        self.session.commit()
        self.session.refresh(requirement)
        return requirement
    
    def create_version(
        self,
        requirement_id: UUID,
        stakeholder_id: UUID,
        title: str,
        description: str,
        category: str,
        type: RequirementType,
        status: RequirementStatus = RequirementStatus.DRAFT,
        priority: int = 3,
        embedding: List[float] = None,
        conflicts: str = None,
        dependencies: str = None
    ) -> RequirementVersion:
        """Create a new requirement version"""
        # Get next version number
        max_version = (
            self.session.query(func.max(RequirementVersion.version_number))
            .filter(RequirementVersion.requirement_id == requirement_id)
            .scalar()
        )
        version_number = (max_version or 0) + 1
        
        # Create version
        version = RequirementVersion(
            requirement_id=requirement_id,
            stakeholder_id=stakeholder_id,
            version_number=version_number,
            title=title,
            description=description,
            category=category,
            type=type.value,
            status=status.value,
            priority=priority,
            embedding=embedding,
            conflicts=conflicts,
            dependencies=dependencies
        )
        self.session.add(version)
        self.session.flush()
        
        # Update current version
        requirement = self.get_by_id(requirement_id)
        requirement.current_version_id = version.id
        
        self.session.commit()
        self.session.refresh(version)
        return version

    def set_current_version(
        self,
        requirement_id: UUID,
        requirement_version_id: UUID
    ) -> Requirement:
        """Set current requirement version"""
        requirement = self.get_by_id(requirement_id)
        requirement.current_version_id = requirement_version_id
        self.session.commit()
        self.session.refresh(requirement)
        return requirement


    def get_requirement_with_current_version(
        self,
        requirement_id: UUID
    ) -> Optional[Requirement]:
        """Get requirement with current version loaded"""
        return (
            self.session.query(Requirement)
            .options(
                selectinload(Requirement.current_version),
                selectinload(Requirement.versions),
                selectinload(Requirement.ideas)
            )
            .filter(Requirement.id == requirement_id)
            .first()
        )
    
    def get_all_versions(self, requirement_id: UUID) -> List[RequirementVersion]:
        """Get all versions of a requirement"""
        return (
            self.session.query(RequirementVersion)
            .filter(RequirementVersion.requirement_id == requirement_id)
            .order_by(RequirementVersion.version_number.desc())
            .all()
        )
    
    def get_version_by_id(self, version_id: UUID) -> Optional[RequirementVersion]:
        """Get a requirement version by its ID"""
        return self.session.get(RequirementVersion, version_id)

    def update_version(self, version_id: UUID, **kwargs) -> Optional[RequirementVersion]:
        """Update an existing requirement version"""
        version = self.get_version_by_id(version_id)
        if not version:
            return None

        for key, value in kwargs.items():
            if value is None:
                continue

            if hasattr(version, key):
                setattr(version, key, value)

        self.session.commit()
        self.session.refresh(version)
        return version

    def get_by_project(self, project_id: UUID) -> List[Requirement]:
        """Get all requirements for a project"""
        return (
            self.session.query(Requirement)
            .filter(Requirement.project_id == project_id)
            .order_by(Requirement.created_at.desc())
            .all()
        )
    
    def link_idea(self, requirement_id: UUID, idea_id: UUID):
        """Link an idea to a requirement"""
        requirement = self.get_by_id(requirement_id)
        idea = self.session.get(Idea, idea_id)
        
        if requirement and idea:
            requirement.ideas.append(idea)
            self.session.commit()
    
    def unlink_idea(self, requirement_id: UUID, idea_id: UUID):
        """Unlink an idea from a requirement"""
        requirement = self.get_by_id(requirement_id)
        idea = self.session.get(Idea, idea_id)
        
        if requirement and idea and idea in requirement.ideas:
            requirement.ideas.remove(idea)
            self.session.commit()
    
    def search_similar_requirements(
        self,
        embedding: List[float],
        limit: int = 10,
        distance_metric: str = "cosine"
    ) -> List[tuple]:
        """Search for similar requirements based on current version embeddings"""
        if distance_metric == "cosine":
            distance = RequirementVersion.embedding.cosine_distance(embedding)
        elif distance_metric == "l2":
            distance = RequirementVersion.embedding.l2_distance(embedding)
        else:
            distance = RequirementVersion.embedding.max_inner_product(embedding)
        
        query = (
            self.session.query(RequirementVersion, distance.label('distance'))
            .join(Requirement, Requirement.current_version_id == RequirementVersion.id)
            .filter(RequirementVersion.embedding.isnot(None))
        )
        
        results = query.order_by(distance).limit(limit).all()
        return results


class RequirementVersionRepository(BaseRepository):
    def __init__(self, session: Session):
        super().__init__(session, RequirementVersion)

class ChangeRequestRepository(BaseRepository):
    """Repository for ChangeRequest operations"""
    
    def __init__(self, session: Session):
        super().__init__(session, ChangeRequest)
    
    def create(
        self,
        requirement_id: UUID,
        stakeholder_id: UUID,
        base_version_id: UUID,
        next_version_id: UUID,
        summary: str,
        cost: str = None,
        benefit: str = None,
        embedding: List[float] = None,
        status: ChangeRequestStatus = ChangeRequestStatus.PENDING
    ) -> ChangeRequest:
        """Create a new change request"""
        change_request = ChangeRequest(
            requirement_id=requirement_id,
            stakeholder_id=stakeholder_id,
            base_version_id=base_version_id,
            next_version_id=next_version_id,
            summary=summary,
            cost=cost,
            benefit=benefit,
            embedding=embedding,
            status=status
        )
        self.session.add(change_request)
        self.session.commit()
        self.session.refresh(change_request)
        return change_request
    
    def approve(
        self,
        change_request_id: UUID
    ) -> Optional[ChangeRequest]:
        """Approve a change request"""
        cr = self.get_by_id(change_request_id)
        if cr:
            cr.status = ChangeRequestStatus.APPROVED
            self.session.commit()
            self.session.refresh(cr)
        return cr
    
    def reject(self, change_request_id: UUID) -> Optional[ChangeRequest]:
        """Reject a change request"""
        cr = self.get_by_id(change_request_id)
        if cr:
            cr.status = ChangeRequestStatus.REJECTED
            self.session.commit()
            self.session.refresh(cr)
        return cr
    
    def get_by_requirement(
        self,
        requirement_id: UUID,
        status: ChangeRequestStatus = None
    ) -> List[ChangeRequest]:
        """Get change requests for a requirement"""
        query = self.session.query(ChangeRequest).filter(
            ChangeRequest.requirement_id == requirement_id
        )
        
        if status:
            query = query.filter(ChangeRequest.status == status)
        
        return query.order_by(ChangeRequest.created_at.desc()).all()
    
    def get_pending_by_stakeholder(
        self,
        stakeholder_id: UUID
    ) -> List[ChangeRequest]:
        """Get pending change requests by stakeholder"""
        return (
            self.session.query(ChangeRequest)
            .filter(
                and_(
                    ChangeRequest.stakeholder_id == stakeholder_id,
                    ChangeRequest.status == ChangeRequestStatus.PENDING
                )
            )
            .order_by(ChangeRequest.created_at.desc())
            .all()
        )

    def search_similar(
            self,
            embedding: List[float],
            limit: int = 10,
            distance_metric: str = "cosine"
    ) -> List[tuple]:
        """Find similar ideas by embedding"""
        if distance_metric == "cosine":
            distance = ChangeRequest.embedding.cosine_distance(embedding)
        elif distance_metric == "l2":
            distance = ChangeRequest.embedding.l2_distance(embedding)
        else:
            distance = ChangeRequest.embedding.max_inner_product(embedding)

        query = (
            self.session.query(ChangeRequest, distance.label('distance'))
            .filter(ChangeRequest.embedding.isnot(None))
        )

        results = query.order_by(distance).limit(limit).all()
        return results