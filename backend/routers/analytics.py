from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/correlation")
def get_correlation(request: Request):
    return request.app.state.data_service.get_correlation()


@router.get("/performance")
def get_performance(request: Request):
    return {"data": request.app.state.data_service.get_performance()}
