import React, { useState, useMemo } from 'react';
import {
  Plus,
  X,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle as TriangleAlert,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from 'lucide-react';
import api from '../api';

// ─── Behavioral Language Linter ──────────────────────────────
const PALABRAS_PROHIBIDAS = [
  { word: 'triste', sugerencia: '"llora", "se cubre la cara", "baja la mirada"' },
  { word: 'enojado', sugerencia: '"grita", "golpea la mesa", "aprieta los puños"' },
  { word: 'enojada', sugerencia: '"grita", "golpea la mesa", "aprieta los puños"' },
  { word: 'siente', sugerencia: 'Describa la conducta observable, no el estado interno' },
  { word: 'feliz', sugerencia: '"sonríe", "salta", "aplaude"' },
  { word: 'ansioso', sugerencia: '"se muerde las uñas", "camina de un lado a otro"' },
  { word: 'ansiosa', sugerencia: '"se muerde las uñas", "camina de un lado a otro"' },
  { word: 'frustrado', sugerencia: '"arroja objetos", "grita", "llora"' },
  { word: 'frustrada', sugerencia: '"arroja objetos", "grita", "llora"' },
  { word: 'nervioso', sugerencia: '"se frota las manos", "tartamudea", "tiembla"' },
  { word: 'nerviosa', sugerencia: '"se frota las manos", "tartamudea", "tiembla"' },
  { word: 'aburrido', sugerencia: '"mira al techo", "bosteza", "juega con objetos"' },
  { word: 'aburrida', sugerencia: '"mira al techo", "bosteza", "juega con objetos"' },
  { word: 'contento', sugerencia: '"sonríe", "ríe", "aplaude"' },
  { word: 'contenta', sugerencia: '"sonríe", "ríe", "aplaude"' },
  { word: 'asustado', sugerencia: '"retrocede", "se cubre los oídos", "grita"' },
  { word: 'asustada', sugerencia: '"retrocede", "se cubre los oídos", "grita"' },
  { word: 'molesto', sugerencia: '"frunce el ceño", "cruza los brazos", "voltea la cara"' },
  { word: 'molesta', sugerencia: '"frunce el ceño", "cruza los brazos", "voltea la cara"' },
];

function lintText(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return PALABRAS_PROHIBIDAS.filter(({ word }) => {
    // Match whole words only using word boundary logic
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lower);
  });
}

// ─── Intensity Slider Labels ────────────────────────────────
const INTENSITY_LABELS = {
  1: 'Mínima', 2: 'Muy baja', 3: 'Baja', 4: 'Moderada-baja',
  5: 'Moderada', 6: 'Moderada-alta', 7: 'Alta', 8: 'Muy alta',
  9: 'Severa', 10: 'Extrema',
};

// ─── Main Component ─────────────────────────────────────────
export default function RegistroFormPanel({ sujetoId, onSaved }) {
  const [isOpen, setIsOpen] = useState(false);
  const [antecedente, setAntecedente] = useState('');
  const [conducta, setConducta] = useState('');
  const [consecuente, setConsecuente] = useState('');
  const [intensidad, setIntensidad] = useState(5);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Run linter on all fields
  const lintWarnings = useMemo(() => {
    const warnings = [];
    const aLint = lintText(antecedente);
    const bLint = lintText(conducta);
    const cLint = lintText(consecuente);

    aLint.forEach(l => warnings.push({ field: 'Antecedente', ...l }));
    bLint.forEach(l => warnings.push({ field: 'Conducta', ...l }));
    cLint.forEach(l => warnings.push({ field: 'Consecuente', ...l }));

    return warnings;
  }, [antecedente, conducta, consecuente]);

  const intensityColor =
    intensidad > 7 ? 'text-rose-400' : intensidad > 4 ? 'text-amber-400' : 'text-emerald-400';
  const intensityBg =
    intensidad > 7 ? 'bg-rose-500' : intensidad > 4 ? 'bg-amber-500' : 'bg-emerald-500';
  const sliderTrackColor =
    intensidad > 7 ? '#f43f5e' : intensidad > 4 ? '#f59e0b' : '#10b981';

  const canSubmit = antecedente.trim() && conducta.trim() && consecuente.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError(null);

    try {
      await api.post('/registros/', {
        sujeto_id: sujetoId,
        antecedente: antecedente.trim(),
        conducta: conducta.trim(),
        consecuente: consecuente.trim(),
        intensidad,
        metadatos_contexto: {},
      });

      setSuccess(true);
      setTimeout(() => {
        setAntecedente('');
        setConducta('');
        setConsecuente('');
        setIntensidad(5);
        setSuccess(false);
        onSaved(); // Trigger refetch
      }, 600);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Error al guardar el registro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute top-20 right-[396px] z-20" id="registro-form-panel">
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl 
            bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold
            shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:from-blue-500 
            hover:to-purple-500 transition-all animate-fade-in-up"
          id="btn-toggle-form"
        >
          <Plus size={16} />
          Nuevo Registro ABC
        </button>
      )}

      {/* Form Panel */}
      {isOpen && (
        <div className="form-panel-enter w-[380px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 
          rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-blue-400" />
              <h3 className="text-sm font-bold text-white">Nuevo Registro ABC</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X size={14} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Antecedente */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-amber-400">Antecedente</span>
              </label>
              <textarea
                value={antecedente}
                onChange={e => setAntecedente(e.target.value)}
                placeholder="¿Qué ocurrió antes de la conducta?"
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border-2 border-amber-500/30 rounded-xl text-sm 
                  text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/60 
                  focus:ring-2 focus:ring-amber-400/15 transition-all resize-none"
                id="input-antecedente"
              />
            </div>

            {/* Conducta */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-rose-400">Conducta</span>
              </label>
              <textarea
                value={conducta}
                onChange={e => setConducta(e.target.value)}
                placeholder="¿Qué conducta observable se presentó?"
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border-2 border-rose-500/30 rounded-xl text-sm 
                  text-white placeholder-slate-600 focus:outline-none focus:border-rose-400/60 
                  focus:ring-2 focus:ring-rose-400/15 transition-all resize-none"
                id="input-conducta"
              />
            </div>

            {/* Consecuente */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-400">Consecuente</span>
              </label>
              <textarea
                value={consecuente}
                onChange={e => setConsecuente(e.target.value)}
                placeholder="¿Qué ocurrió inmediatamente después?"
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border-2 border-emerald-500/30 rounded-xl text-sm 
                  text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400/60 
                  focus:ring-2 focus:ring-emerald-400/15 transition-all resize-none"
                id="input-consecuente"
              />
            </div>

            {/* Linter Warnings */}
            {lintWarnings.length > 0 && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3.5 space-y-2 lint-warning-enter">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert size={14} className="text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Linter Conductual
                  </span>
                </div>
                {lintWarnings.map((w, i) => (
                  <div key={i} className="text-xs text-amber-200/80 leading-relaxed">
                    <span className="font-semibold text-amber-300">{w.field}:</span>{' '}
                    "<span className="text-amber-100 underline decoration-amber-400/40">{w.word}</span>" 
                    no es observable. Pruebe → {w.sugerencia}
                  </div>
                ))}
              </div>
            )}

            {/* Intensidad Slider */}
            <div>
              <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-3">
                <span className="text-slate-400">Intensidad</span>
                <span className={`text-lg font-bold ${intensityColor}`}>
                  {intensidad}
                  <span className="text-[10px] font-normal text-slate-500 ml-1.5">
                    {INTENSITY_LABELS[intensidad]}
                  </span>
                </span>
              </label>
              <div className="relative">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={intensidad}
                  onChange={e => setIntensidad(parseInt(e.target.value))}
                  className="intensity-slider w-full"
                  id="slider-intensidad"
                  style={{
                    '--slider-color': sliderTrackColor,
                    '--slider-pct': `${((intensidad - 1) / 9) * 100}%`,
                  }}
                />
                {/* Tick marks */}
                <div className="flex justify-between mt-1.5 px-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        i < intensidad ? intensityBg : 'bg-slate-700'
                      } transition-colors`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <TriangleAlert size={14} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="w-full flex justify-center items-center gap-2 py-3 rounded-xl text-sm font-semibold
                transition-all disabled:opacity-30 disabled:cursor-not-allowed
                bg-gradient-to-r from-blue-600 to-purple-600 text-white 
                hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-600/25"
              id="btn-submit-registro"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : success ? (
                <CheckCircle size={16} />
              ) : (
                <Save size={16} />
              )}
              {saving ? 'Guardando...' : success ? '¡Registrado!' : 'Guardar Registro'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
