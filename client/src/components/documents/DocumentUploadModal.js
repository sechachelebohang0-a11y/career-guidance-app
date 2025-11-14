import React, { useState } from 'react';
// Remove this line: import './DocumentUpload.css';

const DocumentUpload = ({ onUploadComplete, allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'], maxSize = 5 * 1024 * 1024 }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload PDF, JPEG, or PNG files only');
      return;
    }

    if (file.size > maxSize) {
      alert(`File size should be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await fetch('/api/upload/document', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onUploadComplete(result);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const buttonStyle = {
    background: uploading ? '#6c757d' : '#007bff',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: uploading ? 'not-allowed' : 'pointer',
    display: 'inline-block',
    textAlign: 'center'
  };

  const progressBarStyle = {
    width: '100%',
    height: '4px',
    background: '#e9ecef',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '0.5rem'
  };

  const progressStyle = {
    height: '100%',
    background: '#007bff',
    width: `${progress}%`,
    transition: 'width 0.3s ease'
  };

  return (
    <div style={{ margin: '1rem 0' }}>
      <input
        type="file"
        id="document-upload"
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        disabled={uploading}
        style={{ display: 'none' }}
      />
      <label htmlFor="document-upload" style={buttonStyle}>
        {uploading ? `Uploading... ${progress}%` : 'Upload Document'}
      </label>
      {uploading && (
        <div style={progressBarStyle}>
          <div style={progressStyle}></div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;