from fastapi import APIRouter, Request, Query
from constants import STOCKS

router = APIRouter()


@router.get("/")
def list_stocks():
    return {"stocks": STOCKS}


@router.get("/{symbol}/history")
def get_history(symbol: str, request: Request, days: int = Query(365, ge=30, le=1825)):
    data = request.app.state.data_service.get_history(symbol, days)
    return {"symbol": symbol, "data": data}


@router.get("/{symbol}/metrics")
def get_stock_metrics(symbol: str, request: Request):
    perf = request.app.state.data_service.get_performance()
    stock = next((p for p in perf if p["symbol"] == symbol), None)
    if not stock:
        return {"error": f"Symbol {symbol} not found"}
    return stock
