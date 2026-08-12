import './index.css';
import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager } from '@react-google-maps/api';

const libraries = ['drawing', 'geometry'];
const mapContainerStyle = { width: '100%', height: '100%' };
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export default function App() {
  const [roofArea, setRoofArea] = useState(0);
  const [waterSaved, setWaterSaved] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const [searchText, setSearchText] = useState('');
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({ 
    id: 'google-map-script', 
    googleMapsApiKey: "AIzaSyCxgzdFd26l8CnD7SkHQrHGqdXyYKbX_bY", 
    version: '3.64',
    libraries 
  });

  const handleSearch = () => {
    if (!window.google || !searchText.trim()) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchText }, (results, status) => {
      if (status === 'OK' && results[0]) {
        mapRef.current.panTo(results[0].geometry.location);
        mapRef.current.setZoom(19);
      } else {
        alert('Location not found. Please try a more specific address.');
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const onPolygonComplete = useCallback((polygon) => {
    if (!window.google || !window.google.maps) return;
    const area = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
    const roundedArea = Math.round(area);
    setRoofArea(roundedArea);
    
    fetch(`${API_BASE}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area_m2: roundedArea })
    }).then(res => res.json()).then(data => {
      setWaterSaved(data.estimated_liters_saved);
      setIsCalculated(true);
    });
  }, []);

  return (
    <div className="app-container">
      <header>
        <h1 className="header-title">AquaMetrics AI</h1>
        <p className="header-sub">Precision Rainwater Harvesting Analytics Engine</p>
      </header>

      <div className="grid-layout">
        {/* Left Column: Search Bar with Button + Map Card */}
        <div>
          <div className="search-container">
            <input 
              type="text" 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter address or location (e.g., Chennai)..." 
              className="search-input"
            />
            <button onClick={handleSearch} className="btn-search">
              Search
            </button>
          </div>

          <div className="map-card">
            {isLoaded && window.google ? (
              <GoogleMap 
                mapContainerStyle={mapContainerStyle} 
                zoom={18} 
                center={{ lat: 13.0827, lng: 80.2707 }} 
                mapTypeId="satellite" 
                onLoad={(map) => { mapRef.current = map; }}
              >
                <DrawingManager 
                  onPolygonComplete={onPolygonComplete} 
                  options={{
                    drawingControl: true,
                    drawingControlOptions: { position: 1, drawingModes: ['polygon'] },
                    polygonOptions: { fillColor: '#3b82f6', fillOpacity: 0.35, strokeColor: '#60a5fa', strokeWeight: 3 }
                  }} 
                />
              </GoogleMap>
            ) : (
              <div className="loading-map">Loading Map Engine...</div>
            )}
          </div>
        </div>

        {/* Right: Dashboard Card */}
        <div className="dashboard-card">
          <div>
            <div className="dashboard-title">
              <span>⚡</span>
              <h2>Analytics Dashboard</h2>
            </div>

            <div className="metric-box">
              <div className="metric-label">Roof Footprint Area</div>
              <div className="metric-value">
                {roofArea.toLocaleString()} <span style={{fontSize: '0.875rem', fontWeight: 'normal', color: '#64748b'}}>m²</span>
              </div>
            </div>

            {isCalculated && waterSaved !== null && (
              <div className="yield-box">
                <div className="metric-label" style={{color: '#bfdbfe'}}>💧 Estimated Annual Yield</div>
                <div className="metric-value">{waterSaved.toLocaleString()} L</div>
              </div>
            )}
          </div>

          <button 
            onClick={() => window.open(`${API_BASE}/api/report?area=${roofArea}`, '_blank')}
            disabled={roofArea === 0}
            className="btn-report"
          >
            📥 Generate Certified Report
          </button>
        </div>
      </div>
    </div>
  );
}