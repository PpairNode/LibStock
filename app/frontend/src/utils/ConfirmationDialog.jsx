import React from 'react';
import { useTranslation } from 'react-i18next';
import './ConfirmationDialog.css';

const ConfirmDialog = ({ 
  show, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText,
  cancelText,
  confirmButtonClass = "confirm-button"
}) => {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-buttons">
          <button onClick={onConfirm} className={confirmButtonClass}>
            {confirmText || t('confirm_yes')}
          </button>
          <button onClick={onCancel} className="cancel-button">
            {cancelText || t('confirm_no')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;