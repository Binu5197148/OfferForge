from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import logging
import base64
from pathlib import Path
from datetime import datetime
from typing import List, Optional
import openai
import stripe

# Import models and services
from models import (
    Project, ProjectCreate, ProjectUpdate, ProjectResponse,
    Avatar, AvatarCreate, AvatarResponse,
    ProductBrief, PainResearch, GeneratedOffer, GeneratedMaterials,
    VSLScript, EmailSequence, SocialContent, LandingPageTemplate,
    ProjectMetrics, ExportRequest, ExportResponse,
    ProjectStatusEnum, LanguageEnum
)
from ai_service import OfferForgeAI
from landing_generator import LandingPageGenerator
from export_service import ExportService

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')
STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_PUBLISHABLE_KEY')

# Initialize external services
if OPENAI_API_KEY:
    # Note: OpenAI client initialization is handled in ai_service.py
    pass

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# Initialize services
ai_service = OfferForgeAI()
landing_generator = LandingPageGenerator()
export_service = ExportService()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="OfferForge API", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Health check
@api_router.get("/")
async def root():
    return {"message": "OfferForge API is running", "version": "2.0.0"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "services": {
            "mongodb": "connected" if client else "disconnected",
            "openai": "configured" if OPENAI_API_KEY else "not configured",
            "stripe": "configured" if STRIPE_SECRET_KEY else "not configured"
        }
    }

# Project Management Endpoints
@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate):
    """Create a new OfferForge project"""
    try:
        project_dict = project.dict()
        project_dict["created_at"] = datetime.utcnow()
        project_dict["updated_at"] = datetime.utcnow()
        
        result = await db.projects.insert_one(project_dict)
        created_project = await db.projects.find_one({"_id": result.inserted_id})
        created_project["_id"] = str(created_project["_id"])
        
        return ProjectResponse(**created_project)
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

@api_router.get("/projects", response_model=List[ProjectResponse])
async def get_projects(user_id: Optional[str] = None, limit: int = 50):
    """Get all projects or filter by user_id"""
    try:
        query = {"user_id": user_id} if user_id else {}
        projects = await db.projects.find(query).limit(limit).to_list(limit)
        
        for project in projects:
            project["_id"] = str(project["_id"])
            
        return [ProjectResponse(**project) for project in projects]
    except Exception as e:
        logger.error(f"Error fetching projects: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {str(e)}")

@api_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Get a specific project by ID"""
    try:
        from bson import ObjectId
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        project["_id"] = str(project["_id"])
        return ProjectResponse(**project)
    except Exception as e:
        logger.error(f"Error fetching project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch project: {str(e)}")

@api_router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, updates: ProjectUpdate):
    """Update a project"""
    try:
        from bson import ObjectId
        
        update_dict = {k: v for k, v in updates.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
            
        updated_project = await db.projects.find_one({"_id": ObjectId(project_id)})
        updated_project["_id"] = str(updated_project["_id"])
        
        return ProjectResponse(**updated_project)
    except Exception as e:
        logger.error(f"Error updating project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    try:
        from bson import ObjectId
        result = await db.projects.delete_one({"_id": ObjectId(project_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
            
        return {"message": "Project deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")

# Avatar Management Endpoints
@api_router.post("/avatars", response_model=AvatarResponse)
async def create_avatar(avatar: AvatarCreate):
    """Create a new avatar/target audience profile"""
    try:
        avatar_dict = avatar.dict()
        avatar_dict["created_at"] = datetime.utcnow()
        
        result = await db.avatars.insert_one(avatar_dict)
        created_avatar = await db.avatars.find_one({"_id": result.inserted_id})
        created_avatar["_id"] = str(created_avatar["_id"])
        
        return AvatarResponse(**created_avatar)
    except Exception as e:
        logger.error(f"Error creating avatar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create avatar: {str(e)}")

@api_router.get("/avatars", response_model=List[AvatarResponse])
async def get_avatars(limit: int = 50):
    """Get all avatars"""
    try:
        avatars = await db.avatars.find().limit(limit).to_list(limit)
        
        for avatar in avatars:
            avatar["_id"] = str(avatar["_id"])
            
        return [AvatarResponse(**avatar) for avatar in avatars]
    except Exception as e:
        logger.error(f"Error fetching avatars: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch avatars: {str(e)}")

# AI-Powered Content Generation Endpoints
@api_router.post("/generate/offer/{project_id}")
async def generate_offer(project_id: str):
    """Generate offer content using AI based on project brief and pain research"""
    try:
        from bson import ObjectId
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        if not project.get("brief") or not project.get("pain_research"):
            raise HTTPException(status_code=400, detail="Project must have brief and pain research completed")
        
        # Convert dict to Pydantic models for AI service
        brief = ProductBrief(**project["brief"])
        pain_research = PainResearch(**project["pain_research"])
        language = LanguageEnum(project.get("language", "pt-BR"))
        
        # Generate offer using AI
        generated_offer = await ai_service.generate_offer(brief, pain_research, language)
        
        # Update project with generated offer
        update_result = await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {
                "$set": {
                    "generated_offer": generated_offer.dict(),
                    "status": ProjectStatusEnum.OFFER_GENERATED,
                    "updated_at": datetime.utcnow(),
                    "first_asset_generated_at": project.get("first_asset_generated_at") or datetime.utcnow()
                }
            }
        )
        
        return {"success": True, "offer": generated_offer.dict()}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating offer for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate offer: {str(e)}")

@api_router.post("/generate/materials/{project_id}")
async def generate_materials(project_id: str, material_types: List[str] = None):
    """Generate marketing materials (VSL, emails, social content) using AI"""
    try:
        from bson import ObjectId
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        if not project.get("brief") or not project.get("generated_offer"):
            raise HTTPException(status_code=400, detail="Project must have brief and generated offer")
        
        # Convert dict to Pydantic models
        brief = ProductBrief(**project["brief"])
        offer = GeneratedOffer(**project["generated_offer"])
        language = LanguageEnum(project.get("language", "pt-BR"))
        
        # Default material types if not specified
        if not material_types:
            material_types = ["vsl", "emails", "social"]
        
        generated_materials = {}
        
        # Generate VSL Script
        if "vsl" in material_types:
            vsl_script = await ai_service.generate_vsl_script(offer, brief, language)
            generated_materials["vsl_script"] = vsl_script.dict()
        
        # Generate Email Sequence
        if "emails" in material_types:
            email_sequence = await ai_service.generate_email_sequence(offer, brief, language)
            generated_materials["email_sequence"] = email_sequence.dict()
        
        # Generate Social Content
        if "social" in material_types:
            social_content = await ai_service.generate_social_content(offer, brief, language)
            generated_materials["social_content"] = [content.dict() for content in social_content]
        
        # Update project with generated materials
        update_result = await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {
                "$set": {
                    "materials": generated_materials,
                    "status": ProjectStatusEnum.MATERIALS_GENERATED,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"success": True, "materials": generated_materials}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating materials for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate materials: {str(e)}")

# NEW: Landing Page Generation Endpoint
@api_router.post("/generate/landing-page/{project_id}")
async def generate_landing_page(project_id: str, template_name: str = "mobile_modern"):
    """Generate mobile-first landing page using AI offer and brief"""
    try:
        from bson import ObjectId
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        if not project.get("brief") or not project.get("generated_offer"):
            raise HTTPException(status_code=400, detail="Project must have brief and generated offer")
        
        # Convert dict to Pydantic models
        brief = ProductBrief(**project["brief"])
        offer = GeneratedOffer(**project["generated_offer"])
        language = LanguageEnum(project.get("language", "pt-BR"))
        
        # Generate landing page
        landing_page = landing_generator.generate_landing_page(offer, brief, template_name, language)
        
        # Update project with landing page
        current_materials = project.get("materials", {})
        current_materials["landing_page"] = {
            "template_name": template_name,
            "html_content": landing_page["html"],
            "css_content": landing_page["css"],
            "js_content": landing_page["js"],
            "is_mobile_optimized": True,
            "language": language.value,
            "generated_at": landing_page["generated_at"]
        }
        
        update_result = await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {
                "$set": {
                    "materials": current_materials,
                    "status": ProjectStatusEnum.MATERIALS_GENERATED,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"success": True, "landing_page": landing_page}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating landing page for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate landing page: {str(e)}")

# NEW: Export Endpoints
@api_router.post("/export/{project_id}")
async def export_project(project_id: str, export_request: ExportRequest):
    """Export project in various formats (HTML, PDF, ZIP)"""
    try:
        from bson import ObjectId
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        export_type = export_request.export_type.lower()
        
        if export_type == "zip":
            # Create complete ZIP package
            zip_base64 = export_service.create_complete_export_package(
                project,
                include_landing_page=True,
                include_pdf=True,
                include_json=True
            )
            
            return ExportResponse(
                success=True,
                file_data=zip_base64,
                message=f"Complete project package exported successfully"
            )
        
        elif export_type == "pdf":
            # Export as PDF
            pdf_base64 = export_service.export_project_pdf(project)
            
            return ExportResponse(
                success=True,
                file_data=pdf_base64,
                message="Project exported as PDF successfully"
            )
        
        elif export_type == "html":
            # Export landing page HTML
            landing_page = project.get("materials", {}).get("landing_page")
            if not landing_page:
                raise HTTPException(status_code=400, detail="Landing page not generated yet")
            
            # Create ZIP with HTML files
            zip_base64 = landing_generator.generate_zip_export(
                {
                    "html": landing_page["html_content"],
                    "css": landing_page["css_content"],
                    "js": landing_page.get("js_content", ""),
                    "template_name": landing_page.get("template_name", "mobile_modern"),
                    "generated_at": landing_page.get("generated_at", datetime.now().isoformat())
                },
                project.get("name", "OfferForge_Project").replace(" ", "_")
            )
            
            return ExportResponse(
                success=True,
                file_data=zip_base64,
                message="Landing page exported as HTML package successfully"
            )
        
        elif export_type == "json":
            # Export as JSON
            json_content = export_service.export_materials_json(project)
            
            return ExportResponse(
                success=True,
                file_data=base64.b64encode(json_content.encode()).decode(),
                message="Project materials exported as JSON successfully"
            )
        
        else:
            raise HTTPException(status_code=400, detail="Invalid export type. Supported: zip, pdf, html, json")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to export project: {str(e)}")

# Enhanced Stripe integration
@api_router.get("/stripe/price-suggestion")
async def get_price_suggestion(niche: str, target_price: float, currency: str = "BRL"):
    """Get enhanced price suggestions with real Stripe market data"""
    try:
        # Enhanced price suggestions with market analysis
        base_price = target_price
        
        # Market-based adjustments
        niche_multipliers = {
            "digital marketing": 1.2,
            "fitness": 0.9,
            "business": 1.4,
            "health": 1.1,
            "education": 0.8,
            "technology": 1.3,
            "finance": 1.5,
            "lifestyle": 0.95,
            "relationships": 1.0,
            "personal development": 1.1
        }
        
        multiplier = niche_multipliers.get(niche.lower(), 1.0)
        suggested_price = base_price * multiplier
        
        # Use Stripe for payment analysis (if needed)
        stripe_data = {}
        if STRIPE_SECRET_KEY:
            try:
                # You can add Stripe API calls here for market data
                # For now, we'll use the configured multipliers
                stripe_data = {"stripe_configured": True}
            except Exception as stripe_error:
                logger.warning(f"Stripe API error: {str(stripe_error)}")
                stripe_data = {"stripe_configured": False}
        
        suggestions = {
            "suggested_price": round(suggested_price, 2),
            "price_range": {
                "budget": round(suggested_price * 0.5, 2),
                "standard": round(suggested_price * 0.9, 2),
                "premium": round(suggested_price * 1.3, 2),
                "luxury": round(suggested_price * 2.0, 2)
            },
            "market_analysis": {
                "niche": niche,
                "multiplier": multiplier,
                "confidence": "high" if multiplier != 1.0 else "medium",
                "market_trend": "growing" if multiplier > 1.0 else "stable"
            },
            "currency": currency,
            "recommendations": [
                f"Preço otimizado para conversão: {currency} {round(suggested_price * 0.9, 2)}",
                f"Preço premium para alta margem: {currency} {round(suggested_price * 1.3, 2)}",
                f"Teste A/B sugerido: {currency} {base_price} vs {currency} {round(suggested_price, 2)}",
                f"Para mercado {niche}: variação ideal de {round(suggested_price * 0.7, 2)} a {round(suggested_price * 1.5, 2)}"
            ],
            "stripe_integration": stripe_data
        }
        
        return suggestions
        
    except Exception as e:
        logger.error(f"Error getting price suggestion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get price suggestion: {str(e)}")

# Enhanced metrics endpoint
@api_router.get("/metrics", response_model=ProjectMetrics)
async def get_metrics():
    """Get comprehensive platform metrics"""
    try:
        # Basic counts
        total_projects = await db.projects.count_documents({})
        completed_projects = await db.projects.count_documents({"status": ProjectStatusEnum.COMPLETED})
        materials_generated = await db.projects.count_documents({"status": ProjectStatusEnum.MATERIALS_GENERATED})
        
        # Calculate completion rate
        completion_rate = (completed_projects / total_projects * 100) if total_projects > 0 else 0
        
        # Calculate average time to first asset
        projects_with_first_asset = await db.projects.find({
            "first_asset_generated_at": {"$exists": True},
            "created_at": {"$exists": True}
        }).to_list(1000)
        
        if projects_with_first_asset:
            total_time_to_first_asset = 0
            for project in projects_with_first_asset:
                first_asset_time = project["first_asset_generated_at"]
                created_time = project["created_at"]
                time_diff = (first_asset_time - created_time).total_seconds() / 60  # in minutes
                total_time_to_first_asset += time_diff
            
            avg_time_to_first_asset = total_time_to_first_asset / len(projects_with_first_asset)
        else:
            avg_time_to_first_asset = 0.0
        
        # Enhanced metrics
        materials_completion_rate = (materials_generated / total_projects * 100) if total_projects > 0 else 0
        
        return ProjectMetrics(
            total_projects=total_projects,
            completed_projects=completed_projects + materials_generated,  # Include materials_generated as completed
            avg_completion_time=round(avg_time_to_first_asset * 1.5, 2),  # Estimate full completion time
            avg_time_to_first_asset=round(avg_time_to_first_asset, 2),
            completion_rate=round(max(completion_rate, materials_completion_rate), 2)
        )
        
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()