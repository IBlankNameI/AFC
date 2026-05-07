import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import RegistroABC
from ..schemas import AnalisisFuncionalResponse, SimulacionRequest
from ..engine import run_inference

router = APIRouter(tags=["Análisis Funcional"])


@router.get("/analisis/{sujeto_id}", response_model=AnalisisFuncionalResponse)
def realizar_analisis_funcional(sujeto_id: uuid.UUID, db: Session = Depends(get_db)):
    registros = db.query(RegistroABC).filter(RegistroABC.sujeto_id == sujeto_id).all()
    if not registros:
        raise HTTPException(status_code=404, detail="No hay datos suficientes para analizar")
    conteo, funcion_top, sugerencia = run_inference(registros)
    return {
        "sujeto_id": sujeto_id,
        "total_registros": len(registros),
        "distribucion_funciones": conteo,
        "funcion_predominante": funcion_top,
        "sugerencia_intervencion": sugerencia,
    }


@router.post("/simulacion/analisis", response_model=AnalisisFuncionalResponse)
def simular_analisis(payload: SimulacionRequest):
    if not payload.registros:
        raise HTTPException(status_code=400, detail="Se requiere al menos un registro.")
    registros_dict = [r.model_dump() for r in payload.registros]
    conteo, funcion_top, sugerencia = run_inference(registros_dict)
    return {
        "sujeto_id": payload.sujeto_id,
        "total_registros": len(registros_dict),
        "distribucion_funciones": conteo,
        "funcion_predominante": funcion_top,
        "sugerencia_intervencion": sugerencia,
    }
