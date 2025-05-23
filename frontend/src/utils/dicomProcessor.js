import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as dicomParser from 'dicom-parser';

// Initialize cornerstone libraries
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

// Set up image loader configuration
cornerstoneWADOImageLoader.configure({
  useWebWorkers: true,
  decodeConfig: {
    usePDFJS: false,
    useHTTPAuth: false
  }
});

/**
 * Process DICOM file and prepare for upload
 * @param {File} file - The DICOM file to process
 * @returns {Promise<Object>} - Processed DICOM data
 */
export const processDicomFile = async (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const byteArray = new Uint8Array(arrayBuffer);
        
        // Parse DICOM file
        const dataSet = dicomParser.parseDicom(byteArray);
        
        // Extract basic metadata
        const metadata = extractDicomMetadata(dataSet);
        
        // Get image as blob for preview
        const imageBlob = await extractDicomImage(file, dataSet);
        
        resolve({
          metadata,
          imageBlob,
          file,
          anonymized: false
        });
      } catch (error) {
        console.error('Error processing DICOM file:', error);
        reject(new Error(`Failed to process DICOM file: ${error.message}`));
      }
    };
    
    fileReader.onerror = () => {
      reject(new Error('Failed to read DICOM file'));
    };
    
    fileReader.readAsArrayBuffer(file);
  });
};

/**
 * Extract key metadata from DICOM dataset
 * @param {Object} dataSet - DICOM dataset
 * @returns {Object} - Extracted metadata
 */
const extractDicomMetadata = (dataSet) => {
  // Helper function to safely get string values
  const getString = (tag) => {
    try {
      const value = dataSet.string(tag);
      return value || '';
    } catch (e) {
      return '';
    }
  };
  
  // Extract key DICOM tags
  return {
    patientId: getString('x00100020'),
    patientName: getString('x00100010'),
    patientBirthDate: getString('x00100030'),
    patientSex: getString('x00100040'),
    studyDate: getString('x00080020'),
    studyTime: getString('x00080030'),
    studyDescription: getString('x00081030'),
    modality: getString('x00080060'),
    manufacturer: getString('x00080070'),
    institutionName: getString('x00080080'),
    bodyPartExamined: getString('x00180015'),
    pixelSpacing: getString('x00280030'),
    rows: dataSet.uint16('x00280010'),
    columns: dataSet.uint16('x00280011'),
    bitsAllocated: dataSet.uint16('x00280100'),
    imageOrientation: getString('x00200037'),
    imagePosition: getString('x00200032'),
    windowCenter: getString('x00281050'),
    windowWidth: getString('x00281051'),
    hasPixelData: dataSet.elements.x7fe00010 !== undefined
  };
};

/**
 * Extract image from DICOM file for preview
 * @param {File} file - Original DICOM file
 * @param {Object} dataSet - Parsed DICOM dataset
 * @returns {Promise<Blob>} - Image blob
 */
const extractDicomImage = async (file, dataSet) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a URL for the file
      const objectUrl = URL.createObjectURL(file);
      
      // Load the image
      cornerstone.loadImage(`wadouri:${objectUrl}`).then(image => {
        // Clean up object URL
        URL.revokeObjectURL(objectUrl);
        
        // Get the rendered canvas
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        
        cornerstone.renderToCanvas(canvas, image);
        
        // Convert canvas to blob
        canvas.toBlob(blob => {
          resolve(blob);
        }, 'image/jpeg', 0.85);
      }).catch(error => {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Anonymize DICOM file by removing/modifying personal data
 * @param {File} file - Original DICOM file
 * @returns {Promise<File>} - Anonymized DICOM file
 */
export const anonymizeDicomFile = async (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const byteArray = new Uint8Array(arrayBuffer);
        
        // Parse DICOM
        const dataSet = dicomParser.parseDicom(byteArray);
        
        // List of tags to anonymize
        const tagsToAnonymize = [
          'x00100010', // Patient Name
          'x00100020', // Patient ID
          'x00100030', // Patient Birth Date
          'x00100040', // Patient Sex
          'x00101010', // Patient Age
          'x00101040', // Patient Address
          'x00320032', // Requesting Physician
          'x00320033', // Requesting Service
          'x00081080', // Admitting Diagnoses Description
          'x00081050', // Performing Physician Name
          'x00081070', // Operator Name
          'x00081060', // Name of Physician Reading Study
          'x00400275'  // Request Attributes Sequence
        ];
        
        // Create a modified byteArray with anonymized data
        const anonymizedByteArray = anonymizeByteArray(byteArray, dataSet, tagsToAnonymize);
        
        // Create a new File from the anonymized byteArray
        const anonymizedFile = new File([anonymizedByteArray], file.name, {
          type: file.type,
          lastModified: file.lastModified
        });
        
        resolve(anonymizedFile);
      } catch (error) {
        console.error('Error anonymizing DICOM file:', error);
        reject(new Error(`Failed to anonymize DICOM file: ${error.message}`));
      }
    };
    
    fileReader.onerror = () => {
      reject(new Error('Failed to read DICOM file for anonymization'));
    };
    
    fileReader.readAsArrayBuffer(file);
  });
};

/**
 * Anonymize a DICOM byte array by modifying personal data tags
 * @param {Uint8Array} byteArray - Original DICOM byte array
 * @param {Object} dataSet - Parsed DICOM dataset
 * @param {Array} tagsToAnonymize - Array of tags to anonymize
 * @returns {Uint8Array} - Anonymized byte array
 */
const anonymizeByteArray = (byteArray, dataSet, tagsToAnonymize) => {
  // Create a copy of the byteArray
  const anonymizedBytes = new Uint8Array(byteArray);
  
  // For each tag to anonymize
  tagsToAnonymize.forEach(tag => {
    const element = dataSet.elements[tag];
    if (element) {
      // Get the value representation
      const vr = element.vr || detectVR(tag, dataSet);
      
      // Set appropriate anonymized value based on VR
      if (vr === 'PN') { // Person Name
        replaceStringValue(anonymizedBytes, element, 'ANONYMOUS');
      } else if (vr === 'DA') { // Date
        replaceStringValue(anonymizedBytes, element, '19000101');
      } else if (vr === 'AS') { // Age String
        replaceStringValue(anonymizedBytes, element, '000Y');
      } else if (vr === 'LO' || vr === 'SH' || vr === 'ST') { // Long String, Short String, Short Text
        replaceStringValue(anonymizedBytes, element, '');
      } else if (vr === 'SQ') { // Sequence
        // Remove the sequence by zeroing out its bytes
        for (let i = element.dataOffset; i < element.dataOffset + element.length; i++) {
          anonymizedBytes[i] = 0;
        }
      } else {
        // For other VRs, just zero out the data
        for (let i = element.dataOffset; i < element.dataOffset + element.length; i++) {
          anonymizedBytes[i] = 0;
        }
      }
    }
  });
  
  return anonymizedBytes;
};

/**
 * Detect the Value Representation for a tag
 * @param {string} tag - DICOM tag
 * @param {Object} dataSet - Parsed DICOM dataset
 * @returns {string} - Value Representation
 */
const detectVR = (tag, dataSet) => {
  // Standard VRs for common tags
  const knownVRs = {
    'x00100010': 'PN', // Patient Name
    'x00100020': 'LO', // Patient ID
    'x00100030': 'DA', // Patient Birth Date
    'x00100040': 'CS', // Patient Sex
    'x00101010': 'AS', // Patient Age
    'x00101040': 'LO'  // Patient Address
  };
  
  return knownVRs[tag] || 'UN'; // Unknown if not in the list
};

/**
 * Replace a string value in a DICOM byte array
 * @param {Uint8Array} byteArray - DICOM byte array to modify
 * @param {Object} element - DICOM element to modify
 * @param {string} newValue - New value to set
 */
const replaceStringValue = (byteArray, element, newValue) => {
  // Convert new value to bytes
  const encoder = new TextEncoder();
  const newValueBytes = encoder.encode(newValue);
  
  // Copy new value into the byteArray
  const maxLength = Math.min(newValueBytes.length, element.length);
  for (let i = 0; i < maxLength; i++) {
    byteArray[element.dataOffset + i] = newValueBytes[i];
  }
  
  // Pad with spaces if needed
  for (let i = maxLength; i < element.length; i++) {
    byteArray[element.dataOffset + i] = 32; // ASCII space
  }
};

/**
 * Get DICOM file metadata without loading the full pixel data
 * @param {File} file - DICOM file
 * @returns {Promise<Object>} - DICOM metadata
 */
export const getDicomMetadata = async (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        const byteArray = new Uint8Array(arrayBuffer);
        
        // Parse DICOM - only parse the header, not the pixel data
        const dataSet = dicomParser.parseDicom(byteArray, { untilTag: 'x7fe00010' });
        
        // Extract metadata
        const metadata = extractDicomMetadata(dataSet);
        resolve(metadata);
      } catch (error) {
        console.error('Error reading DICOM metadata:', error);
        reject(new Error(`Failed to read DICOM metadata: ${error.message}`));
      }
    };
    
    fileReader.onerror = () => {
      reject(new Error('Failed to read DICOM file'));
    };
    
    // Only read the first 10KB to get headers
    const headerChunk = file.slice(0, 10 * 1024);
    fileReader.readAsArrayBuffer(headerChunk);
  });
};

/**
 * Validate if a file is a valid DICOM file
 * @param {File} file - File to validate
 * @returns {Promise<boolean>} - Whether file is valid DICOM
 */
export const validateDicomFile = async (file) => {
  return new Promise((resolve) => {
    const fileReader = new FileReader();
    
    fileReader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        const byteArray = new Uint8Array(arrayBuffer);
        
        // Check for DICOM magic number 'DICM' at offset 128
        if (byteArray.length < 132) {
          resolve(false);
          return;
        }
        
        const magicNumber = String.fromCharCode(
          byteArray[128], byteArray[129], byteArray[130], byteArray[131]
        );
        
        if (magicNumber === 'DICM') {
          // Further validate by trying to parse
          try {
            dicomParser.parseDicom(byteArray, { untilTag: 'x00080060' }); // Parse until Modality tag
            resolve(true);
          } catch (parseError) {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      } catch (error) {
        resolve(false);
      }
    };
    
    fileReader.onerror = () => {
      resolve(false);
    };
    
    // Only read the first 4KB to check magic number
    const headerChunk = file.slice(0, 4 * 1024);
    fileReader.readAsArrayBuffer(headerChunk);
  });
};

export default {
  processDicomFile,
  anonymizeDicomFile,
  getDicomMetadata,
  validateDicomFile
}; 
