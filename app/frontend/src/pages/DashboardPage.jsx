// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { getConditionLabel } from '../utils/TranslationHelper';
import axios from "../api/axiosConfig";
import "./DashboardPage.css";
import getPublicImageUrl from "../utils/Media";
import ImageLightbox from "../components/ImageLightbox";





const DashboardPage = () => {
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return localStorage.getItem("selectedCategory") || t('selected_category_all');
  });
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(() => {
    return localStorage.getItem("selectedContainer") || null;
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
      await axios.delete(`/container/${selectedContainer}/item/delete/${itemId}`);

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

  // Storing in localStorage
  useEffect(() => {
    if (selectedContainer) {
      localStorage.setItem("selectedContainer", selectedContainer);
    }
  }, [selectedContainer]);

  useEffect(() => {
    localStorage.setItem("visibleColumns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const handleCheckboxChange = (key) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Fetch items
  useEffect(() => {
    if (!selectedContainer) return;

    const fetchItems = async () => {
      console.log("Fetching items...");
      try {
        const response = await axios.get(`/container/${selectedContainer}/items`);
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
          console.error("Error fetching items:", error.message);
          setSelectedContainer(null);
        }
      }
    };

    fetchItems();
  }, [selectedContainer, navigate]);

  // Fetch categories
  useEffect(() => {
    if (!selectedContainer) return;

    const fetchCategories = async () => {
      try {
        const response = await axios.get(`/container/${selectedContainer}/categories`);
        if (!Array.isArray(response.data)) {
          console.error("Expected an array but got:", response.data);
          setCategories([]);
          return;
        }

        const categoryNames = response.data.map(cat => cat.name);
        if (categoryNames.length > 0) {
          setCategories([t('selected_category_all'), ...categoryNames]);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error.message);
        setSelectedContainer(null);
        setCategories([]);
      }
    };

    fetchCategories();
  }, [selectedContainer, navigate, t]);

  // Fetch containers one time
  useEffect(() => {
    const fetchContainers = async () => {
      try {
        const response = await axios.get("/containers");
        if (!Array.isArray(response.data)) {
          console.error("Expected an array but got:", response.data);
          navigate("/error", {
            state: {
              message: `Error fetching containers: Expected an array but got ${typeof response.data}`
            }
          });
          return;
        }

        setContainers(response.data.map(container => ({
          id: container._id,
          name: container.name
        })));

        // Check if saved containers still exists and if not, delete them from localstorage 
        const savedContainerId = localStorage.getItem("selectedContainer");
        if (savedContainerId) {
          const containerExists = response.data.some(c => c._id === savedContainerId);
          if (!containerExists) {
            console.log("Saved container no longer exists, clearing selection");
            localStorage.removeItem("selectedContainer");
            localStorage.removeItem("selectedCategory");
            setSelectedContainer(null);
            setSelectedCategory(null);
          }
        }

      } catch (error) {
        console.error("Error fetching containers:", error.message);
        navigate("/error", { state: { message: `Error fetching containers: ${error.message}` }});
      }
    };

    fetchContainers();
  }, [navigate]);

  const handleContainerChange = (e) => {
    const value = e.target.value;
    setSelectedContainer(value);
    setSelectedCategory(t('selected_category_all'));
  };
  
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === t('selected_category_all') || item.category === selectedCategory;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      item.name?.toLowerCase().includes(search) ||
      item.creator?.toLowerCase().includes(search) ||
      item.owner?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search) ||
      item.comment?.toLowerCase().includes(search) ||
      item.edition?.toLowerCase().includes(search) ||
      item.author?.toLowerCase().includes(search) ||
      item.condition?.toLowerCase().includes(search) ||
      item.location?.toLowerCase().includes(search) ||
      item.serie?.toLowerCase().includes(search) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(search)));

    return matchesCategory && matchesSearch;
  });

  const totalValue = filteredItems.reduce((sum, item) => {
    const value = parseFloat(item.value);
    const number = parseInt(item.number)
    return sum + (isNaN(value) ? 0 : value * number);
  }, 0);



  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>{t('dashboard')}</h2>
        <div className="button-group">
            <Link
              to={selectedContainer && categories.length > 0 ? `/container/${selectedContainer}/item` : "#"}
              className={`nav-button ${!selectedContainer || categories.length === 0 ? "disabled" : ""}`}
              onClick={(e) => {
                if (!selectedContainer || categories.length === 0) {
                  e.preventDefault(); // prevent navigation if no container or no categories
                }
              }}
            >
              <strong>{t('add_text')} {t('item_text')}</strong>
            </Link>
            <Link
              to={`/container/${selectedContainer}/category`}
              className={`nav-button ${!selectedContainer ? "disabled" : ""}`}
              onClick={(e) => {
                if (!selectedContainer) e.preventDefault(); // prevent navigation if no container
              }}
            >
              <strong>{t('categories_text')}</strong>
            </Link>
            <Link to="/container/" className="nav-button"><strong>{t('containers_text')}</strong></Link>
            <Link
              to="/export"
              className={`nav-button ${!selectedContainer ? "disabled" : ""}`}
              onClick={(e) => {
                if (!selectedContainer) e.preventDefault(); // prevent navigation if no container
              }}
            >
              <strong>{t('export')}</strong>
            </Link>
            <Link to="/import" className="nav-button"><strong>{t('import')}</strong></Link>
            <Link to="/summary" className="nav-button"><strong>{t('summary_text')}</strong></Link>
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
          <label htmlFor="categoryFilter">{t('containers_text')}</label>
          <select
            id="containerFilter"
            value={selectedContainer || ""}
            onChange={handleContainerChange}
          >
            <option value="" disabled>
              {t('container_selection_text')}
            </option>
            {containers.map((container) => (
              <option key={container.id} value={container.id}>
                {container.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="categoryFilter">{t('categories_text')}</label>
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
          <label htmlFor="categoryFilter">{t('search_text')}</label>
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
                        <Link to={`/container/${item.container_id}/item/update/${item._id}`} className="nav-button nav-button-small">O</Link>
                      </td>
                      <td className="actions-button" style={{ width: "30px" }}>
                        <button onClick={() => handleDelete(item._id)} className="delete-button">X</button>
                      </td>
                      {/* All other columns */}
                      <td><b>{item.name}</b></td>
                      <td>{item.category}</td>
                      <td><b>{item.value}</b>{t('currency')}</td>
                      <td>{item.date_added?.slice(0, 10)}</td>
                      {optionalColumns.map(
                      (col) =>
                        visibleColumns.includes(col.key) && (
                          <td key={col.key}>
                            {col.key === "tags"
                              ? item[col.key]?.join(", ")
                              : col.key === "image_path"
                              ? <img src={getPublicImageUrl(item[col.key])} alt="Item ICON" className="item-icon" />
                              : col.key === "condition"
                              ? getConditionLabel(item[col.key])
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
                <p><strong>{t('item_condition')}:</strong> {getConditionLabel(selectedItem.condition)}</p>
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
