import os, uuid, shutil
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.core.config import settings
from app.core.security import get_current_user_id

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload")
def upload_file(doc_type: str, f: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    os.makedirs(settings.file_upload_dir, exist_ok=True)
    file_id = str(uuid.uuid4())
    dest = os.path.join(settings.file_upload_dir, f"{file_id}_{f.filename}")
    with open(dest, "wb") as out:
        shutil.copyfileobj(f.file, out)
    return {"file_id": file_id, "file_name": f.filename, "doc_type": doc_type, "storage_path": dest}
