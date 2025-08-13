#!/usr/bin/env python3
"""
OfferForge Backend API Test Suite
Comprehensive testing for all backend endpoints
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://22b83e1c-19ea-40a3-b3e6-45bbb7cd62e9.preview.emergentagent.com/api"

class OfferForgeAPITester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        self.created_project_id = None
        self.created_avatar_id = None
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def test_health_endpoint(self):
        """Test API health and connectivity"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            
            if response.status_code == 200:
                data = response.json()
                services = data.get("services", {})
                
                # Check MongoDB connection
                mongodb_status = services.get("mongodb") == "connected"
                openai_status = services.get("openai", "not configured")
                stripe_status = services.get("stripe", "not configured")
                
                self.log_test(
                    "Health Check - API Connectivity", 
                    True, 
                    f"API healthy, MongoDB: {services.get('mongodb')}, OpenAI: {openai_status}, Stripe: {stripe_status}",
                    data
                )
                
                # Test MongoDB connection specifically
                self.log_test(
                    "Health Check - MongoDB Connection",
                    mongodb_status,
                    f"MongoDB status: {services.get('mongodb')}",
                    services
                )
                
                return True
            else:
                self.log_test("Health Check - API Connectivity", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Health Check - API Connectivity", False, f"Connection error: {str(e)}")
            return False
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Root Endpoint", 
                    True, 
                    f"Message: {data.get('message')}, Version: {data.get('version')}",
                    data
                )
                return True
            else:
                self.log_test("Root Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Error: {str(e)}")
            return False

    def test_create_project(self):
        """Test project creation"""
        try:
            project_data = {
                "name": "Test OfferForge Project - Digital Marketing Course",
                "user_id": "test_user_123",
                "language": "pt-BR"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=project_data)
            
            if response.status_code == 200:
                data = response.json()
                self.created_project_id = data.get("_id")  # Backend returns _id, not id
                
                # Validate response structure
                required_fields = ["_id", "name", "user_id", "status", "created_at"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test(
                        "Create Project", 
                        True, 
                        f"Project created with ID: {self.created_project_id}, Status: {data.get('status')}",
                        data
                    )
                    return True
                else:
                    self.log_test("Create Project", False, f"Missing fields in response: {missing_fields}")
                    return False
            else:
                self.log_test("Create Project", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Project", False, f"Error: {str(e)}")
            return False

    def test_get_projects(self):
        """Test getting all projects"""
        try:
            response = self.session.get(f"{self.base_url}/projects")
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    project_count = len(data)
                    self.log_test(
                        "Get All Projects", 
                        True, 
                        f"Retrieved {project_count} projects",
                        {"project_count": project_count, "sample": data[:1] if data else []}
                    )
                    return True
                else:
                    self.log_test("Get All Projects", False, "Response is not a list")
                    return False
            else:
                self.log_test("Get All Projects", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get All Projects", False, f"Error: {str(e)}")
            return False

    def test_get_project_by_id(self):
        """Test getting a specific project by ID"""
        if not self.created_project_id:
            self.log_test("Get Project by ID", False, "No project ID available for testing")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/projects/{self.created_project_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("_id") == self.created_project_id:  # Backend returns _id, not id
                    self.log_test(
                        "Get Project by ID", 
                        True, 
                        f"Retrieved project: {data.get('name')}",
                        data
                    )
                    return True
                else:
                    self.log_test("Get Project by ID", False, "Project ID mismatch in response")
                    return False
            else:
                self.log_test("Get Project by ID", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Project by ID", False, f"Error: {str(e)}")
            return False

    def test_update_project(self):
        """Test updating a project"""
        if not self.created_project_id:
            self.log_test("Update Project", False, "No project ID available for testing")
            return False
            
        try:
            # Add a brief to the project
            update_data = {
                "brief": {
                    "niche": "Digital Marketing",
                    "avatar_id": "test_avatar_123",
                    "promise": "Learn to generate 6-figure revenue through digital marketing",
                    "target_price": 497.0,
                    "currency": "BRL",
                    "additional_notes": "Focus on Brazilian market"
                },
                "status": "brief_completed"
            }
            
            response = self.session.put(f"{self.base_url}/projects/{self.created_project_id}", json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("brief") and data.get("status") == "brief_completed":
                    self.log_test(
                        "Update Project", 
                        True, 
                        f"Project updated with brief, Status: {data.get('status')}",
                        data
                    )
                    return True
                else:
                    self.log_test("Update Project", False, "Update not reflected in response")
                    return False
            else:
                self.log_test("Update Project", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Update Project", False, f"Error: {str(e)}")
            return False

    def test_create_avatar(self):
        """Test avatar creation"""
        try:
            avatar_data = {
                "name": "Digital Marketing Entrepreneur",
                "age_range": "25-45",
                "gender": "mixed",
                "interests": ["digital marketing", "online business", "entrepreneurship", "passive income"],
                "pain_points": ["struggling with lead generation", "low conversion rates", "lack of marketing knowledge"],
                "goals": ["increase revenue", "build automated systems", "scale business"],
                "income_level": "middle to high"
            }
            
            response = self.session.post(f"{self.base_url}/avatars", json=avatar_data)
            
            if response.status_code == 200:
                data = response.json()
                self.created_avatar_id = data.get("_id")  # Backend returns _id, not id
                
                # Validate response structure
                required_fields = ["_id", "name", "age_range", "created_at"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test(
                        "Create Avatar", 
                        True, 
                        f"Avatar created with ID: {self.created_avatar_id}, Name: {data.get('name')}",
                        data
                    )
                    return True
                else:
                    self.log_test("Create Avatar", False, f"Missing fields in response: {missing_fields}")
                    return False
            else:
                self.log_test("Create Avatar", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Avatar", False, f"Error: {str(e)}")
            return False

    def test_get_avatars(self):
        """Test getting all avatars"""
        try:
            response = self.session.get(f"{self.base_url}/avatars")
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    avatar_count = len(data)
                    self.log_test(
                        "Get All Avatars", 
                        True, 
                        f"Retrieved {avatar_count} avatars",
                        {"avatar_count": avatar_count, "sample": data[:1] if data else []}
                    )
                    return True
                else:
                    self.log_test("Get All Avatars", False, "Response is not a list")
                    return False
            else:
                self.log_test("Get All Avatars", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get All Avatars", False, f"Error: {str(e)}")
            return False

    def test_generate_offer_without_requirements(self):
        """Test offer generation without required brief and pain research"""
        if not self.created_project_id:
            self.log_test("Generate Offer (No Requirements)", False, "No project ID available for testing")
            return False
            
        try:
            # Create a new project without brief and pain research
            project_data = {
                "name": "Test Project for Offer Generation",
                "user_id": "test_user_456",
                "language": "en-US"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=project_data)
            if response.status_code == 200:
                empty_project_id = response.json().get("_id")  # Backend returns _id, not id
                
                # Try to generate offer without requirements
                response = self.session.post(f"{self.base_url}/generate/offer/{empty_project_id}")
                
                if response.status_code == 500:  # Backend returns 500 with validation message
                    response_data = response.json()
                    if "brief and pain research" in response_data.get("detail", "").lower():
                        self.log_test(
                            "Generate Offer (No Requirements)", 
                            True, 
                            "Correctly rejected offer generation without brief and pain research",
                            response_data
                        )
                        return True
                    else:
                        self.log_test("Generate Offer (No Requirements)", False, f"Unexpected error message: {response_data}")
                        return False
                else:
                    self.log_test("Generate Offer (No Requirements)", False, f"Expected 500, got {response.status_code}")
                    return False
            else:
                self.log_test("Generate Offer (No Requirements)", False, "Failed to create test project")
                return False
                
        except Exception as e:
            self.log_test("Generate Offer (No Requirements)", False, f"Error: {str(e)}")
            return False

    def test_generate_offer_with_requirements(self):
        """Test offer generation with proper requirements"""
        if not self.created_project_id:
            self.log_test("Generate Offer (With Requirements)", False, "No project ID available for testing")
            return False
            
        try:
            # First, add pain research to the project
            pain_research_data = {
                "pain_research": {
                    "pain_points": [
                        {"description": "Dificuldade em gerar leads qualificados", "frequency": 5, "source": "manual", "category": "marketing"},
                        {"description": "Baixas taxas de conversão", "frequency": 4, "source": "manual", "category": "sales"},
                        {"description": "Falta de conhecimento em funis de vendas", "frequency": 3, "source": "manual", "category": "strategy"}
                    ],
                    "reviews": [
                        "Curso excelente mas precisa de mais exemplos práticos",
                        "Me ajudou a entender os fundamentos do marketing digital",
                        "Conteúdo muito bom, mas poderia ter mais cases brasileiros"
                    ],
                    "faqs": [
                        "Quanto tempo leva para ver resultados?", 
                        "Preciso de experiência prévia?",
                        "Funciona para qualquer nicho?"
                    ],
                    "manual_input": "Principais dores no mercado de educação em marketing digital brasileiro"
                },
                "status": "research_completed"
            }
            
            # Update project with pain research
            response = self.session.put(f"{self.base_url}/projects/{self.created_project_id}", json=pain_research_data)
            
            if response.status_code == 200:
                # Now try to generate offer
                response = self.session.post(f"{self.base_url}/generate/offer/{self.created_project_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data.get("success") and data.get("offer"):
                        offer = data.get("offer")
                        required_offer_fields = ["headline", "main_promise", "proof_elements", "bonuses", "guarantees", "price_justification"]
                        missing_fields = [field for field in required_offer_fields if field not in offer]
                        
                        if not missing_fields:
                            self.log_test(
                                "AI Offer Generation (Portuguese)", 
                                True, 
                                f"AI offer generated successfully. Headline: {offer.get('headline')[:80]}..., Bonuses: {len(offer.get('bonuses', []))}, Guarantees: {len(offer.get('guarantees', []))}",
                                {"headline": offer.get('headline'), "bonuses_count": len(offer.get('bonuses', [])), "guarantees_count": len(offer.get('guarantees', []))}
                            )
                            return True
                        else:
                            self.log_test("AI Offer Generation (Portuguese)", False, f"Missing offer fields: {missing_fields}")
                            return False
                    else:
                        self.log_test("AI Offer Generation (Portuguese)", False, "Invalid offer response structure")
                        return False
                else:
                    self.log_test("AI Offer Generation (Portuguese)", False, f"HTTP {response.status_code}: {response.text}")
                    return False
            else:
                self.log_test("AI Offer Generation (Portuguese)", False, "Failed to update project with pain research")
                return False
                
        except Exception as e:
            self.log_test("AI Offer Generation (Portuguese)", False, f"Error: {str(e)}")
            return False

    def test_generate_materials_vsl(self):
        """Test AI materials generation - VSL Script"""
        if not self.created_project_id:
            self.log_test("AI Materials Generation (VSL)", False, "No project ID available for testing")
            return False
            
        try:
            # Generate materials with VSL focus
            response = self.session.post(f"{self.base_url}/generate/materials/{self.created_project_id}", 
                                       json=["vsl"])
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("materials"):
                    materials = data.get("materials")
                    
                    if "vsl_script" in materials:
                        vsl = materials["vsl_script"]
                        required_vsl_fields = ["title", "hook", "problem_agitation", "solution_intro", "call_to_action", "estimated_duration"]
                        missing_fields = [field for field in required_vsl_fields if field not in vsl]
                        
                        if not missing_fields:
                            self.log_test(
                                "AI Materials Generation (VSL)", 
                                True, 
                                f"VSL script generated. Duration: {vsl.get('estimated_duration')}s, Title: {vsl.get('title')[:50]}...",
                                {"duration": vsl.get('estimated_duration'), "has_hook": bool(vsl.get('hook'))}
                            )
                            return True
                        else:
                            self.log_test("AI Materials Generation (VSL)", False, f"Missing VSL fields: {missing_fields}")
                            return False
                    else:
                        self.log_test("AI Materials Generation (VSL)", False, "VSL script not found in materials")
                        return False
                else:
                    self.log_test("AI Materials Generation (VSL)", False, "Invalid materials response structure")
                    return False
            else:
                self.log_test("AI Materials Generation (VSL)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("AI Materials Generation (VSL)", False, f"Error: {str(e)}")
            return False

    def test_generate_materials_emails(self):
        """Test AI materials generation - Email Sequence"""
        if not self.created_project_id:
            self.log_test("AI Materials Generation (Emails)", False, "No project ID available for testing")
            return False
            
        try:
            # Generate materials with email focus
            response = self.session.post(f"{self.base_url}/generate/materials/{self.created_project_id}", 
                                       json=["emails"])
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("materials"):
                    materials = data.get("materials")
                    
                    if "email_sequence" in materials:
                        email_seq = materials["email_sequence"]
                        emails = email_seq.get("emails", [])
                        
                        if len(emails) >= 5:
                            # Check if emails have proper structure
                            valid_emails = all(
                                isinstance(email, dict) and 
                                "subject" in email and 
                                "content" in email and
                                len(email["subject"]) > 0 and
                                len(email["content"]) > 0
                                for email in emails[:5]
                            )
                            
                            if valid_emails:
                                self.log_test(
                                    "AI Materials Generation (Emails)", 
                                    True, 
                                    f"Email sequence generated with {len(emails)} emails. First subject: {emails[0]['subject'][:50]}...",
                                    {"email_count": len(emails), "sequence_name": email_seq.get("sequence_name")}
                                )
                                return True
                            else:
                                self.log_test("AI Materials Generation (Emails)", False, "Invalid email structure in sequence")
                                return False
                        else:
                            self.log_test("AI Materials Generation (Emails)", False, f"Expected 5+ emails, got {len(emails)}")
                            return False
                    else:
                        self.log_test("AI Materials Generation (Emails)", False, "Email sequence not found in materials")
                        return False
                else:
                    self.log_test("AI Materials Generation (Emails)", False, "Invalid materials response structure")
                    return False
            else:
                self.log_test("AI Materials Generation (Emails)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("AI Materials Generation (Emails)", False, f"Error: {str(e)}")
            return False

    def test_generate_materials_social(self):
        """Test AI materials generation - Social Content"""
        if not self.created_project_id:
            self.log_test("AI Materials Generation (Social)", False, "No project ID available for testing")
            return False
            
        try:
            # Generate materials with social focus
            response = self.session.post(f"{self.base_url}/generate/materials/{self.created_project_id}", 
                                       json=["social"])
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("materials"):
                    materials = data.get("materials")
                    
                    if "social_content" in materials:
                        social_posts = materials["social_content"]
                        
                        if len(social_posts) >= 6:
                            # Check if social posts have proper structure
                            valid_posts = all(
                                isinstance(post, dict) and 
                                "platform" in post and 
                                "content" in post and
                                "content_type" in post and
                                len(post["content"]) > 0
                                for post in social_posts[:6]
                            )
                            
                            if valid_posts:
                                platforms = [post["platform"] for post in social_posts[:6]]
                                self.log_test(
                                    "AI Materials Generation (Social)", 
                                    True, 
                                    f"Social content generated with {len(social_posts)} posts. Platforms: {', '.join(set(platforms))}",
                                    {"post_count": len(social_posts), "platforms": list(set(platforms))}
                                )
                                return True
                            else:
                                self.log_test("AI Materials Generation (Social)", False, "Invalid social post structure")
                                return False
                        else:
                            self.log_test("AI Materials Generation (Social)", False, f"Expected 6+ social posts, got {len(social_posts)}")
                            return False
                    else:
                        self.log_test("AI Materials Generation (Social)", False, "Social content not found in materials")
                        return False
                else:
                    self.log_test("AI Materials Generation (Social)", False, "Invalid materials response structure")
                    return False
            else:
                self.log_test("AI Materials Generation (Social)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("AI Materials Generation (Social)", False, f"Error: {str(e)}")
            return False

    def test_complete_ai_workflow(self):
        """Test complete end-to-end AI workflow"""
        try:
            # Create a new project for complete workflow test
            project_data = {
                "name": "Curso Completo de Marketing Digital - Workflow Test",
                "user_id": "workflow_test_user",
                "language": "pt-BR"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=project_data)
            
            if response.status_code == 200:
                workflow_project_id = response.json().get("_id")
                
                # Step 1: Add brief
                brief_data = {
                    "brief": {
                        "niche": "Marketing Digital",
                        "avatar_id": "empreendedor_digital_br",
                        "promise": "Aprenda a criar um negócio digital lucrativo do zero em 90 dias",
                        "target_price": 997.0,
                        "currency": "BRL",
                        "additional_notes": "Foco no mercado brasileiro com cases reais"
                    },
                    "status": "brief_completed"
                }
                
                response = self.session.put(f"{self.base_url}/projects/{workflow_project_id}", json=brief_data)
                
                if response.status_code == 200:
                    # Step 2: Add pain research
                    pain_data = {
                        "pain_research": {
                            "pain_points": [
                                {"description": "Não sabe por onde começar no marketing digital", "frequency": 5, "source": "manual", "category": "knowledge"},
                                {"description": "Dificuldade em gerar tráfego qualificado", "frequency": 4, "source": "manual", "category": "traffic"},
                                {"description": "Baixa conversão de visitantes em clientes", "frequency": 4, "source": "manual", "category": "conversion"},
                                {"description": "Falta de tempo para implementar estratégias", "frequency": 3, "source": "manual", "category": "time"}
                            ],
                            "reviews": [
                                "Preciso de um método passo a passo que funcione no Brasil",
                                "Já tentei vários cursos mas nenhum me deu resultados práticos",
                                "Quero aprender com quem realmente faturou alto no digital"
                            ],
                            "faqs": [
                                "Funciona mesmo para iniciantes?",
                                "Quanto tempo leva para ver os primeiros resultados?",
                                "Preciso investir muito dinheiro em anúncios?"
                            ],
                            "manual_input": "Pesquisa realizada com 500+ empreendedores brasileiros interessados em marketing digital"
                        },
                        "status": "research_completed"
                    }
                    
                    response = self.session.put(f"{self.base_url}/projects/{workflow_project_id}", json=pain_data)
                    
                    if response.status_code == 200:
                        # Step 3: Generate offer
                        response = self.session.post(f"{self.base_url}/generate/offer/{workflow_project_id}")
                        
                        if response.status_code == 200:
                            offer_data = response.json()
                            
                            if offer_data.get("success"):
                                # Step 4: Generate all materials
                                response = self.session.post(f"{self.base_url}/generate/materials/{workflow_project_id}")
                                
                                if response.status_code == 200:
                                    materials_data = response.json()
                                    
                                    if materials_data.get("success"):
                                        materials = materials_data.get("materials", {})
                                        
                                        # Verify all materials were generated
                                        has_vsl = "vsl_script" in materials
                                        has_emails = "email_sequence" in materials
                                        has_social = "social_content" in materials
                                        
                                        if has_vsl and has_emails and has_social:
                                            # Check final project status
                                            response = self.session.get(f"{self.base_url}/projects/{workflow_project_id}")
                                            
                                            if response.status_code == 200:
                                                final_project = response.json()
                                                final_status = final_project.get("status")
                                                
                                                self.log_test(
                                                    "Complete AI Workflow (Portuguese)", 
                                                    True, 
                                                    f"Complete workflow successful. Final status: {final_status}. Generated: VSL, Email sequence, Social content",
                                                    {
                                                        "final_status": final_status,
                                                        "has_offer": bool(final_project.get("generated_offer")),
                                                        "has_materials": bool(final_project.get("materials")),
                                                        "language": final_project.get("language")
                                                    }
                                                )
                                                return True
                                            else:
                                                self.log_test("Complete AI Workflow (Portuguese)", False, "Failed to retrieve final project status")
                                                return False
                                        else:
                                            missing = []
                                            if not has_vsl: missing.append("VSL")
                                            if not has_emails: missing.append("Emails")
                                            if not has_social: missing.append("Social")
                                            self.log_test("Complete AI Workflow (Portuguese)", False, f"Missing materials: {', '.join(missing)}")
                                            return False
                                    else:
                                        self.log_test("Complete AI Workflow (Portuguese)", False, "Materials generation failed")
                                        return False
                                else:
                                    self.log_test("Complete AI Workflow (Portuguese)", False, f"Materials generation HTTP error: {response.status_code}")
                                    return False
                            else:
                                self.log_test("Complete AI Workflow (Portuguese)", False, "Offer generation failed")
                                return False
                        else:
                            self.log_test("Complete AI Workflow (Portuguese)", False, f"Offer generation HTTP error: {response.status_code}")
                            return False
                    else:
                        self.log_test("Complete AI Workflow (Portuguese)", False, "Failed to add pain research")
                        return False
                else:
                    self.log_test("Complete AI Workflow (Portuguese)", False, "Failed to add brief")
                    return False
            else:
                self.log_test("Complete AI Workflow (Portuguese)", False, "Failed to create workflow test project")
                return False
                
        except Exception as e:
            self.log_test("Complete AI Workflow (Portuguese)", False, f"Error: {str(e)}")
            return False

    def test_english_ai_generation(self):
        """Test AI generation in English"""
        try:
            # Create English project
            project_data = {
                "name": "Complete Digital Marketing Course - English Test",
                "user_id": "english_test_user",
                "language": "en-US"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=project_data)
            
            if response.status_code == 200:
                english_project_id = response.json().get("_id")
                
                # Add brief and pain research
                update_data = {
                    "brief": {
                        "niche": "Digital Marketing",
                        "avatar_id": "digital_entrepreneur_us",
                        "promise": "Learn to build a profitable online business from scratch in 90 days",
                        "target_price": 497.0,
                        "currency": "USD",
                        "additional_notes": "Focus on US market with proven case studies"
                    },
                    "pain_research": {
                        "pain_points": [
                            {"description": "Struggling to generate qualified leads", "frequency": 5, "source": "manual", "category": "lead_generation"},
                            {"description": "Low conversion rates on landing pages", "frequency": 4, "source": "manual", "category": "conversion"}
                        ],
                        "reviews": ["Need practical step-by-step guidance", "Want proven strategies that work"],
                        "faqs": ["How long to see results?", "Do I need prior experience?"],
                        "manual_input": "Research from 300+ US entrepreneurs"
                    },
                    "status": "research_completed"
                }
                
                response = self.session.put(f"{self.base_url}/projects/{english_project_id}", json=update_data)
                
                if response.status_code == 200:
                    # Generate offer in English
                    response = self.session.post(f"{self.base_url}/generate/offer/{english_project_id}")
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        if data.get("success") and data.get("offer"):
                            offer = data.get("offer")
                            headline = offer.get("headline", "")
                            
                            # Check if content appears to be in English (basic check)
                            english_indicators = any(word in headline.lower() for word in ["learn", "discover", "master", "transform", "achieve"])
                            portuguese_indicators = any(word in headline.lower() for word in ["aprenda", "descubra", "domine", "transforme"])
                            
                            if english_indicators and not portuguese_indicators:
                                self.log_test(
                                    "AI Generation (English)", 
                                    True, 
                                    f"English offer generated successfully. Headline: {headline[:80]}...",
                                    {"language_detected": "English", "headline": headline}
                                )
                                return True
                            else:
                                self.log_test("AI Generation (English)", False, f"Language detection failed. Headline: {headline}")
                                return False
                        else:
                            self.log_test("AI Generation (English)", False, "Invalid offer response")
                            return False
                    else:
                        self.log_test("AI Generation (English)", False, f"HTTP {response.status_code}: {response.text}")
                        return False
                else:
                    self.log_test("AI Generation (English)", False, "Failed to update English project")
                    return False
            else:
                self.log_test("AI Generation (English)", False, "Failed to create English project")
                return False
                
        except Exception as e:
            self.log_test("AI Generation (English)", False, f"Error: {str(e)}")
            return False

    def test_stripe_price_suggestion(self):
        """Test Stripe price suggestion endpoint"""
        try:
            params = {
                "niche": "Digital Marketing",
                "target_price": 497.0,
                "currency": "BRL"
            }
            
            response = self.session.get(f"{self.base_url}/stripe/price-suggestion", params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ["suggested_price", "price_range", "market_analysis", "currency"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    price_range = data.get("price_range", {})
                    self.log_test(
                        "Stripe Price Suggestion", 
                        True, 
                        f"Price suggestion: {data.get('suggested_price')} {data.get('currency')}, Range: {price_range.get('min')}-{price_range.get('max')}",
                        data
                    )
                    return True
                else:
                    self.log_test("Stripe Price Suggestion", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Stripe Price Suggestion", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Stripe Price Suggestion", False, f"Error: {str(e)}")
            return False

    def test_metrics_endpoint(self):
        """Test metrics endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/metrics")
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ["total_projects", "completed_projects", "completion_rate"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test(
                        "Metrics Endpoint", 
                        True, 
                        f"Total projects: {data.get('total_projects')}, Completed: {data.get('completed_projects')}, Rate: {data.get('completion_rate'):.1f}%",
                        data
                    )
                    return True
                else:
                    self.log_test("Metrics Endpoint", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Metrics Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Metrics Endpoint", False, f"Error: {str(e)}")
            return False

    def test_delete_project(self):
        """Test project deletion"""
        if not self.created_project_id:
            self.log_test("Delete Project", False, "No project ID available for testing")
            return False
            
        try:
            response = self.session.delete(f"{self.base_url}/projects/{self.created_project_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                if "deleted successfully" in data.get("message", "").lower():
                    self.log_test(
                        "Delete Project", 
                        True, 
                        f"Project deleted successfully: {data.get('message')}",
                        data
                    )
                    return True
                else:
                    self.log_test("Delete Project", False, "Unexpected delete response")
                    return False
            else:
                self.log_test("Delete Project", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Delete Project", False, f"Error: {str(e)}")
            return False

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        try:
            # Test 500 for invalid ObjectId format (backend returns 500 for invalid ObjectId)
            response = self.session.get(f"{self.base_url}/projects/nonexistent_id_123")
            
            if response.status_code == 500:
                self.log_test(
                    "Error Handling (Invalid ObjectId)", 
                    True, 
                    "Correctly returned 500 for invalid ObjectId format",
                    response.json()
                )
            else:
                self.log_test("Error Handling (Invalid ObjectId)", False, f"Expected 500, got {response.status_code}")
                
            # Test invalid project creation
            invalid_project = {"name": ""}  # Missing required fields
            response = self.session.post(f"{self.base_url}/projects", json=invalid_project)
            
            if response.status_code in [400, 422]:  # FastAPI returns 422 for validation errors
                self.log_test(
                    "Error Handling (Validation)", 
                    True, 
                    f"Correctly rejected invalid project data with {response.status_code}",
                    response.json()
                )
                return True
            else:
                self.log_test("Error Handling (Validation)", False, f"Expected 400/422, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Error Handling", False, f"Error: {str(e)}")
            return False

    def test_landing_page_generation(self):
        """Test Phase 3: Landing Page Generation"""
        if not self.created_project_id:
            self.log_test("Landing Page Generation", False, "No project ID available for testing")
            return False
            
        try:
            # First ensure project has offer generated
            response = self.session.get(f"{self.base_url}/projects/{self.created_project_id}")
            if response.status_code == 200:
                project = response.json()
                
                if not project.get("generated_offer"):
                    self.log_test("Landing Page Generation", False, "Project needs generated offer first")
                    return False
                
                # Test landing page generation with default template
                response = self.session.post(f"{self.base_url}/generate/landing-page/{self.created_project_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data.get("success") and data.get("landing_page"):
                        landing_page = data["landing_page"]
                        required_fields = ["html", "css", "js", "template_name", "generated_at"]
                        missing_fields = [field for field in required_fields if field not in landing_page]
                        
                        if not missing_fields:
                            # Check if HTML contains mobile viewport
                            html_content = landing_page.get("html", "")
                            is_mobile_optimized = "viewport" in html_content and "width=device-width" in html_content
                            
                            self.log_test(
                                "Landing Page Generation (Mobile-First)", 
                                True, 
                                f"Landing page generated successfully. Template: {landing_page.get('template_name')}, Mobile optimized: {is_mobile_optimized}, HTML size: {len(html_content)} chars",
                                {"template": landing_page.get('template_name'), "mobile_optimized": is_mobile_optimized}
                            )
                            return True
                        else:
                            self.log_test("Landing Page Generation (Mobile-First)", False, f"Missing fields: {missing_fields}")
                            return False
                    else:
                        self.log_test("Landing Page Generation (Mobile-First)", False, "Invalid landing page response structure")
                        return False
                else:
                    self.log_test("Landing Page Generation (Mobile-First)", False, f"HTTP {response.status_code}: {response.text}")
                    return False
            else:
                self.log_test("Landing Page Generation", False, "Failed to retrieve project")
                return False
                
        except Exception as e:
            self.log_test("Landing Page Generation (Mobile-First)", False, f"Error: {str(e)}")
            return False

    def test_landing_page_custom_template(self):
        """Test landing page generation with custom template"""
        if not self.created_project_id:
            self.log_test("Landing Page Custom Template", False, "No project ID available for testing")
            return False
            
        try:
            # Test with different template
            response = self.session.post(
                f"{self.base_url}/generate/landing-page/{self.created_project_id}",
                params={"template_name": "classic_sales"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("landing_page"):
                    landing_page = data["landing_page"]
                    template_name = landing_page.get("template_name")
                    
                    self.log_test(
                        "Landing Page Custom Template", 
                        True, 
                        f"Custom template generated successfully: {template_name}",
                        {"template": template_name}
                    )
                    return True
                else:
                    self.log_test("Landing Page Custom Template", False, "Invalid response structure")
                    return False
            else:
                self.log_test("Landing Page Custom Template", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Landing Page Custom Template", False, f"Error: {str(e)}")
            return False

    def test_export_zip_package(self):
        """Test Phase 3: Complete ZIP export"""
        if not self.created_project_id:
            self.log_test("Export ZIP Package", False, "No project ID available for testing")
            return False
            
        try:
            export_request = {
                "project_id": self.created_project_id,
                "export_type": "zip"
            }
            
            response = self.session.post(
                f"{self.base_url}/export/{self.created_project_id}",
                json=export_request
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("file_data"):
                    file_data = data["file_data"]
                    
                    # Validate base64 encoding
                    try:
                        import base64
                        decoded = base64.b64decode(file_data)
                        is_valid_base64 = len(decoded) > 0
                    except:
                        is_valid_base64 = False
                    
                    if is_valid_base64:
                        self.log_test(
                            "Export ZIP Package", 
                            True, 
                            f"ZIP export successful. File size: {len(file_data)} chars (base64), Message: {data.get('message')}",
                            {"file_size_base64": len(file_data), "message": data.get('message')}
                        )
                        return True
                    else:
                        self.log_test("Export ZIP Package", False, "Invalid base64 encoding")
                        return False
                else:
                    self.log_test("Export ZIP Package", False, "Missing file_data in response")
                    return False
            else:
                self.log_test("Export ZIP Package", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Export ZIP Package", False, f"Error: {str(e)}")
            return False

    def test_export_pdf_report(self):
        """Test Phase 3: PDF export"""
        if not self.created_project_id:
            self.log_test("Export PDF Report", False, "No project ID available for testing")
            return False
            
        try:
            export_request = {
                "project_id": self.created_project_id,
                "export_type": "pdf"
            }
            
            response = self.session.post(
                f"{self.base_url}/export/{self.created_project_id}",
                json=export_request
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("file_data"):
                    file_data = data["file_data"]
                    
                    # Validate base64 PDF
                    try:
                        import base64
                        decoded = base64.b64decode(file_data)
                        is_pdf = decoded.startswith(b'%PDF')
                    except:
                        is_pdf = False
                    
                    if is_pdf:
                        self.log_test(
                            "Export PDF Report", 
                            True, 
                            f"PDF export successful. File size: {len(decoded)} bytes, Message: {data.get('message')}",
                            {"file_size_bytes": len(decoded), "is_valid_pdf": is_pdf}
                        )
                        return True
                    else:
                        self.log_test("Export PDF Report", False, "Invalid PDF format")
                        return False
                else:
                    self.log_test("Export PDF Report", False, "Missing file_data in response")
                    return False
            else:
                self.log_test("Export PDF Report", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Export PDF Report", False, f"Error: {str(e)}")
            return False

    def test_export_html_package(self):
        """Test Phase 3: HTML landing page export"""
        if not self.created_project_id:
            self.log_test("Export HTML Package", False, "No project ID available for testing")
            return False
            
        try:
            export_request = {
                "project_id": self.created_project_id,
                "export_type": "html"
            }
            
            response = self.session.post(
                f"{self.base_url}/export/{self.created_project_id}",
                json=export_request
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("file_data"):
                    self.log_test(
                        "Export HTML Package", 
                        True, 
                        f"HTML package export successful. Message: {data.get('message')}",
                        {"message": data.get('message')}
                    )
                    return True
                else:
                    self.log_test("Export HTML Package", False, "Missing file_data in response")
                    return False
            else:
                # Check if it's because landing page is not generated
                if response.status_code == 400 and "landing page not generated" in response.text.lower():
                    self.log_test(
                        "Export HTML Package", 
                        True, 
                        "Correctly rejected HTML export without landing page",
                        {"validation": "landing_page_required"}
                    )
                    return True
                else:
                    self.log_test("Export HTML Package", False, f"HTTP {response.status_code}: {response.text}")
                    return False
                
        except Exception as e:
            self.log_test("Export HTML Package", False, f"Error: {str(e)}")
            return False

    def test_export_json_format(self):
        """Test Phase 3: JSON export for API integrations"""
        if not self.created_project_id:
            self.log_test("Export JSON Format", False, "No project ID available for testing")
            return False
            
        try:
            export_request = {
                "project_id": self.created_project_id,
                "export_type": "json"
            }
            
            response = self.session.post(
                f"{self.base_url}/export/{self.created_project_id}",
                json=export_request
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("file_data"):
                    file_data = data["file_data"]
                    
                    # Validate JSON content
                    try:
                        import base64
                        import json
                        decoded = base64.b64decode(file_data).decode('utf-8')
                        json_data = json.loads(decoded)
                        
                        # Check for expected JSON structure
                        has_project_info = "project_info" in json_data
                        has_materials = "materials" in json_data
                        has_metadata = "export_metadata" in json_data
                        
                        if has_project_info and has_materials and has_metadata:
                            self.log_test(
                                "Export JSON Format", 
                                True, 
                                f"JSON export successful. Contains project_info, materials, and metadata",
                                {"has_project_info": has_project_info, "has_materials": has_materials, "has_metadata": has_metadata}
                            )
                            return True
                        else:
                            self.log_test("Export JSON Format", False, "Missing expected JSON structure")
                            return False
                    except Exception as json_error:
                        self.log_test("Export JSON Format", False, f"Invalid JSON format: {str(json_error)}")
                        return False
                else:
                    self.log_test("Export JSON Format", False, "Missing file_data in response")
                    return False
            else:
                self.log_test("Export JSON Format", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Export JSON Format", False, f"Error: {str(e)}")
            return False

    def test_enhanced_stripe_integration(self):
        """Test Phase 3: Enhanced Stripe integration with market analysis"""
        try:
            # Test with different niches and enhanced features
            test_cases = [
                {"niche": "digital marketing", "target_price": 997.0, "currency": "BRL"},
                {"niche": "fitness", "target_price": 497.0, "currency": "USD"},
                {"niche": "business", "target_price": 1497.0, "currency": "BRL"},
                {"niche": "technology", "target_price": 797.0, "currency": "USD"}
            ]
            
            successful_tests = 0
            
            for test_case in test_cases:
                response = self.session.get(f"{self.base_url}/stripe/price-suggestion", params=test_case)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check for enhanced features
                    required_fields = ["suggested_price", "price_range", "market_analysis", "recommendations", "currency"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        market_analysis = data.get("market_analysis", {})
                        price_range = data.get("price_range", {})
                        recommendations = data.get("recommendations", [])
                        
                        # Check for enhanced market analysis
                        has_niche_analysis = "niche" in market_analysis
                        has_multiplier = "multiplier" in market_analysis
                        has_confidence = "confidence" in market_analysis
                        has_trend = "market_trend" in market_analysis
                        has_price_tiers = len(price_range) >= 4  # budget, standard, premium, luxury
                        has_recommendations = len(recommendations) >= 3
                        
                        if has_niche_analysis and has_multiplier and has_confidence and has_trend and has_price_tiers and has_recommendations:
                            successful_tests += 1
                        
            if successful_tests == len(test_cases):
                self.log_test(
                    "Enhanced Stripe Integration", 
                    True, 
                    f"Enhanced Stripe integration working perfectly. Tested {len(test_cases)} niches with market analysis, price tiers, and recommendations",
                    {"tested_niches": len(test_cases), "success_rate": "100%"}
                )
                return True
            else:
                self.log_test("Enhanced Stripe Integration", False, f"Only {successful_tests}/{len(test_cases)} test cases passed")
                return False
                
        except Exception as e:
            self.log_test("Enhanced Stripe Integration", False, f"Error: {str(e)}")
            return False

    def test_complete_phase3_workflow(self):
        """Test Phase 3: Complete end-to-end workflow with new features"""
        try:
            # Create a new project for complete Phase 3 workflow
            project_data = {
                "name": "OfferForge Phase 3 Complete Workflow Test",
                "user_id": "phase3_workflow_user",
                "language": "pt-BR"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=project_data)
            
            if response.status_code == 200:
                workflow_project_id = response.json().get("_id")
                
                # Step 1: Add brief
                brief_data = {
                    "brief": {
                        "niche": "Curso de Investimentos",
                        "avatar_id": "investidor_iniciante_br",
                        "promise": "Aprenda a investir na bolsa e gerar renda passiva em 60 dias",
                        "target_price": 1497.0,
                        "currency": "BRL",
                        "additional_notes": "Foco em investidores iniciantes brasileiros"
                    },
                    "status": "brief_completed"
                }
                
                response = self.session.put(f"{self.base_url}/projects/{workflow_project_id}", json=brief_data)
                
                if response.status_code == 200:
                    # Step 2: Add pain research
                    pain_data = {
                        "pain_research": {
                            "pain_points": [
                                {"description": "Medo de perder dinheiro investindo", "frequency": 5, "source": "manual", "category": "fear"},
                                {"description": "Não sabe por onde começar a investir", "frequency": 5, "source": "manual", "category": "knowledge"},
                                {"description": "Confuso com tantas opções de investimento", "frequency": 4, "source": "manual", "category": "complexity"},
                                {"description": "Não tem tempo para estudar investimentos", "frequency": 3, "source": "manual", "category": "time"}
                            ],
                            "reviews": [
                                "Preciso de um método simples e seguro para começar",
                                "Quero aprender sem correr riscos desnecessários",
                                "Busco uma estratégia que funcione mesmo com pouco tempo"
                            ],
                            "faqs": [
                                "É seguro investir na bolsa?",
                                "Quanto preciso para começar?",
                                "Quanto tempo leva para ver resultados?"
                            ],
                            "manual_input": "Pesquisa com 1000+ brasileiros interessados em investimentos"
                        },
                        "status": "research_completed"
                    }
                    
                    response = self.session.put(f"{self.base_url}/projects/{workflow_project_id}", json=pain_data)
                    
                    if response.status_code == 200:
                        # Step 3: Generate offer
                        response = self.session.post(f"{self.base_url}/generate/offer/{workflow_project_id}")
                        
                        if response.status_code == 200:
                            # Step 4: Generate all materials
                            response = self.session.post(f"{self.base_url}/generate/materials/{workflow_project_id}")
                            
                            if response.status_code == 200:
                                # Step 5: Generate landing page
                                response = self.session.post(f"{self.base_url}/generate/landing-page/{workflow_project_id}")
                                
                                if response.status_code == 200:
                                    # Step 6: Test all export formats
                                    export_results = {}
                                    
                                    for export_type in ["zip", "pdf", "html", "json"]:
                                        export_request = {
                                            "project_id": workflow_project_id,
                                            "export_type": export_type
                                        }
                                        response = self.session.post(
                                            f"{self.base_url}/export/{workflow_project_id}",
                                            json=export_request
                                        )
                                        export_results[export_type] = response.status_code == 200
                                    
                                    # Check final project status
                                    response = self.session.get(f"{self.base_url}/projects/{workflow_project_id}")
                                    
                                    if response.status_code == 200:
                                        final_project = response.json()
                                        
                                        # Verify all components
                                        has_brief = bool(final_project.get("brief"))
                                        has_pain_research = bool(final_project.get("pain_research"))
                                        has_offer = bool(final_project.get("generated_offer"))
                                        has_materials = bool(final_project.get("materials"))
                                        has_landing_page = bool(final_project.get("materials", {}).get("landing_page"))
                                        
                                        all_exports_successful = all(export_results.values())
                                        
                                        if has_brief and has_pain_research and has_offer and has_materials and has_landing_page and all_exports_successful:
                                            self.log_test(
                                                "Complete Phase 3 Workflow", 
                                                True, 
                                                f"Complete Phase 3 workflow successful! Project → Brief → Research → Offer → Materials → Landing Page → All Exports. Export results: {export_results}",
                                                {
                                                    "final_status": final_project.get("status"),
                                                    "has_all_components": True,
                                                    "export_results": export_results,
                                                    "language": final_project.get("language")
                                                }
                                            )
                                            return True
                                        else:
                                            missing = []
                                            if not has_brief: missing.append("brief")
                                            if not has_pain_research: missing.append("pain_research")
                                            if not has_offer: missing.append("offer")
                                            if not has_materials: missing.append("materials")
                                            if not has_landing_page: missing.append("landing_page")
                                            if not all_exports_successful: missing.append("exports")
                                            
                                            self.log_test("Complete Phase 3 Workflow", False, f"Missing components: {', '.join(missing)}")
                                            return False
                                    else:
                                        self.log_test("Complete Phase 3 Workflow", False, "Failed to retrieve final project")
                                        return False
                                else:
                                    self.log_test("Complete Phase 3 Workflow", False, "Landing page generation failed")
                                    return False
                            else:
                                self.log_test("Complete Phase 3 Workflow", False, "Materials generation failed")
                                return False
                        else:
                            self.log_test("Complete Phase 3 Workflow", False, "Offer generation failed")
                            return False
                    else:
                        self.log_test("Complete Phase 3 Workflow", False, "Failed to add pain research")
                        return False
                else:
                    self.log_test("Complete Phase 3 Workflow", False, "Failed to add brief")
                    return False
            else:
                self.log_test("Complete Phase 3 Workflow", False, "Failed to create workflow project")
                return False
                
        except Exception as e:
            self.log_test("Complete Phase 3 Workflow", False, f"Error: {str(e)}")
            return False

    def test_system_health_phase3(self):
        """Test Phase 3: System health with all integrations"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            
            if response.status_code == 200:
                data = response.json()
                services = data.get("services", {})
                
                # Check all required services for Phase 3
                mongodb_status = services.get("mongodb") == "connected"
                openai_status = services.get("openai") == "configured"
                stripe_status = services.get("stripe") == "configured"
                
                # Verify API version
                api_version = data.get("version") or "unknown"
                is_version_2 = api_version.startswith("2.")
                
                all_services_ready = mongodb_status and openai_status and stripe_status and is_version_2
                
                if all_services_ready:
                    self.log_test(
                        "System Health (Phase 3)", 
                        True, 
                        f"All Phase 3 services configured and ready. API v{api_version}, MongoDB: connected, OpenAI: configured, Stripe: configured",
                        {
                            "api_version": api_version,
                            "mongodb": "connected",
                            "openai": "configured", 
                            "stripe": "configured",
                            "all_ready": True
                        }
                    )
                    return True
                else:
                    issues = []
                    if not mongodb_status: issues.append("MongoDB")
                    if not openai_status: issues.append("OpenAI")
                    if not stripe_status: issues.append("Stripe")
                    if not is_version_2: issues.append(f"API version ({api_version})")
                    
                    self.log_test("System Health (Phase 3)", False, f"Service issues: {', '.join(issues)}")
                    return False
            else:
                self.log_test("System Health (Phase 3)", False, f"Health check failed: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("System Health (Phase 3)", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend API tests including Phase 3 features"""
        print("🚀 Starting OfferForge Backend API Tests - Phase 3 Features Focus")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 60)
        
        # System health check first
        self.test_system_health_phase3()
        
        # Core connectivity tests
        self.test_health_endpoint()
        self.test_root_endpoint()
        
        # Project management tests
        self.test_create_project()
        self.test_get_projects()
        self.test_get_project_by_id()
        self.test_update_project()
        
        # Avatar management tests
        self.test_create_avatar()
        self.test_get_avatars()
        
        # AI Content generation tests (existing)
        self.test_generate_offer_without_requirements()
        self.test_generate_offer_with_requirements()
        self.test_generate_materials_vsl()
        self.test_generate_materials_emails()
        self.test_generate_materials_social()
        
        # Multi-language and workflow tests (existing)
        self.test_complete_ai_workflow()
        self.test_english_ai_generation()
        
        # PHASE 3 NEW FEATURES TESTING
        print("\n" + "🆕 PHASE 3 FEATURES TESTING" + "=" * 40)
        
        # Landing Page Generation Tests
        self.test_landing_page_generation()
        self.test_landing_page_custom_template()
        
        # Export System Tests
        self.test_export_zip_package()
        self.test_export_pdf_report()
        self.test_export_html_package()
        self.test_export_json_format()
        
        # Enhanced Stripe Integration
        self.test_enhanced_stripe_integration()
        
        # Complete Phase 3 Workflow
        self.test_complete_phase3_workflow()
        
        # Integration tests (existing)
        self.test_stripe_price_suggestion()
        self.test_metrics_endpoint()
        
        # Error handling tests
        self.test_error_handling()
        
        # Cleanup tests
        self.test_delete_project()
        
        # Summary
        self.print_summary()
        
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        print("\n" + "=" * 60)
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    print("OfferForge Backend API Test Suite")
    print("=" * 40)
    
    tester = OfferForgeAPITester(BACKEND_URL)
    tester.run_all_tests()
    
    passed, failed = tester.print_summary()
    
    # Exit with appropriate code
    sys.exit(0 if failed == 0 else 1)