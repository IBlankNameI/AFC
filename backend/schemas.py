import uuid
from datetime import datetime
from typing import Optional, List, Dict

from pydantic import BaseModel, Field


# ─── Esquemas de Validación (Pydantic) ───────────────────────

class SujetoBase(BaseModel):
    nombre_codigo: str
    descripcion_base: Optional[str] = None


class SujetoCreate(SujetoBase):
    pass


class SujetoResponse(SujetoBase):
    id: uuid.UUID
    created_at: datetime
    class Config:
        from_attributes = True


class RegistroABCCreate(BaseModel):
    sujeto_id: uuid.UUID
    antecedente: str
    conducta: str
    consecuente: str
    intensidad: int = Field(ge=1, le=10)  # Validación estricta 1-10
    metadatos_contexto: Optional[Dict] = {}


class RegistroABCResponse(RegistroABCCreate):
    id: uuid.UUID
    timestamp: datetime
    class Config:
        from_attributes = True


class AnalisisFuncionalResponse(BaseModel):
    sujeto_id: uuid.UUID
    total_registros: int
    distribucion_funciones: Dict[str, int]
    funcion_predominante: str
    sugerencia_intervencion: str


class RegistroSimulado(BaseModel):
    antecedente: str
    conducta: str
    consecuente: str
    intensidad: int = Field(ge=1, le=10)


class SimulacionRequest(BaseModel):
    sujeto_id: uuid.UUID
    registros: List[RegistroSimulado]


class CambioAplicado(BaseModel):
    nodo: str
    texto_original: str
    texto_nuevo: str


class PlanIntervencionCreate(BaseModel):
    sujeto_id: uuid.UUID
    funcion_original: str
    funcion_simulada: str
    cambios_aplicados: List[CambioAplicado]
    sugerencia_intervencion: Optional[str] = None
    notas: Optional[str] = None


class PlanIntervencionResponse(PlanIntervencionCreate):
    id: uuid.UUID
    created_at: datetime
    class Config:
        from_attributes = True
