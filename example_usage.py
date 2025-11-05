"""
Example usage of SQLAlchemy Database Manager
Demonstrates querying and working with existing database data

PREREQUISITE: Run seed_database.py first to populate the database
    python seed_database.py --small

This script demonstrates how to:
- Query existing projects, stakeholders, documents, ideas, requirements
- Use vector similarity search
- Navigate relationships between entities
- Filter and sort data
- Access related data through relationships
"""

from dotenv import load_dotenv
from openai import embeddings

from database import DatabaseManager, DatabaseConfig, init_db
from rag import EmbeddingService, RetrivalService
from repositories import (
    ProjectRepository,
    StakeholderRepository,
    DocumentRepository,
    IdeaRepository,
    RequirementRepository,
    ChangeRequestRepository
)
from models import (
    ProjectStatus, DocumentType, IdeaStatus, IdeaPriority,
    RequirementType, RequirementStatus, ChangeRequestStatus
)

# Load environment variables
load_dotenv()


def example_query_projects(db: DatabaseManager):
    """Example: Querying Projects"""
    print("\n" + "="*60)
    print("QUERYING PROJECTS")
    print("="*60)
    
    with db.session_scope() as session:
        project_repo = ProjectRepository(session)
        
        # Get all projects
        all_projects = project_repo.get_all(limit=10)
        print(f"✓ Total projects in database: {project_repo.count()}")
        print(f"✓ Showing first {len(all_projects)} projects:")
        for project in all_projects:
            print(f"  - {project.key}: {project.title} ({project.project_status.value})")
        
        if not all_projects:
            print("\n⚠️  No projects found! Run 'python seed_database.py' first.")
            return None
        
        # Get projects by status
        active_projects = project_repo.get_by_status(ProjectStatus.ACTIVE)
        print(f"\n✓ Active projects: {len(active_projects)}")
        
        # Get specific project by key
        first_project = all_projects[0]
        found = project_repo.get_by_key(first_project.key)
        if found:
            print(f"\n✓ Found project by key '{first_project.key}': {found.title}")
        
        return first_project


def example_query_stakeholders(db: DatabaseManager, project):
    """Example: Querying Stakeholders"""
    print("\n" + "="*60)
    print(f"QUERYING STAKEHOLDERS FOR PROJECT: {project.title}")
    print("="*60)
    
    with db.session_scope() as session:
        stakeholder_repo = StakeholderRepository(session)
        
        # Get all stakeholders for project
        stakeholders = stakeholder_repo.get_by_project(project.id)
        print(f"✓ Total stakeholders: {len(stakeholders)}")
        
        if not stakeholders:
            print("  No stakeholders found for this project")
            return None
        
        # Display stakeholders
        print("\n✓ Team members:")
        for stakeholder in stakeholders:
            print(f"  - {stakeholder.name} ({stakeholder.role})")
            print(f"    Email: {stakeholder.email}")
        
        # Get stakeholders by role
        if stakeholders:
            first_role = stakeholders[0].role
            same_role = stakeholder_repo.get_by_role(project.id, first_role)
            print(f"\n✓ Stakeholders with role '{first_role}': {len(same_role)}")
        
        # Find by email
        if stakeholders:
            first_email = stakeholders[0].email
            found = stakeholder_repo.get_by_email(first_email)
            if found:
                print(f"\n✓ Found stakeholder by email: {found.name}")
        
        return stakeholders[0] if stakeholders else None


def example_query_documents(db: DatabaseManager, project):
    """Example: Querying Documents"""
    print("\n" + "="*60)
    print(f"QUERYING DOCUMENTS FOR PROJECT: {project.title}")
    print("="*60)
    
    with db.session_scope() as session:
        doc_repo = DocumentRepository(session)
        
        # Get all documents for project
        documents = doc_repo.get_by_project(project.id)
        print(f"✓ Total documents: {len(documents)}")
        
        if not documents:
            print("  No documents found for this project")
            return None
        
        # Display documents by type
        doc_types = {}
        for doc in documents:
            doc_type = doc.type.value
            if doc_type not in doc_types:
                doc_types[doc_type] = []
            doc_types[doc_type].append(doc)
        
        print("\n✓ Documents by type:")
        for doc_type, docs in doc_types.items():
            print(f"  {doc_type}: {len(docs)} documents")
            for doc in docs[:3]:  # Show first 3
                print(f"    - {doc.title}")
        
        # Get specifications only
        specs = doc_repo.get_by_project(project.id, doc_type=DocumentType.SPECIFICATION)
        if specs:
            print(f"\n✓ Specification documents: {len(specs)}")
            for spec in specs[:2]:
                print(f"  - {spec.title}")
        
        return documents[0] if documents else None


def example_vector_search_documents(db: DatabaseManager, project, sample_doc):
    """Example: Vector similarity search on documents"""
    if not sample_doc or not sample_doc.embedding.any():
        print("\n⚠️  No document with embedding found for similarity search")
        return
    
    print("\n" + "="*60)
    print(f"VECTOR SIMILARITY SEARCH: Finding documents similar to '{sample_doc.title}'")
    print("="*60)
    
    with db.session_scope() as session:
        doc_repo = DocumentRepository(session)
        
        # Find similar documents using the sample document's embedding
        similar_docs = doc_repo.search_similar(
            embedding=sample_doc.embedding,
            limit=5
        )
        
        print(f"✓ Found {len(similar_docs)} similar documents:")
        for doc, distance in similar_docs:
            print(f"  - {doc.title}")
            print(f"    Type: {doc.type.value}, Distance: {distance:.4f}")


def example_query_ideas(db: DatabaseManager, project):
    """Example: Querying Ideas with ICE scores"""
    print("\n" + "="*60)
    print(f"QUERYING IDEAS FOR PROJECT: {project.title}")
    print("="*60)
    
    with db.session_scope() as session:
        idea_repo = IdeaRepository(session)
        
        # Get all ideas for project
        ideas = idea_repo.get_by_project(project.id)
        print(f"✓ Total ideas: {len(ideas)}")
        
        if not ideas:
            print("  No ideas found for this project")
            return None
        
        # Get top ideas by ICE score
        top_ideas = idea_repo.get_top_by_ice_score(project.id, limit=5)
        print(f"\n✓ Top {len(top_ideas)} ideas by ICE score:")
        for i, idea in enumerate(top_ideas, 1):
            print(f"  {i}. {idea.title}")
            print(f"     ICE Score: {idea.ice_score:.2f} (Impact: {idea.impact}, "
                  f"Confidence: {idea.confidence}, Effort: {idea.effort})")
            print(f"     Status: {idea.status.value}, Priority: {idea.priority.value}")
        
        # Get ideas by status
        proposed_ideas = idea_repo.get_by_project(project.id, status=IdeaStatus.PROPOSED)
        print(f"\n✓ Proposed ideas: {len(proposed_ideas)}")
        
        return ideas[0] if ideas else None


def example_query_requirements(db: DatabaseManager, project):
    """Example: Querying Requirements and Versions"""
    print("\n" + "="*60)
    print(f"QUERYING REQUIREMENTS FOR PROJECT: {project.title}")
    print("="*60)
    
    with db.session_scope() as session:
        req_repo = RequirementRepository(session)
        
        # Get all requirements for project
        requirements = req_repo.get_by_project(project.id)
        print(f"✓ Total requirements: {len(requirements)}")
        
        if not requirements:
            print("  No requirements found for this project")
            return None
        
        # Display requirements with version info
        print("\n✓ Requirements:")
        for req in requirements[:5]:  # Show first 5
            if req.current_version:
                print(f"  - {req.current_version.title}")
                
                # Get all versions
                versions = req_repo.get_all_versions(req.id)
                print(f"    Versions: {len(versions)}, "
                      f"Current: v{req.current_version.version_number}, "
                      f"Status: {req.current_version.status.value}")
                
                # Show version history if multiple versions
                if len(versions) > 1:
                    print(f"    Version history:")
                    for version in versions:
                        print(f"      v{version.version_number}: {version.status.value}")
        
        # Show requirement with linked ideas
        for req in requirements:
            if req.ideas:
                print(f"\n✓ Requirement '{req.current_version.title if req.current_version else 'Unknown'}' "
                      f"linked to {len(req.ideas)} ideas:")
                for idea in req.ideas[:3]:
                    print(f"  - {idea.title}")
                break
        
        return requirements[0] if requirements else None


def example_query_change_requests(db: DatabaseManager, project):
    """Example: Querying Change Requests"""
    print("\n" + "="*60)
    print(f"QUERYING CHANGE REQUESTS FOR PROJECT: {project.title}")
    print("="*60)
    
    with db.session_scope() as session:
        cr_repo = ChangeRequestRepository(session)
        req_repo = RequirementRepository(session)
        
        # Get all requirements for project
        requirements = req_repo.get_by_project(project.id)
        
        total_crs = 0
        for req in requirements:
            crs = cr_repo.get_by_requirement(req.id)
            total_crs += len(crs)
        
        print(f"✓ Total change requests in project: {total_crs}")
        
        if total_crs == 0:
            print("  No change requests found")
            return
        
        # Show change requests by status
        print("\n✓ Change requests by requirement:")
        for req in requirements[:5]:
            crs = cr_repo.get_by_requirement(req.id)
            if crs:
                req_title = req.current_version.title if req.current_version else "Unknown"
                print(f"  {req_title}: {len(crs)} change requests")
                
                for cr in crs[:2]:  # Show first 2
                    print(f"    - {cr.summary}")
                    print(f"      Status: {cr.status.value}, Cost: {cr.cost}")


def example_relationships(db: DatabaseManager, project):
    """Example: Navigating relationships"""
    print("\n" + "="*60)
    print(f"EXPLORING RELATIONSHIPS FOR PROJECT: {project.title}")
    print("="*60)
    
    with db.session_scope() as session:
        project_repo = ProjectRepository(session)
        
        # Reload project with relationships
        project = project_repo.get_by_id(project.id)
        
        # Access related entities through relationships
        print(f"\n✓ Project: {project.title}")
        print(f"  - Stakeholders: {len(project.stakeholders)}")
        print(f"  - Documents: {len(project.documents)}")
        print(f"  - Ideas: {len(project.ideas)}")
        print(f"  - Requirements: {len(project.requirements)}")
        
        # Show stakeholder's contributions
        if project.stakeholders:
            stakeholder = project.stakeholders[0]
            print(f"\n✓ Stakeholder: {stakeholder.name}")
            print(f"  - Documents authored: {len(stakeholder.documents)}")
            print(f"  - Ideas created: {len(stakeholder.ideas)}")
            print(f"  - Requirement versions: {len(stakeholder.requirement_versions)}")
            print(f"  - Change requests: {len(stakeholder.change_requests)}")
        
        # Show document author
        if project.documents:
            doc = project.documents[0]
            if doc.stakeholder:
                print(f"\n✓ Document: {doc.title}")
                print(f"  Author: {doc.stakeholder.name} ({doc.stakeholder.role})")


def example_aggregations(db: DatabaseManager):
    """Example: Aggregations and statistics"""
    print("\n" + "="*60)
    print("DATABASE STATISTICS")
    print("="*60)
    
    with db.session_scope() as session:
        project_repo = ProjectRepository(session)
        stakeholder_repo = StakeholderRepository(session)
        doc_repo = DocumentRepository(session)
        idea_repo = IdeaRepository(session)
        req_repo = RequirementRepository(session)
        
        print(f"\n✓ Total counts:")
        print(f"  - Projects: {project_repo.count()}")
        print(f"  - Stakeholders: {stakeholder_repo.count()}")
        print(f"  - Documents: {doc_repo.count()}")
        print(f"  - Ideas: {idea_repo.count()}")
        print(f"  - Requirements: {req_repo.count()}")
        
        # Projects by status
        print(f"\n✓ Projects by status:")
        for status in ProjectStatus:
            count = len(project_repo.get_by_status(status))
            if count > 0:
                print(f"  - {status.value}: {count}")


def main():
    """Main example function"""
    print("\n" + "="*60)
    print("DATABASE QUERY EXAMPLES")
    print("="*60)
    print("\nPrerequisite: Database should be populated with data")
    print("Run: python seed_database.py --small")
    print("="*60)
    
    # Initialize database
    config = DatabaseConfig.from_env()
    db = DatabaseManager(config)
    
    try:
        # Health check
        if not db.health_check():
            print("✗ Database connection failed!")
            return
        
        print("✓ Database connection successful")
        
        # Ensure tables exist
        db.create_all_tables()
        print("✓ Tables verified")
        
        # Query examples
        project = example_query_projects(db)
        
        if not project:
            print("\n" + "="*60)
            print("⚠️  DATABASE IS EMPTY")
            print("="*60)
            print("\nPlease populate the database first:")
            print("  python seed_database.py --small")
            print("\nThen run this script again:")
            print("  python example_usage.py")
            return
        
        stakeholder = example_query_stakeholders(db, project)
        document = example_query_documents(db, project)
        
        if document:
            example_vector_search_documents(db, project, document)
        
        example_query_ideas(db, project)
        example_query_requirements(db, project)
        example_query_change_requests(db, project)
        example_relationships(db, project)
        example_aggregations(db)

        print("\n" + "="*60)
        print("✅ ALL EXAMPLES COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("\nNext steps:")
        print("  - Explore the data using the repository classes")
        print("  - Try vector similarity searches")
        print("  - Build your own queries")
        print("  - Run tests: pytest test_database.py -v")

        query = "weather"
        print(f"Running RAG search for: {query}")

        with db.session_scope() as session:
            retrival = RetrivalService(session)
            embedding = EmbeddingService()
            emb = embedding.embed_query(query)
            results = retrival.search(emb, topk_per_type=5)

            print(f"Query: {query}")

            print(f"\nFound {len(results)} hits:")
            for r in results:
                print(f"  - [{r['type']}] id={r['id']} score={r['score']:.4f} dist={r['distance']:.4f}")


    except Exception as e:
        print(f"\n❌ Error occurred: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean up
        db.close()
        print("\nDatabase connection closed.")


if __name__ == "__main__":
    main()
