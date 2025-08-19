import React, { useState } from "react";
import axios from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import "./AddItemPage.css"; // Reuse the same styling

const AddCategoryPage = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await axios.post("/api/category/add", { name });
      setSuccess("Category added successfully.");
      navigate("/dashboard"); // Or wherever you want to redirect
    } catch (err) {
      console.error("Error submitting category:", err.message);
      setError("Failed to add category.");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "1rem" }}>
      <h2>Add New Category</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit} className="item-form-grid">
        <div className="form-row">
          <label htmlFor="name">Name*</label>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div style={{ textAlign: "right", marginTop: "1rem" }}>
          <button type="submit">Add Category</button>
        </div>
      </form>
    </div>
  );
};

export default AddCategoryPage;
