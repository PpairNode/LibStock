import React, { useState, useEffect } from "react";
import axios from "../api/axiosConfig";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import "./DashboardPage.css";
import "./AddItemPage.css";
import "../components/Form.css";

const AddContainerPage = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [containers, setContainers] = useState([]);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await axios.post("/container/add", { name });
      setSuccess("Container added successfully.");
      const res = await axios.get("/containers");
      setContainers(res.data);
      setName("");
    } catch (err) {
      console.error("Error submitting container:", err.message);
      setError(`Failed to add container: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/container/delete/${id}`)

      // Remove item from local state
      setContainers((prevItems) => prevItems.filter((container) => container._id !== id));
      setSuccess(res.data.message);
      setError(null);
    } catch (error) {
      console.error("Error deleting container:", error.message);
      setError("Failed to delete container.");
    }
  };

  useEffect(() => {
    const fetchContainers = async () => {
      try {
        const res = await axios.get("/containers");
        setContainers(res.data);
      } catch (err) {
        console.error("Failed to fetch user info", err.message);
        navigate('/error')
      }
    };

    fetchContainers();
  }, [navigate]);

  return (
    <div className="container">
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      
      <div style={{ marginBottom: "1rem" }}>
        <h2>{t('container_head_text')}</h2><br/>
        <form onSubmit={handleSubmit} className="item-form-grid">
          <div className="form-group">
            <div className="form-row">
              <label htmlFor="name">{t('container_name')}*</label>
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
              <th>{t('container_text')}</th>
              </tr>
          </thead>
          <tbody>
              {containers.map((container, idx) => (
              <tr
                  key={idx}
                  style={{ cursor: "pointer", backgroundColor: "white" }}
              >
                {/* DELETE button */}
                {/* TODO: add a popup to be sure user wants to delete all objects */}
                <td style={{ width: "30px" }}>
                    <button
                        onClick={(e) => {
                        e.stopPropagation(); // prevent row click
                        handleDelete(container._id);
                        }}
                        className="delete-button"
                    >
                    X
                    </button>
                </td>
                <td>{container.name}</td>
              </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AddContainerPage;
