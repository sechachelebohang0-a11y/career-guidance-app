import React, { useState, useRef } from 'react';
import { db, storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, collection, addDoc, updateDoc } from 'firebase/firestore';
import './DocumentUploadModal.css';

const DocumentUploadModal = ({ documentType, studentId, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const documentTypes = {
    high_school_transcript: 'High School Transcript',
    birth_certificate: 'Birth Certificate',
    id_copy: 'ID Copy',
    academic_transcript: 'Academic Transcript',
    degree_certificate: 'Degree Certificate',
    professional_certificate: 'Professional Certificate',
    other: 'Other Document'
  };

  const allowedTypes = {
    high_school_transcript: ['.pdf', '.jpg', '.jpeg', '.png'],
    birth_certificate: ['.pdf', '.jpg', '.jpeg', '.png'],
    id_copy: ['.pdf', '.jpg', '.jpeg', '.png'],
    academic_transcript: ['.pdf'],
    degree_certificate: ['.pdf', '.jpg', '.jpeg', '.png'],
    professional_certificate: ['.pdf', '.jpg', '.jpeg', '.png'],
    other: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      // Check file type
      const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
      const allowedExtensions = allowedTypes[documentType] || allowedTypes.other;
      
      if (!allowedExtensions.includes(fileExtension)) {
        alert(`Allowed file types for ${documentTypes[documentType]}: ${allowedExtensions.join(', ')}`);
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Create a unique file name
      const timestamp = new Date().getTime();
      const fileName = `${documentType}_${studentId}_${timestamp}_${file.name}`;
      const fileRef = ref(storage, `documents/${studentId}/${fileName}`);

      // Upload file to Firebase Storage
      const uploadTask = uploadBytes(fileRef, file);
      
      // Simulate progress (Firebase Storage doesn't provide progress for uploadBytes)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const snapshot = await uploadTask;
      clearInterval(progressInterval);
      setProgress(100);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Save document metadata to Firestore
      const documentData = {
        studentId: studentId,
        type: documentType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storagePath: snapshot.ref.fullPath,
        downloadURL: downloadURL,
        uploadedAt: new Date(),
        status: 'pending_review',
        reviewedBy: null,
        reviewedAt: null,
        feedback: null
      };

      await addDoc(collection(db, 'documents'), documentData);

      // Update student profile to indicate document upload
      const studentRef = doc(db, 'users', studentId);
      await updateDoc(studentRef, {
        lastDocumentUpload: new Date(),
        updatedAt: new Date()
      });

      onSuccess();
      alert('Document uploaded successfully! It will be reviewed by administrators.');

    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const inputEvent = {
        target: {
          files: [droppedFile]
        }
      };
      handleFileSelect(inputEvent);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content document-upload-modal">
        <div className="modal-header">
          <h2>Upload {documentTypes[documentType]}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="upload-info">
            <div className="document-requirements">
              <h4>Upload Requirements:</h4>
              <ul>
                <li>File size: Maximum 10MB</li>
                <li>Allowed formats: {allowedTypes[documentType]?.join(', ') || 'All common formats'}</li>
                <li>Ensure document is clear and legible</li>
                <li>File name should be descriptive</li>
              </ul>
            </div>
          </div>

          <div 
            className="upload-area"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept={allowedTypes[documentType]?.join(',')}
              style={{ display: 'none' }}
            />
            
            {!file ? (
              <div className="upload-placeholder">
                <div className="upload-icon">📁</div>
                <p>Click to select or drag and drop your file here</p>
                <small>Supported formats: {allowedTypes[documentType]?.join(', ') || 'All common formats'}</small>
              </div>
            ) : (
              <div className="file-preview">
                <div className="file-info">
                  <div className="file-icon">📄</div>
                  <div className="file-details">
                    <h4>{file.name}</h4>
                    <p>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={removeFile}>
                  Remove
                </button>
              </div>
            )}
          </div>

          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="progress-text">{progress}% Uploading...</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;