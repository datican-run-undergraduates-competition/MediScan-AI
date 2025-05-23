# DICOM Processing API

This module provides API endpoints for processing DICOM medical imaging files. It supports uploading, anonymizing, and extracting metadata from DICOM files.

## Overview

The DICOM API provides the following functionality:
- Upload DICOM files
- Anonymize DICOM files to remove PHI (Protected Health Information)
- Extract metadata from DICOM files
- Download DICOM files
- Track processing status

## Endpoints

### POST /api/dicom/upload

Upload and process a DICOM file.

**Request Body**:
- `file`: DICOM file (multipart/form-data)
- `anonymize`: Whether to anonymize the DICOM file (boolean, default: false)
- `study_type`: Type of study (string, e.g., "xray", "ct", "mri", default: "general")

**Response**:
```json
{
  "message": "DICOM file processed successfully",
  "file_id": "uuid-string",
  "metadata": { ... },
  "status": "completed"
}
```

### GET /api/dicom/metadata/{file_id}

Get metadata for a previously uploaded DICOM file.

**Path Parameters**:
- `file_id`: ID of the DICOM file

**Response**:
```json
{
  "patient_id": "value",
  "patient_name": "value",
  "study_date": "value",
  "modality": "value",
  ...
}
```

### POST /api/dicom/anonymize/{file_id}

Anonymize a previously uploaded DICOM file.

**Path Parameters**:
- `file_id`: ID of the DICOM file to anonymize

**Response**:
```json
{
  "message": "DICOM file queued for anonymization",
  "original_file_id": "uuid-string",
  "anonymized_file_id": "uuid-string",
  "status": "processing"
}
```

### GET /api/dicom/download/{file_id}

Download a previously uploaded DICOM file.

**Path Parameters**:
- `file_id`: ID of the DICOM file

**Response**: Binary DICOM file

### GET /api/dicom/status/{file_id}

Get the processing status of a DICOM file.

**Path Parameters**:
- `file_id`: ID of the DICOM file

**Response**:
```json
{
  "status": "completed", // or "processing"
  "file_id": "uuid-string"
}
```

## DICOM Anonymization

The anonymization process removes or modifies the following PHI elements:
- Patient Name
- Patient ID
- Patient Birth Date
- Patient Sex
- Patient Age
- Patient Address
- Patient Telephone Numbers
- Physician Information
- Institution Information
- And other identifiable data

The anonymized DICOM file retains all clinical data required for analysis but is compliant with privacy regulations like HIPAA and GDPR.

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 400: Bad request (e.g., invalid DICOM file)
- 404: File not found
- 500: Server error

Error responses include a descriptive message in the response body:
```json
{
  "detail": "Error message"
}
```

## Audit Logging

All DICOM operations are logged for compliance and security purposes. The logs include:
- User ID
- Action type (upload, download, anonymize, etc.)
- Timestamp
- File ID
- Success/failure status 
