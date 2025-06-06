import React, { useState, useRef } from 'react';
import { FaUpload, FaFileAlt, FaSpinner, FaCheck, FaExclamationTriangle, FaMicrophone } from 'react-icons/fa';
import { toast } from 'react-toastify';
import uploadService from '../services/uploadService';
import SpeechRecognition from '../components/voice/SpeechRecognition';
import TextToSpeech from '../components/voice/TextToSpeech';

const ReportUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [voiceCommandActive, setVoiceCommandActive] = useState(false);
  const [voiceCommandText, setVoiceCommandText] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  // Process selected files
  const handleFiles = async (selectedFiles) => {
    const validFiles = selectedFiles.filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    
    if (validFiles.length !== selectedFiles.length) {
      toast.warning('Some files were rejected. Only PDF and Word documents are supported.');
    }
    
    if (validFiles.length === 0) return;
    
    setFiles(prev => [...prev, ...validFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Provide voice feedback
    if (voiceCommandActive) {
      const feedback = `Added ${validFiles.length} files for upload.`;
      setVoiceFeedback(feedback);
    }
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
  const uploadAndAnalyzeFile = async (file) => {
    const fileIndex = files.findIndex(f => f === file);
    
    try {
      setUploadStatus(prev => ({
        ...prev,
        [fileIndex]: 'uploading'
      }));
      
      const response = await uploadService.uploadReport(file, (progressEvent) => {
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
  const storeForOfflineUpload = async (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    return new Promise((resolve) => {
      reader.onload = async () => {
        const pendingUpload = {
          id: Date.now(),
          name: file.name,
          type: file.type,
          dataUrl: reader.result,
          timestamp: new Date().toISOString()
        };
        
        const updatedPending = [...pendingUploads, pendingUpload];
        setPendingUploads(updatedPending);
        localStorage.setItem('pendingReportUploads', JSON.stringify(updatedPending));
        
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
    
    setProcessing(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          if (navigator.onLine) {
            await uploadAndAnalyzeFile(file);
          } else {
            await storeForOfflineUpload(file);
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
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Medical Report Upload</h1>
        <p className="text-gray-600">
          Upload and analyze medical reports using our advanced AI models
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
          accept=".pdf,.doc,.docx"
          className="hidden"
        />
        <FaUpload className="mx-auto text-4xl text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">
          Drag and drop your medical report files here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-500 hover:text-blue-600"
          >
            browse
          </button>
        </p>
        <p className="text-sm text-gray-500">
          Supported formats: PDF, DOC, DOCX
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
                  <FaFileAlt className="text-2xl text-gray-400" />
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
          disabled={processing || files.length === 0}
          className={`px-6 py-2 rounded-md text-white ${
            processing || files.length === 0
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

export default ReportUpload; 