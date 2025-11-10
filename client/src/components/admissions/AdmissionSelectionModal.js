import React, { useState } from 'react';
import './AdmissionSelectionModal.css';

const AdmissionSelectionModal = ({ offers, onSelect, onClose }) => {
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedOffer) {
      alert('Please select an admission offer to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSelect(selectedOffer);
    } catch (error) {
      console.error('Error selecting admission:', error);
      alert('There was an error processing your selection. Please try again.');
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
          <h2>Multiple Admission Offers</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="selection-info">
            <p className="info-message">
              Congratulations! You have been admitted to multiple institutions. 
              Please select one offer to accept. Once you make your selection, 
              you will be automatically removed from other institutions' admission lists.
            </p>
            
            <div className="selection-note">
              <strong>Important:</strong> Your selection will open spots for students on waiting lists.
            </div>
          </div>

          <div className="offers-list">
            {offers.map((offer, index) => (
              <div 
                key={offer.id}
                className={`offer-card ${selectedOffer === offer.id ? 'selected' : ''}`}
                onClick={() => setSelectedOffer(offer.id)}
              >
                <div className="offer-radio">
                  <input
                    type="radio"
                    name="admissionOffer"
                    checked={selectedOffer === offer.id}
                    onChange={() => setSelectedOffer(offer.id)}
                    id={`offer-${index}`}
                  />
                  <label htmlFor={`offer-${index}`}></label>
                </div>
                
                <div className="offer-content">
                  <h3>{offer.course?.name || 'Unknown Course'}</h3>
                  <p className="institution-name">{offer.institution?.name || 'Unknown Institution'}</p>
                  
                  <div className="offer-details">
                    <div className="detail-item">
                      <span className="label">Course Duration:</span>
                      <span className="value">{offer.course?.duration || 'N/A'} years</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Faculty:</span>
                      <span className="value">{offer.course?.facultyName || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Fees:</span>
                      <span className="value">M{offer.course?.fees || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Admitted On:</span>
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
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={!selectedOffer || isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Confirm Selection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdmissionSelectionModal;