from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class LanguageEnum(str, Enum):
    PT_BR = "pt-BR"
    EN_US = "en-US"

class ProjectStatusEnum(str, Enum):
    DRAFT = "draft"
    BRIEF_COMPLETED = "brief_completed"
    RESEARCH_COMPLETED = "research_completed"
    OFFER_GENERATED = "offer_generated"
    MATERIALS_GENERATED = "materials_generated"
    COMPLETED = "completed"

# Avatar/Target Audience Models
class Avatar(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    age_range: str
    gender: Optional[str] = None
    interests: List[str] = []
    pain_points: List[str] = []
    goals: List[str] = []
    income_level: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AvatarCreate(BaseModel):
    name: str
    age_range: str
    gender: Optional[str] = None
    interests: List[str] = []
    pain_points: List[str] = []
    goals: List[str] = []
    income_level: Optional[str] = None

# Product Brief Models
class ProductBrief(BaseModel):
    niche: str
    avatar_id: str
    promise: str
    target_price: float
    currency: str = "BRL"
    additional_notes: Optional[str] = None

# Pain Research Models
class PainPoint(BaseModel):
    description: str
    frequency: int = 1
    source: str  # "manual", "csv", "review"
    category: Optional[str] = None

class PainResearch(BaseModel):
    pain_points: List[PainPoint] = []
    reviews: List[str] = []
    faqs: List[str] = []
    manual_input: Optional[str] = None
    csv_data: Optional[str] = None

# Offer Generation Models
class GeneratedOffer(BaseModel):
    headline: str
    main_promise: str
    proof_elements: List[str] = []
    bonuses: List[str] = []
    guarantees: List[str] = []
    price_justification: str
    urgency_elements: List[str] = []

# Materials Models
class VSLScript(BaseModel):
    title: str
    hook: str
    problem_agitation: str
    solution_intro: str
    benefits: List[str] = []
    social_proof: str
    offer_presentation: str
    guarantee: str
    call_to_action: str
    estimated_duration: int = 90  # seconds
    language: LanguageEnum = LanguageEnum.PT_BR

class EmailSequence(BaseModel):
    sequence_name: str
    emails: List[Dict[str, str]] = []  # [{"subject": "", "content": ""}]
    language: LanguageEnum = LanguageEnum.PT_BR

class SocialContent(BaseModel):
    platform: str  # "instagram", "facebook", "linkedin"
    content_type: str  # "post", "story", "carousel"
    content: str
    hashtags: List[str] = []
    language: LanguageEnum = LanguageEnum.PT_BR

class LandingPageTemplate(BaseModel):
    template_name: str
    html_content: str
    css_content: str
    is_mobile_optimized: bool = True
    language: LanguageEnum = LanguageEnum.PT_BR

class GeneratedMaterials(BaseModel):
    vsl_script: Optional[VSLScript] = None
    email_sequence: Optional[EmailSequence] = None
    social_content: List[SocialContent] = []
    landing_page: Optional[LandingPageTemplate] = None

# Main Project Model
class Project(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    user_id: str
    language: LanguageEnum = LanguageEnum.PT_BR
    status: ProjectStatusEnum = ProjectStatusEnum.DRAFT
    
    # Core Components
    brief: Optional[ProductBrief] = None
    pain_research: Optional[PainResearch] = None
    generated_offer: Optional[GeneratedOffer] = None
    materials: Optional[GeneratedMaterials] = None
    
    # Timestamps & Metrics
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    first_asset_generated_at: Optional[datetime] = None
    completion_time: Optional[float] = None  # in minutes
    
    # Export tracking
    exports: List[Dict[str, Any]] = []  # Track export history

class ProjectCreate(BaseModel):
    name: str
    user_id: str
    language: LanguageEnum = LanguageEnum.PT_BR

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[ProjectStatusEnum] = None
    brief: Optional[ProductBrief] = None
    pain_research: Optional[PainResearch] = None
    generated_offer: Optional[GeneratedOffer] = None
    materials: Optional[GeneratedMaterials] = None

# API Response Models
class ProjectResponse(Project):
    class Config:
        populate_by_name = True

class AvatarResponse(Avatar):
    class Config:
        populate_by_name = True

# Metrics Models
class ProjectMetrics(BaseModel):
    total_projects: int
    completed_projects: int
    avg_completion_time: float
    avg_time_to_first_asset: float
    completion_rate: float

# Export Models
class ExportRequest(BaseModel):
    project_id: str
    export_type: str  # "html", "pdf", "zip"
    include_assets: bool = True

class ExportResponse(BaseModel):
    success: bool
    file_url: Optional[str] = None
    file_data: Optional[str] = None  # base64 for small files
    message: str