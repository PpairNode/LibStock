import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";
import "./AddItemPage.css";
import "../components/Form.css";

const EditItemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    value: 0,
    item_date: today,
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
        const res = await axios.get(`/item/update/${id}`);
        const item = res.data;

        setFormData({
          name: item.name || "",
          description: item.description || "",
          value: item.value || 0,
          item_date: item.item_date?.slice(0, 10) || today,
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
      await axios.post(`/item/update/${id}`, updatedItem);
      navigate("/dashboard");
    } catch (err) {
      console.error("Update failed:", err.message);
      setError("Failed to update item.");
    }
  };

  return (
    <div className="container">
      <h2>Edit Item</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} className="item-form-grid">
        <div className="form-group">
          <div className="form-row">
            <label htmlFor="owner">Owner</label>
            <input id="owner" name="owner" value={formData.owner} onChange={handleChange} style={{ backgroundColor: "#f0f0f0" }} required />
          </div>

          <div className="form-row">
            <label htmlFor="name">Name*</label>
            <input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="value">Value*</label>
            <input id="value" name="value" type="number" value={formData.value} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <label htmlFor="item_date">Item Date*</label>
            <input id="item_date" name="item_date" type="date" value={formData.item_date} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="location">Location</label>
            <input id="location" name="location" value={formData.location} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="creator">Author/Inventor</label>
            <input id="creator" name="creator" value={formData.creator} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input id="tags" name="tags" value={formData.tags} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="category">Category*</label>
            <select id="category" name="category" value={formData.category} onChange={handleChange} required>
              <option value="">-- Select a Category --</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="comment">Comment</label>
            <textarea id="comment" name="comment" value={formData.comment} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="condition">Condition</label>
            <select id="condition" name="condition" value={formData.condition} onChange={handleChange}>
              <option value="">-- Select a Condition --</option>
              <option value="New">New</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Used">Used</option>
              <option value="Damaged">Damaged</option>
              <option value="Heavily Damaged">Heavily Damaged</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="number">Number</label>
            <input id="number" name="number" type="number" value={formData.number} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="edition">Edition</label>
            <input id="edition" name="edition" value={formData.edition} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label htmlFor="image">Image</label>
            <input type="file" id="image" name="image" accept="image/*" onChange={handleImageChange} />
            {uploading && <p>Uploading...</p>}
            {formData.image_path && <p>✅ Image uploaded</p>}
          </div>

          <button type="submit" className="form-button">Update Item</button>
        </div>
      </form>
    </div>
  );
};

export default EditItemPage;
