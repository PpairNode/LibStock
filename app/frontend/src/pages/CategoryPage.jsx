import React, { useState, useEffect } from "react";
import axios from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import "./AddItemPage.css"; // Reuse the same styling

const AddCategoryPage = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await axios.post("/api/category/add", { name });
      setSuccess("Category added successfully.");
      const res = await axios.get("/api/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Error submitting category:", err.message);
      setError(`Failed to add category: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await axios.delete("/api/category/delete", {
        data: { id: itemId },
      });

      // Remove item from local state
      setCategories((prevItems) => prevItems.filter((cat) => cat._id !== itemId));
    } catch (error) {
      console.error("Error deleting category:", error.message);
      setError("Failed to delete category.");
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/api/categories");
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to fetch user info", err.message);
        navigate('/error')
      }
    };

    fetchCategories();
  }, [navigate]);

  return (
    <div className="dashboard-container">
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      
      <div style={{ /*display: "flex", justifyContent: "space-between", alignItems: "center" */ marginBottom: "1rem" }}>
        <h2>Manage Categories</h2><br/>
        <form onSubmit={handleSubmit} className="item-form-grid">
            <label htmlFor="name">Name*</label>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <button type="submit">Add Category</button>
        </form>
      </div>



      <div className="table-wrapper">
        <table className="item-table">
          <thead>
              <tr>
              <th>Category</th>
              <th>Delete</th>
              </tr>
          </thead>
          <tbody>
              {categories.map((cat, idx) => (
              <tr
                  key={idx}
                  style={{ cursor: "pointer", backgroundColor: "white" }}
              >
                  <td>{cat.name}</td>
                  {/* DELETE button */}
                  <td>
                  <button
                      onClick={(e) => {
                      e.stopPropagation(); // prevent row click
                      handleDelete(cat._id);
                      }}
                      className="delete-button"
                  >
                      Delete
                  </button>
                  </td>
              </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AddCategoryPage;
