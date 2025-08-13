import openai
import os
from dotenv import load_dotenv
from typing import Dict, List, Optional
from models import (
    ProductBrief, PainResearch, GeneratedOffer, 
    VSLScript, EmailSequence, SocialContent,
    LanguageEnum
)

# Load environment variables
load_dotenv()

class OfferForgeAI:
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            # Para desenvolvimento local sem API key
            print("⚠️ OPENAI_API_KEY não encontrada - modo desenvolvimento")
            self.client = None
        else:
            self.client = openai.OpenAI(api_key=api_key)
        
    async def generate_offer(
        self, 
        brief: ProductBrief, 
        pain_research: PainResearch,
        language: LanguageEnum = LanguageEnum.PT_BR
    ) -> GeneratedOffer:
        """Generate complete offer using OpenAI based on brief and pain research"""
        
        # Prepare context for AI
        niche_context = brief.niche
        avatar_context = f"Avatar targeting, price point: {brief.currency} {brief.target_price}"
        promise_context = brief.promise
        
        # Compile pain points
        pain_points = []
        for pain in pain_research.pain_points:
            pain_points.extend([pain.description] * pain.frequency)
        
        pain_context = ", ".join(pain_points[:10])  # Top 10 most frequent pains
        
        # Additional context from reviews and FAQs
        reviews_context = " | ".join(pain_research.reviews[:5]) if pain_research.reviews else ""
        faqs_context = " | ".join(pain_research.faqs[:5]) if pain_research.faqs else ""
        
        # Language-specific prompts
        prompts = self._get_language_prompts(language)
        
        try:
            # Generate headline
            headline_prompt = prompts["headline"].format(
                niche=niche_context,
                promise=promise_context,
                pain_context=pain_context
            )
            
            headline_response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": prompts["system"]},
                    {"role": "user", "content": headline_prompt}
                ],
                max_tokens=150,
                temperature=0.8
            )
            
            headline = headline_response.choices[0].message.content.strip()
            
            # Generate proof elements
            proof_prompt = prompts["proof"].format(
                niche=niche_context,
                promise=promise_context,
                reviews=reviews_context
            )
            
            proof_response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": prompts["system"]},
                    {"role": "user", "content": proof_prompt}
                ],
                max_tokens=300,
                temperature=0.7
            )
            
            proof_elements = [
                line.strip() 
                for line in proof_response.choices[0].message.content.strip().split('\n') 
                if line.strip() and not line.strip().startswith('#')
            ][:5]
            
            # Generate bonuses
            bonus_prompt = prompts["bonuses"].format(
                niche=niche_context,
                promise=promise_context,
                target_price=brief.target_price
            )
            
            bonus_response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": prompts["system"]},
                    {"role": "user", "content": bonus_prompt}
                ],
                max_tokens=250,
                temperature=0.8
            )
            
            bonuses = [
                line.strip() 
                for line in bonus_response.choices[0].message.content.strip().split('\n') 
                if line.strip() and not line.strip().startswith('#')
            ][:4]
            
            # Generate guarantees
            guarantee_prompt = prompts["guarantees"].format(
                niche=niche_context,
                target_price=brief.target_price,
                currency=brief.currency
            )
            
            guarantee_response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": prompts["system"]},
                    {"role": "user", "content": guarantee_prompt}
                ],
                max_tokens=200,
                temperature=0.6
            )
            
            guarantees = [
                line.strip() 
                for line in guarantee_response.choices[0].message.content.strip().split('\n') 
                if line.strip() and not line.strip().startswith('#')
            ][:3]
            
            # Generate price justification
            price_justification_prompt = prompts["price_justification"].format(
                target_price=brief.target_price,
                currency=brief.currency,
                promise=promise_context,
                bonuses=", ".join(bonuses[:2])
            )
            
            price_response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": prompts["system"]},
                    {"role": "user", "content": price_justification_prompt}
                ],
                max_tokens=150,
                temperature=0.7
            )
            
            price_justification = price_response.choices[0].message.content.strip()
            
            # Generate urgency elements
            urgency_elements = self._generate_urgency_elements(language, brief.target_price)
            
            return GeneratedOffer(
                headline=headline,
                main_promise=promise_context,
                proof_elements=proof_elements,
                bonuses=bonuses,
                guarantees=guarantees,
                price_justification=price_justification,
                urgency_elements=urgency_elements
            )
            
        except Exception as e:
            raise Exception(f"AI content generation failed: {str(e)}")
    
    async def generate_vsl_script(
        self,
        offer: GeneratedOffer,
        brief: ProductBrief,
        language: LanguageEnum = LanguageEnum.PT_BR,
        duration: int = 90
    ) -> VSLScript:
        """Generate VSL script based on offer and brief"""
        
        prompts = self._get_language_prompts(language)
        
        try:
            vsl_prompt = prompts["vsl_script"].format(
                headline=offer.headline,
                promise=offer.main_promise,
                niche=brief.niche,
                proof_elements=", ".join(offer.proof_elements[:3]),
                bonuses=", ".join(offer.bonuses[:2]),
                guarantee=offer.guarantees[0] if offer.guarantees else "Garantia de satisfação",
                duration=duration
            )
            
            vsl_response = self.client.chat.completions.create(
                model="gpt-4", 
                messages=[
                    {"role": "system", "content": prompts["system"]},
                    {"role": "user", "content": vsl_prompt}
                ],
                max_tokens=800,
                temperature=0.7
            )
            
            vsl_content = vsl_response.choices[0].message.content.strip()
            
            # Parse VSL sections (basic parsing)
            sections = vsl_content.split('\n\n')
            
            return VSLScript(
                title=offer.headline,
                hook=sections[0] if len(sections) > 0 else offer.headline,
                problem_agitation=sections[1] if len(sections) > 1 else "Problema identificado...",
                solution_intro=sections[2] if len(sections) > 2 else "Apresentando a solução...",
                benefits=offer.proof_elements[:3],
                social_proof=sections[3] if len(sections) > 3 else "Depoimentos de clientes...",
                offer_presentation=sections[4] if len(sections) > 4 else f"Oferta especial: {brief.currency} {brief.target_price}",
                guarantee=offer.guarantees[0] if offer.guarantees else "Garantia de satisfação",
                call_to_action=sections[-1] if len(sections) > 5 else "Clique agora e transforme sua vida!",
                estimated_duration=duration,
                language=language
            )
            
        except Exception as e:
            raise Exception(f"VSL generation failed: {str(e)}")
    
    async def generate_email_sequence(
        self,
        offer: GeneratedOffer,
        brief: ProductBrief,
        language: LanguageEnum = LanguageEnum.PT_BR
    ) -> EmailSequence:
        """Generate 5-email sequence"""
        
        prompts = self._get_language_prompts(language)
        
        try:
            email_prompt = prompts["email_sequence"].format(
                niche=brief.niche,
                promise=offer.main_promise,
                headline=offer.headline,
                bonuses=", ".join(offer.bonuses[:2]),
                guarantee=offer.guarantees[0] if offer.guarantees else "Garantia"
            )
            
            email_response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": prompts["system"]},
                    {"role": "user", "content": email_prompt}
                ],
                max_tokens=1200,
                temperature=0.7
            )
            
            email_content = email_response.choices[0].message.content.strip()
            
            # Parse emails (basic parsing)
            email_sections = email_content.split('---')
            emails = []
            
            for i, section in enumerate(email_sections[:5]):
                if section.strip():
                    lines = [line.strip() for line in section.strip().split('\n') if line.strip()]
                    subject = lines[0] if lines else f"Email {i+1}"
                    content = '\n'.join(lines[1:]) if len(lines) > 1 else section.strip()
                    emails.append({"subject": subject, "content": content})
            
            # Ensure we have 5 emails
            while len(emails) < 5:
                emails.append({
                    "subject": f"Email {len(emails) + 1} - {brief.niche}",
                    "content": "Conteúdo do email a ser gerado..."
                })
            
            return EmailSequence(
                sequence_name=f"Sequência {brief.niche}",
                emails=emails,
                language=language
            )
            
        except Exception as e:
            raise Exception(f"Email sequence generation failed: {str(e)}")
    
    async def generate_social_content(
        self,
        offer: GeneratedOffer,
        brief: ProductBrief,
        language: LanguageEnum = LanguageEnum.PT_BR
    ) -> List[SocialContent]:
        """Generate 6 social media hooks"""
        
        prompts = self._get_language_prompts(language)
        
        try:
            social_prompt = prompts["social_content"].format(
                niche=brief.niche,
                headline=offer.headline,
                promise=offer.main_promise
            )
            
            social_response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": prompts["system"]},
                    {"role": "user", "content": social_prompt}
                ],
                max_tokens=600,
                temperature=0.8
            )
            
            social_content = social_response.choices[0].message.content.strip()
            
            # Parse social content
            posts = []
            platforms = ["instagram", "facebook", "linkedin", "instagram", "facebook", "linkedin"]
            content_types = ["post", "post", "post", "story", "story", "post"]
            
            social_lines = [line.strip() for line in social_content.split('\n') if line.strip() and not line.startswith('#')]
            
            for i in range(min(6, len(social_lines))):
                posts.append(SocialContent(
                    platform=platforms[i],
                    content_type=content_types[i],
                    content=social_lines[i],
                    hashtags=[f"#{brief.niche.lower()}", "#oferta", "#limitado"],
                    language=language
                ))
            
            return posts
            
        except Exception as e:
            raise Exception(f"Social content generation failed: {str(e)}")
    
    def _get_language_prompts(self, language: LanguageEnum) -> Dict[str, str]:
        """Get language-specific prompts"""
        
        if language == LanguageEnum.PT_BR:
            return {
                "system": "Você é um especialista em marketing digital e copywriting brasileiro. Crie conteúdo persuasivo e autêntico em português brasileiro, focado no mercado brasileiro.",
                "headline": "Crie uma headline poderosa para uma oferta no nicho de {niche}. A promessa principal é: {promise}. As principais dores do público são: {pain_context}. A headline deve ser específica, criar curiosidade e prometer transformação. Responda apenas com a headline, sem explicações.",
                "proof": "Liste 5 elementos de prova social convincentes para um produto no nicho {niche} com a promessa '{promise}'. Base-se nestas avaliações reais: {reviews}. Formato: uma linha por elemento, sem numeração.",
                "bonuses": "Crie 4 bônus irresistíveis para complementar uma oferta no nicho {niche} com promessa '{promise}' e preço de {target_price}. Cada bônus deve agregar valor percebido. Formato: uma linha por bônus.",
                "guarantees": "Crie 3 garantias convincentes para um produto de {niche} no valor de {currency} {target_price}. As garantias devem remover o risco e aumentar a confiança. Formato: uma linha por garantia.",
                "price_justification": "Crie uma justificativa de preço convincente para uma oferta de {currency} {target_price} com a promessa '{promise}' e bônus '{bonuses}'. Explique por que vale o investimento.",
                "vsl_script": "Crie um roteiro de VSL de {duration} segundos para a oferta '{headline}' no nicho {niche}. Estrutura: Hook inicial, Agitação do problema, Apresentação da solução, Benefícios ({proof_elements}), Prova social, Apresentação da oferta com bônus ({bonuses}), Garantia ({guarantee}), Call-to-action. Separe cada seção com quebra de linha dupla.",
                "email_sequence": "Crie uma sequência de 5 e-mails para nutrir leads interessados em {niche} com a oferta '{headline}'. A promessa é '{promise}'. Inclua bônus: {bonuses}. Garantia: {guarantee}. Separe cada e-mail com '---'. Formato: Assunto na primeira linha, conteúdo nas linhas seguintes.",
                "social_content": "Crie 6 hooks diferentes para redes sociais promovendo uma oferta de {niche}. Headline da oferta: '{headline}'. Promessa: '{promise}'. Cada hook deve ser único, chamar atenção e gerar curiosidade. Uma linha por hook."
            }
        else:  # EN_US
            return {
                "system": "You are a digital marketing and copywriting expert. Create persuasive and authentic content in English, focused on the international market.",
                "headline": "Create a powerful headline for an offer in the {niche} niche. The main promise is: {promise}. The main pain points of the audience are: {pain_context}. The headline should be specific, create curiosity and promise transformation. Answer only with the headline, no explanations.",
                "proof": "List 5 convincing social proof elements for a product in the {niche} niche with the promise '{promise}'. Base it on these real reviews: {reviews}. Format: one line per element, no numbering.",
                "bonuses": "Create 4 irresistible bonuses to complement an offer in the {niche} niche with promise '{promise}' and price of {target_price}. Each bonus should add perceived value. Format: one line per bonus.",
                "guarantees": "Create 3 convincing guarantees for a {niche} product worth {currency} {target_price}. Guarantees should remove risk and increase trust. Format: one line per guarantee.",
                "price_justification": "Create a convincing price justification for an offer of {currency} {target_price} with the promise '{promise}' and bonuses '{bonuses}'. Explain why it's worth the investment.",
                "vsl_script": "Create a {duration}-second VSL script for the offer '{headline}' in the {niche} niche. Structure: Initial hook, Problem agitation, Solution presentation, Benefits ({proof_elements}), Social proof, Offer presentation with bonuses ({bonuses}), Guarantee ({guarantee}), Call-to-action. Separate each section with double line break.",
                "email_sequence": "Create a sequence of 5 emails to nurture leads interested in {niche} with the offer '{headline}'. The promise is '{promise}'. Include bonuses: {bonuses}. Guarantee: {guarantee}. Separate each email with '---'. Format: Subject on first line, content on following lines.",
                "social_content": "Create 6 different hooks for social media promoting a {niche} offer. Offer headline: '{headline}'. Promise: '{promise}'. Each hook should be unique, grab attention and generate curiosity. One line per hook."
            }
    
    def _generate_urgency_elements(self, language: LanguageEnum, target_price: float) -> List[str]:
        """Generate urgency elements based on language"""
        
        if language == LanguageEnum.PT_BR:
            return [
                "Oferta válida apenas por 48 horas",
                "Apenas 50 vagas disponíveis",
                f"Preço promocional de R$ {target_price} por tempo limitado",
                "Bônus exclusivos apenas para os primeiros 25 alunos"
            ]
        else:
            return [
                "Offer valid for 48 hours only",
                "Only 50 spots available", 
                f"Promotional price of ${target_price} for limited time",
                "Exclusive bonuses for the first 25 students only"
            ]