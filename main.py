import os
import uuid
from datetime import datetime
from typing import Optional, List, Dict
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, text, Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import sessionmaker, Session, relationship, declarative_base
from sqlalchemy.sql import func
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# 1. CONFIGURACIÓN DE ENTORNO Y BASE DE DATOS
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. MODELOS DE BASE DE DATOS (SQLAlchemy)
class Sujeto(Base):
    __tablename__ = "sujetos"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre_codigo = Column(String, nullable=False)
    descripcion_base = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    registros = relationship("RegistroABC", back_populates="sujeto", cascade="all, delete-orphan")

class RegistroABC(Base):
    __tablename__ = "registros_abc"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sujeto_id = Column(UUID(as_uuid=True), ForeignKey("sujetos.id", ondelete="CASCADE"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    antecedente = Column(String, nullable=False)
    conducta = Column(String, nullable=False)
    consecuente = Column(String, nullable=False)
    intensidad = Column(Integer)
    metadatos_contexto = Column(JSON)
    sujeto = relationship("Sujeto", back_populates="registros")

class PlanIntervencion(Base):
    __tablename__ = "planes_intervencion"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sujeto_id = Column(UUID(as_uuid=True), ForeignKey("sujetos.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    funcion_original = Column(String, nullable=False)
    funcion_simulada = Column(String, nullable=False)
    cambios_aplicados = Column(JSON, nullable=False)
    sugerencia_intervencion = Column(String)
    notas = Column(String)

# 3. ESQUEMAS DE VALIDACIÓN (Pydantic)
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
    intensidad: int = Field(ge=1, le=10) # Validación estricta 1-10
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

# 4. INICIALIZACIÓN Y DEPENDENCIAS
app = FastAPI(title="Sistema Automatizado de AFC - API")
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 5. ENDPOINTS

@app.get("/")
def inicio():
    return {"status": "Sistema de Análisis Funcional Activo", "version": "1.3"}

@app.get("/test-db")
def probar_conexion(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"message": "Conexión con Neon.tech exitosa."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de base de datos: {str(e)}")

@app.post("/sujetos/", response_model=SujetoResponse)
def crear_sujeto(sujeto: SujetoCreate, db: Session = Depends(get_db)):
    nuevo_sujeto = Sujeto(**sujeto.model_dump())
    db.add(nuevo_sujeto)
    db.commit()
    db.refresh(nuevo_sujeto)
    return nuevo_sujeto

@app.get("/sujetos/", response_model=List[SujetoResponse])
def listar_sujetos(db: Session = Depends(get_db)):
    return db.query(Sujeto).all()

@app.post("/registros/", response_model=RegistroABCResponse)
def crear_registro(registro: RegistroABCCreate, db: Session = Depends(get_db)):
    db_sujeto = db.query(Sujeto).filter(Sujeto.id == registro.sujeto_id).first()
    if not db_sujeto:
        raise HTTPException(status_code=404, detail="Sujeto no encontrado")
    nuevo_registro = RegistroABC(**registro.model_dump())
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    return nuevo_registro

@app.get("/registros/{sujeto_id}", response_model=List[RegistroABCResponse])
def listar_registros_por_sujeto(sujeto_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(RegistroABC).filter(RegistroABC.sujeto_id == sujeto_id).all()

# --- MOTOR DE INFERENCIA FUNCIONAL ---

KEYWORDS = {
    "Escape/Evitación": ["retira", "quita", "deja de", "sale", "vete", "evita", "termina", "descanso"],
    "Atención": ["mira", "regaña", "habla", "acerca", "atención", "explica", "consuela", "abrazo"],
    "Tangible": ["da", "entrega", "juguete", "caramelo", "comida", "objeto", "obtiene", "premio"],
    "Sensorial/Automático": ["solo", "mismo", "estereotipia", "estimulación", "placer", "balanceo"]
}

SUGERENCIAS = {
    "Escape/Evitación": "Implementar FCT (Entrenamiento en Comunicación Funcional) para solicitar descansos.",
    "Atención": "Utilizar Extinción y Reforzamiento Diferencial de Conductas Alternativas (DRA).",
    "Tangible": "Establecer sistemas de espera y reforzamiento diferencial de baja tasa.",
    "Sensorial/Automático": "Proporcionar dietas sensoriales o juguetes de estimulación alternativa.",
    "Indeterminado": "Se recomienda realizar un registro más descriptivo para identificar la función."
}

def _run_inference(registros_data):
    conteo = {f: 0 for f in KEYWORDS.keys()}
    conteo["Indeterminado"] = 0
    for r in registros_data:
        hallado = False
        cons_lower = (r.consecuente if hasattr(r, 'consecuente') else r['consecuente']).lower()
        for funcion, palabras in KEYWORDS.items():
            if any(p in cons_lower for p in palabras):
                conteo[funcion] += 1
                hallado = True
        if not hallado:
            conteo["Indeterminado"] += 1
    funcion_top = max(conteo, key=conteo.get)
    return conteo, funcion_top, SUGERENCIAS.get(funcion_top)

@app.get("/analisis/{sujeto_id}", response_model=AnalisisFuncionalResponse)
def realizar_analisis_funcional(sujeto_id: uuid.UUID, db: Session = Depends(get_db)):
    registros = db.query(RegistroABC).filter(RegistroABC.sujeto_id == sujeto_id).all()
    if not registros:
        raise HTTPException(status_code=404, detail="No hay datos suficientes para analizar")
    conteo, funcion_top, sugerencia = _run_inference(registros)
    return {"sujeto_id": sujeto_id, "total_registros": len(registros),
            "distribucion_funciones": conteo, "funcion_predominante": funcion_top,
            "sugerencia_intervencion": sugerencia}

@app.post("/simulacion/analisis", response_model=AnalisisFuncionalResponse)
def simular_analisis(payload: SimulacionRequest):
    if not payload.registros:
        raise HTTPException(status_code=400, detail="Se requiere al menos un registro.")
    registros_dict = [r.model_dump() for r in payload.registros]
    conteo, funcion_top, sugerencia = _run_inference(registros_dict)
    return {"sujeto_id": payload.sujeto_id, "total_registros": len(registros_dict),
            "distribucion_funciones": conteo, "funcion_predominante": funcion_top,
            "sugerencia_intervencion": sugerencia}

@app.post("/planes/", response_model=PlanIntervencionResponse)
def crear_plan(plan: PlanIntervencionCreate, db: Session = Depends(get_db)):
    nuevo_plan = PlanIntervencion(
        sujeto_id=plan.sujeto_id, funcion_original=plan.funcion_original,
        funcion_simulada=plan.funcion_simulada,
        cambios_aplicados=[c.model_dump() for c in plan.cambios_aplicados],
        sugerencia_intervencion=plan.sugerencia_intervencion, notas=plan.notas)
    db.add(nuevo_plan)
    db.commit()
    db.refresh(nuevo_plan)
    return nuevo_plan

@app.get("/planes/{sujeto_id}", response_model=List[PlanIntervencionResponse])
def listar_planes(sujeto_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(PlanIntervencion).filter(PlanIntervencion.sujeto_id == sujeto_id).all()