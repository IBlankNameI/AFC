import React, { useEffect, useState } from 'react';
import api from './api';
import AnalisisCanvas from './components/AnalisisCanvas';
import { UserPlus, Activity, BrainCircuit, Search, Users, Dna } from 'lucide-react';

function App() {
  const [sujetos, setSujetos] = useState([]);
  const [selectedSujeto, setSelectedSujeto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get('/sujetos/').then(res => setSujetos(res.data)).catch(err => console.error(err));
  }, []);

  // Filtro de búsqueda
  const filtered = sujetos.filter(s =>
    s.nombre_codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Vista de Análisis ─────────────────────────────────────
  if (selectedSujeto) {
    return (
      <AnalisisCanvas
        sujetoId={selectedSujeto.id}
        sujetoNombre={selectedSujeto.nombre_codigo}
        onBack={() => setSelectedSujeto(null)}
      />
    );
  }

  // ─── Vista de Lista (Dashboard) ────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-slate-800">
        {/* Gradient glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full" />

        <div className="relative max-w-7xl mx-auto px-8 py-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Dna className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Sistema
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> AFC</span>
                  </h1>
                  <p className="text-slate-500 text-sm">Análisis Funcional de Conducta · Automatizado</p>
                </div>
              </div>
            </div>

            <button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white 
                px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/25 
                hover:shadow-blue-500/40 font-medium text-sm"
              id="btn-new-subject"
            >
              <UserPlus size={18} /> Nuevo Sujeto
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6 mt-8">
            <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl px-5 py-3">
              <Users size={18} className="text-blue-400" />
              <div>
                <p className="text-xl font-bold">{sujetos.length}</p>
                <p className="text-xs text-slate-500">Sujetos Activos</p>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar sujeto por código..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 backdrop-blur-sm border border-slate-800 
                  rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 
                  focus:ring-2 focus:ring-blue-500/20 transition-all"
                id="search-subjects"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(s => (
            <div
              key={s.id}
              className="group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800 
                rounded-2xl p-6 hover:border-slate-700 hover:bg-slate-900/80 
                transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/50"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
                      <Activity className="text-blue-400" size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                        {s.nombre_codigo}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {new Date(s.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-500 mb-6 line-clamp-2">
                  {s.descripcion_base || 'Sin descripción clínica registrada'}
                </p>

                <button
                  onClick={() => setSelectedSujeto(s)}
                  className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl 
                    bg-slate-800/80 border border-slate-700/50 text-slate-300 font-medium text-sm
                    hover:bg-blue-600/20 hover:border-blue-500/30 hover:text-blue-300 
                    transition-all duration-300 group/btn"
                  id={`btn-analyze-${s.id}`}
                >
                  <BrainCircuit size={16} className="group-hover/btn:text-blue-400 transition-colors" />
                  Analizar Ruta de Inteligencia
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Users className="w-16 h-16 text-slate-800 mx-auto mb-4" />
              <p className="text-slate-600 text-lg font-medium">
                {searchTerm ? 'No se encontraron resultados' : 'No hay sujetos registrados aún'}
              </p>
              <p className="text-slate-700 text-sm mt-1">
                {searchTerm ? 'Prueba con otro término de búsqueda' : 'Comienza creando un nuevo sujeto'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
