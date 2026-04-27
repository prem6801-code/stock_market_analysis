from fastapi import APIRouter, Request, Query

router = APIRouter()


@router.get("/all")
def get_all_predictions(request: Request):
    preds = request.app.state.model_service.next_predictions
    return {"predictions": list(preds.values())}


@router.get("/{symbol}/history")
def get_prediction_history(
    symbol: str, request: Request, days: int = Query(90, ge=30, le=365)
):
    test_preds = request.app.state.model_service.test_predictions.get(symbol, [])
    return {"symbol": symbol, "data": test_preds[-days:]}


@router.get("/{symbol}")
def get_prediction(symbol: str, request: Request):
    pred = request.app.state.model_service.next_predictions.get(symbol)
    if not pred:
        return {"error": f"No prediction available for {symbol}"}
    return pred
