"""
AI Media Integrity Engine (MIE) Service

This service handles:
1. Real-time deepfake detection using hybrid MobileNetV2-LSTM
2. Face detection and temporal inconsistency analysis
3. Trust scoring system (0-100) for media verification
4. Support for images and videos with MTCNN face detection
"""

import asyncio
import io
import time
import hashlib
from typing import Dict, Any, Optional
from PIL import Image
from PIL.ExifTags import TAGS
import numpy as np
import cv2
import torch
import torch.nn as nn
from torchvision import transforms
import logging

logger = logging.getLogger(__name__)

class MobileNetV2LSTM(nn.Module):
    """
    Hybrid MobileNetV2-LSTM architecture for deepfake detection.
    
    - MobileNetV2: Extracts spatial features from each frame
    - Bidirectional LSTM: Detects temporal inconsistencies
    """
    def __init__(self, num_classes=2, hidden_size=128, num_layers=2):
        super().__init__()
        
        # Feature extractor (MobileNetV2 backbone)
        from torchvision.models import mobilenet_v2
        self.feature_extractor = mobilenet_v2(pretrained=True)
        self.feature_extractor.classifier = nn.Identity()  # Remove classification head
        
        # Temporal analyzer (Bidirectional LSTM)
        self.lstm = nn.LSTM(
            input_size=1280,  # MobileNetV2 feature size
            hidden_size=hidden_size,
            num_layers=num_layers,
            bidirectional=True,
            batch_first=True,
            dropout=0.3
        )
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size * 2, 64),  # *2 for bidirectional
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(64, num_classes)
        )
        
    def forward(self, x):
        # x shape: (batch_size, sequence_length, channels, height, width)
        batch_size, seq_len = x.size(0), x.size(1)
        
        # Reshape for CNN processing
        x = x.view(batch_size * seq_len, *x.shape[2:])
        
        # Extract spatial features
        features = self.feature_extractor(x)  # (batch_size * seq_len, 1280)
        
        # Reshape for LSTM processing
        features = features.view(batch_size, seq_len, -1)
        
        # Temporal analysis
        lstm_out, _ = self.lstm(features)
        
        # Use last hidden state for classification
        output = self.classifier(lstm_out[:, -1, :])
        
        return output

class MIEService:
    """
    Media Integrity Engine Service for deepfake detection.
    """
    
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.face_detector = None
        self.transform = None
        self._initialize_components()
        
    def _initialize_components(self):
        """Initialize ML models and preprocessing components."""
        try:
            # Initialize face detector (MTCNN would be ideal, using CV2 for now)
            self.face_detector = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            
            # Initialize image transform
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                                   std=[0.229, 0.224, 0.225])
            ])
            
            # Initialize model (placeholder - would load trained weights)
            self.model = MobileNetV2LSTM(num_classes=2)
            
            # TODO: Load trained weights
            # self.model.load_state_dict(torch.load('path/to/trained/model.pth'))
            
            self.model.to(self.device)
            self.model.eval()
            
            logger.info("MIE Service initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing MIE Service: {e}")
            raise
    
    async def analyze_image(self, image_data: bytes, filename: str) -> Dict[str, Any]:
        """
        Analyze single image for deepfake indicators.
        
        Args:
            image_data: Raw image bytes
            filename: Original filename
            
        Returns:
            Analysis result with trust score and details
        """
        start_time = time.time()
        
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_data)).convert('RGB')
            
            # Convert to numpy for face detection
            img_array = np.array(image)
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Detect faces
            faces = self.face_detector.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
            )
            
            if len(faces) == 0:
                return {
                    "trust_score": 50,  # Neutral score when no faces detected
                    "confidence": 0.3,
                    "face_detection": {"faces_detected": 0, "message": "No faces detected"},
                    "visual_artifacts": {"artifacts_detected": False},
                    "metadata_analysis": {"suspicious_metadata": False},
                    "recommendations": ["Image contains no detectable faces"],
                    "processing_time": time.time() - start_time
                }
            
            # Process largest face
            largest_face = max(faces, key=lambda f: f[2] * f[3])
            x, y, w, h = largest_face
            
            # Extract face region with padding
            padding = 20
            face_region = img_array[
                max(0, y-padding):y+h+padding,
                max(0, x-padding):x+w+padding
            ]
            
            # Analyze face region
            face_pil = Image.fromarray(face_region)
            face_tensor = self.transform(face_pil).unsqueeze(0).to(self.device)
            
            # Add sequence dimension for compatibility with LSTM model
            face_tensor = face_tensor.unsqueeze(0)  # (1, 1, 3, 224, 224)
            
            with torch.no_grad():
                # Get model prediction
                outputs = self.model(face_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                fake_prob = probabilities[0][1].item()  # Probability of being fake
                
                # Convert to trust score (0-100, higher = more trustworthy)
                trust_score = int((1 - fake_prob) * 100)
                confidence = max(probabilities[0]).item()
            
            # Analyze visual artifacts (placeholder implementation)
            artifacts_score = self._analyze_visual_artifacts(img_array)
            
            # Analyze metadata (placeholder implementation) 
            metadata_analysis = self._analyze_metadata(image_data, filename)
            metadata_score = metadata_analysis["metadata_score"]
            
            # Combine scores
            final_trust_score = int(
                0.6 * trust_score + 
                0.3 * artifacts_score + 
                0.1 * metadata_score
            )
            
            processing_time = time.time() - start_time
            
            return {
                "trust_score": final_trust_score,
                "confidence": confidence,
                "face_detection": {
                    "faces_detected": len(faces),
                    "largest_face_size": f"{w}x{h}",
                    "face_position": f"({x}, {y})"
                },
                "visual_artifacts": {
                    "artifacts_score": artifacts_score,
                    "artifacts_detected": artifacts_score < 70
                },
                "metadata_analysis": metadata_analysis,
                "recommendations": self._generate_recommendations(final_trust_score, confidence),
                "processing_time": processing_time
            }
            
        except Exception as e:
            logger.error(f"Error analyzing image: {e}")
            return {
                "trust_score": 0,
                "confidence": 0.0,
                "error": str(e),
                "processing_time": time.time() - start_time
            }
    
    async def analyze_video(self, video_data: bytes, filename: str) -> Dict[str, Any]:
        """
        Analyze video for deepfake indicators with temporal consistency checks.
        
        Args:
            video_data: Raw video bytes
            filename: Original filename
            
        Returns:
            Analysis result with trust score and temporal analysis
        """
        start_time = time.time()
        
        try:
            # Save video data to temporary file for OpenCV processing
            import tempfile
            import os
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
                temp_file.write(video_data)
                temp_path = temp_file.name
            
            try:
                # Open video
                cap = cv2.VideoCapture(temp_path)
                if not cap.isOpened():
                    raise ValueError("Could not open video file")
                
                frames = []
                frame_count = 0
                max_frames = 30  # Analyze up to 30 frames for efficiency
                
                # Sample frames evenly throughout video
                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                frame_step = max(1, total_frames // max_frames)
                
                while frame_count < max_frames and cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        break
                    
                    # Convert BGR to RGB
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frames.append(frame_rgb)
                    
                    # Skip frames according to step
                    for _ in range(frame_step - 1):
                        cap.read()
                    
                    frame_count += 1
                
                cap.release()
                
                if len(frames) == 0:
                    raise ValueError("No frames could be extracted from video")
                
                # Analyze frame sequence
                frame_scores = []
                face_detections = []
                
                for i, frame in enumerate(frames):
                    # Detect faces in frame
                    gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
                    faces = self.face_detector.detectMultiScale(
                        gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
                    )
                    
                    face_detections.append(len(faces))
                    
                    if len(faces) > 0:
                        # Process largest face
                        largest_face = max(faces, key=lambda f: f[2] * f[3])
                        x, y, w, h = largest_face
                        
                        # Extract and analyze face region
                        face_region = frame[y:y+h, x:x+w]
                        face_pil = Image.fromarray(face_region)
                        face_tensor = self.transform(face_pil).unsqueeze(0)
                        
                        frames_tensor = face_tensor.unsqueeze(0).to(self.device)  # Add batch dim
                        
                        with torch.no_grad():
                            outputs = self.model(frames_tensor)
                            probabilities = torch.softmax(outputs, dim=1)
                            fake_prob = probabilities[0][1].item()
                            trust_score = int((1 - fake_prob) * 100)
                            frame_scores.append(trust_score)
                    else:
                        frame_scores.append(50)  # Neutral score for frames without faces
                
                # Calculate temporal consistency
                temporal_consistency = self._calculate_temporal_consistency(frame_scores)
                
                # Calculate overall scores
                avg_trust_score = int(np.mean(frame_scores)) if frame_scores else 50
                face_consistency = 1.0 - (np.std(face_detections) / max(1, np.mean(face_detections)))
                
                # Combine scores
                final_trust_score = int(
                    0.7 * avg_trust_score + 
                    0.2 * (temporal_consistency * 100) + 
                    0.1 * (face_consistency * 100)
                )
                
                processing_time = time.time() - start_time
                
                return {
                    "trust_score": final_trust_score,
                    "confidence": temporal_consistency,
                    "face_detection": {
                        "frames_analyzed": len(frames),
                        "faces_per_frame": face_detections,
                        "avg_faces": np.mean(face_detections)
                    },
                    "temporal_consistency": {
                        "consistency_score": temporal_consistency,
                        "frame_scores": frame_scores,
                        "score_variance": np.var(frame_scores)
                    },
                    "visual_artifacts": {
                        "compression_artifacts": "Not implemented",
                        "encoding_inconsistencies": "Not implemented"
                    },
                    "recommendations": self._generate_recommendations(final_trust_score, temporal_consistency),
                    "processing_time": processing_time
                }
                
            finally:
                # Clean up temporary file
                os.unlink(temp_path)
                
        except Exception as e:
            logger.error(f"Error analyzing video: {e}")
            return {
                "trust_score": 0,
                "confidence": 0.0,
                "error": str(e),
                "processing_time": time.time() - start_time
            }
    
    def _analyze_visual_artifacts(self, image: np.ndarray) -> int:
        """
        Analyze image for visual artifacts that may indicate manipulation.
        
        Placeholder implementation - would include:
        - JPEG compression analysis
        - Edge inconsistencies
        - Noise pattern analysis
        - Color distribution analysis
        """
        # Simple implementation based on image statistics
        try:
            # Calculate image sharpness (Laplacian variance)
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Normalize to 0-100 scale (higher = less artifacts)
            # This is a very basic heuristic
            artifact_score = min(100, int(laplacian_var / 10))
            
            return max(0, artifact_score)
        except:
            return 50  # Default score if analysis fails
    
    def _analyze_metadata(self, image_data: bytes, filename: str = "") -> Dict[str, Any]:
        """
        Analyze image metadata for signs of manipulation.

        Returns a structured metadata report including:
        - metadata_score (0-100, higher means more likely genuine)
        - AI generation likelihood
        - verdict: likely genuine / likely AI-generated / inconclusive
        """
        ai_hints = []
        genuine_hints = []
        ai_probability = 0.35  # neutral prior

        ai_tool_signatures = [
            "midjourney", "dall-e", "stable diffusion", "comfyui", "dreamstudio",
            "adobe firefly", "generative fill", "leonardo", "ideogram", "nightcafe",
            "runway", "sora", "bing image creator"
        ]

        try:
            file_size = len(image_data)

            image = Image.open(io.BytesIO(image_data))
            exif = image.getexif() if hasattr(image, "getexif") else None

            exif_map: Dict[str, str] = {}
            if exif:
                for tag_id, value in exif.items():
                    tag_name = TAGS.get(tag_id, str(tag_id))
                    exif_map[str(tag_name)] = str(value)

            has_exif = len(exif_map) > 0
            software = exif_map.get("Software", "")
            make = exif_map.get("Make", "")
            model = exif_map.get("Model", "")
            date_original = (
                exif_map.get("DateTimeOriginal") or
                exif_map.get("DateTime") or
                exif_map.get("CreateDate")
            )

            if not has_exif:
                ai_probability += 0.20
                ai_hints.append("No EXIF metadata found")
            else:
                genuine_hints.append("EXIF metadata is present")

            if make:
                ai_probability -= 0.12
                genuine_hints.append(f"Camera make present: {make}")
            if model:
                ai_probability -= 0.10
                genuine_hints.append(f"Camera model present: {model}")

            if software:
                lowered_software = software.lower()
                if any(sig in lowered_software for sig in ai_tool_signatures):
                    ai_probability += 0.55
                    ai_hints.append(f"Software tag indicates AI tool: {software}")
                elif any(sig in lowered_software for sig in ["photoshop", "lightroom", "gimp"]):
                    ai_probability += 0.15
                    ai_hints.append(f"Software tag indicates post-processing: {software}")
                else:
                    genuine_hints.append(f"Software tag present: {software}")

            if filename and any(token in filename.lower() for token in ["ai", "generated", "synthetic", "midjourney"]):
                ai_probability += 0.20
                ai_hints.append("Filename contains synthetic/AI marker keywords")

            if file_size < 10_000:
                ai_probability += 0.15
                ai_hints.append("Very small file size for photo content")
            elif 100_000 <= file_size <= 8_000_000:
                genuine_hints.append("File size falls in typical camera-export range")

            if date_original:
                try:
                    normalized = date_original.replace("-", ":")
                    parsed = None
                    for fmt in ["%Y:%m:%d %H:%M:%S", "%Y:%m:%d %H:%M"]:
                        try:
                            parsed = time.strptime(normalized, fmt)
                            break
                        except Exception:
                            continue
                    if parsed:
                        # If timestamp exists and is parseable, treat as mild genuine signal
                        ai_probability -= 0.08
                        genuine_hints.append("Capture timestamp metadata is present")
                except Exception:
                    pass

            ai_probability = max(0.02, min(0.98, ai_probability))
            metadata_score = int((1.0 - ai_probability) * 100)

            if ai_probability >= 0.65:
                verdict = "Likely AI-Generated"
            elif ai_probability <= 0.45:
                verdict = "Likely Genuine"
            else:
                verdict = "Inconclusive"

            confidence = min(0.95, 0.45 + 0.08 * max(len(ai_hints), len(genuine_hints)))

            return {
                "metadata_score": metadata_score,
                "suspicious_metadata": ai_probability >= 0.55,
                "verdict": verdict,
                "ai_generated_probability": round(ai_probability, 3),
                "confidence": round(confidence, 3),
                "exif_summary": {
                    "has_exif": has_exif,
                    "software": software or None,
                    "camera_make": make or None,
                    "camera_model": model or None,
                    "capture_time": date_original or None,
                    "width": image.width,
                    "height": image.height,
                    "file_size_bytes": file_size
                },
                "ai_indicators": ai_hints,
                "genuine_indicators": genuine_hints
            }

        except Exception as e:
            logger.warning(f"Metadata analysis failed: {e}")
            return {
                "metadata_score": 50,
                "suspicious_metadata": True,
                "verdict": "Inconclusive",
                "ai_generated_probability": 0.5,
                "confidence": 0.3,
                "exif_summary": {
                    "has_exif": False,
                    "software": None,
                    "camera_make": None,
                    "camera_model": None,
                    "capture_time": None,
                    "width": None,
                    "height": None,
                    "file_size_bytes": len(image_data) if image_data else 0
                },
                "ai_indicators": ["Unable to read metadata"],
                "genuine_indicators": []
            }
    
    def _calculate_temporal_consistency(self, frame_scores: list) -> float:
        """
        Calculate temporal consistency across video frames.
        
        Args:
            frame_scores: List of trust scores for each frame
            
        Returns:
            Consistency score between 0.0 and 1.0
        """
        if len(frame_scores) < 2:
            return 0.5
        
        # Calculate consistency based on score variance
        variance = np.var(frame_scores)
        max_variance = 2500  # Maximum expected variance (scores range 0-100)
        
        consistency = 1.0 - min(1.0, variance / max_variance)
        return consistency
    
    def _generate_recommendations(self, trust_score: int, confidence: float) -> list:
        """Generate actionable recommendations based on analysis results."""
        recommendations = []
        
        if trust_score >= 80:
            recommendations.append("Media appears authentic with high confidence")
        elif trust_score >= 60:
            recommendations.append("Media shows minor signs of manipulation - verify source")
        elif trust_score >= 40:
            recommendations.append("Media shows concerning signs of manipulation - investigate further")
        else:
            recommendations.append("Media likely manipulated - high risk of deepfake")
        
        if confidence < 0.5:
            recommendations.append("Low confidence in analysis - consider manual review")
        
        return recommendations