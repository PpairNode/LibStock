import React, { useState } from 'react';
import axios from "../api/axiosConfig";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './ImportPage.css';

function ImportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [conflictStrategy, setConflictStrategy] = useState('rename');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/json') {
        setError('Please select a valid JSON file');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conflict_strategy', conflictStrategy);

    try {
      const response = await axios.post('/import/containers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      alert('Import successful!');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-page">
      <h1>{t('import')} {t('container_text')}</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="import-section">
        <h2>{t('select_file')}</h2>
        
        <div className="file-input-wrapper">
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            id="import-file"
          />
          <label htmlFor="import-file" className="file-label">
            {file ? file.name : (t('select_file'))}
          </label>
        </div>

        {file && (
          <div className="file-info">
            <p><strong>{t('file_selected')}:</strong> {file.name}</p>
            <p><strong>{t('file_size')}:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        <div className="conflict-strategy">
          <h3>{t('import_strategy')}</h3>
          <label>
            <input
              type="radio"
              value="skip"
              checked={conflictStrategy === 'skip'}
              onChange={(e) => setConflictStrategy(e.target.value)}
            />
            {t('import_strategy_skip')}
          </label>
          <label>
            <input
              type="radio"
              value="rename"
              checked={conflictStrategy === 'rename'}
              onChange={(e) => setConflictStrategy(e.target.value)}
            />
            {t('import_strategy_rename')}
          </label>
          <label>
            <input
              type="radio"
              value="replace"
              checked={conflictStrategy === 'replace'}
              onChange={(e) => setConflictStrategy(e.target.value)}
            />
            {t('import_strategy_replace')}
          </label>
        </div>

        <button 
          onClick={handleImport} 
          disabled={loading || !file}
          className="import-button"
        >
          {loading ? (t('importing')) : (t('import'))}
        </button>
      </div>

      {result && (
        <div className="import-result">
          <h2>{t('import_complete') || 'Import Complete'}</h2>
          <p><strong>{t('imported_containers') || 'Imported Containers'}:</strong></p>
          <ul>
            {result.imported_containers.map(container => (
              <li key={container.id}>
                <strong>{container.name}</strong>: {container.categories_count} categories, {container.items_count} items
              </li>
            ))}
          </ul>
          <p>{t('redirecting') || 'Redirecting to dashboard...'}</p>
        </div>
      )}
    </div>
  );
}

export default ImportPage;