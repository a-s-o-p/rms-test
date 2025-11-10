"""
Database Seeding Script
Populates database with realistic mock data for testing and development

Usage:
    python seed_database.py                    # Seed with default data
    python seed_database.py --clear            # Clear and reseed
    python seed_database.py --projects 5       # Create 5 projects
    python seed_database.py --small            # Small dataset
    python seed_database.py --large            # Large dataset
"""

import random
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any
from dotenv import load_dotenv
from openai import embeddings

from database import DatabaseManager, DatabaseConfig, init_db
from repositories import (
    ProjectRepository, StakeholderRepository, DocumentRepository,
    IdeaRepository, RequirementRepository, ChangeRequestRepository
)
from models import (
    ProjectStatus, DocumentType, IdeaStatus, IdeaPriority,
    RequirementType, RequirementStatus, ChangeRequestStatus
)
from rag import AIService

# Load environment
load_dotenv()

# ==================== MOCK DATA GENERATORS ====================
config = DatabaseConfig.from_env()
db = DatabaseManager(config)

def generate_embedding(session, text) -> List[float]:
    embedding = AIService(session).embed_texts(text)[0]
    return embedding


def random_date(start_days_ago: int = 90, end_days_ago: int = 0) -> datetime:
    """Generate random date within range"""
    start = datetime.now() - timedelta(days=start_days_ago)
    end = datetime.now() - timedelta(days=end_days_ago)
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)


# Project mock data
PROJECT_KEYS = [
    "DCIS"
]

PROJECT_TITLES = [
    "Drone Control Information System"
]

PROJECT_DESCRIPTIONS = [
    "Central platform for mission planning, flight control, telemetry, and compliance for unmanned aircraft systems."
]

# Stakeholder mock data
FIRST_NAMES = [
    "John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa",
    "James", "Maria", "William", "Patricia", "Richard", "Jennifer", "Thomas",
    "Linda", "Charles", "Elizabeth", "Daniel", "Susan"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin"
]

ROLES = [
    "Product Manager", "Lead Developer", "Senior Developer", "UX Designer",
    "QA Engineer", "DevOps Engineer", "Data Scientist", "Business Analyst",
    "Project Manager", "Technical Architect", "Security Engineer"
]

# Document mock data
DOCUMENT_TITLES = {
    DocumentType.SPECIFICATION: [
        "UAV System Requirements Specification",
        "Flight Control API Specification v1.0",
        "Ground Control Station (GCS) Architecture",
        "Telemetry & Data Pipeline Design",
        "Airspace Integration & UTM Guidelines",
        "Safety Protocols & Fail-Safe Modes"
    ],
    DocumentType.MEETING_NOTES: [
        "Mission Planning Sync",
        "BVLOS Compliance Review",
        "Obstacle Avoidance Workshop",
        "Daily Flight Ops Standup",
        "Architecture Decision Record — Autopilot",
        "Design Review — Remote ID Module"
    ],
    DocumentType.REPORT: [
        "Flight Test Report — Waypoint Missions",
        "Performance Analysis — Telemetry Throughput",
        "Safety Audit Report — Fail-Safe & RTL",
        "User Research — Pilot GCS Usability",
        "Airspace Rules Impact Analysis",
        "ROI Projection — Fleet Ops"
    ],
    DocumentType.EMAIL: [
        "Program Kickoff — DCIS",
        "Milestone Reached — First Autonomous Flight",
        "Change Request — Geofencing Rules Update",
        "Risk Update — Weather Service Outage",
        "Budget Approval — RTK GPS Integration",
        "Timeline Adjustment — UTM Certification"
    ],
    DocumentType.OTHER: [
        "Airframe Compatibility Matrix",
        "Test Range Checklist",
        "Pre-Flight Safety Card"
    ]
}

DOCUMENT_CONTENT_TEMPLATES = {
    DocumentType.SPECIFICATION: [
        "This document defines the architecture for the Drone Control Information System (DCIS). The flight stack uses {} with a {} backend. The system supports mission planning, live telemetry, and BVLOS operations with processing for {}.",
        "Specification outlines {} requirements for UAV control and GCS interfaces. Key technologies include {} and {}. Expected telemetry throughput is {} msgs/sec.",
        "Technical requirements for DCIS: Autopilot interface via {}, data store {}, front-end {} (GCS), deployment on {} with redundancy."
    ],
    DocumentType.MEETING_NOTES: [
        "Team discussed {} related to flight safety. Decisions: {}. Action items assigned to {}. Next test window scheduled for {}.",
        "Meeting focused on {} (UTM/Remote ID). Attendees: {}. Decisions: {}. Blockers: {}. Target certification date: {}.",
        "Sprint planning covered {} for mission planner. Velocity: {}. Priorities: {}. Risks: {}."
    ],
    DocumentType.REPORT: [
        "This report analyzes {} during flight trials. Findings: {}. Recommendations: {}. Expected impact: {}.",
        "Performance report for {}: Metrics show {}. Improvements needed in {}. Success rate: {}.",
        "Analysis of {} reveals {}. Key insights: {}. Action plan: {}."
    ]
}

# === Ideas (drone features) ===
IDEA_TITLES = [
    "Dynamic No-Fly Zone & Geofencing Updates",
    "Real-Time Telemetry Heatmap",
    "Swarm Mission Orchestration",
    "BVLOS Compliance Assistant",
    "On-board Obstacle Avoidance (CV)",
    "Mission Templates Library",
    "Weather & NOTAM Integration",
    "RTK GPS Support for Precision Landing",
    "Edge Video Streaming with Adaptive Bitrate",
    "Remote ID Broadcast & Verification",
    "Automated Pre-Flight Checklist",
    "Offline Mission Sync",
    "Failsafe: Return-to-Launch Enhancements",
    "UTM Corridor Routing",
    "Flight Log Analytics & Anomaly Detection",
    "Pilot Mobile Companion App",
    "Geo-tagged Incident Reporting",
    "Multi-UAV Handover Between GCS",
    "Battery Health Prediction",
    "3D Terrain-Aware Path Planning"
]

IDEA_DESCRIPTIONS = [
    "Pull and enforce live no-fly zones; update geofences mid-mission.",
    "Visualize telemetry intensity and link quality across airspace.",
    "Coordinate multiple UAVs with shared objectives and deconfliction.",
    "Guide pilots through BVLOS rules and automatic checks.",
    "Use onboard vision models to detect and avoid obstacles.",
    "Provide reusable mission templates for common operations.",
    "Ingest weather/NOWCast and NOTAMs to gate launches.",
    "Use RTK corrections for sub-decimeter landing accuracy.",
    "Stream video with adaptive bitrate based on link quality.",
    "Broadcast Remote ID and verify nearby drones’ identity.",
    "Generate and verify digital pre-flight checklists.",
    "Allow mission planning and execution without connectivity.",
    "Enhance RTL with smarter landing site selection.",
    "Plan routes within approved UTM corridors.",
    "Detect anomalies in flight logs using ML models.",
    "Lightweight app for pilots to monitor/control missions.",
    "Capture incidents with geo-tags and attach evidence.",
    "Seamlessly transfer control between ground stations.",
    "Predict pack degradation and remaining useful life.",
    "Compute paths using DEM/DTM and terrain clearance."
]

CATEGORIES = [
    "USER INTERFACE",
    "APPLICATION LOGIC",
    "API INTEGRATION",
    "DATA MANAGEMENT",
    "SECURITY",
    "PERFORMANCE",
    "INFRASTRUCTURE",
    "OPERATIONS",
    "COMPLIANCE",
    "USABILITY",
    "AVAILABILITY",
    "MAINTAINABILITY"
]

# === Requirements (drone-specific) ===
REQUIREMENT_TITLES = [
    "Mission Planning & Waypoint Execution",
    "Telemetry Ingest & Storage",
    "Remote ID Support",
    "UTM/USSP Integration",
    "Geofencing & No-Fly Enforcement",
    "Failsafe & RTL Logic",
    "Pilot Authentication & RBAC",
    "Link Health Monitoring",
    "Flight Log Audit Trail",
    "Weather/NOTAM Gatekeeping",
    "Obstacle Avoidance Interface",
    "Ground Control Session Management",
    "Video Streaming & Recording",
    "Battery & Health Telemetry",
    "3D Terrain & Elevation Data"
]

REQUIREMENT_DESCRIPTIONS = [
    "The system shall allow defining waypoint missions (speed, altitude, actions) and upload them to the UAV with live re-planning.",
    "System shall ingest telemetry at ≥ 50 Hz per UAV, persist raw and aggregated streams, and expose query APIs.",
    "System shall support Remote ID broadcast and verification per applicable standards with tamper-evident logs.",
    "Integrate with UTM/USSP for flight authorization, strategic deconfliction, and conformance monitoring.",
    "Enforce static/dynamic geofences with real-time updates; prevent arming and command breaches.",
    "Provide configurable fail-safes (RTL, land, hold) triggered by link loss, low battery, or geofence breach.",
    "Implement RBAC for pilots, ops managers, and observers; enforce least-privilege access.",
    "Continuously measure RSSI/SNR/throughput; surface alerts and degrade video bitrate automatically.",
    "Maintain immutable audit trail of commands, parameter changes, and mission edits.",
    "Block launches when weather or NOTAM thresholds are violated; provide override policy controls.",
    "Expose APIs to autopilot CV modules for obstacle detection and avoidance commands.",
    "Secure session handling for GCS with timeout and reconnection without command duplication.",
    "Support low-latency video with DVR capture and metadata timecodes aligned to telemetry.",
    "Track cell voltage, cycle count, temperature; compute SOC/SOH and predictive alerts.",
    "Provide terrain models (DEM/DTM) for clearance checks and altitude-above-ground control."
]

# ==================== SEEDING FUNCTIONS ====================

class DatabaseSeeder:
    """Main seeding class"""
    
    def __init__(self, db: DatabaseManager, verbose: bool = True):
        self.db = db
        self.verbose = verbose
        self.projects = []
        self.stakeholders_by_project = {}
        self.documents = []
        self.ideas = []
        self.requirements = []
        
    def log(self, message: str):
        """Log message if verbose"""
        if self.verbose:
            print(f"[SEED] {message}")
    
    def seed_projects(self, count: int = 1) -> List[Any]:
        """Seed projects"""
        self.log(f"Creating {count} projects...")
        
        with self.db.session_scope() as session:
            repo = ProjectRepository(session)
            
            for i in range(min(count, len(PROJECT_TITLES))):
                key = f"{PROJECT_KEYS[i]}-{random.randint(100, 999)}"
                title = PROJECT_TITLES[i]
                project_status = random.choice(list(ProjectStatus))
                project = repo.create(
                    key=key,
                    title=title,
                    project_status=project_status,
                    embedding=generate_embedding(session=session, text=f"KEY: {key} TITLE: {title} STATUS: {project_status}"
                    )
                )
                self.projects.append(project)
                self.log(f"  ✓ {project.key}: {project.title}")
        
        return self.projects
    
    def seed_stakeholders(self, per_project: int = 8) -> Dict[str, List[Any]]:
        """Seed stakeholders"""
        self.log(f"Creating {per_project} stakeholders per project...")
        
        with self.db.session_scope() as session:
            repo = StakeholderRepository(session)

            for project in self.projects:
                stakeholders = []
                for _ in range(per_project):
                    first_name = random.choice(FIRST_NAMES)
                    last_name = random.choice(LAST_NAMES)
                    email = f"{first_name.lower()}.{last_name.lower()}@company.com"
                    role = random.choice(ROLES)
                    stakeholder = repo.create(
                        project_id=project.id,
                        name=f"{first_name} {last_name}",
                        email=email,
                        role=role,
                        embedding=generate_embedding(session=session, text=f"ID: {project.id} NAME: {first_name} {last_name} EMAIL: {email} ROLE: {role}"
                        )
                    )
                    stakeholders.append(stakeholder)
                
                self.stakeholders_by_project[project.id] = stakeholders
                self.log(f"  ✓ Added {len(stakeholders)} stakeholders to {project.key}")
        
        return self.stakeholders_by_project
    
    def seed_documents(self, per_project: int = 30) -> List[Any]:
        """Seed documents"""
        self.log(f"Creating {per_project} documents per project...")
        
        with self.db.session_scope() as session:
            repo = DocumentRepository(session)
            
            for project in self.projects:
                stakeholders = self.stakeholders_by_project.get(project.id, [])
                
                for _ in range(per_project):
                    doc_type = random.choice(list(DocumentType))
                    title = random.choice(DOCUMENT_TITLES[doc_type])
                    
                    # Generate content
                    if doc_type in DOCUMENT_CONTENT_TEMPLATES:
                        template = random.choice(DOCUMENT_CONTENT_TEMPLATES[doc_type])
                        content = template.format(
                            project.title,
                            random.choice(["microservices", "monolithic", "serverless"]),
                            random.choice(["Node.js", "Python", "Java", "Go"]),
                            random.choice(["10,000 concurrent users", "high availability"]),
                            random.choice(["1000 requests/second", "real-time data"])
                        )
                    else:
                        content = f"Document content for {title} in project {project.title}. " \
                                 f"This document contains important information and specifications."
                    title = f"{title} - {random.randint(1, 99)}"
                    stakeholder_id = random.choice(stakeholders).id if stakeholders else None
                    document = repo.create(
                        project_id=project.id,
                        type=doc_type,
                        title=title,
                        text=content,
                        stakeholder_id=stakeholder_id,
                        embedding=generate_embedding(session=session, text=f"ID: {project.id} TYPE: {doc_type} TITLE: {title} TEXT: {content} STAKEHOLDER: {stakeholder_id}")
                    )
                    self.documents.append(document)
                
                self.log(f"  ✓ Added {per_project} documents to {project.key}")
        
        return self.documents
    
    def seed_ideas(self, per_project: int = 15) -> List[Any]:
        """Seed ideas"""
        self.log(f"Creating {per_project} ideas per project...")
        
        with self.db.session_scope() as session:
            repo = IdeaRepository(session)
            
            for project in self.projects:
                stakeholders = self.stakeholders_by_project.get(project.id, [])
                
                for i in range(min(per_project, len(IDEA_TITLES))):
                    stakeholder_id = random.choice(stakeholders).id if stakeholders else None
                    title = f"{IDEA_TITLES[i]} - {random.randint(1, 99)}"
                    description = IDEA_DESCRIPTIONS[i]
                    category = random.choice(CATEGORIES)
                    status = random.choice(list(IdeaStatus))
                    priority = random.choice(list(IdeaPriority))
                    impact = random.randint(5, 10)
                    confidence = random.randint(5, 10)
                    effort = random.randint(2, 8)

                    # Compose a rich context string for embedding
                    embed_text = (
                        f"ID: {project.id} "
                        f"STAKEHOLDER: {stakeholder_id} "
                        f"TITLE: {title} "
                        f"DESCRIPTION: {description} "
                        f"CATEGORY: {category} "
                        f"STATUS: {status.name if hasattr(status, 'name') else status} "
                        f"PRIORITY: {priority.name if hasattr(priority, 'name') else priority} "
                        f"IMPACT: {impact} "
                        f"CONFIDENCE: {confidence} "
                        f"EFFORT: {effort}"
                    )
                    idea = repo.create(
                        project_id=project.id,
                        stakeholder_id=stakeholder_id,
                        title=title,
                        description=description,
                        category=category,
                        status=status,
                        priority=priority,
                        impact=impact,
                        confidence=confidence,
                        effort=effort,
                        embedding=generate_embedding(session=session, text=embed_text)  # <- now contextual
                    )
                    self.ideas.append(idea)
                
                self.log(f"  ✓ Added {per_project} ideas to {project.key} (ICE scores calculated)")
        
        return self.ideas
    
    def seed_requirements(self, per_project: int = 20) -> List[Any]:
        """Seed requirements with versions"""
        self.log(f"Creating {per_project} requirements per project...")
        
        with self.db.session_scope() as session:
            repo = RequirementRepository(session)
            
            for project in self.projects:
                stakeholders = self.stakeholders_by_project.get(project.id, [])
                project_ideas = [idea for idea in self.ideas if idea.project_id == project.id]
                
                for i in range(min(per_project, len(REQUIREMENT_TITLES))):
                    # Create requirement
                    requirement = repo.create_requirement(project_id=project.id)

                    # Create initial version
                    stakeholder_id = random.choice(stakeholders).id if stakeholders else None
                    title = REQUIREMENT_TITLES[i]
                    description = REQUIREMENT_DESCRIPTIONS[i]
                    category = random.choice(CATEGORIES)
                    req_type = random.choice(list(RequirementType))
                    status = random.choice(list(RequirementStatus))
                    priority = random.randint(1, 5)

                    # 🧠 Compose a meaningful text for embedding
                    embed_text = (
                        f"REQUIREMENT ID: {requirement.id} "
                        f"PROJECT ID: {project.id} "
                        f"STAKEHOLDER: {stakeholder_id} "
                        f"TITLE: {title} "
                        f"DESCRIPTION: {description} "
                        f"CATEGORY: {category} "
                        f"TYPE: {req_type.name if hasattr(req_type, 'name') else req_type} "
                        f"STATUS: {status.name if hasattr(status, 'name') else status} "
                        f"PRIORITY: {priority}"
                    )

                    # Create version with real embedding
                    version = repo.create_version(
                        requirement_id=requirement.id,
                        stakeholder_id=stakeholder_id,
                        title=title,
                        description=description,
                        category=category,
                        type=req_type,
                        status=status,
                        priority=priority,
                        embedding=generate_embedding(session=session, text=embed_text)
                    )

                    # Link to some ideas (30% chance)
                    if project_ideas and random.random() < 0.3:
                        linked_ideas = random.sample(
                            project_ideas, 
                            min(random.randint(1, 3), len(project_ideas))
                        )
                        for idea in linked_ideas:
                            repo.link_idea(requirement.id, idea.id)
                    
                    # Sometimes create a second version (40% chance)
                    if random.random() < 0.4:
                        updated_description = REQUIREMENT_DESCRIPTIONS[i] + \
                            " Additional constraints: " + random.choice([
                                "Must support mobile devices",
                                "Performance requirement: < 200ms response time",
                                "Must comply with GDPR regulations",
                                "Should integrate with existing systems"
                            ])

                        # make variables explicit
                        stakeholder_id = random.choice(stakeholders).id if stakeholders else None
                        title = REQUIREMENT_TITLES[i]
                        description = updated_description
                        category = random.choice(CATEGORIES)
                        req_type = version.type
                        status = RequirementStatus.APPROVED
                        priority = version.priority
                        deps = f"REQ-{random.randint(100, 999)}"

                        # rich f-string for the embedding context
                        embed_text = (
                            f"REQUIREMENT ID: {requirement.id} "
                            f"PROJECT ID: {project.id} "
                            f"STAKEHOLDER: {stakeholder_id} "
                            f"TITLE: {title} "
                            f"DESCRIPTION: {description} "
                            f"CATEGORY: {category} "
                            f"TYPE: {getattr(req_type, 'name', req_type)} "
                            f"STATUS: {getattr(status, 'name', status)} "
                            f"PRIORITY: {priority} "
                            f"DEPENDENCIES: {deps}"
                        )

                        repo.create_version(
                            requirement_id=requirement.id,
                            stakeholder_id=stakeholder_id,
                            title=title,
                            description=description,
                            category=category,
                            type=req_type,
                            status=status,
                            priority=priority,
                            embedding=generate_embedding(session=session, text=embed_text),  # <-- real embedding
                            dependencies=deps,
                        )

                    self.requirements.append(requirement)
                
                self.log(f"  ✓ Added {per_project} requirements to {project.key}")
        
            return self.requirements
    
    def seed_change_requests(self, count: int = 10) -> List[Any]:
        """Seed change requests"""
        self.log(f"Creating {count} change requests...")
        
        change_requests = []
        
        with self.db.session_scope() as session:
            cr_repo = ChangeRequestRepository(session)
            req_repo = RequirementRepository(session)
            
            for requirement in random.sample(self.requirements, min(count, len(self.requirements))):
                versions = req_repo.get_all_versions(requirement.id)
                if not versions:
                    continue
                
                project_stakeholders = self.stakeholders_by_project.get(requirement.project_id, [])
                if not project_stakeholders:
                    continue
                
                base_version = versions[0]
                stakeholder_id = random.choice(project_stakeholders).id
                summary = random.choice([
                    "Add mobile support",
                    "Improve performance requirements",
                    "Add integration with third-party service",
                    "Update security requirements",
                    "Add accessibility features",
                    "Expand user roles and permissions"
                ])
                cost = f"{random.randint(3, 15)} developer days, ${random.randint(5, 50)}k budget"
                benefit = f"{random.randint(10, 40)}% improvement in {random.choice(['user adoption', 'performance', 'security', 'usability'])}"
                status = random.choice(list(ChangeRequestStatus))

                # rich context for the embedding
                embed_text = (
                    f"CHANGE REQUEST FOR REQUIREMENT: {requirement.id} "
                    f"STAKEHOLDER: {stakeholder_id} "
                    f"BASE_VERSION: {base_version.id} "
                    f"SUMMARY: {summary} "
                    f"COST: {cost} "
                    f"BENEFIT: {benefit} "
                    f"STATUS: {getattr(status, 'name', status)}"
                )
                change_request = cr_repo.create(
                    requirement_id=requirement.id,
                    stakeholder_id=random.choice(project_stakeholders).id,
                    base_version_id=base_version.id,
                    summary=random.choice([
                        "Add mobile support",
                        "Improve performance requirements",
                        "Add integration with third-party service",
                        "Update security requirements",
                        "Add accessibility features",
                        "Expand user roles and permissions"
                    ]),
                    cost=f"{random.randint(3, 15)} developer days, ${random.randint(5, 50)}k budget",
                    benefit=f"{random.randint(10, 40)}% improvement in {random.choice(['user adoption', 'performance', 'security', 'usability'])}",
                    embedding=generate_embedding(session=session, text=embed_text),
                    status=status
                )
                change_requests.append(change_request)
        
        self.log(f"  ✓ Created {len(change_requests)} change requests")
        return change_requests
    
    def seed_all(
        self, 
        projects: int = 1,
        stakeholders_per_project: int = 8,
        documents_per_project: int = 20,
        ideas_per_project: int = 10,
        requirements_per_project: int = 20,
        change_requests: int = 10
    ):
        """Seed all data"""
        self.log("=" * 60)
        self.log("STARTING DATABASE SEEDING")
        self.log("=" * 60)
        
        self.seed_projects(projects)
        self.seed_stakeholders(stakeholders_per_project)
        self.seed_documents(documents_per_project)
        self.seed_ideas(ideas_per_project)
        self.seed_requirements(requirements_per_project)
        self.seed_change_requests(change_requests)
        
        self.log("=" * 60)
        self.log("SEEDING COMPLETED")
        self.log("=" * 60)
        self.print_summary()
    
    def print_summary(self):
        """Print summary of seeded data"""
        print(f"\n📊 Database Summary:")
        print(f"  • Projects: {len(self.projects)}")
        print(f"  • Stakeholders: {sum(len(s) for s in self.stakeholders_by_project.values())}")
        print(f"  • Documents: {len(self.documents)}")
        print(f"  • Ideas: {len(self.ideas)}")
        print(f"  • Requirements: {len(self.requirements)}")
        print()


def clear_database(db: DatabaseManager):
    """Clear all data from database"""
    print("🗑️  Clearing database...")
    db.drop_all_tables()
    db.create_all_tables()
    print("✓ Database cleared and tables recreated")


def main():
    """Main seeding function"""
    parser = argparse.ArgumentParser(description="Seed database with mock data")
    parser.add_argument("--clear", action="store_true", help="Clear database before seeding")
    parser.add_argument("--projects", type=int, default=1, help="Number of projects")
    parser.add_argument("--stakeholders", type=int, default=10, help="Stakeholders per project")
    parser.add_argument("--documents", type=int, default=20, help="Documents per project")
    parser.add_argument("--ideas", type=int, default=10, help="Ideas per project")
    parser.add_argument("--requirements", type=int, default=20, help="Requirements per project")
    parser.add_argument("--change-requests", type=int, default=10, help="Total change requests")
    parser.add_argument("--small", action="store_true", help="Small dataset (2/3/5/8/5/10)")
    parser.add_argument("--large", action="store_true", help="Large dataset (10/8/20/20/15/50)")
    parser.add_argument("--quiet", action="store_true", help="Minimal output")
    
    args = parser.parse_args()
    
    # Preset configurations
    if args.small:
        args.projects = 1
        args.stakeholders = 3
        args.documents = 5
        args.ideas = 8
        args.requirements = 5
        args.change_requests = 10
    elif args.large:
        args.projects = 1
        args.stakeholders = 8
        args.documents = 20
        args.ideas = 20
        args.requirements = 15
        args.change_requests = 50
    
    # Initialize database
    db = init_db()
    
    try:
        # Health check
        if not db.health_check():
            print("❌ Database connection failed!")
            return
        
        print("✓ Database connection successful")
        
        # Clear if requested
        if args.clear:
            clear_database(db)
        
        # Create tables if they don't exist
        db.create_all_tables()

        # Seed data
        seeder = DatabaseSeeder(db, verbose=not args.quiet)
        seeder.seed_all(
            projects=args.projects,
            stakeholders_per_project=args.stakeholders,
            documents_per_project=args.documents,
            ideas_per_project=args.ideas,
            requirements_per_project=args.requirements,
            change_requests=args.change_requests
        )
        
        print("\n✅ Seeding completed successfully!")
        print(f"\nYou can now run: python example_usage.py")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()


if __name__ == "__main__":
    main()
