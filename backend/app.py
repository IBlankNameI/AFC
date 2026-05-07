from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routes import sujetos, registros, analisis, planes

# ─── Inicialización de la aplicación ─────────────────────────
app = FastAPI(title="Sistema Automatizado de AFC - API")

# Crear tablas
Base.metadata.create_all(bind=engine)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Registrar Routers ──────────────────────────────────────
app.include_router(sujetos.router)
app.include_router(registros.router)
app.include_router(analisis.router)
app.include_router(planes.router)


# ─── Root Endpoint ───────────────────────────────────────────
@app.get("/")
def inicio():
    return {"status": "Sistema de Análisis Funcional Activo", "version": "2.0"}


@app.get("/test-db")
def probar_conexion():
    from sqlalchemy import text
    from .database import SessionLocal
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"message": "Conexión con Neon.tech exitosa."}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error de base de datos: {str(e)}")
    finally:
        db.close()
