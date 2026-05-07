"""
AFC - Análisis Funcional de Conducta
=====================================
Punto de entrada principal del servidor.

Uso:
    uvicorn main:app --reload

La aplicación FastAPI se inicializa en backend/app.py
y se expone aquí para compatibilidad con uvicorn.
"""

from backend.app import app  # noqa: F401