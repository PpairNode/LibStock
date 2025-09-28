import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";
import "./AddItemPage.css";
import "../components/Form.css";
import { useTranslation } from 'react-i18next';


const EditItemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const today = new Date().toISOString().split("T")[0];
  
  const { containerId, id: itemId } = useParams();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    value: 0,
    date_created: today,
    location: "",
    creator: "",
    tags: "",
    image: null,
    image_path: "",
    category: "",
    comment: "",
    condition: "",
    owner: "",
    number: 1,
    edition: "",
  });
  const [error, setError] = useState(null);
  const [, setSuccess] = useState(null);
  const [uploading, setUploading] = useState(false);

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
          image: null,
          category: item.category || "",
          comment: item.comment || "",
          condition: item.condition || "",
          owner: item.owner || "",
          number: item.number || 1,
          edition: item.edition || "",
        });
      } catch (err) {
        console.error("Error fetching item for update:", err.message);
        navigate("/error");
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await axios.get("/categories");
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err.message);
        navigate("/error");
      }
    };

    fetchItem();
    fetchCategories();
  }, [id, navigate, today]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image selection and immediate upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formDataImg = new FormData();
    formDataImg.append("image", file);

    try {
      const response = await axios.post("/upload/image", formDataImg, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormData((prev) => ({
        ...prev,
        image: file,
        image_path: response.data.image_path,
      }));

      setSuccess("Image uploaded successfully.");
    } catch (err) {
      console.error("Image upload failed:", err);
      setError("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedItem = {
      ...formData,
      tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      image_path: formData.image_path
    };

    try {
      await axios.post(`/container/${containerId}/item/update/${id}`, updatedItem);
      navigate("/dashboard");
    } catch (err) {
      console.error("Update failed:", err.message);
      setError("Failed to update item.");
    }
  };

  return (
    <div className="container">
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>{t('edit_item_text')}</h2>
      <form onSubmit={handleSubmit} className="item-form-grid">
        <div className="form-group">
          <div className="form-row">
            <label htmlFor="owner">{t('item_owner')}</label>
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
            <input id="value" name="value" type="number" value={formData.value} onChange={handleChange} required />
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
            <input id="tags" name="tags" value={formData.tags} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="category">{t('item_category')}*</label>
            <select id="category" name="category" value={formData.category} onChange={handleChange} required>
              <option value="">-- {t('item_category_select')} --</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat.name}>{cat.name}</option>
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
            <input type="file" id="image" name="image" accept="image/*" onChange={handleImageChange} />
            {uploading && <p>{t('uploading')}...</p>}
            {formData.image_path && <p>✅ {t('uploaded')}</p>}
          </div>

          <button type="submit" className="nav-button">{t('edit_text')}</button>
        </div>
      </form>
    </div>
  );
};

export default EditItemPage;
