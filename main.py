"""
FastAPI application for Requirements Management System
Simple CRUD + AI services
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from database import DatabaseManager, DatabaseConfig
from repositories import (
    ProjectRepository, StakeholderRepository, DocumentRepository,
    IdeaRepository, RequirementRepository, ChangeRequestRepository
)
from schemas import (
    # Project
    ProjectCreate, ProjectUpdate, ProjectResponse,
    # Stakeholder
    StakeholderCreate, StakeholderUpdate, StakeholderResponse,
    # Document
    DocumentCreate, DocumentUpdate, DocumentResponse,
    # Idea
    IdeaCreate, IdeaUpdate, IdeaResponse,
    # Requirement
    RequirementCreate, RequirementVersionBase, RequirementVersionResponse, RequirementResponse,
    # Change Request
    ChangeRequestCreate, ChangeRequestUpdate, ChangeRequestResponse,
    # AI
    AISearchRequest,
    AIGenerateIdeasRequest, AIGenerateRequirementsRequest, AIGenerateChangeRequestRequest,
)
from models import (
    ProjectStatus, DocumentType, IdeaStatus, IdeaPriority,
    RequirementType, RequirementStatus, ChangeRequestStatus, RequirementVersion
)
from rag import AIService

# Initialize FastAPI
app = FastAPI(
    title="Requirements Management System",
    description="Local tool for managing requirements with AI assistance",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
config = DatabaseConfig.from_env()
db_manager = DatabaseManager(config)


# Dependency
def get_db():
    with db_manager.session_scope() as session:
        yield session


# Helper: Get default project
def get_default_project(db: Session):
    """Get first project or raise error"""
    repo = ProjectRepository(db)
    projects = repo.get_all(limit=1)
    if not projects:
        raise HTTPException(
            status_code=404,
            detail="No project found. Create a project first."
        )
    return projects[0]


# Helper: Get default stakeholder (optional)
def get_default_stakeholder(db: Session):
    """Get first stakeholder or return None"""
    repo = StakeholderRepository(db)
    stakeholders = repo.get_all(limit=1)
    return stakeholders[0] if stakeholders else None

# ============================================
# PROJECT ENDPOINTS
# ============================================

@app.get("/projects", response_model=List[ProjectResponse])
def list_projects(
        limit: int = 100,
        offset: int = 0,
        db: Session = Depends(get_db)
):
    """List all projects"""
    repo = ProjectRepository(db)
    return repo.get_all(limit=limit, offset=offset)


@app.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: UUID, db: Session = Depends(get_db)):
    """Get project by ID"""
    repo = ProjectRepository(db)
    project = repo.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Create new project"""
    repo = ProjectRepository(db)
    ai = AIService(db)

    # Generate embedding
    text = f"{project.title} {project.key}"
    embedding = ai.embed_query(text)

    return repo.create(
        key=project.key,
        title=project.title,
        project_status=project.project_status,
        embedding=embedding
    )


@app.put("/projects/{project_id}", response_model=ProjectResponse)
def update_project(
        project_id: UUID,
        project: ProjectUpdate,
        db: Session = Depends(get_db)
):
    """Update project"""
    repo = ProjectRepository(db)
    updated = repo.update(project_id, **project.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated


@app.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: UUID, db: Session = Depends(get_db)):
    """Delete project"""
    repo = ProjectRepository(db)
    if not repo.delete(project_id):
        raise HTTPException(status_code=404, detail="Project not found")


# ============================================
# STAKEHOLDER ENDPOINTS
# ============================================

@app.get("/stakeholders", response_model=List[StakeholderResponse])
def list_stakeholders(
        project_id: Optional[UUID] = None,
        db: Session = Depends(get_db)
):
    """List stakeholders, optionally filtered by project"""
    repo = StakeholderRepository(db)
    if project_id:
        return repo.get_by_project(project_id)
    return repo.get_all()


@app.get("/stakeholders/{stakeholder_id}", response_model=StakeholderResponse)
def get_stakeholder(stakeholder_id: UUID, db: Session = Depends(get_db)):
    """Get stakeholder by ID"""
    repo = StakeholderRepository(db)
    stakeholder = repo.get_by_id(stakeholder_id)
    if not stakeholder:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
    return stakeholder


@app.post("/stakeholders", response_model=StakeholderResponse, status_code=status.HTTP_201_CREATED)
def create_stakeholder(stakeholder: StakeholderCreate, db: Session = Depends(get_db)):
    """Create new stakeholder"""
    repo = StakeholderRepository(db)
    ai = AIService(db)

    text = f"{stakeholder.name} {stakeholder.email} {stakeholder.role}"
    embedding = ai.embed_query(text)

    return repo.create(
        project_id=stakeholder.project_id,
        name=stakeholder.name,
        email=stakeholder.email,
        role=stakeholder.role,
        embedding=embedding
    )


@app.put("/stakeholders/{stakeholder_id}", response_model=StakeholderResponse)
def update_stakeholder(
        stakeholder_id: UUID,
        stakeholder: StakeholderUpdate,
        db: Session = Depends(get_db)
):
    """Update stakeholder"""
    repo = StakeholderRepository(db)
    updated = repo.update(stakeholder_id, **stakeholder.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
    return updated


@app.delete("/stakeholders/{stakeholder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stakeholder(stakeholder_id: UUID, db: Session = Depends(get_db)):
    """Delete stakeholder"""
    repo = StakeholderRepository(db)
    if not repo.delete(stakeholder_id):
        raise HTTPException(status_code=404, detail="Stakeholder not found")


# ============================================
# DOCUMENT ENDPOINTS
# ============================================

@app.get("/documents", response_model=List[DocumentResponse])
def list_documents(
        project_id: Optional[UUID] = None,
        doc_type: Optional[DocumentType] = None,
        db: Session = Depends(get_db)
):
    """List documents"""
    repo = DocumentRepository(db)
    if project_id:
        return repo.get_by_project(project_id, doc_type)
    return repo.get_all()


@app.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(document_id: UUID, db: Session = Depends(get_db)):
    """Get document by ID"""
    repo = DocumentRepository(db)
    doc = repo.get_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@app.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(document: DocumentCreate, db: Session = Depends(get_db)):
    """Create new document"""
    repo = DocumentRepository(db)
    ai = AIService(db)

    text = f"{document.title} {document.text}"
    embedding = ai.embed_query(text)

    return repo.create(
        project_id=document.project_id,
        type=document.type,
        title=document.title,
        text=document.text,
        stakeholder_id=document.stakeholder_id,
        embedding=embedding
    )


@app.put("/documents/{document_id}", response_model=DocumentResponse)
def update_document(
        document_id: UUID,
        document: DocumentUpdate,
        db: Session = Depends(get_db)
):
    """Update document"""
    repo = DocumentRepository(db)
    updated = repo.update(document_id, **document.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Document not found")
    return updated


@app.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: UUID, db: Session = Depends(get_db)):
    """Delete document"""
    repo = DocumentRepository(db)
    if not repo.delete(document_id):
        raise HTTPException(status_code=404, detail="Document not found")


# ============================================
# IDEA ENDPOINTS
# ============================================

@app.get("/ideas", response_model=List[IdeaResponse])
def list_ideas(
        project_id: Optional[UUID] = None,
        status: Optional[IdeaStatus] = None,
        db: Session = Depends(get_db)
):
    """List ideas"""
    repo = IdeaRepository(db)
    if project_id:
        return repo.get_by_project(project_id, status)
    return repo.get_all()


@app.get("/ideas/top", response_model=List[IdeaResponse])
def get_top_ideas(
        project_id: UUID,
        limit: int = 10,
        db: Session = Depends(get_db)
):
    """Get top ideas by ICE score"""
    repo = IdeaRepository(db)
    return repo.get_top_by_ice_score(project_id, limit)


@app.get("/ideas/{idea_id}", response_model=IdeaResponse)
def get_idea(idea_id: UUID, db: Session = Depends(get_db)):
    """Get idea by ID"""
    repo = IdeaRepository(db)
    idea = repo.get_by_id(idea_id)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return idea


@app.post("/ideas", response_model=IdeaResponse, status_code=status.HTTP_201_CREATED)
def create_idea(idea: IdeaCreate, db: Session = Depends(get_db)):
    """Create new idea"""
    repo = IdeaRepository(db)
    ai = AIService(db)

    text = f"{idea.title} {idea.description} {idea.category}"
    embedding = ai.embed_query(text)

    return repo.create(
        project_id=idea.project_id,
        stakeholder_id=idea.stakeholder_id,
        title=idea.title,
        description=idea.description,
        category=idea.category,
        status=idea.status,
        priority=idea.priority,
        impact=idea.impact,
        confidence=idea.confidence,
        effort=idea.effort,
        conflicts=idea.conflicts,
        dependencies=idea.dependencies,
        embedding=embedding
    )


@app.put("/ideas/{idea_id}", response_model=IdeaResponse)
def update_idea(
        idea_id: UUID,
        idea: IdeaUpdate,
        db: Session = Depends(get_db)
):
    """Update idea"""
    repo = IdeaRepository(db)
    updated = repo.update(idea_id, **idea.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Idea not found")
    return updated


@app.delete("/ideas/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_idea(idea_id: UUID, db: Session = Depends(get_db)):
    """Delete idea"""
    repo = IdeaRepository(db)
    if not repo.delete(idea_id):
        raise HTTPException(status_code=404, detail="Idea not found")


# ============================================
# REQUIREMENT ENDPOINTS
# ============================================

@app.get("/requirements", response_model=List[RequirementResponse])
def list_requirements(
        project_id: Optional[UUID] = None,
        db: Session = Depends(get_db)
):
    """List requirements"""
    repo = RequirementRepository(db)
    if project_id:
        return repo.get_by_project(project_id)
    return repo.get_all()


@app.post("/requirements", response_model=RequirementResponse, status_code=status.HTTP_201_CREATED)
def create_requirement(
        requirement: RequirementCreate,
        db: Session = Depends(get_db)
):
    """Create a requirement with its initial version"""
    repo = RequirementRepository(db)
    ai = AIService(db)

    created_requirement = repo.create_requirement(requirement.project_id)

    version = requirement.initial_version
    version_text = f"{version.title} {version.description} {version.category}"
    embedding = ai.embed_query(version_text)

    repo.create_version(
        requirement_id=created_requirement.id,
        stakeholder_id=requirement.stakeholder_id,
        title=version.title,
        description=version.description,
        category=version.category,
        type=version.type,
        status=version.status,
        priority=version.priority,
        conflicts=version.conflicts,
        dependencies=version.dependencies,
        embedding=embedding
    )

    db.refresh(created_requirement)
    return repo.get_requirement_with_current_version(created_requirement.id)


@app.get("/requirements/{requirement_id}", response_model=RequirementResponse)
def get_requirement(requirement_id: UUID, db: Session = Depends(get_db)):
    """Get requirement by ID with current version"""
    repo = RequirementRepository(db)
    req = repo.get_requirement_with_current_version(requirement_id)
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return req


@app.get("/requirements/{requirement_id}/versions", response_model=List[RequirementVersionResponse])
def get_requirement_versions(requirement_id: UUID, db: Session = Depends(get_db)):
    """Get all versions of a requirement"""
    repo = RequirementRepository(db)
    return repo.get_all_versions(requirement_id)


@app.post("/requirements/{requirement_id}/versions", response_model=RequirementVersionResponse,
          status_code=status.HTTP_201_CREATED)
def create_requirement_version(
        requirement_id: UUID,
        version: RequirementVersionBase,
        stakeholder_id: UUID,
        db: Session = Depends(get_db)
):
    """Create new requirement version"""
    repo = RequirementRepository(db)
    ai = AIService(db)

    text = f"{version.title} {version.description} {version.category}"
    embedding = ai.embed_query(text)

    return repo.create_version(
        requirement_id=requirement_id,
        stakeholder_id=stakeholder_id,
        title=version.title,
        description=version.description,
        category=version.category,
        type=version.type,
        status=version.status,
        priority=version.priority,
        conflicts=version.conflicts,
        dependencies=version.dependencies,
        embedding=embedding
    )


@app.delete("/requirements/{requirement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_requirement(requirement_id: UUID, db: Session = Depends(get_db)):
    """Delete requirement"""
    repo = RequirementRepository(db)
    if not repo.delete(requirement_id):
        raise HTTPException(status_code=404, detail="Requirement not found")


# ============================================
# CHANGE REQUEST ENDPOINTS
# ============================================

@app.get("/change-requests", response_model=List[ChangeRequestResponse])
def list_change_requests(
        requirement_id: Optional[UUID] = None,
        status: Optional[ChangeRequestStatus] = None,
        db: Session = Depends(get_db)
):
    """List change requests"""
    repo = ChangeRequestRepository(db)
    if requirement_id:
        return repo.get_by_requirement(requirement_id, status)
    return repo.get_all()


@app.get("/change-requests/{cr_id}", response_model=ChangeRequestResponse)
def get_change_request(cr_id: UUID, db: Session = Depends(get_db)):
    """Get change request by ID"""
    repo = ChangeRequestRepository(db)
    cr = repo.get_by_id(cr_id)
    if not cr:
        raise HTTPException(status_code=404, detail="Change request not found")
    return cr


@app.post("/change-requests", response_model=ChangeRequestResponse, status_code=status.HTTP_201_CREATED)
def create_change_request(cr: ChangeRequestCreate, db: Session = Depends(get_db)):
    """Create new change request"""
    repo = ChangeRequestRepository(db)
    ai = AIService(db)
    embedding = ai.embed_query(cr.summary)

    return repo.create(
        requirement_id=cr.requirement_id,
        stakeholder_id=cr.stakeholder_id,
        base_version_id=cr.base_version_id,
        next_version_id=cr.next_version_id,
        summary=cr.summary,
        cost=cr.cost,
        benefit=cr.benefit,
        embedding=embedding,
        status=cr.status
    )


@app.put("/change-requests/{cr_id}", response_model=ChangeRequestResponse)
def update_change_request(
        cr_id: UUID,
        cr: ChangeRequestUpdate,
        db: Session = Depends(get_db)
):
    """Update change request"""
    repo = ChangeRequestRepository(db)
    change_request = repo.get_by_id(cr_id)
    if not change_request:
        raise HTTPException(status_code=404, detail="Change request not found")

    for key, value in cr.model_dump(exclude_unset=True).items():
        setattr(change_request, key, value)

    db.commit()
    db.refresh(change_request)
    return change_request


@app.post("/change-requests/{cr_id}/approve")
def approve_change_request(
        cr_id: UUID,
        next_version_id: UUID,
        db: Session = Depends(get_db)
):
    """Approve change request"""
    repo = ChangeRequestRepository(db)
    cr = repo.approve(cr_id, next_version_id)
    if not cr:
        raise HTTPException(status_code=404, detail="Change request not found")
    return {"message": "Change request approved", "id": cr_id}


@app.post("/change-requests/{cr_id}/reject")
def reject_change_request(cr_id: UUID, db: Session = Depends(get_db)):
    """Reject change request"""
    repo = ChangeRequestRepository(db)
    cr = repo.reject(cr_id)
    if not cr:
        raise HTTPException(status_code=404, detail="Change request not found")
    return {"message": "Change request rejected", "id": cr_id}


@app.delete("/change-requests/{cr_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_change_request(cr_id: UUID, db: Session = Depends(get_db)):
    """Delete change request"""
    repo = ChangeRequestRepository(db)
    if not repo.delete(cr_id):
        raise HTTPException(status_code=404, detail="Change request not found")


# ============================================
# AI SERVICE ENDPOINTS
# ============================================

@app.post("/ai/search")
def ai_search(payload: AISearchRequest, db: Session = Depends(get_db)):
    """Natural language search"""
    if not payload.query:
        raise HTTPException(status_code=400, detail="Query is required for AI search")

    ai = AIService(db)
    response = ai.search(payload.query)
    return {"query": payload.query, "response": response}


@app.post("/ai/generate-ideas")
def ai_generate_ideas(
        payload: AIGenerateIdeasRequest,
        db: Session = Depends(get_db)
):
    """Generate ideas from meeting text and save to database"""
    ai = AIService(db)
    idea_repo = IdeaRepository(db)

    # Extract ideas
    extracted = ai.generate_ideas(payload.text)

    project = get_default_project(db)
    stakeholder = get_default_stakeholder(db)

    # Save to database
    saved_ideas = []
    for idea_data in extracted.ideas:
        idea_text = f"{idea_data.title} {idea_data.description} {idea_data.category}"
        embedding = ai.embed_query(idea_text)

        idea = idea_repo.create(
            project_id=project.id,
            stakeholder_id=stakeholder.id,
            title=idea_data.title,
            description=idea_data.description,
            category=idea_data.category,
            status=IdeaStatus.PROPOSED,
            priority=idea_data.priority,
            impact=idea_data.impact,
            confidence=idea_data.confidence,
            effort=idea_data.effort,
            conflicts=idea_data.conflicts,
            dependencies=idea_data.dependencies,
            embedding=embedding
        )
        saved_ideas.append(idea)

    return jsonable_encoder([
        IdeaResponse.model_validate(idea).model_dump()
        for idea in saved_ideas
    ])


@app.post("/ai/generate-requirements")
def ai_generate_requirements(
        payload: AIGenerateRequirementsRequest,
        db: Session = Depends(get_db)
):
    """Generate requirements from ideas and save to database"""
    ai = AIService(db)
    idea_repo = IdeaRepository(db)
    req_repo = RequirementRepository(db)

    # Get ideas
    ideas = [idea_repo.get_by_id(id) for id in payload.idea_ids]
    ideas = [i for i in ideas if i is not None]

    if not ideas:
        raise HTTPException(status_code=404, detail="No valid ideas found")

    # Generate requirements
    extracted = ai.generate_requirements(ideas)

    project = get_default_project(db)
    stakeholder = get_default_stakeholder(db)

    # Save to database
    saved_requirements = []
    for req_data in extracted.requirements:
        # Create requirement
        requirement = req_repo.create_requirement(project.id)

        # Create first version
        req_text = f"{req_data.title} {req_data.description} {req_data.category}"
        embedding = ai.embed_query(req_text)

        req_repo.create_version(
            requirement_id=requirement.id,
            stakeholder_id=stakeholder.id,
            title=req_data.title,
            description=req_data.description,
            category=req_data.category,
            type=req_data.type,
            status=req_data.status,
            priority=req_data.priority,
            conflicts=req_data.conflicts,
            dependencies=req_data.dependencies,
            embedding=embedding
        )

        # Link ideas to requirement
        for idea in ideas:
            req_repo.link_idea(requirement.id, idea.id)

        db.refresh(requirement)
        saved_requirements.append(requirement)

    return jsonable_encoder([
        RequirementResponse.model_validate(req).model_dump()
        for req in saved_requirements
    ])


@app.post("/ai/generate-change-request")
def ai_generate_change_request(
        payload: AIGenerateChangeRequestRequest,
        db: Session = Depends(get_db)
):
    """Generate change request"""
    ai = AIService(db)
    cr_repo = ChangeRequestRepository(db)

    base_version = db.get(RequirementVersion, payload.base_version_id)
    next_version = db.get(RequirementVersion, payload.next_version_id)

    if not base_version or not next_version:
        raise HTTPException(status_code=404, detail="No valid versions found")

    if base_version.requirement_id != next_version.requirement_id:
        raise HTTPException(status_code=400, detail="Versions must belong to the same requirement")

    def _to_requirement_version_base(version: RequirementVersion) -> RequirementVersionBase:
        try:
            req_type = RequirementType(version.type)
        except ValueError:
            req_type = RequirementType.FUNCTIONAL

        try:
            req_status = RequirementStatus(version.status)
        except ValueError:
            req_status = RequirementStatus.DRAFT

        return RequirementVersionBase(
            title=version.title or "Untitled Requirement",
            description=version.description or "",
            category=version.category or "General",
            type=req_type,
            status=req_status,
            priority=version.priority or 3,
            conflicts=version.conflicts,
            dependencies=version.dependencies,
        )

    generated = ai.generate_change_request(
        _to_requirement_version_base(base_version),
        _to_requirement_version_base(next_version)
    )

    change_request_text = " ".join(
        filter(None, [generated.cost, generated.benefit, generated.summary])
    ) or "Proposed change request"
    embedding = ai.embed_query(change_request_text)

    stakeholder_id = next_version.stakeholder_id or base_version.stakeholder_id
    if not stakeholder_id:
        default_stakeholder = get_default_stakeholder(db)
        if not default_stakeholder:
            raise HTTPException(status_code=400, detail="No stakeholder available for change request")
        stakeholder_id = default_stakeholder.id

    if isinstance(generated.status, ChangeRequestStatus):
        status_value = generated.status
    else:
        try:
            status_value = ChangeRequestStatus(generated.status) if generated.status else ChangeRequestStatus.PENDING
        except ValueError:
            status_value = ChangeRequestStatus.PENDING

    change_request = cr_repo.create(
        requirement_id=next_version.requirement_id,
        stakeholder_id=stakeholder_id,
        base_version_id=payload.base_version_id,
        next_version_id=payload.next_version_id,
        summary=generated.summary,
        cost=generated.cost,
        benefit=generated.benefit,
        embedding=embedding,
        status=status_value
    )

    return jsonable_encoder(
        ChangeRequestResponse.model_validate(change_request).model_dump()
    )


# ============================================
# HEALTH CHECK
# ============================================

@app.get("/health")
def health_check():
    """Health check endpoint"""
    db_healthy = db_manager.health_check()
    return {
        "status": "healthy" if db_healthy else "unhealthy",
        "database": "connected" if db_healthy else "disconnected"
    }


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Requirements Management System API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)