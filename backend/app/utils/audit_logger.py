import logging
import json
import datetime
import os
import uuid
from enum import Enum
from typing import Dict, Any, Optional, List, Union
import asyncio
from contextlib import asynccontextmanager

# Set up logging
logger = logging.getLogger(__name__)

# Define logging categories and actions
class LOG_CATEGORY(str, Enum):
    AUTHENTICATION = "authentication"
    DATA_ACCESS = "data_access"
    IMAGE_PROCESSING = "image_processing"
    PATIENT_RECORD = "patient_record"
    SYSTEM = "system"
    CONFIGURATION = "configuration"
    SECURITY = "security"
    USER_MANAGEMENT = "user_management"
    CONSENT = "consent"
    EXPORT = "export"

class LOG_ACTION(str, Enum):
    # Authentication actions
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    PASSWORD_CHANGED = "password_changed"
    MFA_ENABLED = "mfa_enabled"
    MFA_DISABLED = "mfa_disabled"
    
    # Data access actions
    VIEW = "view"
    SEARCH = "search"
    DOWNLOAD = "download"
    PRINT = "print"
    SHARE = "share"
    
    # Image processing actions
    UPLOAD = "upload"
    PROCESS = "process"
    ANALYZE = "analyze"
    ANONYMIZE = "anonymize"
    
    # Patient record actions
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    ARCHIVE = "archive"
    RESTORE = "restore"
    
    # Consent actions
    CONSENT_GIVEN = "consent_given"
    CONSENT_WITHDRAWN = "consent_withdrawn"
    CONSENT_EXPIRED = "consent_expired"
    
    # Export actions
    EXPORT_STARTED = "export_started"
    EXPORT_COMPLETED = "export_completed"
    EXPORT_FAILED = "export_failed"
    
    # System actions
    SYSTEM_STARTUP = "system_startup"
    SYSTEM_SHUTDOWN = "system_shutdown"
    BACKUP_CREATED = "backup_created"
    ERROR = "error"

# Sensitive data patterns for sanitization
SENSITIVE_PATTERNS = [
    # Patient identifiers
    (r'\b\d{3}-\d{2}-\d{4}\b', '***-**-****'),  # SSN
    (r'\b\d{9}\b', '*********'),  # 9-digit numbers like SSN without dashes
    (r'\b[A-Z]{2}\d{6}[A-Z]?\b', '********'),  # Passport numbers
    
    # Contact information
    (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b', '[EMAIL]'),  # Email
    (r'\b(\+\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s-]?)?[\d\s-]{7,10}\b', '[PHONE]'),  # Phone
    
    # Credit card numbers
    (r'\b(?:\d{4}[\s-]?){3}\d{4}\b', '[CREDIT_CARD]'),
    (r'\b\d{13,16}\b', '[POSSIBLE_CREDIT_CARD]'),
    
    # Addresses
    (r'\b\d{5}(-\d{4})?\b', '[ZIP]')  # ZIP codes
]

# Configure log directory
LOG_DIR = os.environ.get("AUDIT_LOG_DIR", "./logs/audit")
os.makedirs(LOG_DIR, exist_ok=True)

# Initialize buffer for batch processing
log_buffer = []
buffer_lock = asyncio.Lock()
MAX_BUFFER_SIZE = 50

# Log rotation settings
MAX_LOG_SIZE_MB = 10
MAX_LOG_FILES = 30

async def log_event(
    category: Union[LOG_CATEGORY, str],
    action: Union[LOG_ACTION, str], 
    user_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    sensitive: bool = False
) -> None:
    """
    Log an audit event
    
    Args:
        category: Event category
        action: Event action
        user_id: User ID (if applicable)
        details: Additional event details
        ip_address: Client IP address
        sensitive: Whether the event contains sensitive data
    """
    try:
        # Create log entry
        log_entry = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "category": category if isinstance(category, str) else category.value,
            "action": action if isinstance(action, str) else action.value,
            "user_id": user_id or "system",
            "ip_address": ip_address or "127.0.0.1",
            "details": sanitize_data(details) if sensitive and details else details or {}
        }
        
        # Add to buffer
        async with buffer_lock:
            log_buffer.append(log_entry)
            
            # Flush buffer if it's full
            if len(log_buffer) >= MAX_BUFFER_SIZE:
                await flush_logs()
    
    except Exception as e:
        logger.error(f"Error logging audit event: {str(e)}")

async def flush_logs() -> None:
    """Flush logs from buffer to storage"""
    global log_buffer
    
    async with buffer_lock:
        if not log_buffer:
            return
        
        # Get a copy of the buffer and clear it
        logs_to_write = log_buffer.copy()
        log_buffer = []
    
    try:
        # Get current log file
        log_file = get_current_log_file()
        
        # Write logs to file
        with open(log_file, 'a') as f:
            for log_entry in logs_to_write:
                f.write(json.dumps(log_entry) + '\n')
        
        # Check if rotation is needed
        await check_log_rotation(log_file)
    
    except Exception as e:
        logger.error(f"Error flushing audit logs: {str(e)}")
        
        # Put logs back in the buffer
        async with buffer_lock:
            log_buffer = logs_to_write + log_buffer

def get_current_log_file() -> str:
    """Get the current log file path"""
    today = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    return os.path.join(LOG_DIR, f"audit-{today}.log")

async def check_log_rotation(log_file: str) -> None:
    """Check if log rotation is needed"""
    try:
        # Check file size
        file_size_mb = os.path.getsize(log_file) / (1024 * 1024)
        
        if file_size_mb >= MAX_LOG_SIZE_MB:
            # Rotate the file
            timestamp = datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')
            rotated_file = f"{log_file}.{timestamp}"
            os.rename(log_file, rotated_file)
            
            # Clean up old files if needed
            log_files = [os.path.join(LOG_DIR, f) for f in os.listdir(LOG_DIR) 
                         if f.startswith('audit-') and '.log.' in f]
            
            # Sort by modification time (oldest first)
            log_files.sort(key=os.path.getmtime)
            
            # Remove oldest files if we have too many
            while len(log_files) > MAX_LOG_FILES:
                os.remove(log_files.pop(0))
    
    except Exception as e:
        logger.error(f"Error rotating audit logs: {str(e)}")

def sanitize_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize sensitive data
    
    Args:
        data: Data to sanitize
        
    Returns:
        Sanitized data
    """
    import re
    
    if not data:
        return {}
    
    # Deep copy to avoid modifying original
    sanitized = json.loads(json.dumps(data))
    
    # Recursive function to sanitize objects
    def sanitize_object(obj):
        if not obj or not isinstance(obj, dict):
            return obj
        
        for key, value in obj.items():
            # Check if key is sensitive
            if re.search(r'password|token|secret|key|ssn|credit|card|address|email|phone|birth|name|gender|race|ethnicity|diagnosis', key, re.I):
                obj[key] = '[REDACTED]'
            elif isinstance(value, str):
                # Apply patterns to string values
                for pattern, replacement in SENSITIVE_PATTERNS:
                    value = re.sub(pattern, replacement, value)
                obj[key] = value
            elif isinstance(value, dict):
                # Recurse into nested objects
                obj[key] = sanitize_object(value)
            elif isinstance(value, list):
                # Recurse into list items
                obj[key] = [sanitize_object(item) if isinstance(item, dict) else item for item in value]
        
        return obj
    
    return sanitize_object(sanitized)

@asynccontextmanager
async def audit_context(
    category: Union[LOG_CATEGORY, str],
    action: Union[LOG_ACTION, str],
    user_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    sensitive: bool = False
):
    """
    Context manager for auditing operations
    
    Args:
        category: Event category
        action: Event action
        user_id: User ID (if applicable)
        details: Additional event details
        ip_address: Client IP address
        sensitive: Whether the event contains sensitive data
    """
    start_time = datetime.datetime.utcnow()
    operation_id = str(uuid.uuid4())
    
    # Log start event
    await log_event(
        category=category,
        action=f"{action}_started",
        user_id=user_id,
        details={
            **(details or {}),
            "operation_id": operation_id,
            "status": "started"
        },
        ip_address=ip_address,
        sensitive=sensitive
    )
    
    error = None
    try:
        yield
    except Exception as e:
        error = e
        # Log error event
        await log_event(
            category=category,
            action=f"{action}_failed",
            user_id=user_id,
            details={
                **(details or {}),
                "operation_id": operation_id,
                "status": "failed",
                "error": str(e)
            },
            ip_address=ip_address,
            sensitive=sensitive
        )
        raise
    finally:
        end_time = datetime.datetime.utcnow()
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        if not error:
            # Log completion event
            await log_event(
                category=category,
                action=f"{action}_completed",
                user_id=user_id,
                details={
                    **(details or {}),
                    "operation_id": operation_id,
                    "status": "completed",
                    "duration_ms": duration_ms
                },
                ip_address=ip_address,
                sensitive=sensitive
            )

async def initialize():
    """Initialize the audit logger"""
    os.makedirs(LOG_DIR, exist_ok=True)
    
    # Log startup event
    await log_event(
        category=LOG_CATEGORY.SYSTEM,
        action=LOG_ACTION.SYSTEM_STARTUP,
        details={"message": "Audit logging system initialized"}
    )
    
    # Start background task to periodically flush logs
    asyncio.create_task(periodic_flush())

async def periodic_flush():
    """Periodically flush logs"""
    while True:
        await asyncio.sleep(30)  # Flush every 30 seconds
        await flush_logs()

async def shutdown():
    """Shutdown the audit logger"""
    # Log shutdown event
    await log_event(
        category=LOG_CATEGORY.SYSTEM,
        action=LOG_ACTION.SYSTEM_SHUTDOWN,
        details={"message": "Audit logging system shutting down"}
    )
    
    # Flush any remaining logs
    await flush_logs()

async def get_audit_logs(
    start_date: Optional[datetime.datetime] = None,
    end_date: Optional[datetime.datetime] = None,
    category: Optional[Union[LOG_CATEGORY, str]] = None,
    action: Optional[Union[LOG_ACTION, str]] = None,
    user_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    Get audit logs
    
    Args:
        start_date: Start date for logs
        end_date: End date for logs
        category: Filter by category
        action: Filter by action
        user_id: Filter by user ID
        limit: Maximum number of logs to return
        offset: Offset for pagination
        
    Returns:
        List of audit logs
    """
    logs = []
    
    # Set default dates if not provided
    if not end_date:
        end_date = datetime.datetime.utcnow()
    if not start_date:
        start_date = end_date - datetime.timedelta(days=7)
    
    # Convert to strings for comparison
    category_str = category.value if isinstance(category, LOG_CATEGORY) else category
    action_str = action.value if isinstance(action, LOG_ACTION) else action
    
    # Get list of log files within date range
    current_date = start_date
    log_files = []
    
    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        log_file = os.path.join(LOG_DIR, f"audit-{date_str}.log")
        
        if os.path.exists(log_file):
            log_files.append(log_file)
        
        # Check for rotated files
        rotated_files = [
            os.path.join(LOG_DIR, f) for f in os.listdir(LOG_DIR)
            if f.startswith(f"audit-{date_str}.log.")
        ]
        log_files.extend(rotated_files)
        
        current_date += datetime.timedelta(days=1)
    
    # Process each log file
    for log_file in log_files:
        try:
            with open(log_file, 'r') as f:
                for line in f:
                    try:
                        log_entry = json.loads(line.strip())
                        
                        # Parse timestamp
                        timestamp = datetime.datetime.fromisoformat(log_entry["timestamp"].rstrip("Z"))
                        
                        # Apply filters
                        if timestamp < start_date or timestamp > end_date:
                            continue
                        
                        if category_str and log_entry.get("category") != category_str:
                            continue
                        
                        if action_str and log_entry.get("action") != action_str:
                            continue
                        
                        if user_id and log_entry.get("user_id") != user_id:
                            continue
                        
                        logs.append(log_entry)
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            logger.error(f"Error reading audit log file {log_file}: {str(e)}")
    
    # Sort by timestamp (newest first)
    logs.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Apply pagination
    return logs[offset:offset+limit]

async def generate_compliance_report(
    start_date: datetime.datetime,
    end_date: datetime.datetime
) -> Dict[str, Any]:
    """
    Generate a HIPAA compliance report
    
    Args:
        start_date: Start date for report
        end_date: End date for report
        
    Returns:
        Compliance report
    """
    # Get all logs within date range
    logs = await get_audit_logs(start_date, end_date, limit=10000)
    
    # Initialize report data
    report = {
        "report_id": str(uuid.uuid4()),
        "generated_at": datetime.datetime.utcnow().isoformat(),
        "period_start": start_date.isoformat(),
        "period_end": end_date.isoformat(),
        "total_events": len(logs),
        "categories": {},
        "users": {},
        "security_incidents": 0,
        "data_access_events": 0,
        "anonymization_events": 0,
        "consent_events": 0
    }
    
    # Process logs
    for log in logs:
        category = log.get("category")
        action = log.get("action")
        user_id = log.get("user_id")
        
        # Update category counts
        if category not in report["categories"]:
            report["categories"][category] = 0
        report["categories"][category] += 1
        
        # Update user counts
        if user_id not in report["users"]:
            report["users"][user_id] = 0
        report["users"][user_id] += 1
        
        # Count specific event types
        if category == LOG_CATEGORY.SECURITY.value:
            report["security_incidents"] += 1
        
        if category == LOG_CATEGORY.DATA_ACCESS.value:
            report["data_access_events"] += 1
        
        if action == LOG_ACTION.ANONYMIZE.value:
            report["anonymization_events"] += 1
        
        if category == LOG_CATEGORY.CONSENT.value:
            report["consent_events"] += 1
    
    # Add summary
    report["summary"] = {
        "most_active_user": max(report["users"].items(), key=lambda x: x[1])[0] if report["users"] else None,
        "most_common_category": max(report["categories"].items(), key=lambda x: x[1])[0] if report["categories"] else None,
        "security_incident_rate": report["security_incidents"] / report["total_events"] if report["total_events"] > 0 else 0,
        "anonymization_rate": report["anonymization_events"] / report["total_events"] if report["total_events"] > 0 else 0
    }
    
    return report 
