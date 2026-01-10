import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './SummaryPage.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const SummaryPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [containers, setContainers] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalValue, setTotalValue] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const generateColors = (count) => {
    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)',
      'rgba(83, 102, 255, 0.8)',
      'rgba(255, 99, 255, 0.8)',
      'rgba(99, 255, 132, 0.8)',
    ];
    return colors.slice(0, count);
  };

  const fetchSummaryData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all containers
      const containersRes = await axios.get('/containers');
      const containersData = containersRes.data;
      setContainers(containersData);

      const summary = [];
      let grandTotal = 0;
      let grandTotalItems = 0;

      // For each container, fetch items and calculate stats
      for (const container of containersData) {
        try {
          const itemsRes = await axios.get(`/container/${container._id}/items`);
          const items = itemsRes.data;

          const containerValue = items.reduce((sum, item) => sum + (item.value || 0), 0);
          const itemCount = items.length;

          // Group by category for this container
          const categoryValues = {};
          items.forEach(item => {
            const category = item.category || t('uncategorized');
            const value = item.value || 0;
            categoryValues[category] = (categoryValues[category] || 0) + value;
          });

          // Prepare chart data for this container
          let chartData = null;
          if (Object.keys(categoryValues).length > 0) {
            const sortedCategories = Object.entries(categoryValues)
              .sort((a, b) => b[1] - a[1]);

            const colors = generateColors(sortedCategories.length);

            chartData = {
              labels: sortedCategories.map(([category]) => category),
              datasets: [
                {
                  data: sortedCategories.map(([, value]) => value),
                  backgroundColor: colors,
                  borderColor: 'white',
                  borderWidth: 2,
                },
              ],
            };
          }

          summary.push({
            id: container._id,
            name: container.name,
            itemCount: itemCount,
            totalValue: containerValue,
            categoryCount: Object.keys(categoryValues).length,
            chartData: chartData
          });

          grandTotal += containerValue;
          grandTotalItems += itemCount;
        } catch (err) {
          console.error(`Error fetching items for container ${container._id}:`, err);
        }
      }

      setSummaryData(summary);
      setTotalValue(grandTotal);
      setTotalItems(grandTotalItems);
    } catch (err) {
      console.error('Error fetching summary data:', err);
      setError(t('error_loading_summary'));
    } finally {
      setLoading(false);
    }
  };

  const handleContainerClick = (containerId) => {
    navigate(`/dashboard?container=${containerId}`);
  };

  if (loading) {
    return (
      <div className="summary-page">
        <div className="loading-message">{t('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="summary-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="summary-page">
      <div className="summary-header">
        <h1>{t('summary_title')}</h1>
        <div className="summary-totals">
          <div className="total-card">
            <span className="total-label">{t('total_items')}</span>
            <span className="total-value">{totalItems}</span>
          </div>
          <div className="total-card">
            <span className="total-label">{t('total_value')}</span>
            <span className="total-value">${totalValue.toFixed(2)}</span>
          </div>
          <div className="total-card">
            <span className="total-label">{t('total_containers')}</span>
            <span className="total-value">{containers.length}</span>
          </div>
        </div>
      </div>

      <div className="summary-content">
        {/* Container Cards Grid */}
        <section className="containers-section">
          <h2>{t('containers_breakdown')}</h2>
          <div className="container-cards-grid">
            {summaryData.map((container, index) => (
              <div
                key={container.id}
                className="container-card"
                onClick={() => handleContainerClick(container.id)}
              >
                <div className="container-card-header">
                  <div className="container-icon" style={{ backgroundColor: generateColors(summaryData.length)[index] }}>
                    📦
                  </div>
                  <h3>{container.name}</h3>
                </div>
                <div className="container-card-body">
                  <div className="stat-row">
                    <span className="stat-label">{t('items')}</span>
                    <span className="stat-value">{container.itemCount}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">{t('categories')}</span>
                    <span className="stat-value">{container.categoryCount}</span>
                  </div>
                  <div className="stat-row stat-row-highlight">
                    <span className="stat-label">{t('value')}</span>
                    <span className="stat-value">${container.totalValue.toFixed(2)}</span>
                  </div>

                  {/* Chart for this container */}
                  {container.chartData && (
                    <div className="container-chart" onClick={(e) => e.stopPropagation()}>
                      <h4>{t('value_by_category')}</h4>
                      <div className="mini-chart-container">
                        <Pie
                          data={container.chartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                              legend: {
                                display: false
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                      {/* Legend */}
                      <div className="chart-legend">
                        {container.chartData.labels.map((label, idx) => (
                          <div key={idx} className="legend-item">
                            <span 
                              className="legend-color" 
                              style={{ backgroundColor: container.chartData.datasets[0].backgroundColor[idx] }}
                            ></span>
                            <span className="legend-label">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SummaryPage;