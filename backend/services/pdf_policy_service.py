"""
Enhanced Policy Service with PDF Analysis
========================================

This service provides:
1. PDF upload and text extraction
2. Policy document summarization
3. Key point extraction
4. Sentiment analysis of policies
5. Policy comparison capabilities
"""

import pdfplumber
import PyPDF2
import io
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import logging
from functools import lru_cache
import hashlib

logger = logging.getLogger(__name__)

class PDFPolicyAnalyzer:
    """Enhanced policy analysis with PDF processing capabilities"""
    
    def __init__(self):
        self.device = -1  # CPU only for deployment
        self.summarizer = None
        self.sentiment_analyzer = None
        self.tokenizer = None
        self.model = None
        self.max_chunk_tokens = 900
        
        # Initialize models
        self.initialize_models()
        
        # Policy analysis patterns
        self.policy_keywords = {
            'objectives': ['goal', 'objective', 'aim', 'purpose', 'mission', 'vision'],
            'requirements': ['must', 'shall', 'required', 'mandatory', 'obligatory'],
            'benefits': ['benefit', 'advantage', 'improvement', 'enhancement', 'positive'],
            'restrictions': ['prohibition', 'restriction', 'limitation', 'constraint', 'ban'],
            'timelines': ['deadline', 'timeline', 'schedule', 'date', 'period', 'duration'],
            'stakeholders': ['citizen', 'business', 'organization', 'agency', 'department']
        }
    
    def initialize_models(self):
        """Skip heavy model downloads — use fast extractive summarization instead."""
        logger.info("✅ PDF Policy Analyzer ready (extractive mode — no model download required)")
        self.summarizer = None
        self.tokenizer = None
        self.model = None
    
    def extract_text_from_pdf(self, pdf_file) -> Tuple[str, Dict]:
        """Extract text from PDF file with metadata"""
        try:
            # Read PDF file
            pdf_bytes = pdf_file.read()
            pdf_file_obj = io.BytesIO(pdf_bytes)
            
            # Method 1: Try pdfplumber first (better for complex layouts)
            text_content = ""
            metadata = {
                'total_pages': 0,
                'extraction_method': 'pdfplumber',
                'file_size': len(pdf_bytes),
                'extraction_time': datetime.now().isoformat()
            }
            
            try:
                with pdfplumber.open(pdf_file_obj) as pdf:
                    metadata['total_pages'] = len(pdf.pages)
                    
                    for page_num, page in enumerate(pdf.pages, 1):
                        page_text = page.extract_text()
                        if page_text:
                            text_content += f"\\n\\n--- Page {page_num} ---\\n"
                            text_content += page_text
                    
                    logger.info(f"✅ Extracted text from {metadata['total_pages']} pages using pdfplumber")
                    
            except Exception as e:
                logger.warning(f"pdfplumber failed: {e}, trying PyPDF2...")
                
                # Method 2: Fallback to PyPDF2
                pdf_file_obj.seek(0)  # Reset file pointer
                
                try:
                    pdf_reader = PyPDF2.PdfReader(pdf_file_obj)
                    metadata['total_pages'] = len(pdf_reader.pages)
                    metadata['extraction_method'] = 'PyPDF2'
                    
                    for page_num, page in enumerate(pdf_reader.pages, 1):
                        page_text = page.extract_text()
                        if page_text:
                            text_content += f"\\n\\n--- Page {page_num} ---\\n"
                            text_content += page_text
                    
                    logger.info(f"✅ Extracted text from {metadata['total_pages']} pages using PyPDF2")
                    
                except Exception as e2:
                    logger.error(f"Both PDF extraction methods failed: {e2}")
                    raise Exception(f"PDF extraction failed: {str(e2)}")
            
            if not text_content.strip():
                raise Exception("No text content could be extracted from the PDF")
            
            # Clean the extracted text
            cleaned_text = self.clean_extracted_text(text_content)
            metadata['character_count'] = len(cleaned_text)
            metadata['word_count'] = len(cleaned_text.split())
            
            return cleaned_text, metadata
            
        except Exception as e:
            logger.error(f"PDF text extraction failed: {e}")
            raise Exception(f"Failed to extract text from PDF: {str(e)}")
    
    def clean_extracted_text(self, text: str) -> str:
        """Clean and normalize extracted PDF text"""
        # Remove excessive whitespace
        text = re.sub(r'\\s+', ' ', text)
        
        # Remove page headers/footers (common patterns)
        text = re.sub(r'--- Page \\d+ ---', '', text)
        
        # Fix common OCR issues
        text = re.sub(r'([a-z])([A-Z])', r'\\1 \\2', text)  # Add space between camelCase
        text = re.sub(r'([.!?])([A-Z])', r'\\1 \\2', text)  # Add space after punctuation
        
        # Remove excessive newlines
        text = re.sub(r'\\n+', '\\n\\n', text)
        
        return text.strip()
    
    def extract_policy_structure(self, text: str) -> Dict:
        """Extract structured information from policy text"""
        structure = {
            'title': self.extract_title(text),
            'sections': self.extract_sections(text),
            'key_points': self.extract_key_points(text),
            'stakeholders': self.extract_stakeholders(text),
            'timelines': self.extract_timelines(text),
            'requirements': self.extract_requirements(text)
        }
        
        return structure
    
    def extract_title(self, text: str) -> str:
        """Extract document title"""
        lines = text.split('\\n')
        
        # Look for title patterns
        for line in lines[:10]:  # Check first 10 lines
            line = line.strip()
            if len(line) > 10 and len(line) < 200:
                # Check if it looks like a title
                if any(keyword in line.lower() for keyword in ['policy', 'act', 'law', 'regulation', 'bill']):
                    return line
        
        # Fallback: use first substantial line
        for line in lines[:5]:
            line = line.strip()
            if len(line) > 20:
                return line
        
        return "Policy Document"
    
    def extract_sections(self, text: str) -> List[Dict]:
        """Extract document sections"""
        sections = []
        
        # Look for section headers (numbers, letters, or keywords)
        section_patterns = [
            r'^\\s*(?:Section|SECTION)\\s+(\\d+[.:]?.*?)$',
            r'^\\s*(\\d+\\.\\s+.*?)$',
            r'^\\s*([A-Z][A-Z\\s]{3,}?)$'  # ALL CAPS headers
        ]
        
        lines = text.split('\\n')
        current_section = None
        section_content = []
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            # Check if this line is a section header
            is_section_header = False
            for pattern in section_patterns:
                if re.match(pattern, line, re.MULTILINE):
                    is_section_header = True
                    break
            
            if is_section_header:
                # Save previous section
                if current_section and section_content:
                    sections.append({
                        'title': current_section,
                        'content': '\\n'.join(section_content).strip()
                    })
                
                # Start new section
                current_section = line
                section_content = []
            else:
                # Add to current section content
                if current_section:
                    section_content.append(line)
        
        # Add the last section
        if current_section and section_content:
            sections.append({
                'title': current_section,
                'content': '\\n'.join(section_content).strip()
            })
        
        return sections[:10]  # Limit to first 10 sections
    
    def extract_key_points(self, text: str) -> List[str]:
        """Extract key policy points"""
        key_points = []
        
        # Look for bullet points and numbered lists
        bullet_patterns = [
            r'^\\s*[•·▪▫]\\s+(.+)$',
            r'^\\s*[-*]\\s+(.+)$',
            r'^\\s*\\d+\\.\\s+(.+)$',
            r'^\\s*\\([a-zA-Z]\\)\\s+(.+)$'
        ]
        
        lines = text.split('\\n')
        for line in lines:
            line = line.strip()
            for pattern in bullet_patterns:
                match = re.match(pattern, line)
                if match:
                    point = match.group(1).strip()
                    if len(point) > 10:  # Ignore very short points
                        key_points.append(point)
                        break
        
        return key_points[:20]  # Limit to first 20 key points
    
    def extract_stakeholders(self, text: str) -> List[str]:
        """Extract mentioned stakeholders"""
        stakeholders = set()
        
        # Common stakeholder patterns
        stakeholder_patterns = [
            r'\\b(citizens?|residents?)\\b',
            r'\\b(businesses?|companies?|corporations?)\\b',
            r'\\b(government|federal|state|local)\\s+\\w+\\b',
            r'\\b(department|agency|bureau)\\s+of\\s+\\w+\\b',
            r'\\b(organizations?|institutions?)\\b'
        ]
        
        text_lower = text.lower()
        for pattern in stakeholder_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                if isinstance(match, tuple):
                    stakeholders.add(match[0])
                else:
                    stakeholders.add(match)
        
        return list(stakeholders)[:10]
    
    def extract_timelines(self, text: str) -> List[str]:
        """Extract timeline information"""
        timelines = []
        
        # Date and timeline patterns
        timeline_patterns = [
            r'\\b(?:by|before|after|on|within)\\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},?\\s+\\d{4}\\b',
            r'\\b\\d{1,2}/\\d{1,2}/\\d{4}\\b',
            r'\\b\\d{4}-\\d{2}-\\d{2}\\b',
            r'\\bwithin\\s+\\d+\\s+(?:days?|weeks?|months?|years?)\\b',
            r'\\b(?:effective|starting)\\s+(?:immediately|on)\\b'
        ]
        
        for pattern in timeline_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            timelines.extend(matches)
        
        return list(set(timelines))[:10]  # Remove duplicates and limit
    
    def extract_requirements(self, text: str) -> List[str]:
        """Extract policy requirements"""
        requirements = []
        
        # Requirement patterns
        requirement_patterns = [
            r'\\b(?:must|shall|required?|mandatory)\\s+[^.!?]+[.!?]',
            r'\\b(?:prohibited|forbidden|banned)\\s+[^.!?]+[.!?]',
            r'\\b(?:responsible for|obligated to)\\s+[^.!?]+[.!?]'
        ]
        
        for pattern in requirement_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            requirements.extend(matches)
        
        return requirements[:15]  # Limit to 15 requirements
    
    def generate_summary(self, text: str, max_length: int = 1024) -> Dict:
        """Generate comprehensive policy summary with chunking for long documents"""
        try:
            # If text is too short, return as-is
            if len(text) < 100:
                return {
                    'summary': text,
                    'method': 'passthrough',
                    'confidence': 1.0
                }
            
            # If summarizer model is available
            if self.summarizer and self.tokenizer:
                try:
                    # Calculate word count
                    word_count = len(text.split())
                    logger.info(f"Summarizing {word_count} words...")
                    
                    # Chunk the text for long documents
                    chunks = self._chunk_text(text)
                    logger.info(f"Split into {len(chunks)} chunks")
                    
                    # Summarize each chunk
                    chunk_summaries = []
                    words_per_chunk = max(120, max_length // len(chunks))
                    
                    for i, chunk in enumerate(chunks):
                        try:
                            result = self.summarizer(
                                chunk,
                                max_length=min(words_per_chunk * 2, 512),
                                min_length=min(words_per_chunk, 80),
                                do_sample=False,
                                truncation=True,
                                num_beams=4,
                                length_penalty=2.0,
                                early_stopping=True
                            )
                            chunk_summaries.append(result[0]['summary_text'])
                            logger.info(f"✓ Chunk {i+1}/{len(chunks)} summarized")
                        except Exception as e:
                            logger.warning(f"Chunk {i+1} failed: {e}")
                            continue
                    
                    # Combine chunk summaries
                    if chunk_summaries:
                        combined = ' '.join(chunk_summaries)
                        
                        # Final summary if multiple chunks
                        if len(chunks) > 1:
                            try:
                                final_result = self.summarizer(
                                    combined,
                                    max_length=max_length,
                                    min_length=min(max_length // 2, 200),
                                    do_sample=False,
                                    truncation=True
                                )
                                summary_text = final_result[0]['summary_text']
                            except:
                                summary_text = combined[:max_length * 6]
                        else:
                            summary_text = combined
                        
                        # Extract key points (expanded)
                        key_points = self._extract_key_sentences(text, num_points=10)
                        
                        # Generate executive highlights
                        exec_highlights = self._generate_executive_highlights(text, key_points)
                        
                        return {
                            'summary': summary_text,
                            'key_points': key_points,
                            'executive_highlights': exec_highlights,
                            'section_summaries': self._summarize_sections(text),
                            'policy_implications': self._analyze_implications(text),
                            'method': 'transformer_model',
                            'confidence': 0.85,
                            'metadata': {
                                'original_words': word_count,
                                'summary_words': len(summary_text.split()),
                                'chunks_processed': len(chunks),
                                'model': 'facebook/bart-large-cnn'
                            }
                        }
                    
                except Exception as e:
                    logger.warning(f"Transformer summarization failed: {e}")
            
            # Fallback: extractive summarization
            logger.info("Using extractive summarization fallback")
            return self.extractive_summary(text, max_length)
            
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            return {
                'summary': "Unable to generate summary due to processing error.",
                'method': 'error',
                'confidence': 0.0,
                'key_points': []
            }
    
    def _chunk_text(self, text: str) -> List[str]:
        """Split text into chunks that fit model's context window"""
        if not self.tokenizer:
            # Fallback: simple chunking by character count
            chunk_size = 3000
            return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
        
        # Split on sentences
        sentences = text.replace('\n', ' ').split('. ')
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # Tokenize sentence
            tokens = self.tokenizer.encode(sentence, add_special_tokens=False)
            sentence_tokens = len(tokens)
            
            if current_tokens + sentence_tokens > self.max_chunk_tokens:
                # Save current chunk
                if current_chunk:
                    chunks.append('. '.join(current_chunk) + '.')
                current_chunk = [sentence]
                current_tokens = sentence_tokens
            else:
                current_chunk.append(sentence)
                current_tokens += sentence_tokens
        
        # Add final chunk
        if current_chunk:
            chunks.append('. '.join(current_chunk) + '.')
        
        return chunks if chunks else [text]
    
    def _extract_key_sentences(self, text: str, num_points: int = 10) -> List[str]:
        """Extract key sentences using advanced keyword and position scoring"""
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Important keywords for policies (expanded)
        important_keywords = [
            'require', 'must', 'shall', 'policy', 'objective',
            'benefit', 'implement', 'ensure', 'provide', 'establish',
            'mandate', 'regulation', 'law', 'act', 'section',
            'effective', 'compliance', 'enforce', 'authorize', 'prohibit',
            'funding', 'budget', 'allocat', 'responsible', 'accountab',
            'deadline', 'timeline', 'within', 'penalty', 'violation',
            'citizen', 'public', 'stakeholder', 'impact', 'recommend'
        ]
        
        scored_sentences = []
        total = len(sentences)
        for idx, sentence in enumerate(sentences):
            sentence = sentence.strip()
            if len(sentence.split()) < 6:
                continue
            score = sum(1 for kw in important_keywords if kw in sentence.lower())
            # Boost early sentences (introductions carry weight)
            if idx < total * 0.15:
                score += 2
            # Boost sentences with numbers/dates (concrete facts)
            if re.search(r'\d', sentence):
                score += 1
            # Boost sentences with policy action verbs
            if re.search(r'\b(shall|must|will|requires?|mandates?|ensures?|provides?)\b', sentence, re.IGNORECASE):
                score += 2
            if score > 0:
                scored_sentences.append((score, sentence))
        
        scored_sentences.sort(reverse=True, key=lambda x: x[0])
        results = []
        seen = set()
        for _, sent in scored_sentences:
            normalized = sent[:60].lower()
            if normalized not in seen:
                seen.add(normalized)
                clean = sent.strip()
                if not clean.endswith('.'):
                    clean += '.'
                results.append(clean)
                if len(results) >= num_points:
                    break
        return results
    
    def _generate_executive_highlights(self, text: str, key_points: List[str]) -> List[str]:
        """Generate high-level executive highlights from the policy"""
        highlights = []
        text_lower = text.lower()
        
        # Detect scope / who is affected
        scope_keywords = {'all citizens': 'citizens', 'businesses': 'businesses',
                          'organizations': 'organizations', 'employees': 'employees',
                          'government': 'government agencies', 'public': 'the general public'}
        affected = [v for k, v in scope_keywords.items() if k in text_lower]
        if affected:
            highlights.append(f"Primarily affects: {', '.join(set(affected))}")
        
        # Detect financial mentions
        money = re.findall(r'[\$₹€£]\s?[\d,]+(?:\.\d+)?(?:\s?(?:million|billion|crore|lakh|thousand))?', text, re.IGNORECASE)
        if money:
            highlights.append(f"Financial scope: {'; '.join(money[:3])}")
        
        # Detect timeline references
        deadlines = re.findall(r'\b(?:by|before|within|effective)\s+\w[\w\s,]{3,30}', text, re.IGNORECASE)
        if deadlines:
            highlights.append(f"Key timeline: {deadlines[0].strip()}")
        
        # Detect enforcement/penalties
        if re.search(r'\b(penalty|fine|violation|enforce|sanction|punish)', text_lower):
            highlights.append("Includes enforcement provisions and penalties for non-compliance")
        
        # Count requirements
        reqs = re.findall(r'\b(?:must|shall|required to)\b', text_lower)
        if reqs:
            highlights.append(f"Contains {len(reqs)} mandatory requirements")
        
        return highlights
    
    def _summarize_sections(self, text: str) -> List[Dict]:
        """Generate brief summaries for each detected section"""
        sections = self.extract_sections(text)
        section_summaries = []
        for section in sections[:8]:
            content = section.get('content', '')
            if len(content) < 20:
                continue
            # Take first 2 substantial sentences as section summary
            sents = re.split(r'(?<=[.!?])\s+', content)
            summary_sents = [s.strip() for s in sents if len(s.strip()) > 20][:2]
            section_summaries.append({
                'title': section['title'],
                'summary': ' '.join(summary_sents) if summary_sents else content[:200]
            })
        return section_summaries
    
    def _analyze_implications(self, text: str) -> Dict:
        """Analyze policy implications and impact areas"""
        text_lower = text.lower()
        
        impact_areas = []
        area_map = {
            'Economic': ['economic', 'financial', 'budget', 'cost', 'revenue', 'tax', 'funding', 'investment'],
            'Social': ['social', 'community', 'citizen', 'public', 'welfare', 'education', 'health'],
            'Environmental': ['environment', 'climate', 'pollution', 'sustainability', 'green', 'emission'],
            'Legal': ['legal', 'court', 'law', 'regulation', 'compliance', 'enforcement', 'penalty'],
            'Technological': ['technology', 'digital', 'data', 'cyber', 'innovation', 'software', 'ai'],
            'Administrative': ['department', 'agency', 'bureau', 'administration', 'governance', 'oversight']
        }
        
        for area, keywords in area_map.items():
            count = sum(1 for kw in keywords if kw in text_lower)
            if count >= 2:
                impact_areas.append({'area': area, 'relevance': min(count / len(keywords), 1.0)})
        
        impact_areas.sort(key=lambda x: x['relevance'], reverse=True)
        
        # Determine overall complexity
        word_count = len(text.split())
        req_count = len(re.findall(r'\b(?:must|shall|required)\b', text_lower))
        complexity = 'High' if (word_count > 3000 or req_count > 10) else 'Medium' if (word_count > 1000 or req_count > 5) else 'Low'
        
        return {
            'impact_areas': impact_areas[:5],
            'complexity_level': complexity,
            'requirement_count': req_count,
            'estimated_reading_time': f"{max(1, word_count // 200)} minutes"
        }
    
    def extractive_summary(self, text: str, max_length: int = 1024) -> Dict:
        """Enhanced extractive summarization with deeper analysis"""
        sentences = re.split(r'(?<=[.!?])\s+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        
        # Score sentences based on keyword presence and position
        scored_sentences = []
        total = len(sentences)
        for idx, sentence in enumerate(sentences[:100]):  # Process up to 100 sentences
            score = 0
            sentence_lower = sentence.lower()
            
            # Score based on policy keywords
            for category, keywords in self.policy_keywords.items():
                for keyword in keywords:
                    if keyword in sentence_lower:
                        score += 1
            
            # Boost sentences with numbers (contain important facts)
            if re.search(r'\d+', sentence):
                score += 1
            
            # Boost sentences with action verbs
            if re.search(r'\b(shall|must|will|requires?|mandates?|establishes?|provides?|ensures?)\b', sentence_lower):
                score += 2
            
            # Boost first/last sentences of document (intro and conclusion)
            if idx < total * 0.1 or idx > total * 0.9:
                score += 1
            
            scored_sentences.append((score, sentence, idx))
        
        # Sort by score and select top sentences
        scored_sentences.sort(reverse=True, key=lambda x: x[0])
        
        # Build summary - take top sentences, reorder by position for readability
        selected = scored_sentences[:15]
        selected.sort(key=lambda x: x[2])  # Reorder by original position
        
        summary_parts = []
        current_length = 0
        for score, sentence, idx in selected:
            if current_length + len(sentence) > max_length * 5:  # ~5 chars per token
                break
            summary_parts.append(sentence)
            current_length += len(sentence)
        
        summary = ' '.join(summary_parts)
        if summary and not summary.endswith('.'):
            summary += '.'
        
        # Extract key points (top 10 scored sentences)
        key_points = self._extract_key_sentences(text, num_points=10)
        
        # Generate executive highlights and implications
        exec_highlights = self._generate_executive_highlights(text, key_points)
        section_summaries = self._summarize_sections(text)
        implications = self._analyze_implications(text)
        
        return {
            'summary': summary,
            'key_points': key_points,
            'executive_highlights': exec_highlights,
            'section_summaries': section_summaries,
            'policy_implications': implications,
            'method': 'extractive',
            'confidence': 0.6,
            'metadata': {
                'original_words': len(text.split()),
                'summary_words': len(summary.split())
            }
        }
    
    def analyze_sentiment(self, text: str) -> Dict:
        """Analyze policy sentiment"""
        try:
            if self.sentiment_analyzer and len(text) > 10:
                # Truncate text if too long
                analysis_text = text[:512] if len(text) > 512 else text
                
                result = self.sentiment_analyzer(analysis_text)
                
                return {
                    'sentiment': result[0]['label'].lower(),
                    'confidence': result[0]['score'],
                    'method': 'transformer_model'
                }
            else:
                # Fallback sentiment analysis
                return self.rule_based_sentiment(text)
                
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return self.rule_based_sentiment(text)
    
    def rule_based_sentiment(self, text: str) -> Dict:
        """Rule-based sentiment analysis fallback"""
        positive_words = ['benefit', 'improve', 'enhance', 'positive', 'support', 'encourage']
        negative_words = ['restrict', 'prohibit', 'penalty', 'violation', 'ban', 'limitation']
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            sentiment = 'positive'
            confidence = min(0.8, positive_count / max(positive_count + negative_count, 1))
        elif negative_count > positive_count:
            sentiment = 'negative'
            confidence = min(0.8, negative_count / max(positive_count + negative_count, 1))
        else:
            sentiment = 'neutral'
            confidence = 0.5
        
        return {
            'sentiment': sentiment,
            'confidence': confidence,
            'method': 'rule_based'
        }
    
    def analyze_policy_pdf(self, pdf_file, filename: str = "policy.pdf") -> Dict:
        """Complete PDF policy analysis"""
        try:
            logger.info(f"📄 Starting analysis of PDF: {filename}")
            
            # Extract text from PDF
            text_content, extraction_metadata = self.extract_text_from_pdf(pdf_file)
            
            # Analyze policy structure
            structure = self.extract_policy_structure(text_content)
            
            # Generate summary
            summary_result = self.generate_summary(text_content)
            
            # Analyze sentiment
            sentiment_result = self.analyze_sentiment(text_content)
            
            # Compile final result
            result = {
                'success': True,
                'filename': filename,
                'extraction_metadata': extraction_metadata,
                'policy_structure': structure,
                'summary': summary_result,
                'sentiment_analysis': sentiment_result,
                'analysis_timestamp': datetime.now().isoformat(),
                'full_text': text_content[:5000] + "..." if len(text_content) > 5000 else text_content  # Truncate for response
            }
            
            logger.info(f"✅ Policy analysis completed for {filename}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Policy analysis failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'filename': filename,
                'analysis_timestamp': datetime.now().isoformat()
            }

# Global instance - using lazy initialization to avoid startup delays
_pdf_policy_analyzer_instance = None

def get_pdf_policy_analyzer():
    """Get or create the PDF policy analyzer instance"""
    global _pdf_policy_analyzer_instance
    if _pdf_policy_analyzer_instance is None:
        _pdf_policy_analyzer_instance = PDFPolicyAnalyzer()
    return _pdf_policy_analyzer_instance