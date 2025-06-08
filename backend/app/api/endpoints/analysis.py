from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse, FileResponse
from typing import Optional, List, Dict, Any
import io
from PIL import Image
import numpy as np
import tempfile
import os
from datetime import datetime
import json
import logging

# Try to import reportlab, but make it optional
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("ReportLab not available. PDF generation will be disabled.")

from ...ml.image_processor import ImageProcessor
from ...ml.text_processor import TextProcessor
from ...ml.feature_fusion import MultiModalFusion
from ...ml.decision_engine import DecisionEngine
from ...services.analysis import analysis_service
from ...core.auth import get_current_user
from ...models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize ML components
image_processor = ImageProcessor()
text_processor = TextProcessor()
feature_fusion = MultiModalFusion()
decision_engine = DecisionEngine()

def generate_pdf_report(image_path: str, analysis_results: dict, modality: str) -> str:
    """Generate a PDF report from analysis results."""
    if not REPORTLAB_AVAILABLE:
        raise ImportError("ReportLab is not available. Please install it to generate PDF reports.")
        
    # Create a temporary file for the PDF
    temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    doc = SimpleDocTemplate(temp_pdf.name, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Add title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30
    )
    story.append(Paragraph("MediScan AI Analysis Report", title_style))
    story.append(Spacer(1, 20))

    # Add metadata
    metadata_style = styles["Normal"]
    story.append(Paragraph(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", metadata_style))
    story.append(Paragraph(f"Modality: {modality.upper()}", metadata_style))
    story.append(Spacer(1, 20))

    # Add image
    img = Image.open(image_path)
    img_width, img_height = img.size
    aspect = img_height / float(img_width)
    img_width = 6 * inch
    img_height = img_width * aspect
    img = RLImage(image_path, width=img_width, height=img_height)
    story.append(img)
    story.append(Spacer(1, 20))

    # Add analysis results
    story.append(Paragraph("Analysis Results", styles["Heading2"]))
    story.append(Spacer(1, 10))

    # Create table for predictions
    if analysis_results.get('results', {}).get('predictions'):
        data = [['Condition', 'Confidence', 'Description']]
        for condition, details in analysis_results['results']['predictions'].items():
            if details.get('detected'):
                data.append([
                    condition.upper(),
                    f"{(details['probability'] * 100):.1f}%",
                    details.get('description', '')
                ])
        
        table = Table(data, colWidths=[2*inch, 1.5*inch, 3*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(table)
        story.append(Spacer(1, 20))

    # Add recommendations
    if analysis_results.get('results', {}).get('explanation', {}).get('recommendations'):
        story.append(Paragraph("Clinical Recommendations", styles["Heading2"]))
        story.append(Spacer(1, 10))
        for rec in analysis_results['results']['explanation']['recommendations']:
            story.append(Paragraph(f"• {rec}", styles["Normal"]))
            story.append(Spacer(1, 5))

    # Build PDF
    doc.build(story)
    return temp_pdf.name

@router.post("/analyze")
async def analyze_medical_data(
    file: UploadFile = File(...),
    analysis_type: str = Form(...),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Analyze medical data (images, reports, etc.)."""
    try:
        # Read file content
        content = await file.read()
        
        # Process the analysis
        result = await analysis_service.analyze_data(
            content=content,
            file_type=file.content_type,
            analysis_type=analysis_type,
            user_id=current_user.id
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@router.get("/results/{analysis_id}")
async def get_analysis_results(
    analysis_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get analysis results."""
    try:
        result = await analysis_service.get_results(analysis_id, current_user.id)
        return result
    except Exception as e:
        logger.error(f"Error getting results: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get results: {str(e)}"
        )

@router.post("/batch-analyze")
async def batch_analyze(
    files: List[UploadFile] = File(...),
    analysis_type: str = Form(...),
    current_user: User = Depends(get_current_user)
) -> Dict[str, List[Dict[str, Any]]]:
    """Analyze multiple medical files in batch."""
    try:
        results = []
        for file in files:
            content = await file.read()
            result = await analysis_service.analyze_data(
                content=content,
                file_type=file.content_type,
                analysis_type=analysis_type,
                user_id=current_user.id
            )
            results.append(result)
        
        return {"results": results}
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch analysis failed: {str(e)}"
        )

@router.post("/export-pdf")
async def export_pdf_report(
    image: UploadFile = File(...),
    analysis_results: str = Form(...),
    modality: str = Form(...)
):
    """
    Generate and return a PDF report of the analysis results.
    """
    if not REPORTLAB_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="PDF generation is not available. Please install reportlab package."
        )
        
    try:
        # Save uploaded image temporarily
        temp_image = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(image.filename)[1])
        content = await image.read()
        temp_image.write(content)
        temp_image.close()

        # Parse analysis results
        results = json.loads(analysis_results)

        # Generate PDF
        pdf_path = generate_pdf_report(temp_image.name, results, modality)

        # Clean up temporary image file
        os.unlink(temp_image.name)

        # Return PDF file
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=f'mediscan_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating PDF report: {str(e)}"
        )
    finally:
        # Clean up temporary PDF file
        if 'pdf_path' in locals():
            os.unlink(pdf_path) 