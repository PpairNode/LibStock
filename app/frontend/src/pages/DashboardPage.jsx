// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig";
import "./DashboardPage.css";



const requiredColumns = ["name", "category", "value", "item_date"];
const optionalColumns = [
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
  const [error, setError] = useState(null);

  const [visibleColumns, setVisibleColumns] = useState(
    optionalColumns.map((col) => col.key) // tick all optional by default
  );

  const handleCheckboxChange = (key) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get("/api/items");
        setItems(response.data);
      } catch (err) {
        setError("Could not load items");
      }
    };

    fetchItems();
  }, []);

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
        }
      }
    };

    fetchDashboard();
  }, []);


  return (
    <div className="dashboard-container">
      <h2>Dashboard | <strong>{message}</strong> (logged in as: {username})</h2>

      <div className="column-selector">
        <h4>Show optional columns:</h4>
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
        <div className="table-wrapper">
          <table className="item-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Value</th>
                <th>Item Date</th>
                {optionalColumns.map(
                  (col) =>
                    visibleColumns.includes(col.key) && <th key={col.key}>{col.label}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

};

export default DashboardPage;
