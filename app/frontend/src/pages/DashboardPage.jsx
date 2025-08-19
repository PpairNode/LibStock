// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axiosConfig";
import "./DashboardPage.css";



const requiredColumns = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "value", label: "Value" },
  { key: "item_date", label: "Item Date" },
];
const optionalColumns = [
  { key: "possessor", label: "Possessor" },
  { key: "description", label: "Description" },
  { key: "tags", label: "Tags" },
  { key: "location", label: "Location" },
  { key: "creator", label: "Creator" },
  { key: "condition", label: "Condition" },
  { key: "creation_date", label: "Created" },
  { key: "image_path", label: "Image" },
  { key: "comment", label: "Comment" },
];


const DashboardPage = () => {
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");

  const [items, setItems] = useState([]);
  const [error] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);

  const navigate = useNavigate();
  
  const handleDelete = async (itemId) => {
    // This is a prompting to confirm you want to delete. For now do not set
    // if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await axios.delete("/api/item/delete", {
        data: { id: itemId },
      });

      // Remove item from local state
      setItems((prevItems) => prevItems.filter((item) => item._id !== itemId));
    } catch (error) {
      console.error("Error deleting item:", error.message);
      alert("Failed to delete item.");
    }
  };

  // const handleUpdate = (item) => {
  //   navigate(`/item/update/${item._id}`, { state: { item } });
  // };

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
        const response = await axios.get("/api/items");
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
          navigate("/error");
        }
      }
    };

    fetchItems();
  }, [navigate]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get("/api/dashboard");
        setMessage(response.data.message);
        setUsername(response.data.username);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          window.location.href = "/login";
        } else {
          console.error("Error fetching dashboard:", error.message);
          navigate("/error");
        }
      }
    };

    fetchDashboard();
  }, [navigate]);
  


  return (
    <div className="dashboard-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Dashboard | <strong>{message}</strong> (logged in as: {username})</h2>
        <div className="button-group">
            <Link to="/item/add" className="nav-button">Add Item</Link>
            <Link to="/category/add" className="nav-button">Add Category</Link>
        </div>
      </div>

      <div className="column-selector">
        <strong>Optional columns </strong>
        {optionalColumns.map((col) => (
          <button
            key={col.key}
            className={`toggle-btn ${visibleColumns.includes(col.key) ? "active" : ""}`}
            onClick={() => handleCheckboxChange(col.key)}
          >
            {col.label}
          </button>
        ))}
      </div>

      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div style={{ flex: "0 0 70%" }}>
            <div className="table-wrapper">
              <table className="item-table">
                <thead>
                  <tr>
                    {requiredColumns.map(
                      (col) => <th key={col.key}>{col.label}</th>
                    )}
                    {optionalColumns.map(
                      (col) =>
                        visibleColumns.includes(col.key) && <th key={col.key}>{col.label}</th>
                    )}
                    <th>Delete</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr 
                      key={idx}
                      onClick={() => setSelectedItem(item)}
                      style={{ cursor: "pointer", backgroundColor: selectedItem === item ? "#f0f0f0" : "white" }}
                    >
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>${item.value}</td>
                      <td>{item.item_date?.slice(0, 10)}</td>
                      {optionalColumns.map(
                      (col) =>
                        visibleColumns.includes(col.key) && (
                          <td key={col.key}>
                            {col.key === "tags"
                              ? item[col.key]?.join(", ")
                              : col.key === "image_path"
                              ? (
                                  <img
                                    src={item[col.key]}
                                    alt="Item"
                                    width="50"
                                    style={{ borderRadius: "4px" }}
                                  />
                                )
                              : item[col.key]}
                          </td>
                        )
                      )}
                      {/* DELETE button */}
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // prevent row click
                            handleDelete(item._id);
                          }}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </td>

                      {/* UPDATE button */}
                      <td>
                        <Link to={`/item/update/${item._id}`} className="update-button" role="button">
                          Update
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            style={{
              flex: "0 0 30%",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "1rem",
              minHeight: "300px",
            }}
          >
            {selectedItem ? (
              <>
                <h3>Item Details</h3>
                <p><strong>Name:</strong> {selectedItem.name}</p>
                <p><strong>Description:</strong> {selectedItem.description}</p>
                <p><strong>Category:</strong> {selectedItem.category}</p>
                <p><strong>Value:</strong> ${selectedItem.value}</p>
                <p><strong>Date:</strong> {selectedItem.item_date}</p>
                <p><strong>Location:</strong> {selectedItem.location}</p>
                <p><strong>Creator:</strong> {selectedItem.creator}</p>
                <p><strong>Possessor:</strong> {selectedItem.possessor}</p>
                <p><strong>Tags:</strong> {selectedItem.tags?.join(", ")}</p>
                <p><strong>Comment:</strong> {selectedItem.comment}</p>
                <p><strong>Condition:</strong> {selectedItem.condition}</p>
                {selectedItem.image_path && (
                  <img src={selectedItem.image_path} alt="Item" style={{ maxWidth: "100%", marginTop: "1rem" }} />
                )}
              </>
              ) : (
              <p style={{ color: "#888", fontStyle: "italic" }}>
                No item selected. Click a row to view details.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

};

export default DashboardPage;
