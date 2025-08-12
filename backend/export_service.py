import os
import io
import zipfile
import base64
from typing import Dict, List, Optional, Any
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.colors import HexColor
import json

from models import Project, GeneratedOffer, VSLScript, EmailSequence, SocialContent, LanguageEnum

class ExportService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom PDF styles"""
        self.styles.add(ParagraphStyle(
            name='CustomHeading1',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=HexColor('#212529'),
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomHeading2',
            parent=self.styles['Heading2'],
            fontSize=18,
            spaceAfter=20,
            textColor=HexColor('#495057'),
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceAfter=12,
            textColor=HexColor('#212529'),
            fontName='Helvetica'
        ))
        
        self.styles.add(ParagraphStyle(
            name='HighlightBox',
            parent=self.styles['Normal'],
            fontSize=14,
            spaceAfter=20,
            textColor=HexColor('#007AFF'),
            fontName='Helvetica-Bold',
            borderColor=HexColor('#007AFF'),
            borderWidth=1,
            borderPadding=10
        ))
    
    def export_project_pdf(self, project_data: Dict[str, Any]) -> str:
        """Export complete project as PDF"""
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
        
        # Build PDF content
        story = []
        
        # Title Page
        story.append(Paragraph("OfferForge - Projeto Completo", self.styles['CustomHeading1']))
        story.append(Spacer(1, 20))
        
        if project_data.get('name'):
            story.append(Paragraph(f"Projeto: {project_data['name']}", self.styles['CustomHeading2']))
            story.append(Spacer(1, 10))
        
        story.append(Paragraph(f"Gerado em: {datetime.now().strftime('%d/%m/%Y às %H:%M')}", self.styles['CustomBody']))
        story.append(Spacer(1, 20))
        
        # Project Brief
        if project_data.get('brief'):
            story.append(Paragraph("📋 Brief do Produto", self.styles['CustomHeading2']))
            brief = project_data['brief']
            
            story.append(Paragraph(f"<b>Nicho:</b> {brief.get('niche', 'N/A')}", self.styles['CustomBody']))
            story.append(Paragraph(f"<b>Promessa:</b> {brief.get('promise', 'N/A')}", self.styles['CustomBody']))
            story.append(Paragraph(f"<b>Preço-alvo:</b> {brief.get('currency', 'BRL')} {brief.get('target_price', 0)}", self.styles['CustomBody']))
            story.append(Spacer(1, 20))
        
        # Generated Offer
        if project_data.get('generated_offer'):
            story.append(PageBreak())
            story.append(Paragraph("🎯 Oferta Gerada pela IA", self.styles['CustomHeading2']))
            offer = project_data['generated_offer']
            
            story.append(Paragraph(f"<b>Headline:</b>", self.styles['CustomBody']))
            story.append(Paragraph(offer.get('headline', 'N/A'), self.styles['HighlightBox']))
            
            story.append(Paragraph(f"<b>Promessa Principal:</b>", self.styles['CustomBody']))
            story.append(Paragraph(offer.get('main_promise', 'N/A'), self.styles['CustomBody']))
            story.append(Spacer(1, 10))
            
            # Proof Elements
            if offer.get('proof_elements'):
                story.append(Paragraph("✅ <b>Elementos de Prova:</b>", self.styles['CustomBody']))
                for proof in offer['proof_elements']:
                    story.append(Paragraph(f"• {proof}", self.styles['CustomBody']))
                story.append(Spacer(1, 10))
            
            # Bonuses
            if offer.get('bonuses'):
                story.append(Paragraph("🎁 <b>Bônus:</b>", self.styles['CustomBody']))
                for bonus in offer['bonuses']:
                    story.append(Paragraph(f"• {bonus}", self.styles['CustomBody']))
                story.append(Spacer(1, 10))
            
            # Guarantees
            if offer.get('guarantees'):
                story.append(Paragraph("🛡️ <b>Garantias:</b>", self.styles['CustomBody']))
                for guarantee in offer['guarantees']:
                    story.append(Paragraph(f"• {guarantee}", self.styles['CustomBody']))
                story.append(Spacer(1, 10))
            
            # Price Justification
            if offer.get('price_justification'):
                story.append(Paragraph("💰 <b>Justificativa de Preço:</b>", self.styles['CustomBody']))
                story.append(Paragraph(offer['price_justification'], self.styles['CustomBody']))
                story.append(Spacer(1, 10))
        
        # VSL Script
        if project_data.get('materials', {}).get('vsl_script'):
            story.append(PageBreak())
            story.append(Paragraph("🎬 Roteiro VSL", self.styles['CustomHeading2']))
            vsl = project_data['materials']['vsl_script']
            
            story.append(Paragraph(f"<b>Título:</b> {vsl.get('title', 'N/A')}", self.styles['CustomBody']))
            story.append(Paragraph(f"<b>Duração estimada:</b> {vsl.get('estimated_duration', 90)} segundos", self.styles['CustomBody']))
            story.append(Spacer(1, 15))
            
            sections = [
                ('Hook Inicial', vsl.get('hook', '')),
                ('Agitação do Problema', vsl.get('problem_agitation', '')),
                ('Introdução da Solução', vsl.get('solution_intro', '')),
                ('Prova Social', vsl.get('social_proof', '')),
                ('Apresentação da Oferta', vsl.get('offer_presentation', '')),
                ('Garantia', vsl.get('guarantee', '')),
                ('Call-to-Action', vsl.get('call_to_action', ''))
            ]
            
            for section_name, content in sections:
                if content:
                    story.append(Paragraph(f"<b>{section_name}:</b>", self.styles['CustomBody']))
                    story.append(Paragraph(content, self.styles['CustomBody']))
                    story.append(Spacer(1, 10))
        
        # Email Sequence
        if project_data.get('materials', {}).get('email_sequence'):
            story.append(PageBreak())
            story.append(Paragraph("📧 Sequência de E-mails", self.styles['CustomHeading2']))
            email_seq = project_data['materials']['email_sequence']
            
            emails = email_seq.get('emails', [])
            for i, email in enumerate(emails[:5]):
                story.append(Paragraph(f"<b>E-mail {i+1}:</b>", self.styles['CustomBody']))
                story.append(Paragraph(f"<b>Assunto:</b> {email.get('subject', 'N/A')}", self.styles['CustomBody']))
                story.append(Paragraph(f"<b>Conteúdo:</b>", self.styles['CustomBody']))
                # Clean content for PDF
                content = email.get('content', '').replace('\n', '<br/>')
                story.append(Paragraph(content, self.styles['CustomBody']))
                story.append(Spacer(1, 15))
        
        # Social Content
        if project_data.get('materials', {}).get('social_content'):
            story.append(PageBreak())
            story.append(Paragraph("📱 Conteúdo para Redes Sociais", self.styles['CustomHeading2']))
            social_content = project_data['materials']['social_content']
            
            for i, post in enumerate(social_content[:6]):
                story.append(Paragraph(f"<b>Post {i+1} ({post.get('platform', 'N/A').title()}):</b>", self.styles['CustomBody']))
                story.append(Paragraph(post.get('content', 'N/A'), self.styles['CustomBody']))
                
                hashtags = post.get('hashtags', [])
                if hashtags:
                    story.append(Paragraph(f"<b>Hashtags:</b> {' '.join(hashtags)}", self.styles['CustomBody']))
                story.append(Spacer(1, 10))
        
        # Build PDF
        doc.build(story)
        
        # Convert to base64
        buffer.seek(0)
        pdf_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return pdf_base64
    
    def export_materials_json(self, project_data: Dict[str, Any]) -> str:
        """Export materials as JSON for API integrations"""
        
        export_data = {
            'project_info': {
                'name': project_data.get('name', ''),
                'language': project_data.get('language', 'pt-BR'),
                'status': project_data.get('status', ''),
                'exported_at': datetime.now().isoformat()
            },
            'brief': project_data.get('brief', {}),
            'generated_offer': project_data.get('generated_offer', {}),
            'materials': project_data.get('materials', {}),
            'export_metadata': {
                'platform': 'OfferForge',
                'version': '2.0.0',
                'format': 'json'
            }
        }
        
        return json.dumps(export_data, indent=2, ensure_ascii=False)
    
    def export_webhook_payload(self, project_data: Dict[str, Any], webhook_url: str = None) -> Dict[str, Any]:
        """Prepare webhook payload for external integrations"""
        
        payload = {
            'event': 'project_completed',
            'timestamp': datetime.now().isoformat(),
            'project': {
                'id': project_data.get('_id', ''),
                'name': project_data.get('name', ''),
                'language': project_data.get('language', 'pt-BR'),
                'status': project_data.get('status', '')
            },
            'offer': project_data.get('generated_offer', {}),
            'materials': {
                'vsl_available': bool(project_data.get('materials', {}).get('vsl_script')),
                'emails_available': bool(project_data.get('materials', {}).get('email_sequence')),
                'social_available': bool(project_data.get('materials', {}).get('social_content')),
                'landing_page_available': bool(project_data.get('materials', {}).get('landing_page'))
            },
            'metadata': {
                'platform': 'OfferForge',
                'version': '2.0.0',
                'webhook_url': webhook_url
            }
        }
        
        return payload
    
    def create_complete_export_package(
        self, 
        project_data: Dict[str, Any],
        include_landing_page: bool = True,
        include_pdf: bool = True,
        include_json: bool = True
    ) -> str:
        """Create a complete export package with all materials"""
        
        zip_buffer = io.BytesIO()
        project_name = project_data.get('name', 'OfferForge_Project').replace(' ', '_')
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            
            # Add landing page files if requested
            if include_landing_page and project_data.get('materials', {}).get('landing_page'):
                landing_page = project_data['materials']['landing_page']
                zip_file.writestr(f'{project_name}/landing_page/index.html', landing_page.get('html_content', ''))
                zip_file.writestr(f'{project_name}/landing_page/styles.css', landing_page.get('css_content', ''))
            
            # Add PDF export if requested
            if include_pdf:
                pdf_content = self.export_project_pdf(project_data)
                pdf_bytes = base64.b64decode(pdf_content)
                zip_file.writestr(f'{project_name}/{project_name}_complete.pdf', pdf_bytes)
            
            # Add JSON export if requested
            if include_json:
                json_content = self.export_materials_json(project_data)
                zip_file.writestr(f'{project_name}/{project_name}_materials.json', json_content)
            
            # Add individual material files
            materials = project_data.get('materials', {})
            
            # VSL Script
            if materials.get('vsl_script'):
                vsl = materials['vsl_script']
                vsl_content = f"""# Roteiro VSL - {project_data.get('name', 'Projeto')}

## Informações Gerais
- Título: {vsl.get('title', 'N/A')}
- Duração: {vsl.get('estimated_duration', 90)} segundos
- Idioma: {project_data.get('language', 'pt-BR')}

## Roteiro

### Hook Inicial
{vsl.get('hook', 'N/A')}

### Agitação do Problema
{vsl.get('problem_agitation', 'N/A')}

### Introdução da Solução
{vsl.get('solution_intro', 'N/A')}

### Prova Social
{vsl.get('social_proof', 'N/A')}

### Apresentação da Oferta
{vsl.get('offer_presentation', 'N/A')}

### Garantia
{vsl.get('guarantee', 'N/A')}

### Call-to-Action
{vsl.get('call_to_action', 'N/A')}
"""
                zip_file.writestr(f'{project_name}/materials/vsl_script.md', vsl_content)
            
            # Email Sequence
            if materials.get('email_sequence'):
                email_seq = materials['email_sequence']
                emails = email_seq.get('emails', [])
                
                for i, email in enumerate(emails[:5]):
                    email_content = f"""# E-mail {i+1} - {email_seq.get('sequence_name', 'Sequência')}

## Assunto
{email.get('subject', 'N/A')}

## Conteúdo
{email.get('content', 'N/A')}
"""
                    zip_file.writestr(f'{project_name}/materials/email_{i+1}.md', email_content)
            
            # Social Content
            if materials.get('social_content'):
                social_content = materials['social_content']
                
                for i, post in enumerate(social_content[:6]):
                    post_content = f"""# Post {i+1} - {post.get('platform', 'Social').title()}

## Conteúdo
{post.get('content', 'N/A')}

## Hashtags
{' '.join(post.get('hashtags', []))}

## Tipo de Conteúdo
{post.get('content_type', 'post')}
"""
                    zip_file.writestr(f'{project_name}/materials/social_post_{i+1}.md', post_content)
            
            # Add README
            readme_content = f"""# {project_data.get('name', 'OfferForge Project')}

## Projeto gerado com OfferForge
Exportado em: {datetime.now().strftime('%d/%m/%Y às %H:%M')}

## Conteúdo do pacote:
- 📄 Relatório completo em PDF
- 🌐 Landing page (HTML/CSS)
- 🎬 Roteiro VSL
- 📧 Sequência de e-mails
- 📱 Posts para redes sociais
- 📊 Dados em JSON para integrações

## Como usar:
1. Extraia todos os arquivos
2. Revise e personalize o conteúdo
3. Implemente em suas plataformas
4. Use o JSON para integrações com APIs

## Suporte:
Para dúvidas sobre este export, consulte a documentação do OfferForge.
"""
            zip_file.writestr(f'{project_name}/README.md', readme_content)
        
        # Convert to base64
        zip_buffer.seek(0)
        zip_base64 = base64.b64encode(zip_buffer.getvalue()).decode('utf-8')
        
        return zip_base64