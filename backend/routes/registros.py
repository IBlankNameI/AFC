import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Sujeto, RegistroABC
from ..schemas import RegistroABCCreate, RegistroABCResponse

router = APIRouter(prefix="/registros", tags=["Registros ABC"])


@router.post("/", response_model=RegistroABCResponse)
def crear_registro(registro: RegistroABCCreate, db: Session = Depends(get_db)):
    db_sujeto = db.query(Sujeto).filter(Sujeto.id == registro.sujeto_id).first()
    if not db_sujeto:
        raise HTTPException(status_code=404, detail="Sujeto no encontrado")
    nuevo_registro = RegistroABC(**registro.model_dump())
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    return nuevo_registro


@router.get("/{sujeto_id}", response_model=List[RegistroABCResponse])
def listar_registros_por_sujeto(sujeto_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(RegistroABC).filter(RegistroABC.sujeto_id == sujeto_id).all()
