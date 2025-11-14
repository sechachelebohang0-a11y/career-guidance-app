// components/admissions/AdmissionSelectionModal.js
import React, { useState } from 'react';
import './AdmissionSelectionModal.css';

const AdmissionSelectionModal = ({ offers, onSelect, onClose }) => {
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!selectedOfferId) {
      alert('Please select an admission offer to accept.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSelect(selectedOfferId);
      // onSelect should handle closing the modal
    } catch (error) {
      console.error('Error in modal submission:', error);
      alert('Error processing selection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      }
      return new Date(timestamp).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content admission-selection-modal">
        <div className="modal-header">
          <h2>🎉 Select Your Admission Offer</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="selection-info">
            <p className="info-message">
              Congratulations! You have been admitted to multiple programs. Please choose one to accept.
            </p>
            
            <div className="important-note">
              <strong>Important:</strong> Selecting one offer will automatically decline all other applications and open spots for students on waiting lists.
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="offers-list">
              {offers.map((offer, index) => (
                <div 
                  key={offer.id} 
                  className={`offer-card ${selectedOfferId === offer.id ? 'selected' : ''}`}
                  onClick={() => setSelectedOfferId(offer.id)}
                >
                  <div className="offer-radio">
                    <input
                      type="radio"
                      id={`offer-${offer.id}`}
                      name="admissionOffer"
                      value={offer.id}
                      checked={selectedOfferId === offer.id}
                      onChange={(e) => setSelectedOfferId(e.target.value)}
                    />
                  </div>
                  
                  <div className="offer-content">
                    <label htmlFor={`offer-${offer.id}`} className="offer-title">
                      {offer.course?.name || 'Unknown Course'}
                    </label>
                    <p className="institution-name">{offer.institution?.name || 'Unknown Institution'}</p>
                    
                    <div className="offer-details">
                      <div className="detail-item">
                        <span className="label">Faculty:</span>
                        <span className="value">{offer.course?.facultyName || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Duration:</span>
                        <span className="value">{offer.course?.duration || 'N/A'} years</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Fees:</span>
                        <span className="value">M{offer.course?.fees || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Admitted on:</span>
                        <span className="value">{formatDate(offer.admittedAt)}</span>
                      </div>
                    </div>
                    
                    {offer.course?.description && (
                      <div className="course-description">
                        <p>{offer.course.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={!selectedOfferId || isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Accept Selected Offer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdmissionSelectionModal;