import React, { useState } from 'react';
import { X, UserPlus, Loader2, Dna, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function NuevoSujetoModal({ isOpen, onClose, onCreated }) {
  const [nombreCodigo, setNombreCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombreCodigo.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await api.post('/sujetos/', {
        nombre_codigo: nombreCodigo.trim(),
        descripcion_base: descripcion.trim() || null,
      });
      setSuccess(true);
      setTimeout(() => {
        onCreated(res.data);
        // Reset form
        setNombreCodigo('');
        setDescripcion('');
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Error al crear el sujeto.');
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="modal-content relative w-full max-w-lg mx-4 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Dna className="text-white" size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nuevo Sujeto</h2>
              <p className="text-xs text-slate-500">Crear un nuevo caso de análisis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
            id="btn-close-modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative p-6 space-y-5">
          {/* Nombre/Código */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Código del Sujeto <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={nombreCodigo}
              onChange={e => setNombreCodigo(e.target.value)}
              placeholder="Ej: Sujeto-002, Paciente-Alpha"
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white 
                placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 
                focus:ring-blue-500/20 transition-all"
              id="input-nombre-codigo"
              autoFocus
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Descripción Clínica
            </label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Breve descripción del caso clínico, contexto, edad, diagnóstico previo..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white 
                placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 
                focus:ring-purple-500/20 transition-all resize-none"
              id="input-descripcion"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
              <X size={16} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 
                text-sm font-medium hover:bg-slate-700 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !nombreCodigo.trim()}
              className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl text-sm font-semibold
                transition-all disabled:opacity-40 disabled:cursor-not-allowed
                bg-gradient-to-r from-blue-600 to-purple-600 text-white 
                hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-600/25"
              id="btn-submit-sujeto"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : success ? (
                <CheckCircle size={16} />
              ) : (
                <UserPlus size={16} />
              )}
              {saving ? 'Guardando...' : success ? '¡Creado!' : 'Crear Sujeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
