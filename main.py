from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RoofData(BaseModel):
    area_m2: float

@app.post("/api/calculate")
async def calculate_water(data: RoofData):
    rainfall_mm = 1400
    efficiency = 0.85
    liters_saved = data.area_m2 * rainfall_mm * efficiency
    return {
        "roof_area_m2": data.area_m2,
        "annual_rainfall_mm": rainfall_mm,
        "estimated_liters_saved": round(liters_saved, 2)
    }

@app.get("/api/report")
async def download_report(area: float):
    rainfall_mm = 1400
    efficiency = 0.85
    liters_saved = round(area * rainfall_mm * efficiency, 2)

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Header Banner
    p.setFillColorRGB(0.05, 0.3, 0.6)
    p.rect(0, height - 100, width, 100, fill=1, stroke=0)

    p.setFillColorRGB(1, 1, 1)
    p.setFont("Helvetica-Bold", 20)
    p.drawString(50, height - 45, "Rainwater Harvesting Assessment Report")
    
    p.setFont("Helvetica", 11)
    p.drawString(50, height - 70, "Certified Sustainable Urban Water Management | Chennai, India")

    # Body Content
    p.setFillColorRGB(0.1, 0.1, 0.1)
    p.setFont("Helvetica-Bold", 15)
    p.drawString(50, height - 150, "Site Assessment Summary")

    p.setFont("Helvetica", 12)
    y = height - 190
    p.drawString(50, y, f"• Target Zone: Chennai Metropolitan Area")
    p.drawString(50, y - 25, f"• Annual Average Rainfall: {rainfall_mm} mm")
    p.drawString(50, y - 50, f"• Runoff Coefficient (Concrete Roof): {efficiency} (85% efficiency)")
    p.drawString(50, y - 75, f"• Measured Roof Surface Area: {area:,.2f} m²")

    # Highlight Box for Savings
    p.setFillColorRGB(0.9, 0.95, 1)
    p.setStrokeColorRGB(0.2, 0.5, 0.8)
    p.roundRect(50, y - 180, width - 100, 80, 10, fill=1, stroke=1)

    p.setFillColorRGB(0.05, 0.3, 0.6)
    p.setFont("Helvetica-Bold", 13)
    p.drawString(70, y - 130, "ESTIMATED ANNUAL WATER SAVINGS:")
    
    p.setFont("Helvetica-Bold", 20)
    p.drawString(70, y - 160, f"{liters_saved:,.2f} Liters / Year")

    # Footer
    p.setFillColorRGB(0.5, 0.5, 0.5)
    p.setFont("Helvetica", 9)
    p.drawString(50, 50, "Generated dynamically via Python FastAPI & Google Maps API. Ready for municipal submission.")

    p.showPage()
    p.save()

    buffer.seek(0)
    return Response(
        content=buffer.getvalue(), 
        media_type="application/pdf", 
        headers={"Content-Disposition": "attachment; filename=RTRWH_Assessment_Report.pdf"}
    )