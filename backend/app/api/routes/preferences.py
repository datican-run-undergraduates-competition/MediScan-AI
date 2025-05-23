from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import Dict, Any, Optional
import logging
import json

from ...core.security import get_current_user
from ...models.user import User
from ...utils.audit_logger import log_event, LOG_CATEGORY, LOG_ACTION
from ...db_init import get_db_session
from ...models.preferences import UserPreferences

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/preferences",
    tags=["User Preferences"],
    responses={404: {"description": "Not found"}}
)

@router.get("/")
async def get_preferences(
    current_user: User = Depends(get_current_user)
):
    """
    Get user preferences
    
    Returns:
        User preferences
    """
    try:
        # Get database session
        session = get_db_session()
        
        # Get preferences from database
        preferences = session.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()
        
        if not preferences:
            # Return default preferences if none exist
            return {
                "theme": "system",
                "language": "en-US",
                "accessibility": {
                    "highContrast": False,
                    "reducedMotion": False,
                    "largeText": False,
                    "textSpacing": False,
                    "focusIndicators": True
                },
                "notifications": {
                    "email": True,
                    "browser": True,
                    "mobile": False,
                    "uploadComplete": True,
                    "analysisComplete": True,
                    "sharedWithMe": True,
                    "systemUpdates": False
                },
                "privacy": {
                    "anonymizeUploads": False,
                    "dataRetention": "standard",
                    "dataSharing": "minimal"
                },
                "display": {
                    "density": "comfortable",
                    "dateFormat": "MMM D, YYYY",
                    "timeFormat": "h:mm A"
                }
            }
        
        # Log access
        await log_event(
            category=LOG_CATEGORY.DATA_ACCESS,
            action=LOG_ACTION.VIEW,
            user_id=current_user.id,
            details={"resource": "user_preferences"}
        )
        
        # Return preferences
        return json.loads(preferences.preferences_json)
    
    except Exception as e:
        logger.error(f"Error retrieving user preferences: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user preferences: {str(e)}"
        )

@router.put("/")
async def update_preferences(
    preferences: Dict[str, Any] = Body(..., description="User preferences to update"),
    current_user: User = Depends(get_current_user)
):
    """
    Update user preferences
    
    Args:
        preferences: User preferences to update
        
    Returns:
        Updated user preferences
    """
    try:
        # Get database session
        session = get_db_session()
        
        # Get existing preferences
        user_preferences = session.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()
        
        # Convert preferences to JSON
        preferences_json = json.dumps(preferences)
        
        if user_preferences:
            # Update existing preferences
            user_preferences.preferences_json = preferences_json
        else:
            # Create new preferences
            user_preferences = UserPreferences(
                user_id=current_user.id,
                preferences_json=preferences_json
            )
            session.add(user_preferences)
        
        # Commit changes
        session.commit()
        
        # Log update
        await log_event(
            category=LOG_CATEGORY.USER_MANAGEMENT,
            action=LOG_ACTION.UPDATE,
            user_id=current_user.id,
            details={"resource": "user_preferences"}
        )
        
        return preferences
    
    except Exception as e:
        logger.error(f"Error updating user preferences: {str(e)}")
        # Rollback transaction
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user preferences: {str(e)}"
        )

@router.put("/theme")
async def update_theme(
    theme: str = Body(..., description="Theme preference (light, dark, system, high-contrast)"),
    current_user: User = Depends(get_current_user)
):
    """
    Update theme preference
    
    Args:
        theme: Theme preference
        
    Returns:
        Updated theme preference
    """
    try:
        # Validate theme
        valid_themes = ["light", "dark", "system", "high-contrast"]
        if theme not in valid_themes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid theme: {theme}. Must be one of: {', '.join(valid_themes)}"
            )
        
        # Get database session
        session = get_db_session()
        
        # Get existing preferences
        user_preferences = session.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()
        
        if user_preferences:
            # Update existing preferences
            preferences = json.loads(user_preferences.preferences_json)
            preferences["theme"] = theme
            user_preferences.preferences_json = json.dumps(preferences)
        else:
            # Create new preferences
            preferences = {"theme": theme}
            user_preferences = UserPreferences(
                user_id=current_user.id,
                preferences_json=json.dumps(preferences)
            )
            session.add(user_preferences)
        
        # Commit changes
        session.commit()
        
        # Log update
        await log_event(
            category=LOG_CATEGORY.USER_MANAGEMENT,
            action=LOG_ACTION.UPDATE,
            user_id=current_user.id,
            details={"resource": "theme_preference", "value": theme}
        )
        
        return {"theme": theme}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating theme preference: {str(e)}")
        # Rollback transaction
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating theme preference: {str(e)}"
        )

@router.put("/language")
async def update_language(
    language: str = Body(..., description="Language preference (e.g., en-US, fr-FR, es-ES)"),
    current_user: User = Depends(get_current_user)
):
    """
    Update language preference
    
    Args:
        language: Language preference
        
    Returns:
        Updated language preference
    """
    try:
        # Get database session
        session = get_db_session()
        
        # Get existing preferences
        user_preferences = session.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()
        
        if user_preferences:
            # Update existing preferences
            preferences = json.loads(user_preferences.preferences_json)
            preferences["language"] = language
            user_preferences.preferences_json = json.dumps(preferences)
        else:
            # Create new preferences
            preferences = {"language": language}
            user_preferences = UserPreferences(
                user_id=current_user.id,
                preferences_json=json.dumps(preferences)
            )
            session.add(user_preferences)
        
        # Commit changes
        session.commit()
        
        # Log update
        await log_event(
            category=LOG_CATEGORY.USER_MANAGEMENT,
            action=LOG_ACTION.UPDATE,
            user_id=current_user.id,
            details={"resource": "language_preference", "value": language}
        )
        
        return {"language": language}
    
    except Exception as e:
        logger.error(f"Error updating language preference: {str(e)}")
        # Rollback transaction
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating language preference: {str(e)}"
        )

@router.put("/accessibility")
async def update_accessibility(
    accessibility: Dict[str, bool] = Body(..., description="Accessibility preferences"),
    current_user: User = Depends(get_current_user)
):
    """
    Update accessibility preferences
    
    Args:
        accessibility: Accessibility preferences
        
    Returns:
        Updated accessibility preferences
    """
    try:
        # Get database session
        session = get_db_session()
        
        # Get existing preferences
        user_preferences = session.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()
        
        if user_preferences:
            # Update existing preferences
            preferences = json.loads(user_preferences.preferences_json)
            preferences["accessibility"] = accessibility
            user_preferences.preferences_json = json.dumps(preferences)
        else:
            # Create new preferences
            preferences = {"accessibility": accessibility}
            user_preferences = UserPreferences(
                user_id=current_user.id,
                preferences_json=json.dumps(preferences)
            )
            session.add(user_preferences)
        
        # Commit changes
        session.commit()
        
        # Log update
        await log_event(
            category=LOG_CATEGORY.USER_MANAGEMENT,
            action=LOG_ACTION.UPDATE,
            user_id=current_user.id,
            details={"resource": "accessibility_preferences"}
        )
        
        return {"accessibility": accessibility}
    
    except Exception as e:
        logger.error(f"Error updating accessibility preferences: {str(e)}")
        # Rollback transaction
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating accessibility preferences: {str(e)}"
        )

@router.delete("/")
async def reset_preferences(
    current_user: User = Depends(get_current_user)
):
    """
    Reset user preferences to defaults
    
    Returns:
        Success message
    """
    try:
        # Get database session
        session = get_db_session()
        
        # Delete preferences
        session.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).delete()
        
        # Commit changes
        session.commit()
        
        # Log reset
        await log_event(
            category=LOG_CATEGORY.USER_MANAGEMENT,
            action=LOG_ACTION.DELETE,
            user_id=current_user.id,
            details={"resource": "user_preferences", "action": "reset"}
        )
        
        return {"message": "Preferences reset to defaults"}
    
    except Exception as e:
        logger.error(f"Error resetting user preferences: {str(e)}")
        # Rollback transaction
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting user preferences: {str(e)}"
        ) 
