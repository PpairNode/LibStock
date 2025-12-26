import React, { useState, useEffect, useRef } from "react";
import axios from "../api/axiosConfig";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import "./DashboardPage.css";
import "./AddItemPage.css";
import "../components/Form.css";

const AddCategoryPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const inputRef = useRef(null);


  const { containerId } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await axios.post(`/container/${containerId}/category/add`, { name });
      setSuccess("Category added successfully.");
      const res = await axios.get(`/container/${containerId}/categories`);
      setCategories(res.data);
      setName("")
    } catch (err) {
      console.error("Error submitting category:", err.message);
      setError(`Failed to add category: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/container/${containerId}/category/delete/${id}`);

      // Remove item from local state
      setCategories((prevItems) => prevItems.filter((cat) => cat._id !== id));
    } catch (error) {
      console.error("Error deleting category:", error.message);
      setError("Failed to delete category.");
    }
  };

  const handleUpdate = async (id) => {
    try {
      await axios.post(`/container/${containerId}/category/update/${id}`, {
        name: editName,
      });

      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === id ? { ...cat, name: editName } : cat
        )
      );

      setEditingId(null); // exit edit mode
      setEditName("");
    } catch (error) {
      console.error("Error updating category:", error.message);
      setError("Failed to update category.");
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`/container/${containerId}/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to fetch user info", err.message);
        navigate('/error')
      }
    };

    fetchCategories();
  }, [navigate]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);


  return (
    <div className="container">
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      
      <div style={{ marginBottom: "1rem" }}>
        <h2>{t('category_head_text')}</h2><br/>
        <form onSubmit={handleSubmit} className="item-form-grid">
          <div className="form-group">
            <div className="form-row">
              <label htmlFor="name">{t('category_name')}*</label>
              <input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="nav-button">{t('add_text')}</button>
          </div>
        </form>
      </div>

      <div className="table-wrapper">
        <table className="item-table">
          <thead>
              <tr style={{ backgroundColor: "#f0f4f8" }}>
              <th>{t('delete_text')}</th>
              <th>{t('update_text')}</th>
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


                  {/* UPDATE BUTTON */}
                  <td>
                    {editingId === cat._id ? (
                      <button className="nav-button nav-button-small" onClick={() => handleUpdate(cat._id)}>Save</button>
                    ) : (
                      <button
                        className="nav-button nav-button-small"
                        onClick={() => {
                          setEditingId(cat._id);
                          setEditName(cat.name);
                        }}
                      >
                        {t('update_text')}
                      </button>
                    )}
                  </td>
                  
                  {/* NAME CELL */}
                  <td>
                    {editingId === cat._id ? (
                      <input
                        ref={inputRef}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate(cat._id);
                        }}
                      />
                    ) : (
                      cat.name
                    )}
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
