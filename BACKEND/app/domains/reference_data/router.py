from core.constants import DEPARTMENTS
from fastapi import APIRouter
from starlette import status

reference_data_router = APIRouter()


@reference_data_router.get("/departments", status_code=status.HTTP_200_OK)
def get_departments() -> dict:
    return {"data": DEPARTMENTS}
