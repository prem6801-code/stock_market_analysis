import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.data_service import DataService
from services.model_service import ModelService
from services.pipeline_service import PipelineService
from routers import stocks, predictions, analytics, pipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

data_service = DataService()
model_service = ModelService(data_service)
pipeline_service = PipelineService(data_service, model_service)


@asynccontextmanager
async def lifespan(app: FastAPI):
    pipeline_service.start()
    yield
    pipeline_service.stop()


app = FastAPI(title="Stock Market Dashboard API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.data_service = data_service
app.state.model_service = model_service
app.state.pipeline_service = pipeline_service

app.include_router(stocks.router, prefix="/api/stocks", tags=["stocks"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(pipeline.router, prefix="/api/pipeline", tags=["pipeline"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
