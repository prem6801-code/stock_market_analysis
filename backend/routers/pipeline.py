from fastapi import APIRouter, Request, BackgroundTasks

router = APIRouter()


@router.post("/retrain")
def retrain_models(request: Request, background_tasks: BackgroundTasks):
    background_tasks.add_task(request.app.state.model_service.retrain_all)
    return {"message": "Model retraining started"}
