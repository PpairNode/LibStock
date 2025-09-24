import React, { useState, useEffect } from "react";
import axios from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import "./DashboardPage.css";
import "./AddItemPage.css";
import "../components/Form.css";

const AddCategoryPage = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [categories, setCategories] = useState([]);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await axios.post("/category/add", { name });
      setSuccess("Category added successfully.");
      const res = await axios.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Error submitting category:", err.message);
      setError(`Failed to add category: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await axios.delete("/category/delete", {
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
        const res = await axios.get("/categories");
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
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      
      <div style={{ marginBottom: "1rem" }}>
        <h2>{t('category_head_text')}</h2><br/>
        <form onSubmit={handleSubmit} className="item-form-grid">
          <div className="form-group">
            <label htmlFor="name">{t('category_name')}*</label>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <button type="submit" className="nav-button">{t('add_text')}</button>
          </div>
        </form>
      </div>

      <div className="table-wrapper">
        <table className="item-table">
          <thead>
              <tr>
              <th>{t('delete_text')}</th>
              <th>{t('category_text')}</th>
              </tr>
          </thead>
          <tbody>
              {categories.map((cat, idx) => (
              <tr
                  key={idx}
                  style={{ cursor: "pointer", backgroundColor: "white" }}
              >
                  {/* DELETE button */}
                  <td style={{ width: "30px" }}>
                  <button
                      onClick={(e) => {
                      e.stopPropagation(); // prevent row click
                      handleDelete(cat._id);
                      }}
                      className="delete-button"
                  >
                    X
                  </button>
                  </td>
                  <td>{cat.name}</td>
              </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AddCategoryPage;
