import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager } from '@react-google-maps/api';

const libraries = ['drawing', 'geometry'];
const mapContainerStyle = { width: '100%', height: '520px' };
const defaultCenter = { lat: 13.0827, lng: 80.2707 }; // Chennai

const locations = [
  { name: "T. Nagar", lat: 13.0418, lng: 80.2341 },
  { name: "Anna Nagar", lat: 13.0850, lng: 80.2101 },
  { name: "Adyar", lat: 13.0012, lng: 80.2565 },
  { name: "Velachery", lat: 12.9756, lng: 80.2207 },
  { name: "IIT Madras", lat: 12.9915, lng: 80.2337 }
];

// Automatically switches between local backend and live cloud backend
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export default function App() {
  const [roofArea, setRoofArea] = useState(0);
  const [waterSaved, setWaterSaved] = useState(null);
  const [mapKey, setMapKey] = useState(0);
  const [center, setCenter] = useState(defaultCenter);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyCxgzdFd26l8CnD7SkHQrHGqdXyYKbX_bY", 
    libraries: libraries,
    version: "3.64" 
  });

  const calculateSavings = async (area) => {
    try {
      const response = await fetch(`${API_BASE}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area_m2: area })
      });
      const data = await response.json();
      setWaterSaved(data.estimated_liters_saved);
    } catch (error) {
      console.error("Backend connection error!");
    }
  };

  const onPolygonComplete = useCallback((polygon) => {
    const area = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
    const roundedArea = Math.round(area);
    setRoofArea(roundedArea);
    calculateSavings(roundedArea);
  }, []);

  const handleClearMap = () => {
    setMapKey(prev => prev + 1);
    setRoofArea(0);
    setWaterSaved(null);
  };

  const downloadReport = () => {
    if (roofArea === 0) return;
    window.open(`${API_BASE}/api/report?area=${roofArea}`, '_blank');
  };

  const onLoadMap = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const jumpToLocation = (lat, lng) => {
    const newLoc = { lat, lng };
    setCenter(newLoc);
    if (mapRef.current) {
      mapRef.current.panTo(newLoc);
      mapRef.current.setZoom(19);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const geocoder = new window.google.maps.Geocoder();
    const query = searchQuery.toLowerCase().includes('chennai') ? searchQuery : `${searchQuery}, Chennai, India`;

    geocoder.geocode({ address: query }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        const newLoc = { lat: loc.lat(), lng: loc.lng() };
        setCenter(newLoc);
        if (mapRef.current) {
          mapRef.current.panTo(newLoc);
          mapRef.current.setZoom(19);
        }
      } else {
        alert("Location not found. Try a landmark in Chennai!");
      }
    });
  };

  if (!isLoaded) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white font-sans text-xl">
      <div className="animate-pulse flex items-center gap-3">
        <span className="text-3xl">💧</span> Initializing HydroMap Engine...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      {/* Gorgeous Modern Header */}
      <header className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white py-6 px-8 shadow-lg mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-500/30 text-blue-100 text-xs px-3 py-1 rounded-full font-semibold border border-blue-400/30 uppercase tracking-wider">
                AI Urban Sustainability
              </span>
              <span className="bg-emerald-500/30 text-emerald-100 text-xs px-3 py-1 rounded-full font-semibold border border-emerald-400/30">
                Live Satellite Feed Active
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">AquaMetrics RTRWH Engine</h1>
            <p className="text-blue-100 text-sm mt-1">Smart Rooftop Rainwater Harvesting Assessment & Compliance Platform</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-right hidden sm:block">
            <span className="block text-xs text-blue-200 uppercase tracking-widest font-bold">Region Target</span>
            <span className="text-lg font-bold">Chennai Metro, IN</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Search & Quick-Jump Toolbar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="w-full lg:w-1/2 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search address or landmark in Chennai..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md shadow-blue-600/20">
              Locate
            </button>
          </form>

          <div className="w-full lg:w-auto flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Jump:</span>
            {locations.map((loc) => (
              <button
                key={loc.name}
                onClick={() => jumpToLocation(loc.lat, loc.lng)}
                className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 text-xs font-semibold py-2 px-3.5 rounded-lg border border-slate-200 transition-all shadow-2xs"
              >
                📍 {loc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Workspace (Map + Analytics Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Map & Controls (Takes 2 Columns) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-white">
              <GoogleMap 
                key={mapKey} 
                mapContainerStyle={mapContainerStyle} 
                zoom={18} 
                center={center} 
                mapTypeId="satellite"
                onLoad={onLoadMap}
              >
                <DrawingManager
                  onPolygonComplete={onPolygonComplete}
                  options={{
                    drawingControl: true,
                    drawingControlOptions: { position: window.google.maps.ControlPosition.TOP_CENTER, drawingModes: [window.google.maps.drawing.OverlayType.POLYGON] },
                    polygonOptions: { fillColor: '#3b82f6', fillOpacity: 0.45, strokeWeight: 3, strokeColor: '#1d4ed8', clickable: false, editable: true, zIndex: 1 }
                  }}
                />
              </GoogleMap>
              <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-medium border border-white/10 shadow-lg pointer-events-none">
                💡 Tip: Click the polygon tool (⬠) at the top of the map to trace your roof perimeter.
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-4">
              <button 
                onClick={handleClearMap}
                className="flex-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold py-3.5 px-6 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span>🗑️</span> Reset / Clear Polygon
              </button>
              
              <button 
                onClick={downloadReport}
                disabled={roofArea === 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>📥</span> Download Certified PDF Report
              </button>
            </div>
          </div>

          {/* Right: Gorgeous Analytics Dashboard Sidebar (Takes 1 Column) */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>📊</span> Assessment Metrics
                </h2>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              
              {/* Roof Area Card */}
              <div className="mb-5 bg-slate-50 p-4 rounded-xl border border-slate-200/60 transition-all hover:border-blue-200">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Measured Roof Footprint</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{roofArea.toLocaleString()}</span>
                  <span className="text-slate-500 font-bold">m²</span>
                </div>
              </div>

              {/* Annual Water Savings Card (Glowing Hero Metric) */}
              <div className="mb-6 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl shadow-lg shadow-blue-600/20 text-white relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-white/10 text-8xl font-black select-none pointer-events-none">💧</div>
                <span className="block text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Estimated Annual Harvest</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-black">
                    {waterSaved !== null ? waterSaved.toLocaleString() : '---'}
                  </span>
                  <span className="text-blue-200 font-semibold text-sm">Liters / Year</span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-blue-100">
                  <span>Equivalent to ~{(waterSaved ? Math.round(waterSaved / 300) : 0)} tanker trucks</span>
                  <span className="font-bold">100% Eco-Sustainable</span>
                </div>
              </div>

              {/* Parameter Breakdown */}
              <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Rainfall Model:</span>
                  <span className="font-bold text-slate-800">Chennai Annual (1,400 mm)</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Runoff Coefficient:</span>
                  <span className="font-bold text-slate-800">0.85 (Concrete Roof)</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Catchment Efficiency:</span>
                  <span className="font-bold text-emerald-600">High Grade</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Powered by Python FastAPI, Google Maps Satellite, & ReportLab PDF Engine. Built for sustainable urban water governance.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}