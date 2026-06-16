from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_snacks():
    return {"message": "Snack API is under development"}
