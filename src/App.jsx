import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Zap, Download, RefreshCw, Droplets } from 'lucide-react';

const libraries = ['drawing', 'geometry'];
const mapContainerStyle = { width: '100%', height: '100%' };
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export default function App() {
  const [roofArea, setRoofArea] = useState(0);
  const [waterSaved, setWaterSaved] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: "YOUR_API_KEY", libraries });

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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 -z-10" />

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            AquaMetrics AI
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Precision Rainwater Harvesting Analytics</p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Map Card */}
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="lg:col-span-2 h-[500px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
            {isLoaded && (
              <GoogleMap mapContainerStyle={mapContainerStyle} zoom={18} center={{ lat: 13.0827, lng: 80.2707 }} mapTypeId="satellite">
                <DrawingManager onPolygonComplete={onPolygonComplete} options={{
                  drawingControl: true,
                  drawingControlOptions: { position: 1, drawingModes: ['polygon'] },
                  polygonOptions: { fillColor: '#3b82f6', fillOpacity: 0.3, strokeColor: '#60a5fa', strokeWeight: 2 }
                }} />
              </GoogleMap>
            )}
          </motion.div>

          {/* Right: Dashboard Card */}
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Zap size={20} /></div>
                <h2 className="text-xl font-bold tracking-tight">Analytics Engine</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-slate-400 text-sm uppercase tracking-wider font-bold">Roof Area</p>
                  <p className="text-3xl font-black">{roofArea.toLocaleString()} <span className="text-sm font-normal text-slate-500">m²</span></p>
                </div>

                <AnimatePresence>
                  {isCalculated && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-900/50">
                      <p className="text-blue-100 text-sm uppercase tracking-wider font-bold flex items-center gap-2">
                        <Droplets size={14} /> Annual Yield
                      </p>
                      <p className="text-3xl font-black mt-1">{waterSaved.toLocaleString()} L</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <button 
              onClick={() => window.open(`${API_BASE}/api/report?area=${roofArea}`, '_blank')}
              className="w-full mt-6 py-4 bg-emerald-500 hover:bg-emerald-600 transition-colors font-bold rounded-2xl flex items-center justify-center gap-2"
            >
              <Download size={18} /> Generate Report
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}