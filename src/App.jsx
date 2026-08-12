import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager } from '@react-google-maps/api';

const libraries = ['drawing', 'geometry'];
const mapContainerStyle = { width: '100%', height: '100%' };
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export default function App() {
  const [roofArea, setRoofArea] = useState(0);
  const [waterSaved, setWaterSaved] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({ 
    id: 'google-map-script', 
    googleMapsApiKey: "AIzaSyCxgzdFd26l8CnD7SkHQrHGqdXyYKbX_bY", 
    version: '3.64', // Pins the map version to keep DrawingManager working
    libraries 
  });

  const onPolygonComplete = useCallback((polygon) => {
    const area = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
    const roundedArea = Math.round(area);
    setRoofArea(roundedArea);
    
    // Call Backend
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <main className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            AquaMetrics AI
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Precision Rainwater Harvesting Analytics Engine</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Map Card */}
          <div className="lg:col-span-2 h-[500px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 relative">
            {isLoaded ? (
              <GoogleMap mapContainerStyle={mapContainerStyle} zoom={18} center={{ lat: 13.0827, lng: 80.2707 }} mapTypeId="satellite" onLoad={(map) => { mapRef.current = map; }}>
                <DrawingManager onPolygonComplete={onPolygonComplete} options={{
                  drawingControl: true,
                  drawingControlOptions: { position: 1, drawingModes: ['polygon'] },
                  polygonOptions: { fillColor: '#3b82f6', fillOpacity: 0.35, strokeColor: '#60a5fa', strokeWeight: 3 }
                }} />
              </GoogleMap>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">Loading Map Engine...</div>
            )}
          </div>

          {/* Right: Dashboard Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 text-lg">⚡</span>
                <h2 className="text-xl font-bold tracking-tight">Analytics Dashboard</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">Roof Footprint Area</p>
                  <p className="text-3xl font-black mt-1">{roofArea.toLocaleString()} <span className="text-sm font-normal text-slate-500">m²</span></p>
                </div>

                {isCalculated && waterSaved !== null && (
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl shadow-lg shadow-blue-900/30 text-white">
                    <p className="text-blue-100 text-xs uppercase tracking-wider font-bold flex items-center gap-2">
                      💧 Estimated Annual Yield
                    </p>
                    <p className="text-3xl font-black mt-1">{waterSaved.toLocaleString()} L</p>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => window.open(`${API_BASE}/api/report?area=${roofArea}`, '_blank')}
              disabled={roofArea === 0}
              className="w-full mt-6 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 text-white"
            >
              📥 Generate Certified Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}