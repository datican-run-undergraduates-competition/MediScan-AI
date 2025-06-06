from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from typing import Optional, List
import io
from PIL import Image
import numpy as np
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import tempfile
import os
from datetime import datetime
import json

from ...ml.image_processor import ImageProcessor
from ...ml.text_processor import TextProcessor
from ...ml.feature_fusion import MultiModalFusion
from ...ml.decision_engine import DecisionEngine

router = APIRouter()

# Initialize ML components
image_processor = ImageProcessor()
text_processor = TextProcessor()
feature_fusion = MultiModalFusion()
decision_engine = DecisionEngine()

def generate_pdf_report(image_path: str, analysis_results: dict, modality: str) -> str:
    """Generate a PDF report from analysis results."""
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
    image: UploadFile = File(...),
    report: Optional[UploadFile] = File(None),
    modality: str = Form(...),
    target_conditions: Optional[List[str]] = Form(None)
):
    """
    Analyze medical image and optional report for disease detection.
    
    Args:
        image: Medical image file (X-ray, MRI, or CT scan)
        report: Optional medical report text file
        modality: Type of medical image ('xray', 'mri', or 'ct')
        target_conditions: Optional list of conditions to check for
        
    Returns:
        Analysis results including predictions and explanations
    """
    try:
        # Validate modality
        if modality not in ["xray", "mri", "ct"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid modality. Must be one of: xray, mri, ct"
            )
        
        # Save uploaded image temporarily
        temp_image = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(image.filename)[1])
        content = await image.read()
        temp_image.write(content)
        temp_image.close()

        # Process image
        pil_image = Image.open(io.BytesIO(content))
        image_features = image_processor.process_image(pil_image, modality)
        
        # Process report if provided
        text_features = None
        if report:
            report_content = await report.read()
            report_text = report_content.decode("utf-8")
            text_features = text_processor.analyze_report(report_text)
        
        # Fuse features
        if text_features:
            fused_features = feature_fusion.fuse_features(
                image_features,
                text_features
            )
        else:
            # Use only image features if no report is provided
            fused_features = {
                "fused_features": image_features["features"],
                "correlation_scores": {
                    "mean_correlation": 1.0,
                    "max_correlation": 1.0,
                    "correlation_std": 0.0
                },
                "modality_correlations": {}
            }
        
        # Filter target conditions if specified
        if target_conditions:
            decision_engine.conditions = {
                k: v for k, v in decision_engine.conditions.items()
                if k in target_conditions
            }
        
        # Make predictions
        results = decision_engine.analyze(fused_features)
        
        # Generate heatmap for visualization
        heatmap = image_processor.generate_heatmap(
            image_features["attention_maps"],
            pil_image.size[::-1]  # Convert (width, height) to (height, width)
        )
        
        return {
            "status": "success",
            "results": results,
            "visualization": {
                "heatmap": heatmap.tolist(),
                "image_size": pil_image.size
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing medical data: {str(e)}"
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