import torch
import numpy as np
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import json
from datetime import datetime

from .image_processor import ImageProcessor
from .text_processor import TextProcessor
from .feature_fusion import MultiModalFusion
from .decision_engine import DecisionEngine
from .quality_assurance import QualityAssurance
from .model_manager import ModelManager

class EarlyDetectionPipeline:
    def __init__(
        self,
        cache_dir: str = "model_cache",
        standards_path: str = "standards"
    ):
        # Initialize components
        self.model_manager = ModelManager(cache_dir)
        self.image_processor = ImageProcessor()
        self.text_processor = TextProcessor()
        self.feature_fusion = MultiModalFusion()
        self.decision_engine = DecisionEngine()
        self.quality_assurance = QualityAssurance(standards_path)
        
        # Initialize results cache
        self.results_cache = {}
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)

    def analyze(
        self,
        image_path: str,
        report_text: Optional[str] = None,
        facility_id: Optional[str] = None,
        target_conditions: Optional[List[str]] = None
    ) -> Dict:
        """
        Perform comprehensive medical analysis
        
        Args:
            image_path: Path to medical image
            report_text: Optional medical report text
            facility_id: Optional facility identifier
            target_conditions: Optional list of conditions to analyze
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            # Process image
            image_features = self.image_processor.process_image(image_path)
            
            # Process text if provided
            text_features = None
            if report_text:
                text_features = self.text_processor.analyze_report(report_text)
            
            # Fuse features
            fused_features = self.feature_fusion.fuse_features(
                image_features,
                text_features if text_features else {}
            )
            
            # Generate predictions
            predictions = self.decision_engine.analyze(fused_features)
            
            # Assess quality
            quality_assessment = self.quality_assurance.assess_quality(
                image_features.get('quality_metrics', {}),
                text_features.get('text_quality', {}) if text_features else {},
                fused_features.get('correlation_scores', {}),
                facility_id
            )
            
            # Generate heatmap
            heatmap = self.image_processor.generate_heatmap(
                image_path,
                predictions['predictions']
            )
            
            # Prepare results
            results = {
                'timestamp': datetime.now().isoformat(),
                'image_analysis': {
                    'features': image_features,
                    'heatmap': heatmap
                },
                'text_analysis': text_features if text_features else None,
                'predictions': predictions,
                'quality_assessment': quality_assessment,
                'metadata': {
                    'facility_id': facility_id,
                    'target_conditions': target_conditions
                }
            }
            
            # Cache results
            self._cache_results(results)
            
            return results
            
        except Exception as e:
            raise Exception(f"Error in early detection pipeline: {str(e)}")

    def _cache_results(self, results: Dict):
        """Cache analysis results"""
        timestamp = results['timestamp'].replace(':', '-')
        cache_path = self.cache_dir / f"analysis_{timestamp}.json"
        
        with open(cache_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        self.results_cache[timestamp] = results

    def get_cached_results(
        self,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None
    ) -> List[Dict]:
        """Get cached results within time range"""
        if not start_time and not end_time:
            return list(self.results_cache.values())
        
        filtered_results = []
        for timestamp, results in self.results_cache.items():
            if start_time and timestamp < start_time:
                continue
            if end_time and timestamp > end_time:
                continue
            filtered_results.append(results)
        
        return filtered_results

    def export_results(
        self,
        results: Dict,
        format: str = 'pdf'
    ) -> str:
        """
        Export analysis results in specified format
        
        Args:
            results: Analysis results dictionary
            format: Export format ('pdf' or 'json')
            
        Returns:
            Path to exported file
        """
        timestamp = results['timestamp'].replace(':', '-')
        
        if format == 'pdf':
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet
            
            # Create PDF
            export_path = self.cache_dir / f"report_{timestamp}.pdf"
            doc = SimpleDocTemplate(
                str(export_path),
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )
            
            # Prepare content
            styles = getSampleStyleSheet()
            content = []
            
            # Add title
            content.append(Paragraph("Medical Analysis Report", styles['Title']))
            content.append(Spacer(1, 12))
            
            # Add metadata
            content.append(Paragraph("Analysis Details", styles['Heading1']))
            metadata = [
                ["Timestamp", results['timestamp']],
                ["Facility ID", results['metadata']['facility_id'] or "N/A"],
                ["Target Conditions", ", ".join(results['metadata']['target_conditions']) if results['metadata']['target_conditions'] else "All"]
            ]
            metadata_table = Table(metadata, colWidths=[200, 300])
            metadata_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            content.append(metadata_table)
            content.append(Spacer(1, 12))
            
            # Add predictions
            content.append(Paragraph("Analysis Results", styles['Heading1']))
            predictions = results['predictions']['predictions']
            pred_data = [["Condition", "Detected", "Probability", "Confidence"]]
            for condition, data in predictions.items():
                pred_data.append([
                    condition,
                    "Yes" if data['detected'] else "No",
                    f"{data['probability']:.2%}",
                    f"{data['confidence']:.2%}"
                ])
            pred_table = Table(pred_data, colWidths=[150, 100, 100, 100])
            pred_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            content.append(pred_table)
            content.append(Spacer(1, 12))
            
            # Add recommendations
            content.append(Paragraph("Recommendations", styles['Heading1']))
            for rec in results['predictions']['explanation']['recommendations']:
                content.append(Paragraph(f"• {rec}", styles['Normal']))
            content.append(Spacer(1, 12))
            
            # Add quality assessment
            content.append(Paragraph("Quality Assessment", styles['Heading1']))
            quality = results['quality_assessment']
            quality_data = [["Metric", "Score"]]
            for metric, score in quality['metrics'].items():
                quality_data.append([
                    metric.replace('_', ' ').title(),
                    f"{score:.2%}"
                ])
            quality_table = Table(quality_data, colWidths=[300, 100])
            quality_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            content.append(quality_table)
            
            # Build PDF
            doc.build(content)
            
        else:  # JSON format
            export_path = self.cache_dir / f"report_{timestamp}.json"
            with open(export_path, 'w') as f:
                json.dump(results, f, indent=2)
        
        return str(export_path)

    def get_model_info(self) -> Dict:
        """Get information about loaded models"""
        return self.model_manager.get_model_info()

    def update_facility_standards(
        self,
        facility_id: str,
        standards: Dict
    ):
        """Update facility-specific standards"""
        self.quality_assurance.update_facility_standards(
            facility_id,
            standards
        )

    def clear_cache(self):
        """Clear results cache"""
        self.results_cache.clear()
        for file in self.cache_dir.glob("analysis_*.json"):
            file.unlink()
        for file in self.cache_dir.glob("report_*.pdf"):
            file.unlink()
        for file in self.cache_dir.glob("report_*.json"):
            file.unlink() 