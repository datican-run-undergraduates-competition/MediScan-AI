import React, { useState, useEffect, useRef } from 'react';
import { FaUpload, FaImage, FaSpinner, FaCheck, FaExclamationTriangle, FaMicrophone, FaVolumeUp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import uploadService from '../services/uploadService';
import SpeechRecognition from '../components/voice/SpeechRecognition';
import TextToSpeech from '../components/voice/TextToSpeech';

const XrayUpload = () => {
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
          const response = await uploadService.getXrayModels();
          if (response.data && response.data.models) {
            const modelsList = Object.entries(response.data.models).map(([id, model]) => ({
              id,
              name: model.info?.name || id,
              description: model.info?.description || ''
            }));
            setModels(modelsList);
            
            // Cache models in localStorage
            localStorage.setItem('xrayModels', JSON.stringify(modelsList));
            
            // Set default model
            if (modelsList.length > 0 && !selectedModel) {
              setSelectedModel(modelsList[0].id);
            }
          }
        } else {
          // Load from localStorage if offline
          const cachedModels = localStorage.getItem('xrayModels');
          if (cachedModels) {
            setModels(JSON.parse(cachedModels));
          }
        }
      } catch (error) {
        console.error('Error loading models:', error);
        // Try to load from cache if API fails
        const cachedModels = localStorage.getItem('xrayModels');
        if (cachedModels) {
          setModels(JSON.parse(cachedModels));
        }
      }
    };
    
    // Load pending uploads
    const loadPendingUploads = () => {
      const savedUploads = localStorage.getItem('pendingXrayUploads');
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
        localStorage.setItem('pendingXrayUploads', JSON.stringify(updatedPending));
        
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
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File(
                [blob], 
                file.name, 
                { type: 'image/jpeg', lastModified: Date.now() }
              );
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
      };
    });
  };

  // Remove a file from the list
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    
    // Also remove any progress or status for this file
    const newProgress = { ...uploadProgress };
    const newStatus = { ...uploadStatus };
    delete newProgress[index];
    delete newStatus[index];
    setUploadProgress(newProgress);
    setUploadStatus(newStatus);
  };

  // Upload and analyze a single file
  const uploadAndAnalyzeFile = async (file, modelId) => {
    const fileIndex = files.indexOf(file);
    
    try {
      // Create a unique ID for this upload
      const uploadId = Date.now().toString();
      
      // Update status
      setUploadStatus(prev => ({ 
        ...prev, 
        [fileIndex]: { status: 'uploading', id: uploadId } 
      }));
      
      // Setup progress tracking
      const onUploadProgress = (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(prev => ({ ...prev, [fileIndex]: progress }));
      };
      
      // Upload the file with resumable capability
      const response = await uploadService.uploadXrayImage(
        file, 
        modelId || selectedModel,
        { 
          onUploadProgress,
          resumable: true,
        }
      );
      
      // Update status to success
      setUploadStatus(prev => ({ 
        ...prev, 
        [fileIndex]: { 
          status: 'success', 
          id: uploadId,
          result: response.data 
        } 
      }));
      
      // Show success message
      toast.success(`Successfully uploaded and analyzed ${file.name}`);
      
      // Return the result
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      
      // Update status to failed
      setUploadStatus(prev => ({ 
        ...prev, 
        [fileIndex]: { 
          status: 'failed',
          error: error.message || 'Upload failed' 
        } 
      }));
      
      // Show error message
      toast.error(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`);
      
      // Store for later upload if we're offline
      if (!navigator.onLine) {
        storeForOfflineUpload(file, modelId || selectedModel);
      }
      
      throw error;
    }
  };

  // Store a file for later upload when connection is restored
  const storeForOfflineUpload = async (file, modelId) => {
    try {
      // Convert file to data URL for storage
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const newPendingUpload = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result,
          modelId: modelId,
          timestamp: Date.now()
        };
        
        const updatedPending = [...pendingUploads, newPendingUpload];
        setPendingUploads(updatedPending);
        localStorage.setItem('pendingXrayUploads', JSON.stringify(updatedPending));
        
        toast.info(`${file.name} saved for upload when connection is restored.`);
      };
    } catch (error) {
      console.error('Error storing file for offline upload:', error);
      toast.error(`Failed to save ${file.name} for later upload.`);
    }
  };

  // Upload all files
  const uploadAllFiles = async () => {
    if (files.length === 0) return;
    
    setProcessing(true);
    const results = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Skip already processed files
        if (uploadStatus[i] && uploadStatus[i].status === 'success') {
          results.push(uploadStatus[i].result);
          continue;
        }
        
        try {
          const result = await uploadAndAnalyzeFile(file, selectedModel);
          results.push(result);
        } catch (error) {
          console.error(`Error processing file ${i}:`, error);
          // Continue with next file
        }
      }
      
      // Set combined results
      if (results.length > 0) {
        setResults(results);
      }
    } catch (error) {
      console.error('Error in batch upload:', error);
      toast.error('Some files failed to upload. Please check the file list for details.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle voice commands
  const handleVoiceCommand = (text) => {
    setVoiceCommandText(text);
    
    const lowerText = text.toLowerCase();
    
    // Process voice commands
    if (lowerText.includes('upload') || lowerText.includes('send') || lowerText.includes('submit')) {
      uploadAllFiles();
      setVoiceFeedback('Starting upload of all files.');
    } 
    else if (lowerText.includes('select file') || lowerText.includes('choose file') || lowerText.includes('pick file')) {
      fileInputRef.current.click();
      setVoiceFeedback('Please select files to upload.');
    }
    else if (lowerText.includes('compress high') || lowerText.includes('high compression')) {
      setCompressionLevel('high');
      setVoiceFeedback('Set to high compression level.');
    }
    else if (lowerText.includes('compress low') || lowerText.includes('low compression')) {
      setCompressionLevel('low');
      setVoiceFeedback('Set to low compression level.');
    }
    else if (lowerText.includes('compress medium') || lowerText.includes('medium compression')) {
      setCompressionLevel('medium');
      setVoiceFeedback('Set to medium compression level.');
    }
    else if (lowerText.includes('no compress') || lowerText.includes('no compression')) {
      setCompressionLevel('none');
      setVoiceFeedback('Compression disabled.');
    }
    else if (lowerText.includes('clear') || lowerText.includes('reset')) {
      setFiles([]);
      setUploadProgress({});
      setUploadStatus({});
      setResults(null);
      setVoiceFeedback('All files cleared.');
    }
    else if (lowerText.includes('help')) {
      setVoiceFeedback('Available commands: upload files, select files, set compression level, clear files, or help.');
    }
    else {
      setVoiceFeedback('Command not recognized. Try "help" for available commands.');
    }
  };

  // Toggle voice commands
  const toggleVoiceCommands = () => {
    setVoiceCommandActive(!voiceCommandActive);
    
    if (!voiceCommandActive) {
      setVoiceFeedback('Voice commands activated. Say "help" for available commands.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">X-Ray Upload</h1>
        <p className="text-gray-600">Upload X-ray images for AI analysis</p>
      </div>
      
      {/* Network status indicator */}
      <div className={`mb-4 p-3 rounded-md text-white text-center ${offline ? 'bg-red-500' : 'bg-green-500'}`}>
        {offline ? (
          <div className="flex items-center justify-center">
            <FaExclamationTriangle className="mr-2" />
            <span>You are currently offline. Files will be saved and uploaded when your connection is restored.</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <FaCheck className="mr-2" />
            <span>Connected to the server. Ready to upload files.</span>
          </div>
        )}
      </div>
      
      {/* Pending uploads notification */}
      {pendingUploads.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
          <p className="text-yellow-800">
            You have {pendingUploads.length} pending uploads that will be processed when you're online.
          </p>
        </div>
      )}
      
      {/* Voice commands */}
      <div className="mb-6 flex items-center justify-center space-x-4">
        <button
          onClick={toggleVoiceCommands}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
            voiceCommandActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <FaMicrophone />
          <span>{voiceCommandActive ? 'Voice Commands Active' : 'Enable Voice Commands'}</span>
        </button>
        
        {voiceCommandActive && (
          <SpeechRecognition 
            onTextRecognized={handleVoiceCommand} 
            language="en-US"
          />
        )}
      </div>
      
      {voiceFeedback && voiceCommandActive && (
        <div className="mb-4 flex items-center justify-center">
          <div className="flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-md">
            <FaVolumeUp className="mr-2" />
            <span>{voiceFeedback}</span>
          </div>
          <div className="ml-2">
            <TextToSpeech text={voiceFeedback} />
          </div>
        </div>
      )}
      
      {/* File upload area */}
      <div 
        ref={dropAreaRef}
        className="mb-6 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center transition-colors duration-200"
      >
        <FaUpload className="mx-auto text-4xl text-gray-400 mb-4" />
        <p className="mb-4 text-gray-600">Drag and drop files here, or click to select files</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/dicom"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
          disabled={processing}
        >
          Select Files
        </button>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Compression Level:
          </label>
          <select
            value={compressionLevel}
            onChange={(e) => setCompressionLevel(e.target.value)}
            className="block w-full max-w-xs mx-auto mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="none">None (Original Size)</option>
            <option value="low">Low (90% Quality)</option>
            <option value="medium">Medium (70% Quality)</option>
            <option value="high">High (50% Quality)</option>
          </select>
        </div>
      </div>
      
      {/* Model selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Analysis Model:
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={processing || models.length === 0}
        >
          {models.length === 0 ? (
            <option value="">Loading models...</option>
          ) : (
            models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} {model.description ? `- ${model.description}` : ''}
              </option>
            ))
          )}
        </select>
      </div>
      
      {/* File list */}
      {files.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Selected Files:</h2>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-gray-50 border rounded-md"
              >
                <div className="flex items-center">
                  <FaImage className="text-gray-500 mr-3" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {uploadStatus[index] ? (
                    uploadStatus[index].status === 'uploading' ? (
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${uploadProgress[index] || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{uploadProgress[index] || 0}%</span>
                      </div>
                    ) : uploadStatus[index].status === 'success' ? (
                      <span className="text-green-600 flex items-center">
                        <FaCheck className="mr-1" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <FaExclamationTriangle className="mr-1" /> Failed
                      </span>
                    )
                  ) : (
                    <span className="text-gray-500 text-sm">Ready</span>
                  )}
                  
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                    disabled={processing || (uploadStatus[index] && uploadStatus[index].status === 'uploading')}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Upload button */}
      <div className="flex justify-center">
        <button
          onClick={uploadAllFiles}
          disabled={files.length === 0 || processing || offline}
          className={`flex items-center px-6 py-3 rounded-md font-semibold ${
            files.length === 0 || processing || offline
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {processing ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <FaUpload className="mr-2" />
              Upload and Analyze {files.length > 0 ? `(${files.length} files)` : ''}
            </>
          )}
        </button>
      </div>
      
      {/* Results */}
      {results && results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Analysis Results:</h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Result for {files[index]?.name || `File ${index + 1}`}</h3>
                <div className="space-y-2">
                  {result.predictions && (
                    <div>
                      <h4 className="font-medium">Predictions:</h4>
                      <ul className="list-disc pl-5">
                        {Object.entries(result.predictions).map(([key, value]) => (
                          <li key={key}>
                            {key}: {typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : JSON.stringify(value)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.analysis && (
                    <div>
                      <h4 className="font-medium">Analysis:</h4>
                      <p>{result.analysis}</p>
                    </div>
                  )}
                  
                  {result.recommendations && (
                    <div>
                      <h4 className="font-medium">Recommendations:</h4>
                      <p>{result.recommendations}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default XrayUpload; 
