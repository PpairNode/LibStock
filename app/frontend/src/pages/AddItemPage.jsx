import React, { useState, useEffect } from "react";
import axios from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import "./AddItemPage.css"

const AddItemPage = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const [categories, setCategories] = useState([]);


  const [formData, setFormData] = useState({
    possessor: "",
    name: "",
    description: "",
    value: 0,
    item_date: today,
    location: "",
    creator: "",
    tags: "",
    image_path: "",
    category: "",
    comment: "",
    condition: "",
    number: 1,
    edition: "",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const itemToSend = {
      ...formData,
      creation_date: new Date().toISOString(),
      tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
    };

    try {
      await axios.post("/api/item/add", itemToSend);
      setSuccess("Item added successfully.");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error submitting item:", err.message);
      setError("Failed to add item.");
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("Fetching user...");
        const res = await axios.get("/api/user");
        const username = res.data.username;
        console.log("Fetched user:", username);
        setFormData((prev) => ({ ...prev, possessor: username }));
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
        const res = await axios.get("/api/categories");
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
    <div style={{ maxWidth: "600px", margin: "auto", padding: "1rem" }}>
      <h2>Add New Item</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit} className="item-form-grid">
        <div className="form-row">
            <label htmlFor="possessor">Possessor</label>
            <input id="possessor" name="possessor" value={formData.possessor || ""}  style={{ backgroundColor: "#f0f0f0" }} onChange={handleChange} required />
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
            <label htmlFor="image_path">Image Path</label>
            <input id="image_path" name="image_path" value={formData.image_path} onChange={handleChange} />
        </div>

        <div className="form-row">
            <label htmlFor="category">Category*</label>
            <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
            >
                <option value="">-- Select a Category --</option>
                {categories.map((cat, idx) => (
                <option key={idx} value={cat.name}>
                    {cat.name}
                </option>
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

        <div style={{ textAlign: "right", marginTop: "1rem" }}>
            <button type="submit">Add Item</button>
        </div>
        </form>
    </div>
  );
};

export default AddItemPage;
