import React, { useState, useEffect } from "react";
import axios from "../api/axiosConfig";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import "./AddItemPage.css";
import "./DashboardPage.css";
import "../components/Form.css";


const AddItemPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const today = new Date().toISOString().split("T")[0];
  const { containerId } = useParams();
  const [categories, setCategories] = useState([]);
  const initialFormData = {
    owner: "",
    name: "",
    serie: "",
    description: "",
    value: 0,
    date_created: today,
    location: "",
    creator: "",
    tags: "",
    category: "",
    comment: "",
    condition: "",
    number: 1,
    edition: "",
  };
  
  const [formData, setFormData] = useState(initialFormData);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [imageExtension, setImageExtension] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [container, setContainer] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle image selection and convert to base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    
    setLoading(true);
    setError(null);

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError(t('invalid_image_type'));
      setLoading(false);
      return;
    }

    // Validate file size (16MB max)
    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
      setError(t('image_too_large'));
      setLoading(false);
      return;
    }

    try {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        
        setImageData(base64String);
        setImageExtension(extension);
        setImagePreview(reader.result);
        
        setSuccess(t('image_loaded'));
        setLoading(false);
      };
      
      reader.onerror = (error) => {
        setError(t('image_load_failed'));
        setLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      setError(t('image_load_failed'));
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const itemToSend = {
      ...formData,
      creation_date: new Date().toISOString(),
      tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      // Include base64 image data if present
      image_data: imageData,
      image_extension: imageExtension,
    };

    try {
      await axios.post(`/container/${containerId}/item/add`, itemToSend);
      setSuccess(t('item_added_success'));
      
      // Reset form
      setFormData({
        ...initialFormData,
        owner: formData.owner,
        category: formData.category,
      });
      
      // Reset image
      setImageData(null);
      setImageExtension(null);
      setImagePreview(null);
      
      // Reset file input
      const fileInput = document.getElementById('image');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error("Error submitting item:", err.message);
      setError(`${t('item_add_failed')}: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleRemoveImage = () => {
    setImageData(null);
    setImageExtension(null);
    setImagePreview(null);
    setSuccess(null);
    
    // Reset file input
    const fileInput = document.getElementById('image');
    if (fileInput) fileInput.value = '';
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/user");
        const username = res.data.username;
        setFormData((prev) => ({ ...prev, owner: username }));
      } catch (err) {
        console.error("Failed to fetch user info", err.message);
        navigate('/error');
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`/container/${containerId}/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to fetch categories", err.message);
        navigate('/error');
      }
    };

    fetchCategories();
  }, [containerId, navigate]);

  useEffect(() => {
    const fetchContainer = async () => {
      try {
        const res = await axios.get(`/container/${containerId}`);
        setContainer(res.data);
      } catch (err) {
        console.error("Error fetching container:", err.message);
      }
    };
    fetchContainer();
  }, [containerId]);


  return (
    <div className="container">
      <h2>{t('add_new_item_text')} <span style={{ color: "grey" }}>({t('containers_text')}: {container?.name || containerId})</span></h2>
      <form onSubmit={handleSubmit} className="item-form-grid">
        <div className="form-group">
          <div className="form-row">
            <label htmlFor="owner">{t('item_owner')}*</label>
            <input id="owner" name="owner" value={formData.owner || ""} style={{ backgroundColor: "#f0f0f0" }} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <label htmlFor="name">{t('item_name')}*</label>
            <input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <label htmlFor="serie">{t('item_serie')}</label>
            <input id="serie" name="serie" value={formData.serie} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="description">{t('item_description')}</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="value">{t('item_value')}*</label>
            <input id="value" name="value" type="number" step="0.01" value={formData.value} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <label htmlFor="date_created">{t('item_date_created')}*</label>
            <input id="date_created" name="date_created" type="date" value={formData.date_created} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="location">{t('item_location')}</label>
            <input id="location" name="location" value={formData.location} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="creator">{t('item_creator')}</label>
            <input id="creator" name="creator" value={formData.creator} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="tags">{t('item_tags')}</label>
            <input id="tags" name="tags" value={formData.tags} onChange={handleChange} placeholder={t('tags_placeholder')} />
          </div>

          <div className="form-row">
            <label htmlFor="category">{t('item_category')}*</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">-- {t('item_category_select')} --</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="comment">{t('item_comment')}</label>
            <textarea id="comment" name="comment" value={formData.comment} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="condition">{t('item_condition')}</label>
            <select id="condition" name="condition" value={formData.condition} onChange={handleChange}>
              <option value="">-- {t('item_condition_select')} --</option>
              <option value="New">{t('item_condition_value_new')}</option>
              <option value="Very Good">{t('item_condition_value_very_good')}</option>
              <option value="Good">{t('item_condition_value_good')}</option>
              <option value="Used">{t('item_condition_value_used')}</option>
              <option value="Damaged">{t('item_condition_value_damaged')}</option>
              <option value="Heavily Damaged">{t('item_condition_value_heavily_damaged')}</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="number">{t('item_number')}</label>
            <input id="number" name="number" type="number" value={formData.number} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="edition">{t('item_edition')}</label>
            <input id="edition" name="edition" value={formData.edition} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="image">{t('item_image')}</label>
            <input 
              type="file" 
              id="image" 
              name="image" 
              accept="image/png,image/jpeg,image/jpg,image/gif" 
              onChange={handleImageChange}
            />
            {loading && <p>{t('loading_image')}...</p>}
            {imagePreview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <span style={{ fontSize: '14px' }}>{t('image_ready')}</span>
                <button 
                  type="button" 
                  onClick={handleRemoveImage}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🗑️ {t('remove_image')}
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="nav-button" disabled={loading}>
            {loading ? t('loading') : t('add_text')}
          </button>

          {/* LOG Section */}
          {(error || success) && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6'
            }}>
              {t('log')}
              {error && <p style={{ color: "#dc3545", margin: '5px 0', fontSize: '14px' }}>{error}</p>}
              {success && <p style={{ color: "#28a745", margin: '5px 0', fontSize: '14px' }}>{success}</p>}
            </div>
          )}
        </div>
      </form>

      {/* Image preview OUTSIDE the form-group */}
      {imagePreview && (
        <div style={{ 
          marginTop: '5px',
          padding: '5px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#495057' }}>
            {t('image_preview')}
          </h3>
          <img 
            src={imagePreview} 
            alt="Preview"
            style={{ 
              maxWidth: '200px', 
              maxHeight: '200px', 
              objectFit: 'contain',
              border: '2px solid #dee2e6',
              borderRadius: '8px',
              padding: '5px',
              backgroundColor: 'white'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AddItemPage;