import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import api from '../api';
import RegistroFormPanel from './RegistroFormPanel';
import {
  ArrowLeft,
  BrainCircuit,
  AlertTriangle,
  Zap,
  Target,
  Eye,
  Hand,
  Loader2,
  TrendingUp,
  FileText,
  Lightbulb,
  BarChart3,
  Plus,
} from 'lucide-react';

// ─── Custom Node Component ───────────────────────────────────
function ABCNode({ data }) {
  const colorMap = {
    antecedente: {
      bg: 'bg-amber-50',
      border: 'border-amber-400',
      accent: 'bg-amber-400',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-800',
      icon: <AlertTriangle size={14} />,
      label: 'Antecedente',
    },
    conducta: {
      bg: 'bg-rose-50',
      border: 'border-rose-400',
      accent: 'bg-rose-400',
      text: 'text-rose-700',
      badge: 'bg-rose-100 text-rose-800',
      icon: <Zap size={14} />,
      label: 'Conducta',
    },
    consecuente: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-400',
      accent: 'bg-emerald-400',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800',
      icon: <Target size={14} />,
      label: 'Consecuente',
    },
  };

  const style = colorMap[data.type] || colorMap.conducta;

  return (
    <div
      className={`relative rounded-xl border-2 ${style.border} ${style.bg} shadow-lg 
        min-w-[200px] max-w-[240px] transition-all duration-200 hover:shadow-xl hover:scale-[1.02]`}
    >
      {/* Input Handle */}
      {data.type !== 'antecedente' && (
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-slate-400 !w-3 !h-3 !border-2 !border-white"
        />
      )}

      {/* Top accent bar */}
      <div className={`h-1.5 ${style.accent} rounded-t-[10px]`} />

      <div className="p-4">
        {/* Badge */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.badge} mb-3`}>
          {style.icon}
          {style.label}
        </div>

        {/* Content */}
        <p className="text-sm text-slate-700 leading-relaxed font-medium">
          {data.label}
        </p>

        {/* Intensity badge for conducta */}
        {data.intensidad && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">Intensidad:</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < data.intensidad
                      ? data.intensidad > 7
                        ? 'bg-red-400'
                        : data.intensidad > 4
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Output Handle */}
      {data.type !== 'consecuente' && (
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-slate-400 !w-3 !h-3 !border-2 !border-white"
        />
      )}
    </div>
  );
}

// ─── Node Types Registry ─────────────────────────────────────
const nodeTypes = { abcNode: ABCNode };

// ─── Función badge colors ────────────────────────────────────
const funcionColors = {
  'Escape/Evitación': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', icon: <Hand size={16} /> },
  'Atención': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', icon: <Eye size={16} /> },
  'Tangible': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', icon: <Target size={16} /> },
  'Sensorial/Automático': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', icon: <Zap size={16} /> },
  'Indeterminado': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', icon: <AlertTriangle size={16} /> },
};

// ─── Transform records → nodes + edges ───────────────────────
function buildFlowElements(registros) {
  const nodes = [];
  const edges = [];

  const COLUMN_X = { antecedente: 0, conducta: 400, consecuente: 800 };
  const ROW_HEIGHT = 220;

  // Group unique values by type to avoid duplicating identical text
  const uniqueA = [...new Set(registros.map(r => r.antecedente))];
  const uniqueB = [...new Set(registros.map(r => r.conducta))];
  const uniqueC = [...new Set(registros.map(r => r.consecuente))];

  // Create antecedente nodes
  uniqueA.forEach((text, i) => {
    nodes.push({
      id: `a-${i}`,
      type: 'abcNode',
      position: { x: COLUMN_X.antecedente, y: i * ROW_HEIGHT },
      data: { label: text, type: 'antecedente' },
    });
  });

  // Create conducta nodes
  uniqueB.forEach((text, i) => {
    const reg = registros.find(r => r.conducta === text);
    nodes.push({
      id: `b-${i}`,
      type: 'abcNode',
      position: { x: COLUMN_X.conducta, y: i * ROW_HEIGHT },
      data: { label: text, type: 'conducta', intensidad: reg?.intensidad },
    });
  });

  // Create consecuente nodes
  uniqueC.forEach((text, i) => {
    nodes.push({
      id: `c-${i}`,
      type: 'abcNode',
      position: { x: COLUMN_X.consecuente, y: i * ROW_HEIGHT },
      data: { label: text, type: 'consecuente' },
    });
  });

  // Create edges from registros relationships
  const edgeSet = new Set();
  registros.forEach((r) => {
    const aIdx = uniqueA.indexOf(r.antecedente);
    const bIdx = uniqueB.indexOf(r.conducta);
    const cIdx = uniqueC.indexOf(r.consecuente);

    const edgeAB = `a-${aIdx}->b-${bIdx}`;
    if (!edgeSet.has(edgeAB)) {
      edgeSet.add(edgeAB);
      edges.push({
        id: edgeAB,
        source: `a-${aIdx}`,
        target: `b-${bIdx}`,
        animated: true,
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
      });
    }

    const edgeBC = `b-${bIdx}->c-${cIdx}`;
    if (!edgeSet.has(edgeBC)) {
      edgeSet.add(edgeBC);
      edges.push({
        id: edgeBC,
        source: `b-${bIdx}`,
        target: `c-${cIdx}`,
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
      });
    }
  });

  return { nodes, edges };
}

// ─── Main Component ──────────────────────────────────────────
export default function AnalisisCanvas({ sujetoId, sujetoNombre, onBack }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [analisis, setAnalisis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reusable fetch function for initial load and reactive updates
  const fetchData = useCallback((showLoader = true) => {
    if (!sujetoId) return;
    if (showLoader) setLoading(true);
    setError(null);

    // Peticiones en paralelo
    Promise.all([
      api.get(`/registros/${sujetoId}`),
      api.get(`/analisis/${sujetoId}`),
    ])
      .then(([registrosRes, analisisRes]) => {
        const { nodes: n, edges: e } = buildFlowElements(registrosRes.data);
        setNodes(n);
        setEdges(e);
        setAnalisis(analisisRes.data);
      })
      .catch((err) => {
        console.error(err);
        const msg = err.response?.data?.detail || 'Error al cargar los datos del análisis.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [sujetoId]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Distribution bar chart data
  const distEntries = analisis?.distribucion_funciones
    ? Object.entries(analisis.distribucion_funciones).filter(([_, v]) => v > 0).sort((a, b) => b[1] - a[1])
    : [];
  const maxDist = distEntries.length > 0 ? Math.max(...distEntries.map(([_, v]) => v)) : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Procesando ruta de inteligencia...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sin Datos Suficientes</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl 
                hover:bg-slate-700 transition-all border border-slate-700"
            >
              <ArrowLeft size={18} /> Volver
            </button>
            <button
              onClick={() => { setError(null); setLoading(false); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl 
                bg-gradient-to-r from-blue-600 to-purple-600 text-white 
                hover:from-blue-500 hover:to-purple-500 transition-all
                shadow-lg shadow-blue-600/25"
              id="btn-add-first-record"
            >
              <Plus size={18} /> Crear Primer Registro
            </button>
          </div>
        </div>
      </div>
    );
  }

  const predominante = analisis?.funcion_predominante || 'Indeterminado';
  const funcColor = funcionColors[predominante] || funcionColors['Indeterminado'];

  return (
    <div className="flex h-screen bg-slate-950">
      {/* ─── Canvas Area ─── */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center gap-4 px-6 py-4 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 
              hover:text-white hover:bg-slate-800 transition-all"
            id="btn-back-dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="h-6 w-px bg-slate-700" />
          <BrainCircuit className="text-blue-400" size={22} />
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              Ruta de Inteligencia
            </h1>
            <p className="text-xs text-slate-500">
              {sujetoNombre} · {analisis?.total_registros || 0} registros analizados
            </p>
          </div>
        </div>

        {/* Column Headers */}
        <div className="flex px-6 py-3 bg-slate-900/50 border-b border-slate-800/50">
          <div className="flex-1 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Antecedentes
            </span>
          </div>
          <div className="flex-1 flex items-center gap-2 justify-center">
            <div className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Conductas
            </span>
          </div>
          <div className="flex-1 flex items-center gap-2 justify-end">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Consecuentes
            </span>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 relative" id="analysis-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#334155" gap={20} size={1} variant="dots" />
            <Controls
              className="!bg-slate-800 !border-slate-700 !rounded-xl !shadow-2xl [&>button]:!bg-slate-800 
                [&>button]:!border-slate-700 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-700"
            />
            <MiniMap
              nodeColor={(n) => {
                if (n.data?.type === 'antecedente') return '#f59e0b';
                if (n.data?.type === 'conducta') return '#f43f5e';
                return '#10b981';
              }}
              className="!bg-slate-900 !border-slate-700 !rounded-xl"
              maskColor="rgba(15, 23, 42, 0.7)"
            />
          </ReactFlow>

          {/* Floating Form Panel */}
          <RegistroFormPanel
            sujetoId={sujetoId}
            onSaved={() => fetchData(false)}
          />
        </div>
      </div>

      {/* ─── Sidebar de Inferencia ─── */}
      <aside
        className="w-[380px] bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto"
        id="inference-sidebar"
      >
        {/* Sidebar Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <BrainCircuit className="text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Inferencia Funcional</h2>
              <p className="text-xs text-slate-500">Motor de análisis v1.2</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6 flex-1">
          {/* ── Función Predominante ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-slate-500" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Función Predominante Detectada
              </h3>
            </div>
            <div
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 ${funcColor.border} ${funcColor.bg}`}
            >
              <div className={`${funcColor.text}`}>{funcColor.icon}</div>
              <span className={`text-base font-bold ${funcColor.text}`}>
                {predominante}
              </span>
            </div>
          </div>

          {/* ── Distribución de Funciones ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} className="text-slate-500" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Distribución de Funciones
              </h3>
            </div>
            <div className="space-y-3">
              {distEntries.map(([funcion, count]) => {
                const fc = funcionColors[funcion] || funcionColors['Indeterminado'];
                const pct = Math.round((count / maxDist) * 100);
                return (
                  <div key={funcion}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-slate-400">{funcion}</span>
                      <span className={`text-xs font-bold ${fc.text}`}>{count}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          funcion === predominante ? 'bg-blue-500' : 'bg-slate-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Sugerencia de Intervención ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-slate-500" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sugerencia de Intervención
              </h3>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                {analisis?.sugerencia_intervencion}
              </p>
            </div>
          </div>

          {/* ── Resumen de Datos ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} className="text-slate-500" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Resumen
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
                <p className="text-2xl font-bold text-white">{analisis?.total_registros || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Registros</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
                <p className="text-2xl font-bold text-white">{distEntries.length}</p>
                <p className="text-xs text-slate-500 mt-1">Funciones</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="px-6 py-4 border-t border-slate-800">
          <p className="text-[10px] text-slate-600 text-center">
            Análisis generado por el Motor de Inferencia Heurística AFC v1.2
          </p>
        </div>
      </aside>
    </div>
  );
}
