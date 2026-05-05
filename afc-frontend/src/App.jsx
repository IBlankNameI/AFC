import React, { useEffect, useState } from 'react';
import api from './api';
import { UserPlus, Activity, BrainCircuit } from 'lucide-react';

function App() {
  const [sujetos, setSujetos] = useState([]);

  useEffect(() => {
    // Cargar sujetos al iniciar
    api.get('/sujetos/').then(res => setSujetos(res.data)).catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Sistema AFC</h1>
          <p className="text-slate-500">Análisis Funcional Automatizado</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <UserPlus size={20} /> Nuevo Sujeto
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sujetos.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-slate-700">{s.nombre_codigo}</h3>
              <Activity className="text-blue-500" />
            </div>
            <p className="text-sm text-slate-500 mb-6">{s.descripcion_base || "Sin descripción"}</p>
            <div className="flex gap-2">
              <button className="flex-1 flex justify-center items-center gap-2 bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition">
                <BrainCircuit size={18} /> Analizar
              </button>
            </div>
          </div>
        ))}
        {sujetos.length === 0 && (
          <p className="text-slate-500 col-span-full text-center py-10">No hay sujetos registrados aún.</p>
        )}
      </div>
    </div>
  );
}

export default App;
