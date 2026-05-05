from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

# Lo que el usuario nos envía al crear un sujeto
class SujetoCreate(BaseModel):
    nombre_codigo: str
    descripcion_base: Optional[str] = None

# Lo que el sistema devuelve (incluye ID y fecha)
class SujetoResponse(SujetoCreate):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True # Esto permite que Pydantic lea modelos de SQLAlchemy