from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Sujeto
from ..schemas import SujetoCreate, SujetoResponse

router = APIRouter(prefix="/sujetos", tags=["Sujetos"])


@router.post("/", response_model=SujetoResponse)
def crear_sujeto(sujeto: SujetoCreate, db: Session = Depends(get_db)):
    nuevo_sujeto = Sujeto(**sujeto.model_dump())
    db.add(nuevo_sujeto)
    db.commit()
    db.refresh(nuevo_sujeto)
    return nuevo_sujeto


@router.get("/", response_model=List[SujetoResponse])
def listar_sujetos(db: Session = Depends(get_db)):
    return db.query(Sujeto).all()
