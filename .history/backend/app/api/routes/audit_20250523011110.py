from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
import datetime
import logging

from ...core.security import get_current_user, is_admin
from ...models.user import User
from ...utils.audit_logger import (
    get_audit_logs, 
    generate_compliance_report,
    log_event,
    LOG_CATEGORY,
    LOG_ACTION
)

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/audit",
    tags=["Audit Logging"],
    responses={404: {"description": "Not found"}}
)

@router.get("/logs")
async def get_logs(
    start_date: Optional[datetime.datetime] = Query(None, description="Start date for logs"),
    end_date: Optional[datetime.datetime] = Query(None, description="End date for logs"),
    category: Optional[str] = Query(None, description="Filter by category"),
    action: Optional[str] = Query(None, description="Filter by action"),
    limit: int = Query(100, description="Maximum number of logs to return"),
    offset: int = Query(0, description="Offset for pagination"),
    current_user: User = Depends(get_current_user)
):
    """
    Get audit logs (admin only)
    
    Args:
        start_date: Start date for logs
        end_date: End date for logs
        category: Filter by category
        action: Filter by action
        limit: Maximum number of logs to return
        offset: Offset for pagination
        
    Returns:
        List of audit logs
    """
    # Check if user is admin
    if not is_admin(current_user):
        # Log unauthorized access attempt
        await log_event(
            category=LOG_CATEGORY.SECURITY,
            action=LOG_ACTION.UNAUTHORIZED,
            user_id=current_user.id,
            details={"resource": "audit_logs"}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access audit logs"
        )
    
    try:
        # Get logs
        logs = await get_audit_logs(
            start_date=start_date,
            end_date=end_date,
            category=category,
            action=action,
            limit=limit,
            offset=offset
        )
        
        # Log access
        await log_event(
            category=LOG_CATEGORY.DATA_ACCESS,
            action=LOG_ACTION.VIEW,
            user_id=current_user.id,
            details={
                "resource": "audit_logs",
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None,
                "category": category,
                "action": action,
                "limit": limit,
                "offset": offset,
                "count": len(logs)
            }
        )
        
        return {
            "logs": logs,
            "total": len(logs),
            "limit": limit,
            "offset": offset
        }
    
    except Exception as e:
        logger.error(f"Error retrieving audit logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving audit logs: {str(e)}"
        )

@router.post("/logs")
async def save_logs(
    logs: List[Dict[str, Any]] = Body(..., description="Audit logs to save"),
    current_user: User = Depends(get_current_user)
):
    """
    Save audit logs from frontend
    
    Args:
        logs: Audit logs to save
        
    Returns:
        Success status
    """
    try:
        # Process each log
        for log in logs:
            # Add to backend audit log system
            await log_event(
                category=log.get("category", "frontend"),
                action=log.get("action", "unknown"),
                user_id=log.get("userId", current_user.id),
                details=log.get("details", {}),
                ip_address=log.get("ipAddress"),
                sensitive=True  # Always treat frontend logs as potentially sensitive
            )
        
        return {"status": "success", "message": f"Saved {len(logs)} audit logs"}
    
    except Exception as e:
        logger.error(f"Error saving audit logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving audit logs: {str(e)}"
        )

@router.get("/compliance-report")
async def get_compliance_report(
    start_date: datetime.datetime = Query(..., description="Start date for report"),
    end_date: datetime.datetime = Query(..., description="End date for report"),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a HIPAA compliance report (admin only)
    
    Args:
        start_date: Start date for report
        end_date: End date for report
        
    Returns:
        Compliance report
    """
    # Check if user is admin
    if not is_admin(current_user):
        # Log unauthorized access attempt
        await log_event(
            category=LOG_CATEGORY.SECURITY,
            action=LOG_ACTION.UNAUTHORIZED,
            user_id=current_user.id,
            details={"resource": "compliance_report"}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can generate compliance reports"
        )
    
    try:
        # Generate report
        report = await generate_compliance_report(start_date, end_date)
        
        # Log report generation
        await log_event(
            category=LOG_CATEGORY.DATA_ACCESS,
            action=LOG_ACTION.EXPORT,
            user_id=current_user.id,
            details={
                "resource": "compliance_report",
                "report_id": report["report_id"],
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            }
        )
        
        return report
    
    except Exception as e:
        logger.error(f"Error generating compliance report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating compliance report: {str(e)}"
        )

@router.get("/categories")
async def get_categories(current_user: User = Depends(get_current_user)):
    """
    Get all audit log categories and actions
    
    Returns:
        Dictionary of categories and actions
    """
    # Convert enums to dictionaries
    categories = {category.name: category.value for category in LOG_CATEGORY}
    actions = {action.name: action.value for action in LOG_ACTION}
    
    return {
        "categories": categories,
        "actions": actions
    } 
