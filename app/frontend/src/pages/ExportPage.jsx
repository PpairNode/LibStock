import React, { useState, useEffect } from 'react';
import axios from "../api/axiosConfig";
import { useTranslation } from 'react-i18next';
import './ExportPage.css';



function ExportPage() {
  const { t } = useTranslation();
  const [containers, setContainers] = useState([]);
  const [selectedContainers, setSelectedContainers] = useState([]);
  const [includeImages, setIncludeImages] = useState(true);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    try {
      const response = await axios.get('/containers');
      setContainers(response.data);
    } catch (err) {
      setError('Failed to load containers');
    }
  };

  const handleCheckboxChange = (containerId) => {
    setSelectedContainers(prev => 
      prev.includes(containerId)
        ? prev.filter(id => id !== containerId)
        : [...prev, containerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContainers.length === containers.length) {
      setSelectedContainers([]);
    } else {
      setSelectedContainers(containers.map(c => c._id));
    }
  };

  const loadPreview = async () => {
    if (selectedContainers.length === 0) {
      setError('Please select at least one container');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/export/preview', {
        container_ids: selectedContainers
      });
      setPreview(response.data.containers);
    } catch (err) {
      setError('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (selectedContainers.length === 0) {
      setError('Please select at least one container');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/export/containers', {
        container_ids: selectedContainers,
        include_images: includeImages
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `libstock_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      alert('Export successful!');
    } catch (err) {
      setError('Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-page">
      <h1>{t('export') || 'Export Containers'}</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="export-options">
        <h2>{t('selection')} {t('containers_text')}</h2>
        
        <div className="select-all">
          <label>
            <input
              type="checkbox"
              checked={selectedContainers.length === containers.length && containers.length > 0}
              onChange={handleSelectAll}
            />
            {t('select_all')}
          </label>
        </div>

        <div className="containers-list">
          {containers.map(container => (
            <div key={container._id} className="container-item">
              <label>
                <input
                  type="checkbox"
                  checked={selectedContainers.includes(container._id)}
                  onChange={() => handleCheckboxChange(container._id)}
                />
                {container.name}
              </label>
            </div>
          ))}
        </div>

        <div className="export-settings">
          <label>
            <input
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
            />
            {t('include_images') || 'Include images (increases file size)'}
          </label>
        </div>

        <div className="action-buttons">
          <button 
            onClick={loadPreview} 
            disabled={loading || selectedContainers.length === 0}
            className="preview-button"
          >
            {loading ? t('loading') || 'Loading...' : t('preview') || 'Preview Export'}
          </button>
          
          <button 
            onClick={handleExport} 
            disabled={loading || selectedContainers.length === 0}
            className="export-button"
          >
            {loading ? t('exporting') || 'Exporting...' : t('export') || 'Export'}
          </button>
        </div>
      </div>

      {preview && (
        <div className="export-preview">
          <h2>{t('export_preview') || 'Export Preview'}</h2>
          <table>
            <thead>
              <tr>
                <th>{t('container_name') || 'Container'}</th>
                <th>{t('categories') || 'Categories'}</th>
                <th>{t('items') || 'Items'}</th>
                <th>{t('size') || 'Size (MB)'}</th>
              </tr>
            </thead>
            <tbody>
              {preview.map(container => (
                <tr key={container.id}>
                  <td>{container.name}</td>
                  <td>{container.categories_count}</td>
                  <td>{container.items_count}</td>
                  <td>{container.total_size_mb}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="preview-total">
            <strong>{t('total') || 'Total'}:</strong> {preview.reduce((sum, c) => sum + c.total_size_mb, 0).toFixed(2)} MB
          </div>
        </div>
      )}
    </div>
  );
}

export default ExportPage;