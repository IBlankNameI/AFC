import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


# ─── Modelos de Base de Datos (SQLAlchemy) ────────────────────

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
