import React, { useState, useEffect } from "react";
import axios from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import "./AddItemPage.css";
import "./DashboardPage.css";
import "../components/Form.css";
import { DEFAULT_NOT_IMAGE_PATH } from "../utils/Const"


const AddItemPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const today = new Date().toISOString().split("T")[0];
  const [categories, setCategories] = useState([]);
  const initialFormData = {
    owner: "",
    name: "",
    description: "",
    value: 0,
    date_created: today,
    location: "",
    creator: "",
    tags: "",
    image: null,
    category: "",
    comment: "",
    condition: "",
    number: 1,
    edition: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploading, setUploading] = useState(false);

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
    setError(null);
    setSuccess(null);

    const itemToSend = {
      ...formData,
      creation_date: new Date().toISOString(),
      tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      image_path: formData.image_path || DEFAULT_NOT_IMAGE_PATH,
    };

    try {
      await axios.post("/item/add", itemToSend);
      setSuccess("Item added successfully.");
      setFormData({
      ...initialFormData,
      // Preserve few values
      owner: formData.owner,
      category: formData.category,
    });
    } catch (err) {
      console.error("Error submitting item:", err.message);
      setError(`Failed to add item: ${err.response?.data?.error || err.message}`);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("Fetching user...");
        const res = await axios.get("/user");
        const username = res.data.username;
        console.log("Fetched user:", username);
        setFormData((prev) => ({ ...prev, owner: username }));
      } catch (err) {
        console.error("Failed to fetch user info", err.message);
        navigate('/error')
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/categories");
        console.log("Categories:", res.data)
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to fetch user info", err.message);
        navigate('/error')
      }
    };

    fetchCategories();
  }, [navigate]);

  return (
    <div className="container">
      <h2>{t('add_new_item_text')}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit} className="item-form-grid">
        <div className="form-group">
          <div className="form-row">
              <label htmlFor="owner">{t('item_owner')}</label>
              <input id="owner" name="owner" value={formData.owner || ""}  style={{ backgroundColor: "#f0f0f0" }} onChange={handleChange} required />
          </div>

          <div className="form-row">
              <label htmlFor="name">{t('item_name')}*</label>
              <input id="name" name="name" value={formData.name} onChange={handleChange} required />
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
              <input id="date_created" name="date_created" type="date" value={formData.item_date} onChange={handleChange} />
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
              <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
              >
                  <option value="">-- {t('item_category_select')} --</option>
                  {categories.map((cat, idx) => (
                  <option key={idx} value={cat.name}>
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
            <input type="file" id="image" name="image" accept="image/*" onChange={handleImageChange} />
            {uploading && <p>{t('uploading')}...</p>}
            {formData.image_path && <p>✅ {t('uploaded')}</p>}
          </div>

          <button type="submit" className="nav-button">{t('add_text')}</button>
        </div>
      </form>
    </div>
  );
};

export default AddItemPage;
