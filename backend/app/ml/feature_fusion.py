import torch
import torch.nn as nn
import numpy as np
from typing import Dict, List, Optional, Tuple

class CrossAttentionFusion(nn.Module):
    def __init__(self, feature_dim: int = 768, num_heads: int = 8):
        super().__init__()
        self.feature_dim = feature_dim
        self.num_heads = num_heads
        
        # Cross-attention layers
        self.image_to_text = nn.MultiheadAttention(feature_dim, num_heads)
        self.text_to_image = nn.MultiheadAttention(feature_dim, num_heads)
        
        # Feature fusion layers
        self.fusion_layer = nn.Sequential(
            nn.Linear(feature_dim * 2, feature_dim),
            nn.LayerNorm(feature_dim),
            nn.ReLU(),
            nn.Linear(feature_dim, feature_dim)
        )

    def forward(self, image_features: torch.Tensor, text_features: torch.Tensor) -> torch.Tensor:
        """
        Perform cross-attention between image and text features.
        
        Args:
            image_features: Image features tensor [batch_size, seq_len, feature_dim]
            text_features: Text features tensor [batch_size, seq_len, feature_dim]
            
        Returns:
            Fused features tensor
        """
        # Transpose for attention layers
        image_features = image_features.transpose(0, 1)
        text_features = text_features.transpose(0, 1)
        
        # Cross attention
        image_attended, _ = self.image_to_text(image_features, text_features, text_features)
        text_attended, _ = self.text_to_image(text_features, image_features, image_features)
        
        # Transpose back
        image_attended = image_attended.transpose(0, 1)
        text_attended = text_attended.transpose(0, 1)
        
        # Concatenate and fuse
        combined = torch.cat([image_attended, text_attended], dim=-1)
        fused = self.fusion_layer(combined)
        
        return fused

class MultiModalFusion:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Initialize cross-attention layers
        self.image_to_text_attention = nn.MultiheadAttention(
            embed_dim=768,
            num_heads=12,
            dropout=0.1
        ).to(self.device)
        
        self.text_to_image_attention = nn.MultiheadAttention(
            embed_dim=768,
            num_heads=12,
            dropout=0.1
        ).to(self.device)
        
        # Initialize fusion layers
        self.fusion_layer = nn.Sequential(
            nn.Linear(768 * 2, 768),
            nn.LayerNorm(768),
            nn.ReLU(),
            nn.Dropout(0.1)
        ).to(self.device)

    def fuse_features(
        self,
        image_features: Dict,
        text_features: Dict
    ) -> Dict:
        """
        Fuse image and text features using cross-attention mechanisms
        
        Args:
            image_features: Dictionary containing image features and metadata
            text_features: Dictionary containing text features and metadata
            
        Returns:
            Dictionary containing fused features and correlation metrics
        """
        try:
            # Convert features to tensors
            img_emb = torch.tensor(image_features['features']).to(self.device)
            txt_emb = torch.tensor(text_features['embeddings']).to(self.device)
            
            # Reshape for attention
            img_emb = img_emb.unsqueeze(0)  # [1, seq_len, dim]
            txt_emb = txt_emb.unsqueeze(0)  # [1, seq_len, dim]
            
            # Apply cross-attention
            img_attended, _ = self.image_to_text_attention(
                img_emb, txt_emb, txt_emb
            )
            txt_attended, _ = self.text_to_image_attention(
                txt_emb, img_emb, img_emb
            )
            
            # Concatenate attended features
            fused = torch.cat([img_attended, txt_attended], dim=-1)
            
            # Apply fusion layer
            fused_features = self.fusion_layer(fused)
            
            # Calculate correlation metrics
            correlation_metrics = self._calculate_correlation_metrics(
                image_features,
                text_features
            )
            
            # Calculate modality correlations
            modality_correlations = self._calculate_modality_correlations(
                image_features,
                text_features
            )
            
            return {
                'fused_features': fused_features.cpu().numpy(),
                'correlation_scores': correlation_metrics,
                'modality_correlations': modality_correlations
            }
            
        except Exception as e:
            raise Exception(f"Error fusing features: {str(e)}")

    def _calculate_correlation_metrics(
        self,
        image_features: Dict,
        text_features: Dict
    ) -> Dict:
        """Calculate correlation metrics between modalities"""
        # Extract relevant features
        img_quality = image_features.get('quality_metrics', {})
        txt_quality = text_features.get('text_quality', {})
        
        # Calculate correlation scores
        correlation_scores = {
            'mean_correlation': self._calculate_mean_correlation(
                image_features,
                text_features
            ),
            'max_correlation': self._calculate_max_correlation(
                image_features,
                text_features
            ),
            'correlation_std': self._calculate_correlation_std(
                image_features,
                text_features
            )
        }
        
        return correlation_scores

    def _calculate_modality_correlations(
        self,
        image_features: Dict,
        text_features: Dict
    ) -> Dict:
        """Calculate correlations between specific modalities"""
        correlations = {}
        
        # Extract clinical indicators
        img_indicators = set(image_features.get('predictions', {}).keys())
        txt_indicators = set(text_features.get('clinical_indicators', {}).get('conditions', []))
        
        # Calculate overlap
        common_indicators = img_indicators.intersection(txt_indicators)
        total_indicators = img_indicators.union(txt_indicators)
        
        if total_indicators:
            correlations['indicator_overlap'] = len(common_indicators) / len(total_indicators)
        else:
            correlations['indicator_overlap'] = 0.0
        
        # Calculate severity correlation
        img_severity = self._extract_severity(image_features)
        txt_severity = self._extract_severity(text_features)
        correlations['severity_correlation'] = self._calculate_severity_correlation(
            img_severity,
            txt_severity
        )
        
        return correlations

    def _calculate_mean_correlation(
        self,
        image_features: Dict,
        text_features: Dict
    ) -> float:
        """Calculate mean correlation between modalities"""
        # Extract features
        img_feats = image_features['features']
        txt_feats = text_features['embeddings']
        
        # Calculate correlation matrix
        corr_matrix = np.corrcoef(img_feats, txt_feats)
        
        # Return mean correlation
        return float(np.mean(corr_matrix))

    def _calculate_max_correlation(
        self,
        image_features: Dict,
        text_features: Dict
    ) -> float:
        """Calculate maximum correlation between modalities"""
        # Extract features
        img_feats = image_features['features']
        txt_feats = text_features['embeddings']
        
        # Calculate correlation matrix
        corr_matrix = np.corrcoef(img_feats, txt_feats)
        
        # Return maximum correlation
        return float(np.max(corr_matrix))

    def _calculate_correlation_std(
        self,
        image_features: Dict,
        text_features: Dict
    ) -> float:
        """Calculate standard deviation of correlations"""
        # Extract features
        img_feats = image_features['features']
        txt_feats = text_features['embeddings']
        
        # Calculate correlation matrix
        corr_matrix = np.corrcoef(img_feats, txt_feats)
        
        # Return standard deviation
        return float(np.std(corr_matrix))

    def _extract_severity(self, features: Dict) -> float:
        """Extract severity score from features"""
        if 'predictions' in features:
            # Image severity
            max_prob = max(
                pred['probability']
                for pred in features['predictions'].values()
                if pred.get('detected', False)
            )
            return max_prob
        elif 'clinical_indicators' in features:
            # Text severity
            severity_terms = features['clinical_indicators'].get('severity', [])
            severity_scores = {
                'mild': 0.3,
                'moderate': 0.6,
                'severe': 0.8,
                'critical': 1.0
            }
            return max(
                severity_scores.get(term.lower(), 0.0)
                for term in severity_terms
            )
        return 0.0

    def _calculate_severity_correlation(
        self,
        img_severity: float,
        txt_severity: float
    ) -> float:
        """Calculate correlation between severity scores"""
        if img_severity == 0.0 or txt_severity == 0.0:
            return 0.0
        
        # Calculate correlation using simple difference
        diff = abs(img_severity - txt_severity)
        return 1.0 - diff 