# Auto Metadata Generator for MediScan AI Models

This tool automatically analyzes machine learning models and generates appropriate `metadata.json` files required by the MediScan AI platform.

## Overview

When adding ML models to MediScan AI, each model requires a `metadata.json` file describing its properties, including:
- Framework (PyTorch, TensorFlow, ONNX)
- Model type (classification, segmentation, detection)
- Input/output shapes
- Label mappings (for classification models)
- Preprocessing requirements

The `auto_metadata.py` script simplifies this process by:
1. Analyzing your model's architecture
2. Detecting model type and framework
3. Inferring input/output shapes
4. Generating an appropriate metadata.json file
5. Copying the model to the correct location in the MediScan AI structure

## Usage

### Basic Usage

```bash
python -m backend.app.ml.auto_metadata path/to/your/model.pt --name my_model --modality xray
```

This will:
1. Analyze the model file at `path/to/your/model.pt`
2. Create a directory structure at `backend/app/ml/models/my_model/`
3. Copy the model file to the correct location with the standardized name
4. Generate a `metadata.json` file with appropriate settings

### Options

```
usage: auto_metadata.py [-h] --name NAME --modality {xray,mri,ct} [--output-dir OUTPUT_DIR] [--labels-file LABELS_FILE] [--analyze-only] model_path

positional arguments:
  model_path            Path to the model file (.pt, .h5, .onnx)

optional arguments:
  -h, --help            Show this help message and exit
  --name NAME           Name to give the model
  --modality {xray,mri,ct}
                        Medical image modality (xray, mri, ct)
  --output-dir OUTPUT_DIR
                        Custom output directory (defaults to models/<name>)
  --labels-file LABELS_FILE
                        JSON file containing class label mapping
  --analyze-only        Only analyze and print metadata without saving
```

### Examples

#### Analyzing a PyTorch X-ray Classification Model

```bash
python -m backend.app.ml.auto_metadata path/to/xray_classifier.pt --name xray_classifier --modality xray
```

#### Analyzing a TensorFlow MRI Segmentation Model

```bash
python -m backend.app.ml.auto_metadata path/to/brain_tumor_segmentation.h5 --name brain_segmentation --modality mri
```

#### Analyzing an ONNX CT Scan Model

```bash
python -m backend.app.ml.auto_metadata path/to/lung_nodule_detector.onnx --name lung_nodule --modality ct
```

#### Analyze Without Saving

If you just want to see what metadata would be generated without saving:

```bash
python -m backend.app.ml.auto_metadata path/to/model.pt --name test_model --modality xray --analyze-only
```

#### Providing Custom Labels

For classification models, you can provide a JSON file mapping class indices to labels:

```bash
python -m backend.app.ml.auto_metadata path/to/model.pt --name disease_classifier --modality xray --labels-file disease_labels.json
```

Example `disease_labels.json`:
```json
{
    "0": "No Finding",
    "1": "Pneumonia",
    "2": "Effusion",
    "3": "Nodule"
}
```

## Supported Frameworks and Types

### Frameworks
- PyTorch (`.pt` or `.pth` files)
- TensorFlow/Keras (`.h5` or `.keras` files)
- ONNX (`.onnx` files)

### Model Types
- Classification
- Segmentation
- Detection

### Modalities
- X-ray
- MRI
- CT

## Generated Metadata Format

The generated `metadata.json` file will have a structure like this:

```json
{
    "name": "xray_classifier",
    "type": "classification",
    "framework": "pytorch",
    "version": "1.0.0",
    "input_shape": [1, 3, 224, 224],
    "output_shape": [1, 14],
    "modality": "xray",
    "labels": {
        "0": "No Finding",
        "1": "Atelectasis",
        "2": "Cardiomegaly",
        "3": "Effusion",
        ...
    },
    "preprocessing": {
        "normalize": true,
        "target_size": [224, 224]
    }
}
```

## Troubleshooting

### Common Issues

1. **Framework Detection Error**: The tool determines the framework based on file extension. Make sure your model file has the correct extension (`.pt` for PyTorch, `.h5` for TensorFlow, `.onnx` for ONNX).

2. **Incorrect Model Type**: The tool tries to infer the model type from architecture. If it's incorrect, you can modify the metadata.json file after generation.

3. **Missing Dependencies**: Depending on the model framework, you'll need the corresponding library installed:
   - PyTorch models require `torch`
   - TensorFlow models require `tensorflow`
   - ONNX models require `onnx` and `onnxruntime`

### Manual Editing

After auto-generation, you can manually edit the `metadata.json` file to correct any inaccuracies or add additional information. 
