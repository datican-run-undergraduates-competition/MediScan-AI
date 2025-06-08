from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
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
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...schemas.analysis import AnalysisCreate, AnalysisResponse
from ...models.analysis import Analysis
from ...ml.image_processor import ImageProcessor
from ...ml.text_processor import TextProcessor
from ...ml.feature_fusion import MultiModalFusion
from ...ml.decision_engine import DecisionEngine
from ...services.analysis import analysis_service
from ...core.auth import get_current_user
from ...models.user import User
from ...ml.utils.report_generator import ReportGenerator
from pathlib import Path

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

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize components
image_processor = ImageProcessor()
text_processor = TextProcessor()
feature_fusion = MultiModalFusion()
decision_engine = DecisionEngine()
report_generator = ReportGenerator(output_dir="reports")

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

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze a medical image and generate a report."""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
            
        # Save uploaded file
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        file_path = upload_dir / file.filename
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        # Process image
        try:
            analysis_results = await image_processor.process_image(str(file_path))
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            raise HTTPException(status_code=500, detail="Error processing image")
            
        # Generate report
        try:
            # Try PDF first, fall back to JSON if PDF generation fails
            report_path = report_generator.generate_pdf_report(
                analysis_results,
                str(current_user.id)
            )
            
            if not report_path:
                report_path = report_generator.generate_json_report(
                    analysis_results,
                    str(current_user.id)
                )
                
            if not report_path:
                raise HTTPException(status_code=500, detail="Failed to generate report")
                
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}")
            raise HTTPException(status_code=500, detail="Error generating report")
            
        # Save analysis to database
        analysis = Analysis(
            user_id=current_user.id,
            image_path=str(file_path),
            report_path=report_path,
            results=analysis_results
        )
        
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        # Clean up uploaded file in background
        if background_tasks:
            background_tasks.add_task(os.remove, str(file_path))
            
        return AnalysisResponse(
            id=analysis.id,
            user_id=analysis.user_id,
            image_path=analysis.image_path,
            report_path=analysis.report_path,
            results=analysis.results,
            created_at=analysis.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze_image: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
        
@router.get("/analyses", response_model=List[AnalysisResponse])
async def get_user_analyses(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all analyses for the current user."""
    try:
        analyses = db.query(Analysis)\
            .filter(Analysis.user_id == current_user.id)\
            .order_by(Analysis.created_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()
            
        return analyses
        
    except Exception as e:
        logger.error(f"Error fetching user analyses: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching analyses")
        
@router.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific analysis by ID."""
    try:
        analysis = db.query(Analysis)\
            .filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id)\
            .first()
            
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
            
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analysis {analysis_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching analysis")

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