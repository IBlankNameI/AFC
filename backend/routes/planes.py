import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import PlanIntervencion
from ..schemas import PlanIntervencionCreate, PlanIntervencionResponse

router = APIRouter(prefix="/planes", tags=["Planes de Intervención"])


@router.post("/", response_model=PlanIntervencionResponse)
def crear_plan(plan: PlanIntervencionCreate, db: Session = Depends(get_db)):
    nuevo_plan = PlanIntervencion(
        sujeto_id=plan.sujeto_id,
        funcion_original=plan.funcion_original,
        funcion_simulada=plan.funcion_simulada,
        cambios_aplicados=[c.model_dump() for c in plan.cambios_aplicados],
        sugerencia_intervencion=plan.sugerencia_intervencion,
        notas=plan.notas,
    )
    db.add(nuevo_plan)
    db.commit()
    db.refresh(nuevo_plan)
    return nuevo_plan


@router.get("/{sujeto_id}", response_model=List[PlanIntervencionResponse])
def listar_planes(sujeto_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(PlanIntervencion).filter(PlanIntervencion.sujeto_id == sujeto_id).all()
