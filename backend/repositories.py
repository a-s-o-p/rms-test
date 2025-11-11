from typing import List, Optional, Any
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, selectinload, raiseload

from models import (
    Project, Stakeholder, Document, Idea, Requirement,
    RequirementVersion, ChangeRequest, StatusHistory, requirement_ideas,
    ProjectStatus, DocumentType, IdeaStatus, IdeaPriority,
    RequirementType, RequirementStatus, ChangeRequestStatus
)


def record_status_history(
    session: Session,
    entity_type: str,
    entity_id: UUID,
    old_status: Optional[str],
    new_status: str,
    changed_by_stakeholder_id: Optional[UUID] = None,
    notes: Optional[str] = None
) -> StatusHistory:
    history = StatusHistory(
        idea_id=entity_id if entity_type == 'idea' else None,
        requirement_version_id=entity_id if entity_type == 'requirement_version' else None,
        change_request_id=entity_id if entity_type == 'change_request' else None,
        entity_type=entity_type,
        old_status=old_status,
        new_status=new_status,
        changed_by_stakeholder_id=changed_by_stakeholder_id,
        notes=notes
    )
    session.add(history)
    return history


class BaseRepository:
    def __init__(self, session: Session, model_class):
        self.session = session
        self.model_class = model_class
    
    def get_by_id(self, id: UUID, depth: int = 1) -> Optional[Any]:
        return self.session.get(self.model_class, id)
    
    def get_all(self, limit: int = 100, depth: int = 1, offset: int = 0) -> List[Any]:
        query = self.session.query(self.model_class)

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
        obj = self.get_by_id(id)
        if obj:
            self.session.delete(obj)
            self.session.commit()
            return True
        return False
    
    def count(self) -> int:
        return self.session.query(func.count(self.model_class.id)).scalar()


class ProjectRepository(BaseRepository):
    def __init__(self, session: Session):
        super().__init__(session, Project)
    
    def create(
        self,
        title: str,
        description: str = None,
        project_status: ProjectStatus = ProjectStatus.ACTIVE,
        embedding: List[float] = None
    ) -> Project:
        project = Project(
            title=title,
            description=description or "",
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
        project = self.get_by_id(id)
        if project:
            for key, value in kwargs.items():
                if hasattr(project, key) and value is not None:
                    setattr(project, key, value)
            self.session.commit()
            self.session.refresh(project)
        return project
    
    def get_by_status(self, status: ProjectStatus) -> List[Project]:
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
        stakeholder = self.get_by_id(id)
        if stakeholder:
            for key, value in kwargs.items():
                if hasattr(stakeholder, key) and value is not None:
                    setattr(stakeholder, key, value)
            self.session.commit()
            self.session.refresh(stakeholder)
        return stakeholder
    
    def delete(self, id: UUID) -> bool:
        stakeholder = self.get_by_id(id)
        if not stakeholder:
            return False

        ideas_count = self.session.query(Idea).filter(Idea.stakeholder_id == id).count()
        versions_count = self.session.query(RequirementVersion).filter(RequirementVersion.stakeholder_id == id).count()
        change_requests_count = self.session.query(ChangeRequest).filter(ChangeRequest.stakeholder_id == id).count()
        
        has_dependent_records = ideas_count > 0 or versions_count > 0 or change_requests_count > 0

        if has_dependent_records:
            alternative_stakeholder = (
                self.session.query(Stakeholder)
                .filter(
                    and_(
                        Stakeholder.project_id == stakeholder.project_id,
                        Stakeholder.id != id
                    )
                )
                .first()
            )

            if not alternative_stakeholder:
                raise ValueError(
                    "Cannot delete stakeholder: No other stakeholders exist in this project. "
                    "Please create another stakeholder first or delete all dependent records."
                )
            
            alternative_id = alternative_stakeholder.id
            if not alternative_id:
                raise ValueError("Alternative stakeholder has no valid ID")

            ideas_updated = self.session.query(Idea).filter(Idea.stakeholder_id == id).update(
                {Idea.stakeholder_id: alternative_id},
                synchronize_session='fetch'
            )

            versions_updated = self.session.query(RequirementVersion).filter(RequirementVersion.stakeholder_id == id).update(
                {RequirementVersion.stakeholder_id: alternative_id},
                synchronize_session='fetch'
            )

            change_requests_updated = self.session.query(ChangeRequest).filter(ChangeRequest.stakeholder_id == id).update(
                {ChangeRequest.stakeholder_id: alternative_id},
                synchronize_session='fetch'
            )

            self.session.flush()

            remaining_ideas = self.session.query(Idea).filter(Idea.stakeholder_id == id).count()
            remaining_versions = self.session.query(RequirementVersion).filter(RequirementVersion.stakeholder_id == id).count()
            remaining_crs = self.session.query(ChangeRequest).filter(ChangeRequest.stakeholder_id == id).count()
            
            if remaining_ideas > 0 or remaining_versions > 0 or remaining_crs > 0:
                raise IntegrityError(
                    f"Failed to reassign all dependent records. "
                    f"Remaining: {remaining_ideas} ideas, {remaining_versions} versions, {remaining_crs} change requests",
                    None, None
                )


        self.session.delete(stakeholder)
        self.session.commit()
        return True
    
    def get_by_project(self, project_id: UUID) -> List[Stakeholder]:
        return (
            self.session.query(Stakeholder)
            .filter(Stakeholder.project_id == project_id)
            .order_by(Stakeholder.created_at)
            .all()
        )
    
    def get_by_email(self, email: str) -> Optional[Stakeholder]:
        return self.session.query(Stakeholder).filter(Stakeholder.email == email).first()
    
    def get_by_role(self, project_id: UUID, role: str) -> List[Stakeholder]:
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
    def __init__(self, session: Session):
        super().__init__(session, Document)
    
    def create(
        self,
        project_id: UUID,
        type: DocumentType,
        title: str = None,
        text: str = None,
        stakeholder_id: Optional[UUID] = None,
        embedding: List[float] = None
    ) -> Document:
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
        query = self.session.query(Document).filter(Document.project_id == project_id)
        
        if doc_type:
            query = query.filter(Document.type == doc_type)
        
        return query.order_by(Document.created_at.desc()).all()
    
    def get_by_stakeholder(self, stakeholder_id: UUID) -> List[Document]:
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
    def __init__(self, session: Session):
        super().__init__(session, Idea)
    
    def create(
        self,
        project_id: UUID,
        stakeholder_id: UUID,
        category: str,
        title: str = None,
        description: str = None,
        status: IdeaStatus = IdeaStatus.PROPOSED,
        priority: IdeaPriority = IdeaPriority.MEDIUM,
        impact: int = 5,
        confidence: int = 5,
        effort: int = 5,
        embedding: List[float] = None,
        conflicts: str = None,
        dependencies: str = None
    ) -> Idea:
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
        idea.calculate_ice_score()
        
        self.session.add(idea)
        self.session.flush()

        record_status_history(
            self.session,
            'idea',
            idea.id,
            None,
            status.value,
            stakeholder_id,
            'Initial status on creation'
        )
        
        self.session.commit()
        self.session.refresh(idea)
        return idea
    
    def update(self, id: UUID, **kwargs) -> Optional[Idea]:
        idea = self.get_by_id(id)
        if idea:
            old_status = idea.status.value if idea.status else None
            
            for key, value in kwargs.items():
                if hasattr(idea, key) and value is not None:
                    if key == 'status':
                        new_status = value.value if hasattr(value, 'value') else value
                        if old_status != new_status:
                            record_status_history(
                                self.session,
                                'idea',
                                idea.id,
                                old_status,
                                new_status,
                                idea.stakeholder_id,
                                'Status updated'
                            )
                    setattr(idea, key, value)

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
        query = self.session.query(Idea).filter(Idea.project_id == project_id)
        
        if status:
            query = query.filter(Idea.status == status)
        
        return query.order_by(Idea.ice_score.desc()).all()
    
    def get_top_by_ice_score(
        self,
        project_id: UUID,
        limit: int = 10
    ) -> List[Idea]:
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
    def __init__(self, session: Session):
        super().__init__(session, Requirement)
    
    def create_requirement(self, project_id: UUID) -> Requirement:
        requirement = Requirement(project_id=project_id)
        self.session.add(requirement)
        self.session.commit()
        self.session.refresh(requirement)
        return requirement
    
    def create_version(
        self,
        requirement_id: UUID,
        stakeholder_id: UUID,
        category: str,
        type: RequirementType,
        title: str = None,
        description: str = None,
        status: RequirementStatus = RequirementStatus.DRAFT,
        priority: int = 3,
        embedding: List[float] = None,
        conflicts: str = None,
        dependencies: str = None
    ) -> RequirementVersion:
        max_version = (
            self.session.query(func.max(RequirementVersion.version_number))
            .filter(RequirementVersion.requirement_id == requirement_id)
            .scalar()
        )
        version_number = (max_version or 0) + 1

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
        requirement = self.get_by_id(requirement_id)
        requirement.current_version_id = requirement_version_id
        self.session.commit()
        self.session.refresh(requirement)
        return requirement


    def get_requirement_with_current_version(
        self,
        requirement_id: UUID
    ) -> Optional[Requirement]:
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
        return (
            self.session.query(RequirementVersion)
            .filter(RequirementVersion.requirement_id == requirement_id)
            .order_by(RequirementVersion.version_number.desc())
            .all()
        )
    
    def get_version_by_id(self, version_id: UUID) -> Optional[RequirementVersion]:
        return self.session.get(RequirementVersion, version_id)

    def update_version(self, version_id: UUID, **kwargs) -> Optional[RequirementVersion]:
        version = self.get_version_by_id(version_id)
        if not version:
            return None

        old_status = version.status.value if version.status else None
        
        for key, value in kwargs.items():
            if value is None:
                continue

            if hasattr(version, key):
                if key == 'status':
                    new_status = value.value if hasattr(value, 'value') else value
                    old_status_str = old_status

                    if old_status_str != new_status:
                        record_status_history(
                            self.session,
                            'requirement_version',
                            version.id,
                            old_status_str,
                            new_status,
                            version.stakeholder_id,
                            'Status updated'
                        )
                
                setattr(version, key, value)

        self.session.commit()
        self.session.refresh(version)
        return version

    def get_by_project(self, project_id: UUID) -> List[Requirement]:
        return (
            self.session.query(Requirement)
            .filter(Requirement.project_id == project_id)
            .order_by(Requirement.created_at.desc())
            .all()
        )
    
    def link_idea(self, requirement_id: UUID, idea_id: UUID):
        requirement = self.get_by_id(requirement_id)
        idea = self.session.get(Idea, idea_id)
        
        if requirement and idea:
            requirement.ideas.append(idea)
            self.session.commit()
    
    def unlink_idea(self, requirement_id: UUID, idea_id: UUID):
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
    def __init__(self, session: Session):
        super().__init__(session, ChangeRequest)
    
    def create(
        self,
        requirement_id: UUID,
        stakeholder_id: UUID,
        base_version_id: UUID,
        next_version_id: UUID,
        summary: Optional[str] = None,
        title: Optional[str] = None,
        cost: Optional[str] = None,
        benefit: Optional[str] = None,
        embedding: Optional[List[float]] = None,
        status: ChangeRequestStatus = ChangeRequestStatus.PENDING
    ) -> ChangeRequest:
        change_request = ChangeRequest(
            requirement_id=requirement_id,
            stakeholder_id=stakeholder_id,
            base_version_id=base_version_id,
            next_version_id=next_version_id,
            title=title,
            summary=summary,
            cost=cost,
            benefit=benefit,
            embedding=embedding,
            status=status
        )
        self.session.add(change_request)
        self.session.flush()

        record_status_history(
            self.session,
            'change_request',
            change_request.id,
            None,
            status.value,
            stakeholder_id,
            'Initial status on creation'
        )
        
        self.session.commit()
        self.session.refresh(change_request)
        return change_request

    def update(self, id: UUID, **kwargs) -> Optional[ChangeRequest]:
        change_request = self.get_by_id(id)
        if not change_request:
            return None
        
        old_status = change_request.status.value if change_request.status else None
        
        for key, value in kwargs.items():
            if hasattr(change_request, key) and value is not None:
                if key == 'status':
                    new_status = value.value if hasattr(value, 'value') else value
                    if old_status != new_status:
                        record_status_history(
                            self.session,
                            'change_request',
                            change_request.id,
                            old_status,
                            new_status,
                            change_request.stakeholder_id,
                            'Status updated'
                        )
                setattr(change_request, key, value)
        
        self.session.commit()
        self.session.refresh(change_request)
        return change_request
        
    def approve(
        self,
        change_request_id: UUID
    ) -> Optional[ChangeRequest]:
        cr = self.get_by_id(change_request_id)
        if cr:
            old_status = cr.status.value if cr.status else None
            cr.status = ChangeRequestStatus.APPROVED
            new_status = ChangeRequestStatus.APPROVED.value

            if old_status != new_status:
                record_status_history(
                    self.session,
                    'change_request',
                    cr.id,
                    old_status,
                    new_status,
                    cr.stakeholder_id,
                    'Change request approved'
                )
            
            self.session.commit()
            self.session.refresh(cr)
        return cr
    
    def reject(self, change_request_id: UUID) -> Optional[ChangeRequest]:
        cr = self.get_by_id(change_request_id)
        if cr:
            old_status = cr.status.value if cr.status else None
            cr.status = ChangeRequestStatus.REJECTED
            new_status = ChangeRequestStatus.REJECTED.value

            if old_status != new_status:
                record_status_history(
                    self.session,
                    'change_request',
                    cr.id,
                    old_status,
                    new_status,
                    cr.stakeholder_id,
                    'Change request rejected'
                )
            
            self.session.commit()
            self.session.refresh(cr)
        return cr
    
    def get_by_requirement(
        self,
        requirement_id: UUID,
        status: ChangeRequestStatus = None
    ) -> List[ChangeRequest]:
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