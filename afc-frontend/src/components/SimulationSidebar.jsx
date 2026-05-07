import React, { useState } from 'react';
import { TrendingDown, TrendingUp, Minus, Wand2, Save, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';

// Refactoring suggestions based on detected function
const REFACTORING_SUGGESTIONS = {
  'Atención': [
    { tipo: 'consecuente', original: 'regaño', sugerido: 'Extinción: Ignorar la conducta sin contacto visual' },
    { tipo: 'consecuente', original: 'habla con', sugerido: 'Redirigir sin atención directa al problema' },
    { tipo: 'consecuente', original: 'consuela', sugerido: 'Atención contingente solo a conducta apropiada' },
    { tipo: 'consecuente', original: 'explica', sugerido: 'Respuesta breve sin elaboración emocional' },
  ],
  'Escape/Evitación': [
    { tipo: 'antecedente', original: 'instrucción', sugerido: 'Ofrecer elección entre dos tareas equivalentes' },
    { tipo: 'antecedente', original: 'tarea', sugerido: 'Fragmentar tarea en pasos pequeños con refuerzo intermedio' },
    { tipo: 'consecuente', original: 'retira', sugerido: 'Guía graduada: mantener demanda con apoyo' },
    { tipo: 'consecuente', original: 'deja de', sugerido: 'Persistir con la instrucción usando ayuda parcial' },
  ],
  'Tangible': [
    { tipo: 'consecuente', original: 'da', sugerido: 'Sistema de economía de fichas con espera programada' },
    { tipo: 'consecuente', original: 'entrega', sugerido: 'Acceso diferido: "primero X, luego Y"' },
    { tipo: 'consecuente', original: 'obtiene', sugerido: 'Enseñar mando funcional para solicitar el objeto' },
  ],
  'Sensorial/Automático': [
    { tipo: 'antecedente', original: 'solo', sugerido: 'Proveer estimulación sensorial alternativa estructurada' },
    { tipo: 'consecuente', original: 'mismo', sugerido: 'Interrumpir y redirigir a actividad sensorial apropiada' },
  ],
};

function DeltaArrow({ original, simulated }) {
  const diff = simulated - original;
  if (diff === 0) return <Minus size={14} className="text-slate-500" />;
  if (diff < 0) return <TrendingDown size={14} className="text-emerald-400" />;
  return <TrendingUp size={14} className="text-red-400" />;
}

export default function SimulationSidebar({
  sujetoId, analisisOriginal, analisisSimulado, editedTexts, registrosRaw,
  onApplySuggestion, onExitSimulation,
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const origDist = analisisOriginal?.distribucion_funciones || {};
  const simDist = analisisSimulado?.distribucion_funciones || {};

  const allFunctions = [...new Set([...Object.keys(origDist), ...Object.keys(simDist)])];
  const entries = allFunctions
    .map(f => ({ funcion: f, orig: origDist[f] || 0, sim: simDist[f] || 0 }))
    .filter(e => e.orig > 0 || e.sim > 0)
    .sort((a, b) => b.sim - a.sim);
  const maxVal = Math.max(...entries.map(e => Math.max(e.orig, e.sim)), 1);

  const predominante = analisisSimulado?.funcion_predominante || 'Indeterminado';
  const origPredominante = analisisOriginal?.funcion_predominante || 'Indeterminado';
  const changed = predominante !== origPredominante;

  // Build changes list from editedTexts
  const cambios = Object.entries(editedTexts || {}).map(([nodeId, newText]) => {
    const origNode = registrosRaw?.find(r => {
      if (nodeId.startsWith('a-')) {
        const uniqueA = [...new Set(registrosRaw.map(x => x.antecedente))];
        return uniqueA[parseInt(nodeId.split('-')[1])] === r.antecedente;
      }
      if (nodeId.startsWith('c-')) {
        const uniqueC = [...new Set(registrosRaw.map(x => x.consecuente))];
        return uniqueC[parseInt(nodeId.split('-')[1])] === r.consecuente;
      }
      return false;
    });
    const tipo = nodeId.startsWith('a-') ? 'antecedente' : 'consecuente';
    const uniqueList = [...new Set(registrosRaw.map(r => r[tipo]))];
    const idx = parseInt(nodeId.split('-')[1]);
    return { nodo: tipo, texto_original: uniqueList[idx] || '', texto_nuevo: newText };
  });

  const suggestions = REFACTORING_SUGGESTIONS[origPredominante] || [];

  async function handleSavePlan() {
    setSaving(true);
    try {
      await api.post('/planes/', {
        sujeto_id: sujetoId,
        funcion_original: origPredominante,
        funcion_simulada: predominante,
        cambios_aplicados: cambios,
        sugerencia_intervencion: analisisSimulado?.sugerencia_intervencion,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      {/* Simulation Mode Banner */}
      <div className="bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 border border-violet-500/30 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">Modo Simulación</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Doble-clic en nodos A/C para editar. Los cambios se recalculan en tiempo real.
        </p>
      </div>

      {/* Changes Applied */}
      {cambios.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cambios Activos</h4>
          <div className="space-y-2">
            {cambios.map((c, i) => (
              <div key={i} className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/50">
                <span className={`text-[10px] font-bold uppercase ${c.nodo === 'antecedente' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {c.nodo}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-red-400/80 line-through truncate flex-1">{c.texto_original}</span>
                  <ArrowRight size={12} className="text-slate-600 shrink-0" />
                  <span className="text-xs text-emerald-400 truncate flex-1">{c.texto_nuevo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparative Distribution */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Impacto Funcional</h4>
        <div className="space-y-3">
          {entries.map(({ funcion, orig, sim }) => {
            const origPct = Math.round((orig / maxVal) * 100);
            const simPct = Math.round((sim / maxVal) * 100);
            return (
              <div key={funcion}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">{funcion}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">{orig}</span>
                    <DeltaArrow original={orig} simulated={sim} />
                    <span className="text-xs font-bold text-white">{sim}</span>
                  </div>
                </div>
                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="absolute inset-0 h-full rounded-full bg-slate-700/50 transition-all duration-500"
                    style={{ width: `${origPct}%` }} />
                  <div className={`absolute inset-0 h-full rounded-full transition-all duration-500 ${
                    sim < orig ? 'bg-emerald-500' : sim > orig ? 'bg-red-500' : 'bg-blue-500'
                  }`} style={{ width: `${simPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Function Change Indicator */}
      {changed && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
          <p className="text-xs text-emerald-300">
            <span className="font-bold">Función cambiada:</span>{' '}
            <span className="line-through text-red-400/70">{origPredominante}</span>
            {' → '}
            <span className="font-bold text-emerald-400">{predominante}</span>
          </p>
        </div>
      )}

      {/* Auto-Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wand2 size={14} className="text-violet-400" />
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sugerencias de Refactoring</h4>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => onApplySuggestion?.(s)}
                className="w-full text-left bg-slate-800/40 hover:bg-violet-500/10 border border-slate-700/50 
                  hover:border-violet-500/30 rounded-lg p-2.5 transition-all group"
              >
                <span className={`text-[10px] font-bold uppercase ${s.tipo === 'antecedente' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {s.tipo}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  <span className="text-red-400/60">"{s.original}"</span> → <span className="text-violet-300 group-hover:text-violet-200">{s.sugerido}</span>
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Intervention text */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-3">
        <p className="text-xs text-slate-300 leading-relaxed">{analisisSimulado?.sugerencia_intervencion}</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button onClick={handleSavePlan} disabled={saving || saved || cambios.length === 0}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            saved ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-600/25'
          } disabled:opacity-50`}
          id="btn-save-plan"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? 'Plan Guardado' : 'Aplicar como Plan de Intervención'}
        </button>
        <button onClick={onExitSimulation}
          className="w-full py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all border border-slate-800"
        >
          Salir de Simulación
        </button>
      </div>
    </div>
  );
}
