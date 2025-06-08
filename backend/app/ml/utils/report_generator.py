import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

logger = logging.getLogger(__name__)

class ReportGenerator:
    def __init__(self, output_dir: str = "reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.styles = getSampleStyleSheet() if REPORTLAB_AVAILABLE else None
        
    def generate_pdf_report(self, analysis_data: Dict[str, Any], patient_id: str) -> Optional[str]:
        """Generate a PDF report from analysis data."""
        if not REPORTLAB_AVAILABLE:
            logger.warning("ReportLab not available. PDF generation will be disabled.")
            return None
            
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"analysis_report_{patient_id}_{timestamp}.pdf"
            filepath = self.output_dir / filename
            
            doc = SimpleDocTemplate(
                str(filepath),
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )
            
            # Create custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=self.styles['Heading1'],
                fontSize=24,
                spaceAfter=30
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=self.styles['Heading2'],
                fontSize=16,
                spaceAfter=12
            )
            
            # Build the report content
            story = []
            
            # Title
            story.append(Paragraph("Medical Analysis Report", title_style))
            story.append(Spacer(1, 12))
            
            # Patient Information
            story.append(Paragraph("Patient Information", heading_style))
            patient_info = [
                ["Patient ID:", patient_id],
                ["Date:", datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
            ]
            patient_table = Table(patient_info, colWidths=[2*inch, 4*inch])
            patient_table.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(patient_table)
            story.append(Spacer(1, 20))
            
            # Analysis Results
            story.append(Paragraph("Analysis Results", heading_style))
            
            # Process each analysis section
            for section, data in analysis_data.items():
                if isinstance(data, dict):
                    story.append(Paragraph(section.replace("_", " ").title(), self.styles['Heading3']))
                    
                    # Create table for section data
                    table_data = [[str(k), str(v)] for k, v in data.items()]
                    if table_data:
                        table = Table(table_data, colWidths=[2*inch, 4*inch])
                        table.setStyle(TableStyle([
                            ('GRID', (0, 0), (-1, -1), 1, colors.black),
                            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                            ('PADDING', (0, 0), (-1, -1), 6),
                        ]))
                        story.append(table)
                        story.append(Spacer(1, 12))
            
            # Build the PDF
            doc.build(story)
            logger.info(f"Successfully generated PDF report: {filepath}")
            return str(filepath)
            
        except Exception as e:
            logger.error(f"Error generating PDF report: {str(e)}")
            return None
            
    def generate_json_report(self, analysis_data: Dict[str, Any], patient_id: str) -> str:
        """Generate a JSON report as fallback when PDF generation is not available."""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"analysis_report_{patient_id}_{timestamp}.json"
            filepath = self.output_dir / filename
            
            report_data = {
                "patient_id": patient_id,
                "timestamp": datetime.now().isoformat(),
                "analysis_data": analysis_data
            }
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, indent=2, ensure_ascii=False)
                
            logger.info(f"Successfully generated JSON report: {filepath}")
            return str(filepath)
            
        except Exception as e:
            logger.error(f"Error generating JSON report: {str(e)}")
            return None 