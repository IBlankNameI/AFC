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

# Engine preparado para estabilidad y concurrencia en Render/Neon
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
    
    # Relación: Un sujeto tiene muchos registros
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
    metadatos_contexto = Column(JSON) # Para variables como sueño, ruido, etc.
    
    sujeto = relationship("Sujeto", back_populates="registros")

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

# 4. INICIALIZACIÓN Y DEPENDENCIAS[cite: 1]
app = FastAPI(title="Sistema Automatizado de AFC - API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción, especificar el dominio real
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

# 5. ENDPOINTS[cite: 1]

@app.get("/")
def inicio():
    return {"status": "Sistema de Análisis Funcional Activo", "version": "1.2"}

@app.get("/test-db")
def probar_conexion(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"message": "Conexión con Neon.tech exitosa."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de base de datos: {str(e)}")

# --- Endpoints de Sujetos ---

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

# --- Endpoints de Registros ABC ---

@app.post("/registros/", response_model=RegistroABCResponse)
def crear_registro(registro: RegistroABCCreate, db: Session = Depends(get_db)):
    # Verificación de integridad referencial manual para mayor seguridad
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

# --- MOTOR DE INFERENCIA FUNCIONAL ---[cite: 1]

@app.get("/analisis/{sujeto_id}", response_model=AnalisisFuncionalResponse)
def realizar_analisis_funcional(sujeto_id: uuid.UUID, db: Session = Depends(get_db)):
    registros = db.query(RegistroABC).filter(RegistroABC.sujeto_id == sujeto_id).all()
    
    if not registros:
        raise HTTPException(status_code=404, detail="No hay datos suficientes para analizar")

    # Diccionario heurístico de términos conductuales[cite: 1]
    keywords = {
        "Escape/Evitación": ["retira", "quita", "deja de", "sale", "vete", "evita", "termina", "descanso"],
        "Atención": ["mira", "regaña", "habla", "acerca", "atención", "explica", "consuela", "abrazo"],
        "Tangible": ["da", "entrega", "juguete", "caramelo", "comida", "objeto", "obtiene", "premio"],
        "Sensorial/Automático": ["solo", "mismo", "estereotipia", "estimulación", "placer", "balanceo"]
    }

    conteo = {f: 0 for f in keywords.keys()}
    conteo["Indeterminado"] = 0

    # Lógica de escaneo de patrones en el texto[cite: 1]
    for r in registros:
        hallado = False
        cons_lower = r.consecuente.lower()
        for funcion, palabras in keywords.items():
            if any(p in cons_lower for p in palabras):
                conteo[funcion] += 1
                hallado = True
        if not hallado:
            conteo["Indeterminado"] += 1

    funcion_top = max(conteo, key=conteo.get)
    
    # Mapeo de intervenciones basadas en evidencia científica[cite: 1]
    sugerencias = {
        "Escape/Evitación": "Implementar FCT (Entrenamiento en Comunicación Funcional) para solicitar descansos.",
        "Atención": "Utilizar Extinción y Reforzamiento Diferencial de Conductas Alternativas (DRA).",
        "Tangible": "Establecer sistemas de espera y reforzamiento diferencial de baja tasa.",
        "Sensorial/Automático": "Proporcionar dietas sensoriales o juguetes de estimulación alternativa.",
        "Indeterminado": "Se recomienda realizar un registro más descriptivo para identificar la función."
    }

    return {
        "sujeto_id": sujeto_id,
        "total_registros": len(registros),
        "distribucion_funciones": conteo,
        "funcion_predominante": funcion_top,
        "sugerencia_intervencion": sugerencias.get(funcion_top)
    }