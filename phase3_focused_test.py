#!/usr/bin/env python3
"""
OfferForge Phase 3 Features Focused Test
Testing only the new Phase 3 features: Landing Page Generation and Export System
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://5b863d00-8818-454f-812a-a5cd95e2dd7d.preview.emergentagent.com/api"

class Phase3Tester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        self.test_project_id = None
        
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
        
    def setup_test_project(self):
        """Create a complete project for Phase 3 testing"""
        try:
            # Create project
            project_data = {
                "name": "Phase 3 Test Project - Investment Course",
                "user_id": "phase3_test_user",
                "language": "pt-BR"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=project_data)
            if response.status_code != 200:
                return False
                
            self.test_project_id = response.json().get("_id")
            
            # Add brief
            brief_data = {
                "brief": {
                    "niche": "Investimentos",
                    "avatar_id": "investidor_iniciante",
                    "promise": "Aprenda a investir na bolsa e gerar renda passiva em 60 dias",
                    "target_price": 1497.0,
                    "currency": "BRL",
                    "additional_notes": "Curso completo para iniciantes"
                },
                "status": "brief_completed"
            }
            
            response = self.session.put(f"{self.base_url}/projects/{self.test_project_id}", json=brief_data)
            if response.status_code != 200:
                return False
            
            # Add pain research
            pain_data = {
                "pain_research": {
                    "pain_points": [
                        {"description": "Medo de perder dinheiro", "frequency": 5, "source": "manual", "category": "fear"},
                        {"description": "Não sabe por onde começar", "frequency": 4, "source": "manual", "category": "knowledge"}
                    ],
                    "reviews": ["Preciso de orientação segura", "Quero aprender sem riscos"],
                    "faqs": ["É seguro investir?", "Quanto preciso para começar?"],
                    "manual_input": "Pesquisa com investidores iniciantes"
                },
                "status": "research_completed"
            }
            
            response = self.session.put(f"{self.base_url}/projects/{self.test_project_id}", json=pain_data)
            if response.status_code != 200:
                return False
            
            # Generate offer
            response = self.session.post(f"{self.base_url}/generate/offer/{self.test_project_id}")
            if response.status_code != 200:
                return False
            
            # Generate materials
            response = self.session.post(f"{self.base_url}/generate/materials/{self.test_project_id}")
            if response.status_code != 200:
                return False
            
            print(f"✅ Test project setup complete: {self.test_project_id}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to setup test project: {str(e)}")
            return False
    
    def test_landing_page_generation(self):
        """Test Phase 3: Landing Page Generation"""
        try:
            response = self.session.post(f"{self.base_url}/generate/landing-page/{self.test_project_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("landing_page"):
                    landing_page = data["landing_page"]
                    
                    # Check required fields
                    required_fields = ["html", "css", "js", "template_name", "generated_at"]
                    missing_fields = [field for field in required_fields if field not in landing_page]
                    
                    if not missing_fields:
                        html_content = landing_page.get("html", "")
                        is_mobile_optimized = "viewport" in html_content and "width=device-width" in html_content
                        
                        self.log_test(
                            "Landing Page Generation", 
                            True, 
                            f"Landing page generated successfully. Template: {landing_page.get('template_name')}, Mobile optimized: {is_mobile_optimized}, HTML size: {len(html_content)} chars",
                            {"template": landing_page.get('template_name'), "mobile_optimized": is_mobile_optimized}
                        )
                        return True
                    else:
                        self.log_test("Landing Page Generation", False, f"Missing fields: {missing_fields}")
                        return False
                else:
                    self.log_test("Landing Page Generation", False, "Invalid response structure")
                    return False
            else:
                self.log_test("Landing Page Generation", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Landing Page Generation", False, f"Error: {str(e)}")
            return False
    
    def test_export_zip(self):
        """Test ZIP export"""
        try:
            export_request = {
                "project_id": self.test_project_id,
                "export_type": "zip"
            }
            
            response = self.session.post(
                f"{self.base_url}/export/{self.test_project_id}",
                json=export_request
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("file_data"):
                    file_data = data["file_data"]
                    
                    # Validate base64
                    try:
                        import base64
                        decoded = base64.b64decode(file_data)
                        is_valid = len(decoded) > 0
                    except:
                        is_valid = False
                    
                    if is_valid:
                        self.log_test(
                            "Export ZIP", 
                            True, 
                            f"ZIP export successful. File size: {len(file_data)} chars (base64)",
                            {"file_size_base64": len(file_data)}
                        )
                        return True
                    else:
                        self.log_test("Export ZIP", False, "Invalid base64 encoding")
                        return False
                else:
                    self.log_test("Export ZIP", False, "Missing file_data in response")
                    return False
            else:
                self.log_test("Export ZIP", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Export ZIP", False, f"Error: {str(e)}")
            return False
    
    def test_export_pdf(self):
        """Test PDF export"""
        try:
            export_request = {
                "project_id": self.test_project_id,
                "export_type": "pdf"
            }
            
            response = self.session.post(
                f"{self.base_url}/export/{self.test_project_id}",
                json=export_request
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("file_data"):
                    file_data = data["file_data"]
                    
                    # Validate PDF
                    try:
                        import base64
                        decoded = base64.b64decode(file_data)
                        is_pdf = decoded.startswith(b'%PDF')
                    except:
                        is_pdf = False
                    
                    if is_pdf:
                        self.log_test(
                            "Export PDF", 
                            True, 
                            f"PDF export successful. File size: {len(decoded)} bytes",
                            {"file_size_bytes": len(decoded)}
                        )
                        return True
                    else:
                        self.log_test("Export PDF", False, "Invalid PDF format")
                        return False
                else:
                    self.log_test("Export PDF", False, "Missing file_data in response")
                    return False
            else:
                self.log_test("Export PDF", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Export PDF", False, f"Error: {str(e)}")
            return False
    
    def test_export_html(self):
        """Test HTML export"""
        try:
            export_request = {
                "project_id": self.test_project_id,
                "export_type": "html"
            }
            
            response = self.session.post(
                f"{self.base_url}/export/{self.test_project_id}",
                json=export_request
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("file_data"):
                    self.log_test(
                        "Export HTML", 
                        True, 
                        f"HTML export successful. Message: {data.get('message')}",
                        {"message": data.get('message')}
                    )
                    return True
                else:
                    self.log_test("Export HTML", False, "Missing file_data in response")
                    return False
            else:
                self.log_test("Export HTML", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Export HTML", False, f"Error: {str(e)}")
            return False
    
    def test_export_json(self):
        """Test JSON export"""
        try:
            export_request = {
                "project_id": self.test_project_id,
                "export_type": "json"
            }
            
            response = self.session.post(
                f"{self.base_url}/export/{self.test_project_id}",
                json=export_request
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("file_data"):
                    file_data = data["file_data"]
                    
                    # Validate JSON
                    try:
                        import base64
                        import json
                        decoded = base64.b64decode(file_data).decode('utf-8')
                        json_data = json.loads(decoded)
                        
                        has_project_info = "project_info" in json_data
                        has_materials = "materials" in json_data
                        has_metadata = "export_metadata" in json_data
                        
                        if has_project_info and has_materials and has_metadata:
                            self.log_test(
                                "Export JSON", 
                                True, 
                                f"JSON export successful. Contains project_info, materials, and metadata",
                                {"structure_valid": True}
                            )
                            return True
                        else:
                            self.log_test("Export JSON", False, "Missing expected JSON structure")
                            return False
                    except Exception as json_error:
                        self.log_test("Export JSON", False, f"Invalid JSON: {str(json_error)}")
                        return False
                else:
                    self.log_test("Export JSON", False, "Missing file_data in response")
                    return False
            else:
                self.log_test("Export JSON", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Export JSON", False, f"Error: {str(e)}")
            return False
    
    def run_phase3_tests(self):
        """Run all Phase 3 tests"""
        print("🚀 Starting OfferForge Phase 3 Features Test")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Setup test project
        if not self.setup_test_project():
            print("❌ Failed to setup test project. Aborting tests.")
            return
        
        # Test Phase 3 features
        print("\n🆕 PHASE 3 FEATURES TESTING")
        print("=" * 40)
        
        self.test_landing_page_generation()
        self.test_export_zip()
        self.test_export_pdf()
        self.test_export_html()
        self.test_export_json()
        
        # Summary
        self.print_summary()
        
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 PHASE 3 TEST SUMMARY")
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
    print("OfferForge Phase 3 Features Test Suite")
    print("=" * 40)
    
    tester = Phase3Tester(BACKEND_URL)
    tester.run_phase3_tests()
    
    passed, failed = tester.print_summary()
    
    # Exit with appropriate code
    sys.exit(0 if failed == 0 else 1)