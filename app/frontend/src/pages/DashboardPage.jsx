// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import axios from "../api/axiosConfig";
import "./DashboardPage.css";
import getPublicImageUrl from "../utils/Media";
import ImageLightbox from "../components/ImageLightbox";





const DashboardPage = () => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");

  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return localStorage.getItem("selectedCategory") || t('selected_category_all');
  });
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  
  const requiredColumns = [
    { key: "name", label: t('item_name') },
    { key: "category", label: t('item_category') },
    { key: "value", label: t('item_value') },
    { key: "date_added", label: t('item_date_added') },
  ];
  const optionalColumns = [
    { key: "serie", label: t('item_serie') },
    { key: "owner", label: t('item_owner') },
    { key: "description", label: t('item_description') },
    { key: "tags", label: t('item_tags_simple') },
    { key: "location", label: t('item_location') },
    { key: "creator", label: t('item_creator') },
    { key: "condition", label: t('item_condition') },
    { key: "date_created", label: t('item_date_created') },
    { key: "image_path", label: t('item_image') },
    { key: "number", label: t('item_number') },
    { key: "edition", label: t('item_edition') },
  ];
  const navigate = useNavigate();
  
  const handleDelete = async (itemId) => {
    // This is a prompting to confirm you want to delete. For now do not set
    // if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await axios.delete("/item/delete", {
        data: { id: itemId },
      });

      // Remove item from local state
      setItems((prevItems) => prevItems.filter((item) => item._id !== itemId));

      // Reset if selected was the deleted object
      setSelectedItem((prevSelected) => {
        if (prevSelected?._id === itemId) {
          return null;
        }
        return prevSelected;
      });
    } catch (error) {
      console.error("Error deleting item:", error.message);
      setError(`Failed to delete item: ${error.response?.data?.error || error.message}`);
    }
  };

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem("visibleColumns");
    if (saved) {
      return JSON.parse(saved);
    }
    return optionalColumns.map((col) => col.key); // default: all optional columns visible
  });

  useEffect(() => {
    localStorage.setItem("visibleColumns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const handleCheckboxChange = (key) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  useEffect(() => {
    const fetchItems = async () => {
      console.log("Fetching items...")
      try {
        const response = await axios.get("/items");
        // Check if data is an array
        if (!Array.isArray(response.data)) {
          throw new Error("Invalid response format");
        }
        setItems(response.data);
      } catch (error) {
        const status = error.response?.status;
        if (status === 401) {
          console.error("User not authenticated");
          navigate("/login");
        } else {
          console.error("Error fetching dashboard columns:", error.message);
          navigate("/error", { state: { message: `Error fetching dashboard columns: ${error.message}` }});
        }
      }
    };

    fetchItems();
  }, [navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/categories");
        if (!Array.isArray(response.data)) {
          console.error("Expected an array but got:", response.data);
          navigate("/error", {
            state: {
              message: `Error fetching categories: Expected an array but got ${typeof response.data}`
            }
          });
          return;
        }

        const categoryNames = response.data.map(cat => cat.name);
        setCategories([t('selected_category_all'), ...categoryNames]);
      } catch (error) {
        console.error("Error fetching categories:", error.message);
        navigate("/error", { state: { message: `Error fetching categories: ${error.message}` }});
      }
    };

    fetchCategories();
  }, [navigate]);
  
  const filteredItems = items.filter((item) => {
    // Filter by category
    const matchesCategory = selectedCategory === t('selected_category_all') || item.category === selectedCategory;
    // Filter by search term
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      item.name?.toLowerCase().includes(search) ||
      item.creator?.toLowerCase().includes(search) ||
      item.owner?.toLowerCase().includes(search) ||
      item.date_created?.toLowerCase().includes(search) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(search)));

    return matchesCategory && matchesSearch;
  });

  const totalValue = filteredItems.reduce((sum, item) => {
    const value = parseFloat(item.value);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);



  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>{t('dashboard')}</h2>
        <div className="button-group">
            <Link to="/item/add" className="nav-button">{t('add_text')} {t('item_text')}</Link>
            <Link to="/category/add" className="nav-button">{t('add_text')} {t('item_category')}</Link>
        </div>
      </div>

      <div className="column-selector">
        {optionalColumns.map((col) => (
          <button
            key={col.key}
            className={`toggle-btn ${visibleColumns.includes(col.key) ? "active" : ""}`}
            onClick={() => handleCheckboxChange(col.key)}
          >
            <span className="fit-text">{col.label}</span>
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label htmlFor="categoryFilter">{t('category_text')}:</label>
          <select
            id="categoryFilter"
            value={selectedCategory}
            onChange={(e) => {
              const selected = e.target.value;
              setSelectedCategory(selected);
              localStorage.setItem("selectedCategory", selected);
            }}
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="search-group">
          <label htmlFor="categoryFilter">{t('search_text')}:</label>
          <input
            type="text"
            placeholder={t('search_bar_text')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="value-display">
          <div className="label">{t('total_value')}</div>
          <div className="value">{totalValue.toFixed(2)}{t('currency')}</div>
        </div>
      </div>

      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <div className="dashboard-layout">
          <div className="table-section">
            <div className="table-wrapper">
              <table className="item-table">
                <thead>
                  <tr style={{ backgroundColor: "#f0f4f8" }}>
                    <th style={{ width: "30px" }}>{t('action-update')}</th>
                    <th style={{ width: "30px" }}>{t('action-delete')}</th>
                    {requiredColumns.map(
                      (col) => <th key={col.key}>{col.label}</th>
                    )}
                    {optionalColumns.map(
                      (col) =>
                        visibleColumns.includes(col.key) && <th key={col.key}>{col.label}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems
                    .map((item, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedItem({...item})}
                      style={{ cursor: "pointer", backgroundColor: selectedItem === item ? "#000000" : "#ffffff" }}
                    >
                      {/* Actions column (update/delete) */}
                      <td className="actions-button" style={{ width: "30px" }}>
                        <Link to={`/item/update/${item._id}`} className="nav-button nav-button-small">O</Link>
                      </td>
                      <td className="actions-button" style={{ width: "30px" }}>
                        <button onClick={() => handleDelete(item._id)} className="delete-button">X</button>
                      </td>
                      {/* All other columns */}
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.value}{t('currency')}</td>
                      <td>{item.date_added?.slice(0, 10)}</td>
                      {optionalColumns.map(
                      (col) =>
                        visibleColumns.includes(col.key) && (
                          <td key={col.key}>
                            {col.key === "tags"
                              ? item[col.key]?.join(", ")
                              : col.key === "image_path"
                              ? <img src={getPublicImageUrl(item[col.key])} alt="Item ICON" className="item-icon" />
                              : col.key === "date_created"
                              ? item[col.key]?.slice(0, 10)
                              :
                              item[col.key]
                            }
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="details-section">
            {selectedItem ? (
              <>
                <h3 style={{ textAlign: "center" }}>{t('item_details')}</h3>
                <p><strong>{t('item_name')}:</strong> {selectedItem.name}</p>
                <p><strong>{t('item_serie')}:</strong> {selectedItem.serie}</p>
                <p><strong>{t('item_description')}:</strong> {selectedItem.description}</p>
                <p><strong>{t('item_category')}:</strong> {selectedItem.category}</p>
                <p><strong>{t('item_value')}:</strong> {selectedItem.value}{t('currency')}</p>
                <p><strong>{t('item_date_added')}:</strong> {selectedItem.date_added.slice(0, 10)}</p>
                <p><strong>{t('item_date_created')}:</strong> {selectedItem.date_created}</p>
                <p><strong>{t('item_location')}:</strong> {selectedItem.location}</p>
                <p><strong>{t('item_creator')}:</strong> {selectedItem.creator}</p>
                <p><strong>{t('item_owner')}:</strong> {selectedItem.owner}</p>
                <div>
                  <strong>{t('item_tags_simple')}:</strong>
                  <div className="tags-container">
                    {selectedItem.tags?.map((tag, index) => (
                      <span key={index} className="tag-pill">{tag}</span>
                    ))}
                  </div>
                </div>
                <p><strong>{t('item_comment')}:</strong> {selectedItem.comment}</p>
                <p><strong>{t('item_condition')}:</strong> {selectedItem.condition}</p>
                <p><strong>{t('item_number')}:</strong> {selectedItem.number}</p>
                <p><strong>{t('item_edition')}:</strong> {selectedItem.edition}</p>
                <ImageLightbox src={getPublicImageUrl(selectedItem.image_path)} alt={selectedItem.name || "Item image"} />
              </>
              ) : (
              <p style={{ color: "#888", fontStyle: "italic" }}>
                {t('no_item_selected')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

};

export default DashboardPage;
