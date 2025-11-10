# rag.py
import os
from typing import List, Dict, Any, Tuple
from instructor import patch
from openai import OpenAI
from database import DatabaseManager, DatabaseConfig
from models import Idea, RequirementVersion
from repositories import (
    ProjectRepository, DocumentRepository, IdeaRepository, RequirementRepository, ChangeRequestRepository,
    StakeholderRepository
)
from schemas import ExtractedIdeas, ExtractedRequirements, IdeaStatus, ChangeRequestBase, RequirementVersionBase
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ---- Normalization helpers ----
def _to_score(distance: float, metric: str) -> float:
    """
    Convert a distance to a 'higher is better' score for merging.
    - cosine distance in [0,2] (pgvector); smaller is better -> score=1/(1+dist)
    - l2 distance >=0; smaller is better -> score=1/(1+dist)
    - mips returns negative dot for ordering in some impls; treat as -dist
    """
    if metric in ("cosine", "l2"):
        return 1.0 / (1.0 + float(distance))
    return -float(distance)

def _pack(hit_type: str, rows: List[Tuple[Any, float]], topk: int) -> List[Dict[str, Any]]:
    out = []
    for obj, dist in rows[:topk]:
        out.append({
            "type": hit_type,
            "id": obj.id,
            "distance": float(dist),
            "score": _to_score(dist, "cosine"),  # adjust if you use other metric
            "data": {k: v for k, v in obj.__dict__.items() if not k.startswith('_')},  # ORM instance; you can serialize later
        })
    return out

DEFAULT_EMBED_MODEL = "text-embedding-3-small"

class AIService:
    def __init__(self, session):
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
        self.client = patch(self.openai_client)

        self.model = DEFAULT_EMBED_MODEL

        self.projects = ProjectRepository(session)
        self.documents = DocumentRepository(session)
        self.ideas = IdeaRepository(session)
        self.change_requests = ChangeRequestRepository(session)
        self.requirements = RequirementRepository(session)
        self.stakeholders = StakeholderRepository(session)

    def _format_context(self, hits: List[Dict]) -> str:
        context_parts = []

        # Group hits by type
        by_type = {}
        for hit in hits:
            hit_type = hit["type"]
            if hit_type not in by_type:
                by_type[hit_type] = []
            by_type[hit_type].append(hit)

        # Format Documents
        if "Document" in by_type:
            context_parts.append("## Relevant Documents:")
            for hit in by_type["Document"][:5]:  # Top 5
                doc = hit["data"]
                context_parts.append(f"\n### {doc.get('title', 'Untitled')} ({doc.get('type', 'unknown')})")
                context_parts.append(f"Relevance: {hit['score']:.2f}")
                text = doc.get('text', '')
                context_parts.append(f"{text[:500]}..." if len(text) > 500 else text)

        # Format Ideas
        if "Idea" in by_type:
            context_parts.append("\n\n## Existing Ideas:")
            for hit in by_type["Idea"][:5]:
                idea = hit["data"]
                context_parts.append(
                    f"\n- **{idea.get('title', 'Untitled')}** ({idea.get('category', 'uncategorized')})")
                context_parts.append(f"  Relevance: {hit['score']:.2f}")
                context_parts.append(
                    f"  Status: {idea.get('status', 'unknown')}, Priority: {idea.get('priority', 'unknown')}")
                context_parts.append(f"  ICE Score: {idea.get('ice_score', 'N/A')}")
                desc = idea.get('description', '')
                context_parts.append(f"  {desc[:200]}..." if len(desc) > 200 else f"  {desc}")

        # Format Requirements
        if "Requirement" in by_type:
            context_parts.append("\n\n## Related Requirements:")
            for hit in by_type["Requirement"][:5]:
                req = hit["data"]
                # Handle both RequirementVersion and Requirement objects
                title = req.get('title', 'Untitled')
                req_type = req.get('type', 'unknown')
                context_parts.append(f"\n- **{title}** ({req_type})")
                context_parts.append(f"  Relevance: {hit['score']:.2f}")
                desc = req.get('description', '')
                context_parts.append(f"  {desc[:200]}..." if len(desc) > 200 else f"  {desc}")

        # Format Projects
        if "Project" in by_type:
            context_parts.append("\n\n## Related Projects:")
            for hit in by_type["Project"][:5]:
                proj = hit["data"]
                context_parts.append(f"\n- **{proj.get('title', 'Untitled')}** (Key: {proj.get('key', 'N/A')})")
                context_parts.append(f"  Status: {proj.get('project_status', 'unknown')}")

        # Format Change Requests
        if "Change Request" in by_type:
            context_parts.append("\n\n## Recent Change Requests:")
            for hit in by_type["Change Request"][:5]:
                cr = hit["data"]
                context_parts.append(f"\n- {cr.get('summary', 'No summary')[:100]}")
                context_parts.append(f"  Status: {cr.get('status', 'unknown')}")

        # Format Stakeholders
        if "Stakeholder" in by_type:
            context_parts.append("\n\n## Related Stakeholders:")
            for hit in by_type["Stakeholder"][:5]:
                proj = hit["data"]
                context_parts.append(f"\n- **Name: {proj.get('name', 'Untitled')} {proj.get('surname', 'Untitled')})**")
                context_parts.append(f"  Role: {proj.get('role', 'unknown')}")


        return "\n".join(context_parts) if context_parts else "No relevant context found."

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        resp = self.openai_client.embeddings.create(model=self.model, input=texts)
        return [d.embedding for d in resp.data]

    def embed_query(self, text: str) -> List[float]:
        return self.embed_texts([text])[0]

    def retrieve(self, query: str, topk_per_type: int = 5) -> List[Dict[str, Any]]:
        embedding = self.embed_query(query)

        hits: List[Dict[str, Any]] = []
        # Projects
        hits += _pack("Project",
                      self.projects.search_similar(embedding=embedding, limit=topk_per_type),
                      topk_per_type)
        # Documents (can scope to project)
        hits += _pack("Document",
                      self.documents.search_similar(embedding=embedding, limit=topk_per_type),
                      topk_per_type)
        # Idea
        hits += _pack("Idea",
                      self.ideas.search_similar(embedding=embedding, limit=topk_per_type),
                      topk_per_type)
        # Change Requests
        hits += _pack("Change Request",
                      self.change_requests.search_similar(embedding=embedding, limit=topk_per_type),
                      topk_per_type)
        # Stakeholders
        hits += _pack("Stakeholder",
                      self.stakeholders.search_similar(embedding=embedding, limit=topk_per_type),
                      topk_per_type)
        # Requirements (by current_version embedding)
        req_rows = self.requirements.search_similar_requirements(embedding=embedding, limit=topk_per_type)
        # search_similar_requirements returns (RequirementVersion, distance). Convert to requirement object if needed:
        req_hits = []
        for ver, dist in req_rows:
            # ver.requirement is available via relationship; if not eagerly loaded, it will lazy-load
            req = ver.requirement if hasattr(ver, "requirement") else None
            req_hits.append((req or ver, dist))
        hits += _pack("Requirement", req_hits, topk_per_type)

        # Final re-rank by score across all types
        hits.sort(key=lambda h: h["score"], reverse=True)
        return hits

    def augment_query(self, text: str) -> List[str]:
        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """You are a helpful assistant that generates search queries.
                    Given a meeting transcript, generate search queries that would help find 
                    relevant context from a project database (documents, requirements, ideas).
                    Focus on key topics, technical terms, and main discussion points.
                    Generate search queries as you are not familiar with the problem and even industry.
                    Make sure you have asked what our project is, what is the purpose of this project and it's constaints.
                    Ensure everything discussed can be implemented from both physical world restructions, documentation, product goals, etc.
                    With those queries you will found as much context as you can.
                    This search system is a part of RAG so query in natural language.
                    Return each query on a new line."""
                },
                {
                    "role": "user",
                    "content": f"Generate search queries for this meeting:\n\n{text}"
                }
            ],
            temperature=0.01,
            max_tokens=2048
        )

        queries_text = response.choices[0].message.content
        queries = [q.strip().strip('-').strip('•').strip().strip('"').strip("'")
                   for q in queries_text.split('\n') if q.strip()]
        return [q for q in queries if len(q) > 10]

    def search(self, query: str, topk_per_type: int = 5) -> str:
        search_queries = self.augment_query(query)

        # Search with RAG
        all_hits = []
        seen_ids = set()

        for sq in search_queries:
            hits = self.retrieve(
                sq,
                topk_per_type=topk_per_type
            )

            for hit in hits:
                hit_key = (hit["type"], hit["id"])
                if hit_key not in seen_ids:
                    seen_ids.add(hit_key)
                    all_hits.append(hit)

        # Sort by score
        all_hits.sort(key=lambda h: h["score"], reverse=True)

        # Format context
        context = self._format_context(all_hits[:20])

        # Get answer from GPT
        response = self.openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """You are a project assistant. Answer questions based on the provided context.
                    Be clear, concise, and helpful. If the context doesn't have enough information, say so."""
                },
                {
                    "role": "user",
                    "content": f"""Question: {query}

Context:
{context}

Answer the question based on the context above."""
                }
            ],
            temperature=0.1,
            max_tokens=256
        )

        return response.choices[0].message.content

    def generate_ideas(
            self,
            text: str,
            topk_per_query: int = 10
    ) -> ExtractedIdeas:
        # Step 1: Generate search queries from meeting text
        print("🔍 Generating search queries...")
        search_queries = self.augment_query(text)
        print(f"Generated {len(search_queries)} search queries: {search_queries}")

        # Step 2: Search for relevant context using RAG
        print("🔎 Searching for relevant context...")
        all_hits = []
        seen_ids = set()

        for query in search_queries:
            print(f"  Searching: {query}")
            # Use your existing retrieval service
            hits = self.retrieve(
                query,
                topk_per_type=topk_per_query
            )

            # Merge results, avoiding duplicates
            for hit in hits:
                hit_key = (hit["type"], hit["id"])
                if hit_key not in seen_ids:
                    seen_ids.add(hit_key)
                    all_hits.append(hit)

        # Sort all hits by score
        all_hits.sort(key=lambda h: h["score"], reverse=True)

        # Count by type
        type_counts = {}
        for hit in all_hits:
            hit_type = hit["type"]
            type_counts[hit_type] = type_counts.get(hit_type, 0) + 1

        print(f"Found {len(all_hits)} total unique results:")
        for hit_type, count in type_counts.items():
            print(f"  - {hit_type}: {count}")

        # Step 3: Format context for GPT prompt
        formatted_context = self._format_context(all_hits[:30])  # Top 30 results

        # Step 4: Extract ideas using GPT with Instructor
        print("🤖 Extracting ideas with GPT...")

        system_prompt = """
You are an expert product analyst and requirements engineer.

Your single responsibility is to extract zero or more *actionable ideas* from the user's text.
Each idea must be:
- Directly relevant to the provided PROJECT_CONTEXT.
- Clear, specific, and feasible for that context.
- Non-duplicative with respect to what already exists in the context.
- Properly categorized and scored (Impact, Confidence, Effort, Priority).

Reasoning Principles:
1. Work strictly within PROJECT_CONTEXT — no imagination or invention beyond it.
2. If a concept is already covered by an existing idea or requirement, do not duplicate it; only refine if meaningful.
3. If the text contains unrelated, unclear, or joking content, ignore it completely.
4. Output nothing unless an idea clearly contributes to the described system.
5. Evaluate idea based on project capacity and context.
6. Make sure this idea can be created within project.

Scoring Framework (ICE):
- Impact (0–10): expected benefit or improvement to the system or its users (1 = trivial, 10 = massive).
- Confidence (0–10): how certain we are this will succeed, based on clues in text/context and with no huge changes in project cost or capacity (1 = trivial, 10 = massive).
- Effort (1–10): estimated work required (1 = trivial, 10 = massive).
- Priority: implementation priority of this idea based on value.
"""

        user_prompt = f"""
User Query:
{text}

---

Extract and return actionable ideas discussed in USER_QUERY
that are directly relevant to PROJECT_CONTEXT.

---

# Project Context:
{formatted_context}


"""

        extracted_ideas = self.client.chat.completions.create(
            model="gpt-4o",
            response_model=ExtractedIdeas,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.01,
            top_p=0.1,
            max_tokens=8192
        )

        print(f"✅ Extracted {len(extracted_ideas.ideas)} ideas")


        for idx, idea_data in enumerate(extracted_ideas.ideas, 1):
            print(f"  Saving idea {idx}/{len(extracted_ideas.ideas)}: {idea_data.title}")

            idea_text = f"{idea_data.title} {idea_data.description} {idea_data.category}"
            embedding = self.embed_query(idea_text)

        return extracted_ideas

    def generate_requirements(
            self,
            ideas: List[Idea],
            topk_per_query: int = 10
    ) -> ExtractedRequirements:
        # Step 1: Format ideas for context
        print("📋 Formatting ideas...")
        ideas_text = ""
        for idx, idea in enumerate(ideas, 1):
            ideas_text += str(idea)
        print(f"Processing {len(ideas)} ideas")

        # Step 2: Generate search queries based on ideas
        print("🔍 Generating search queries...")
        search_queries = self.augment_query(ideas_text)
        print(f"Generated {len(search_queries)} search queries")

        # Step 3: Search for relevant context using RAG
        print("🔎 Searching for relevant context...")
        all_hits = []
        seen_ids = set()

        for query in search_queries:
            print(f"  Searching: {query}")
            hits = self.retrieve(
                query,
                topk_per_type=topk_per_query
            )

            # Merge results, avoiding duplicates
            for hit in hits:
                hit_key = (hit["type"], hit["id"])
                if hit_key not in seen_ids:
                    seen_ids.add(hit_key)
                    all_hits.append(hit)

        # Sort all hits by score
        all_hits.sort(key=lambda h: h["score"], reverse=True)

        # Count by type
        type_counts = {}
        for hit in all_hits:
            hit_type = hit["type"]
            type_counts[hit_type] = type_counts.get(hit_type, 0) + 1

        print(f"Found {len(all_hits)} total unique results:")
        for hit_type, count in type_counts.items():
            print(f"  - {hit_type}: {count}")

        # Step 4: Format context for GPT prompt
        formatted_context = self._format_context(all_hits[:30])  # Top 30 results

        # Step 5: Generate requirements using GPT with Instructor
        print("🤖 Generating requirements with GPT...")

        system_prompt = """You are an expert requirements engineer and product analyst.
        Your task is to convert ideas into clear, actionable, testable requirements.

        Consider the provided context about existing documents, ideas, and requirements to:
        1. Ensure requirements don't conflict with existing ones
        2. Reference dependencies on other requirements
        3. Maintain consistency with project goals and constraints
        4. Create well-structured, testable requirements

        For each requirement:
        - Write clear, specific titles using standard requirement format (e.g., "System shall...")
        - Provide detailed descriptions with acceptance criteria
        - Categorize appropriately (matching existing categories when applicable)
        - Classify as functional, non-functional, or constraint
        - Identify conflicts and dependencies with existing requirements
        - Set appropriate priority (1=critical, 5=nice-to-have)
        - Start with DRAFT status

        Requirements Quality Guidelines:
        - Must be specific and measurable
        - Must be testable (how would you verify it?)
        - Must be complete (no ambiguity)
        - Must be consistent with other requirements
        - Should follow standard requirement patterns
        """

        user_prompt = f"""# Ideas to Convert:
    {ideas_text}

    ---

    # Project Context:
    {formatted_context}

    ---

    Based on the ideas above and the project context, generate formal requirements.

    For each requirement:
    - Convert the idea into a clear, testable requirement
    - Use appropriate requirement language (e.g., "The system shall...", "The user must be able to...")
    - Provide detailed description with acceptance criteria
    - Choose the correct requirement type (functional/non-functional/constraint)
    - Set priority based on the idea's priority and ICE score
    - Identify any conflicts with existing requirements
    - Note dependencies on other requirements or ideas
    - Use categories from existing requirements when applicable

    Important! Think critically about:
    - Is this requirement technically feasible given project constraints?
    - Does it conflict with existing requirements?
    - What are the dependencies?
    - Can this be tested/verified?
    - Is it specific enough to implement?
    """

        extracted_requirements = self.client.chat.completions.create(
            model="gpt-4o",
            response_model=ExtractedRequirements,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.01,
            max_tokens=8192
        )

        print(f"✅ Generated {len(extracted_requirements.requirements)} requirements")

        return extracted_requirements

    def generate_change_request(
            self,
            base_version: RequirementVersionBase,
            proposed_version: RequirementVersionBase,
            topk_per_query: int = 10
    ) -> ChangeRequestBase:
        # Step 1: Format the change for analysis
        print("🔍 Analyzing changes...")
        change_text = f"Base Version: {str(base_version)}, Proposed Version: {str(proposed_version)}"

        # Step 2: Generate search queries based on the change
        print("🔎 Generating search queries...")
        search_queries = self.augment_query(change_text)
        print(f"Generated {len(search_queries)} search queries")

        # Step 3: Search for relevant context using RAG
        print("🔎 Searching for relevant context...")
        all_hits = []
        seen_ids = set()

        for query in search_queries:
            print(f"  Searching: {query}")
            hits = self.retrieve(
                query,
                topk_per_type=topk_per_query
            )

            # Merge results, avoiding duplicates
            for hit in hits:
                hit_key = (hit["type"], hit["id"])
                if hit_key not in seen_ids:
                    seen_ids.add(hit_key)
                    all_hits.append(hit)

        # Sort all hits by score
        all_hits.sort(key=lambda h: h["score"], reverse=True)

        # Count by type
        type_counts = {}
        for hit in all_hits:
            hit_type = hit["type"]
            type_counts[hit_type] = type_counts.get(hit_type, 0) + 1

        print(f"Found {len(all_hits)} total unique results:")
        for hit_type, count in type_counts.items():
            print(f"  - {hit_type}: {count}")

        # Step 4: Format context for GPT prompt
        formatted_context = self._format_context(all_hits[:30])  # Top 30 results

        # Step 5: Analyze change impact using GPT with Instructor
        print("🤖 Analyzing change impact with GPT...")

        system_prompt = """You are an expert requirements engineer and change management analyst.
        Your task is to analyze proposed changes to requirements and assess their impact.

        Consider the provided context about existing documents, ideas, and requirements to:
        1. Identify all requirements that might be affected by this change
        2. Identify ideas that are related to this change
        3. Assess the technical feasibility and risks
        4. Estimate the effort required to implement the change
        5. Evaluate the benefits of making this change
        6. Provide a clear recommendation (approve, reject, or modify)

        Analysis Guidelines:
        - Be thorough in identifying dependencies and conflicts
        - Consider both technical and business impacts
        - Assess risks realistically
        - Provide actionable recommendations
        - Estimate effort on a scale of 1-10 (1=minimal, 10=massive)
        """

        user_prompt = f"""# Change Analysis Request:

    ## Current Version (Base):
    **Title:** {base_version.title}
    **Category:** {base_version.category}
    **Type:** {base_version.type.value}
    **Status:** {base_version.status.value}
    **Priority:** {base_version.priority}
    **Description:**
    {base_version.description}

    {f"**Dependencies:** {base_version.dependencies}" if base_version.dependencies else ""}
    {f"**Conflicts:** {base_version.conflicts}" if base_version.conflicts else ""}

    ---

    ## Proposed Version (New):
    **Title:** {proposed_version.title}
    **Category:** {proposed_version.category}
    **Type:** {proposed_version.type.value}
    **Status:** {proposed_version.status.value}
    **Priority:** {proposed_version.priority}
    **Description:**
    {proposed_version.description}

    {f"**Dependencies:** {proposed_version.dependencies}" if proposed_version.dependencies else ""}
    {f"**Conflicts:** {proposed_version.conflicts}" if proposed_version.conflicts else ""}

    ---

    # Project Context:
    {formatted_context}

    ---

    Analyze the change from the current version to the proposed version.

    For your analysis:
    1. **Impact Summary:** Describe what's changing and why it matters
    2. **Affected Requirements:** List requirement IDs/titles that might be impacted
    3. **Affected Ideas:** List idea IDs/titles that are related
    4. **Estimated Effort:** Rate 1-10 based on complexity (consider testing, documentation, implementation)
    5. **Risks:** What could go wrong? What are the technical challenges?
    6. **Benefits:** What value does this change bring?
    7. **Recommendation:** Should this be approved, rejected, or modified? Explain why.

    Important! Think critically about:
    - Does this conflict with existing requirements or constraints?
    - What are the ripple effects of this change?
    - Is the effort worth the benefit?
    - Are there any breaking changes?
    - What testing would be required?
    """

        change_request = self.client.chat.completions.create(
            model="gpt-4o",
            response_model=ChangeRequestBase,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.01,
            max_tokens=4096
        )

        print(f"✅ Change impact analysis completed")
        print(f"Change Request: {change_request}")

        return change_request

def example_usage():
    config = DatabaseConfig.from_env()
    db = DatabaseManager(config)

    with db.session_scope() as session:

        # Initialize extractor
        extractor = AIService(
            session=session
        )

        print("📋 Fetching requirement versions...")
        base_version = session.get(RequirementVersion, "f30012e3-b8ed-4902-a468-6ec1f0e948b8")
        proposed_version = session.get(RequirementVersion, "c65feb6d-4c9f-46a1-86e5-12deebbe90db")

        extractor.generate_change_request(
            base_version,
            proposed_version
        )

        # # Meeting text example
        # meeting_text = """
        # Team Meeting - Product Roadmap Discussion
        # Date: 2024-11-03
        #
        # Attendees: John (PM), Sarah (UX Designer), Mike (Engineering Lead)
        #
        # John: We should really focus on improving the user onboarding experience.
        # New users are dropping off at the registration step. Our analytics show
        # a 40% drop-off rate there.
        #
        # Sarah: I agree. Maybe we could add a progress indicator and make the form
        # shorter. We could collect additional info later in the user journey.
        #
        # Mike: What about social login? That would reduce friction significantly.
        # I've seen other products get 60% adoption of social login.
        #
        # John: Good idea! We should also add email verification to reduce spam accounts.
        # But we need to make sure the verification email doesn't end up in spam folders.
        #
        # Sarah: For the dashboard, users are confused about where to start.
        # We need better guidance and tooltips. Maybe an interactive tutorial?
        #
        # Mike: How about an interactive tutorial for first-time users? We could use
        # something like Intro.js. It shouldn't take more than a week to implement.
        #
        # John: That sounds good. Let's prioritize these based on impact and effort.
        # The social login seems like a quick win.
        # """
        #
        # # print("GenI", extractor.generate_ideas(meeting_text))
        # #
        # # print("Test", extractor.search("What is this?"))
        #
        # ideas = session.query(Idea).order_by(
        #     Idea.ice_score.desc()
        # ).limit(5).all()
        #
        # print(f"Converting {len(ideas)} ideas to requirements...")

        # # Generate requirements
        # requirements = extractor.generate_requirements(
        #     ideas=ideas,
        #     topk_per_query=10
        # )
        #
        # # Print results
        # print("\n" + "=" * 70)
        # print("GENERATED REQUIREMENTS:")
        # print("=" * 70)
        #
        # for i, req in enumerate(requirements.requirements, 1):
        #     print(f"\n{i}. {req.title}")
        #     print(f"   Type: {req.type.value} | Category: {req.category}")
        #     print(f"   Priority: {req.priority}/5 | Status: {req.status.value}")
        #     print(f"   Description: {req.description[:200]}...")
        #     if req.dependencies:
        #         print(f"   Dependencies: {req.dependencies}")
        #     if req.conflicts:
        #         print(f"   Conflicts: {req.conflicts}")
        #     print("-" * 70)

if __name__ == "__main__":
    example_usage()