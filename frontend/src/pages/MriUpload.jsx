import React, { useState, useEffect, useRef } from 'react';
import { FaUpload, FaImage, FaSpinner, FaCheck, FaExclamationTriangle, FaMicrophone } from 'react-icons/fa';
import { toast } from 'react-toastify';
import uploadService from '../services/uploadService';
import SpeechRecognition from '../components/voice/SpeechRecognition';
import TextToSpeech from '../components/voice/TextToSpeech';

const MriUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [processing, setProcessing] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [results, setResults] = useState(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [compressionLevel, setCompressionLevel] = useState('medium');
  const [voiceCommandActive, setVoiceCommandActive] = useState(false);
  const [voiceCommandText, setVoiceCommandText] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  // Load saved models and pending uploads from local storage
  useEffect(() => {
    // Check network status
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load models from local storage or API
    const loadModels = async () => {
      try {
        // Try to get from API first
        if (navigator.onLine) {
          const response = await uploadService.getMriModels();
          if (response.data && response.data.models) {
            const modelsList = Object.entries(response.data.models).map(([id, model]) => ({
              id,
              name: model.info?.name || id,
              description: model.info?.description || ''
            }));
            setModels(modelsList);
            
            // Cache models in localStorage
            localStorage.setItem('mriModels', JSON.stringify(modelsList));
            
            // Set default model
            if (modelsList.length > 0 && !selectedModel) {
              setSelectedModel(modelsList[0].id);
            }
          }
        } else {
          // Load from localStorage if offline
          const cachedModels = localStorage.getItem('mriModels');
          if (cachedModels) {
            setModels(JSON.parse(cachedModels));
          }
        }
      } catch (error) {
        console.error('Error loading models:', error);
        // Try to load from cache if API fails
        const cachedModels = localStorage.getItem('mriModels');
        if (cachedModels) {
          setModels(JSON.parse(cachedModels));
        }
      }
    };
    
    // Load pending uploads
    const loadPendingUploads = () => {
      const savedUploads = localStorage.getItem('pendingMriUploads');
      if (savedUploads) {
        setPendingUploads(JSON.parse(savedUploads));
      }
    };
    
    loadModels();
    loadPendingUploads();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Try to upload pending files when online
  useEffect(() => {
    if (navigator.onLine && pendingUploads.length > 0) {
      processPendingUploads();
    }
  }, [offline, pendingUploads]);

  // Handle drag and drop events
  useEffect(() => {
    const dropArea = dropAreaRef.current;
    
    const highlight = () => dropArea.classList.add('bg-blue-50', 'border-blue-400');
    const unhighlight = () => dropArea.classList.remove('bg-blue-50', 'border-blue-400');
    
    const handleDragOver = (e) => {
      e.preventDefault();
      highlight();
    };
    
    const handleDragLeave = () => {
      unhighlight();
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      unhighlight();
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    };
    
    if (dropArea) {
      dropArea.addEventListener('dragover', handleDragOver);
      dropArea.addEventListener('dragleave', handleDragLeave);
      dropArea.addEventListener('drop', handleDrop);
      
      return () => {
        dropArea.removeEventListener('dragover', handleDragOver);
        dropArea.removeEventListener('dragleave', handleDragLeave);
        dropArea.removeEventListener('drop', handleDrop);
      };
    }
  }, []);

  // Process pending uploads
  const processPendingUploads = async () => {
    if (pendingUploads.length === 0) return;
    
    const currentPending = [...pendingUploads];
    
    for (let i = 0; i < currentPending.length; i++) {
      const pendingUpload = currentPending[i];
      
      try {
        // Create a new file object from the stored data
        const fileData = await fetch(pendingUpload.dataUrl);
        const blob = await fileData.blob();
        const file = new File([blob], pendingUpload.name, { type: pendingUpload.type });
        
        // Upload the file
        await uploadAndAnalyzeFile(file, pendingUpload.modelId);
        
        // Remove from pending uploads
        const updatedPending = pendingUploads.filter(
          upload => upload.id !== pendingUpload.id
        );
        setPendingUploads(updatedPending);
        localStorage.setItem('pendingMriUploads', JSON.stringify(updatedPending));
        
        toast.success(`Successfully uploaded pending file: ${pendingUpload.name}`);
      } catch (error) {
        console.error(`Failed to upload pending file ${pendingUpload.name}:`, error);
      }
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  // Process selected files
  const handleFiles = async (selectedFiles) => {
    const validFiles = selectedFiles.filter(file => 
      file.type === 'image/jpeg' || 
      file.type === 'image/png' || 
      file.type === 'image/dicom'
    );
    
    if (validFiles.length !== selectedFiles.length) {
      toast.warning('Some files were rejected. Only JPEG, PNG, and DICOM images are supported.');
    }
    
    if (validFiles.length === 0) return;
    
    // Compress images if needed and add to files list
    const compressedFiles = await Promise.all(
      validFiles.map(async file => {
        // Don't compress DICOM files
        if (file.type === 'image/dicom') return file;
        
        return await compressImage(file, compressionLevel);
      })
    );
    
    setFiles(prev => [...prev, ...compressedFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Provide voice feedback
    if (voiceCommandActive) {
      const feedback = `Added ${compressedFiles.length} files for upload.`;
      setVoiceFeedback(feedback);
    }
  };

  // Compress image to reduce size for upload
  const compressImage = (file, level) => {
    return new Promise((resolve) => {
      // If no compression needed or file is too small
      if (level === 'none' || file.size < 100000) {
        resolve(file);
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Determine compression ratio based on level
          let quality = 0.7; // medium by default
          
          if (level === 'low') {
            quality = 0.9;
          } else if (level === 'high') {
            quality = 0.5;
          }
          
          // Resize image if it's very large
          const MAX_SIZE = 1800;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            } else {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            },
            'image/jpeg',
            quality
          );
        };
      };
    });
  };

  // Remove file from list
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[index];
      return newStatus;
    });
  };

  // Upload and analyze a single file
  const uploadAndAnalyzeFile = async (file, modelId) => {
    const fileIndex = files.findIndex(f => f === file);
    
    try {
      setUploadStatus(prev => ({
        ...prev,
        [fileIndex]: 'uploading'
      }));
      
      const response = await uploadService.uploadMri(file, modelId, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(prev => ({
          ...prev,
          [fileIndex]: progress
        }));
      });
      
      setUploadStatus(prev => ({
        ...prev,
        [fileIndex]: 'success'
      }));
      
      // Get analysis results
      const analysisId = response.data.analysisId;
      const results = await uploadService.getAnalysisResults(analysisId);
      
      setResults(prev => ({
        ...prev,
        [fileIndex]: results.data
      }));
      
      return results.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus(prev => ({
        ...prev,
        [fileIndex]: 'error'
      }));
      throw error;
    }
  };

  // Store file for offline upload
  const storeForOfflineUpload = async (file, modelId) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    return new Promise((resolve) => {
      reader.onload = async () => {
        const pendingUpload = {
          id: Date.now(),
          name: file.name,
          type: file.type,
          dataUrl: reader.result,
          modelId,
          timestamp: new Date().toISOString()
        };
        
        const updatedPending = [...pendingUploads, pendingUpload];
        setPendingUploads(updatedPending);
        localStorage.setItem('pendingMriUploads', JSON.stringify(updatedPending));
        
        resolve();
      };
    });
  };

  // Upload all files
  const uploadAllFiles = async () => {
    if (files.length === 0) {
      toast.warning('Please select files to upload');
      return;
    }
    
    if (!selectedModel) {
      toast.warning('Please select a model');
      return;
    }
    
    setProcessing(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          if (navigator.onLine) {
            await uploadAndAnalyzeFile(file, selectedModel);
          } else {
            await storeForOfflineUpload(file, selectedModel);
            toast.info(`File ${file.name} stored for offline upload`);
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          toast.error(`Failed to process ${file.name}`);
        }
      }
      
      toast.success('All files processed successfully');
    } finally {
      setProcessing(false);
    }
  };

  // Handle voice commands
  const handleVoiceCommand = (text) => {
    setVoiceCommandText(text);
    
    // Process voice commands
    const command = text.toLowerCase();
    
    if (command.includes('upload')) {
      fileInputRef.current?.click();
    } else if (command.includes('start') || command.includes('begin')) {
      uploadAllFiles();
    } else if (command.includes('clear') || command.includes('remove all')) {
      setFiles([]);
      setUploadProgress({});
      setUploadStatus({});
      setResults(null);
    } else if (command.includes('select model')) {
      // Extract model name from command
      const modelName = command.split('select model')[1]?.trim();
      if (modelName) {
        const model = models.find(m => 
          m.name.toLowerCase().includes(modelName.toLowerCase())
        );
        if (model) {
          setSelectedModel(model.id);
          setVoiceFeedback(`Selected model: ${model.name}`);
        }
      }
    }
  };

  // Toggle voice commands
  const toggleVoiceCommands = () => {
    setVoiceCommandActive(!voiceCommandActive);
    if (!voiceCommandActive) {
      setVoiceFeedback('Voice commands activated. You can now use voice commands to control the upload process.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">MRI Scan Upload</h1>
        <p className="text-gray-600">
          Upload and analyze MRI scans using our advanced AI models
        </p>
      </div>

      {/* Voice Command Controls */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={toggleVoiceCommands}
          className={`p-2 rounded-full ${
            voiceCommandActive ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <FaMicrophone />
        </button>
        {voiceCommandActive && (
          <div className="flex-1">
            <SpeechRecognition onCommand={handleVoiceCommand} />
            {voiceFeedback && (
              <div className="mt-2">
                <TextToSpeech text={voiceFeedback} />
                <span className="text-sm text-gray-600">{voiceFeedback}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select AI Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a model...</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload Area */}
      <div
        ref={dropAreaRef}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".jpg,.jpeg,.png,.dicom"
          className="hidden"
        />
        <FaUpload className="mx-auto text-4xl text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">
          Drag and drop your MRI scan files here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-500 hover:text-blue-600"
          >
            browse
          </button>
        </p>
        <p className="text-sm text-gray-500">
          Supported formats: JPEG, PNG, DICOM
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Selected Files</h2>
          <div className="space-y-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
              >
                <div className="flex items-center space-x-4">
                  <FaImage className="text-2xl text-gray-400" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {uploadStatus[index] === 'uploading' && (
                    <div className="w-32">
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${uploadProgress[index]}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {uploadStatus[index] === 'success' && (
                    <FaCheck className="text-green-500" />
                  )}
                  {uploadStatus[index] === 'error' && (
                    <FaExclamationTriangle className="text-red-500" />
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-end">
        <button
          onClick={uploadAllFiles}
          disabled={processing || files.length === 0 || !selectedModel}
          className={`px-6 py-2 rounded-md text-white ${
            processing || files.length === 0 || !selectedModel
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {processing ? (
            <span className="flex items-center">
              <FaSpinner className="animate-spin mr-2" />
              Processing...
            </span>
          ) : (
            'Upload and Analyze'
          )}
        </button>
      </div>

      {/* Results Display */}
      {Object.keys(results || {}).length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
          <div className="space-y-4">
            {Object.entries(results).map(([index, result]) => (
              <div
                key={index}
                className="p-4 bg-white rounded-lg shadow"
              >
                <h3 className="font-medium mb-2">{files[index].name}</h3>
                <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MriUpload; 