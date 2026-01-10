import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";
import "./AddItemPage.css";
import "../components/Form.css";
import { useTranslation } from 'react-i18next';
import { getConditionLabel, CONDITIONS } from '../utils/TranslationHelper';
import getPublicImageUrl from "../utils/Media";


const EditItemPage = () => {
  const { containerId, id: itemId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const today = new Date().toISOString().split("T")[0];

  const [container, setContainer] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
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
    owner: "",
    number: 1,
    edition: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [imageExtension, setImageExtension] = useState(null);
  const [existingImagePath, setExistingImagePath] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch item data and categories on mount
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await axios.get(`/container/${containerId}/item/update/${itemId}`);
        const item = res.data;

        setFormData({
          name: item.name || "",
          serie: item.serie || "",
          description: item.description || "",
          value: item.value || 0,
          date_created: item.date_created?.slice(0, 10) || today,
          location: item.location || "",
          creator: item.creator || "",
          tags: item.tags?.join(", ") || "",
          category: item.category_id || "",
          comment: item.comment || "",
          condition: item.condition || "",
          owner: item.owner || "",
          number: item.number || 1,
          edition: item.edition || "",
        });

        // Load existing image preview
        if (item.image_path && item.image_path !== "not-image.png") {
          setExistingImagePath(item.image_path);
          setImagePreview(`${item.image_path}`);
        }
      } catch (err) {
        console.error("Full error object:", err);
        console.error("Error response:", err.response?.data);
        console.error("Error status:", err.response?.status);
        navigate("/error", { state: { message: `${t('error_fetching_item')}: ${err.response?.data?.message || err.message}` }});
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await axios.get(`/container/${containerId}/categories`);
        if (!Array.isArray(res.data)) {
          console.error("Expected an array but got:", res.data);
          setCategories([]);
          return;
        }
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err.message);
        setCategories([]);
      }
    };

    if (containerId && itemId) {
      fetchItem();
      fetchCategories();
    }
  }, [containerId, itemId, navigate, today, t]);

  // Fetch container metadata separately
  useEffect(() => {
    if (!containerId) return;

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image selection and convert to base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
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
        setExistingImagePath(null); // Clear existing image reference
        
        setSuccess(t('image_loaded'));
        setLoading(false);
      };
      
      reader.onerror = () => {
        setError(t('image_load_failed'));
        setLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Image loading failed:", err);
      setError(t('image_load_failed'));
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageData(null);
    setImageExtension(null);
    setImagePreview(null);
    setExistingImagePath(null);
    setSuccess(null);
    
    // Reset file input
    const fileInput = document.getElementById('image');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const updatedItem = {
      ...formData,
      tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
    };

    // Include new image if uploaded
    if (imageData) {
      updatedItem.image_data = imageData;
      updatedItem.image_extension = imageExtension;
    } else if (existingImagePath) {
      // Keep existing image
      updatedItem.image_path = existingImagePath;
    }

    try {
      await axios.post(`/container/${containerId}/item/update/${itemId}`, updatedItem);
      setSuccess(t('item_updated_success'));
      
      // Redirect after short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Update failed:", err.message);
      setError(`${t('item_update_failed')}: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="container">
      <h2>{t('edit_item_text')} <span style={{ color: "grey" }}>({t('containers_text')}: {container?.name || containerId})</span></h2>
      <form onSubmit={handleSubmit} className="item-form-grid">
        <div className="form-group">
          <div className="form-row">
            <label htmlFor="owner">{t('item_owner')}*</label>
            <input id="owner" name="owner" value={formData.owner} onChange={handleChange} style={{ backgroundColor: "#f0f0f0" }} required />
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
            <select id="category" name="category" value={formData.category} onChange={handleChange} required>
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
              {CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {getConditionLabel(condition)}
                </option>
              ))}
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
                  {t('remove_image')}
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="nav-button" disabled={loading}>
            {loading ? t('loading') : t('edit_text')}
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
            src={
              imagePreview.startsWith('data:') ? imagePreview : getPublicImageUrl(imagePreview)
            }
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

export default EditItemPage;