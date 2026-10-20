from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.analytics.exporter import generate_report_export, export_all_power_bi_csvs

router = APIRouter()

@router.get("/export")
def export_report(
    format: str = Query("json", pattern="^(json|csv)$"),
    db: Session = Depends(get_db)
):
    content = generate_report_export(db, export_format=format)
    media_type = "application/json" if format == "json" else "text/csv"
    filename = f"synthetic_identity_audit_report.{format}"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/generate-power-bi")
def generate_power_bi_exports(db: Session = Depends(get_db)):
    files = export_all_power_bi_csvs(db)
    return {
        "status": "success",
        "message": f"Successfully generated {len(files)} Power BI CSV export files in the reports/ directory.",
        "files": files
    }
