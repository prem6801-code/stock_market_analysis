from fastapi import APIRouter, Request, BackgroundTasks

router = APIRouter()


@router.get("/status")
def get_pipeline_status(request: Request):
    return request.app.state.pipeline_service.get_status()


@router.post("/run")
def trigger_pipeline(request: Request, background_tasks: BackgroundTasks):
    background_tasks.add_task(request.app.state.pipeline_service.run_now)
    return {"message": "Pipeline triggered", "status": "running"}


@router.post("/retrain")
def retrain_models(request: Request, background_tasks: BackgroundTasks):
    background_tasks.add_task(request.app.state.model_service.retrain_all)
    return {"message": "Model retraining started"}
