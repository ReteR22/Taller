import PDFDocument from 'pdfkit'
import { Response }  from 'express'

interface WorkOrderPDF {
  number:      string
  entryDate:   Date
  deliveryDate?: Date | null
  status:      string
  description: string
  diagnosis?:  string | null
  observations?:string | null
  laborCost:   number | string
  discount:    number | string
  tax:         number | string
  total:       number | string
  vehicle: {
    brand:      string
    model:      string
    year:       number
    plate:      string
    engineType?: string | null
    mileage?:   number | null
    client: {
      firstName: string
      lastName:  string
      phone:     string
      email?:    string | null
      address?:  string | null
    }
  }
  mechanic: { name: string }
  parts: {
    name:      string
    quantity:  number
    unitPrice: number | string
    subtotal:  number | string
  }[]
}

// Colores y fuentes
const COLORS = {
  black:     '#0A0A0A',
  red:       '#EF4444',
  darkGray:  '#333333',
  midGray:   '#666666',
  lightGray: '#999999',
  bg:        '#F8F8F8',
  border:    '#E0E0E0',
}

function currency(val: number | string): string {
  return `$${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export async function generateWorkOrderPDF(wo: WorkOrderPDF, res: Response): Promise<void> {
  const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `Orden ${wo.number}` } })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="orden-${wo.number}.pdf"`)
  doc.pipe(res)

  const PAGE_WIDTH = doc.page.width - 80   // márgenes 40 c/lado

  // ── HEADER ─────────────────────────────────────────────
  // Fondo negro del header
  doc.rect(40, 40, PAGE_WIDTH, 70).fill(COLORS.black)

  // Logo texto
  doc.fontSize(24).font('Helvetica-Bold').fillColor('#FFFFFF')
  doc.text('MECH', 56, 56, { continued: true })
  doc.fillColor(COLORS.red).text('PRO')

  // Número de orden
  doc.fontSize(10).fillColor('#AAAAAA').font('Helvetica')
  doc.text('ORDEN DE TRABAJO', PAGE_WIDTH - 60, 54, { align: 'right', width: 100 })
  doc.fontSize(16).fillColor('#FFFFFF').font('Helvetica-Bold')
  doc.text(wo.number, PAGE_WIDTH - 60, 68, { align: 'right', width: 100 })

  let y = 130

  // ── DATOS DEL VEHÍCULO Y CLIENTE ───────────────────────
  // Dos columnas
  const col1X = 40
  const col2X = doc.page.width / 2 + 10
  const colW  = PAGE_WIDTH / 2 - 10

  // Box vehículo
  doc.rect(col1X, y, colW, 100).fill(COLORS.bg).stroke(COLORS.border)
  doc.fontSize(8).fillColor(COLORS.red).font('Helvetica-Bold').text('VEHÍCULO', col1X + 12, y + 10)
  doc.fontSize(13).fillColor(COLORS.black).font('Helvetica-Bold')
  doc.text(`${wo.vehicle.brand} ${wo.vehicle.model} ${wo.vehicle.year}`, col1X + 12, y + 24)
  doc.fontSize(9).font('Helvetica').fillColor(COLORS.darkGray)
  doc.text(`Patente: ${wo.vehicle.plate}`, col1X + 12, y + 42)
  if (wo.vehicle.engineType) doc.text(`Motor: ${wo.vehicle.engineType}`, col1X + 12, y + 55)
  if (wo.vehicle.mileage)    doc.text(`Kilometraje: ${wo.vehicle.mileage.toLocaleString()} km`, col1X + 12, y + 68)

  // Box cliente
  doc.rect(col2X, y, colW, 100).fill(COLORS.bg).stroke(COLORS.border)
  doc.fontSize(8).fillColor(COLORS.red).font('Helvetica-Bold').text('CLIENTE', col2X + 12, y + 10)
  doc.fontSize(13).fillColor(COLORS.black).font('Helvetica-Bold')
  doc.text(`${wo.vehicle.client.firstName} ${wo.vehicle.client.lastName}`, col2X + 12, y + 24)
  doc.fontSize(9).font('Helvetica').fillColor(COLORS.darkGray)
  doc.text(`Tel: ${wo.vehicle.client.phone}`, col2X + 12, y + 42)
  if (wo.vehicle.client.email)   doc.text(wo.vehicle.client.email,   col2X + 12, y + 55)
  if (wo.vehicle.client.address) doc.text(wo.vehicle.client.address, col2X + 12, y + 68)

  y += 116

  // ── METADATOS ──────────────────────────────────────────
  const metaItems = [
    ['Ingreso',    formatDate(wo.entryDate)],
    ['Entrega',    formatDate(wo.deliveryDate)],
    ['Mecánico',   wo.mechanic.name],
    ['Estado',     wo.status],
  ]
  doc.rect(col1X, y, PAGE_WIDTH, 30).fill('#1A1A1A')
  metaItems.forEach((item, i) => {
    const mx = col1X + 12 + i * (PAGE_WIDTH / 4)
    doc.fontSize(7).fillColor('#888888').font('Helvetica').text(item[0], mx, y + 6)
    doc.fontSize(9).fillColor('#FFFFFF').font('Helvetica-Bold').text(item[1], mx, y + 16)
  })

  y += 46

  // ── DESCRIPCIÓN Y DIAGNÓSTICO ──────────────────────────
  doc.fontSize(8).fillColor(COLORS.red).font('Helvetica-Bold').text('DESCRIPCIÓN DEL TRABAJO', col1X, y)
  y += 12
  doc.fontSize(9).fillColor(COLORS.darkGray).font('Helvetica')
  doc.text(wo.description, col1X, y, { width: PAGE_WIDTH })
  y += doc.heightOfString(wo.description, { width: PAGE_WIDTH }) + 8

  if (wo.diagnosis) {
    doc.fontSize(8).fillColor(COLORS.red).font('Helvetica-Bold').text('DIAGNÓSTICO', col1X, y)
    y += 12
    doc.fontSize(9).fillColor(COLORS.darkGray).font('Helvetica')
    doc.text(wo.diagnosis, col1X, y, { width: PAGE_WIDTH })
    y += doc.heightOfString(wo.diagnosis, { width: PAGE_WIDTH }) + 12
  }

  // ── TABLA DE REPUESTOS ─────────────────────────────────
  if (wo.parts.length > 0) {
    doc.fontSize(8).fillColor(COLORS.red).font('Helvetica-Bold').text('REPUESTOS UTILIZADOS', col1X, y)
    y += 12

    // Header de tabla
    const cols = { name: 0, qty: 340, unit: 390, sub: 460 }
    doc.rect(col1X, y, PAGE_WIDTH, 20).fill(COLORS.black)
    doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold')
    doc.text('Repuesto',      col1X + 8,    y + 6)
    doc.text('Cant.',         col1X + cols.qty,  y + 6)
    doc.text('Precio Unit.',  col1X + cols.unit, y + 6)
    doc.text('Subtotal',      col1X + cols.sub,  y + 6)
    y += 22

    // Filas
    for (const [i, part] of wo.parts.entries()) {
      const rowBg = i % 2 === 0 ? '#FFFFFF' : COLORS.bg
      doc.rect(col1X, y, PAGE_WIDTH, 18).fill(rowBg).stroke(COLORS.border)
      doc.fontSize(8.5).fillColor(COLORS.darkGray).font('Helvetica')
      doc.text(part.name,                   col1X + 8,    y + 5, { width: 320, ellipsis: true })
      doc.text(String(part.quantity),       col1X + cols.qty,  y + 5)
      doc.text(currency(part.unitPrice),    col1X + cols.unit, y + 5)
      doc.fillColor(COLORS.black).font('Helvetica-Bold')
      doc.text(currency(part.subtotal),     col1X + cols.sub,  y + 5)
      y += 20
    }
    y += 8
  }

  // ── TOTALES ────────────────────────────────────────────
  const totalsX = PAGE_WIDTH - 160
  const labelW  = 120
  const valW    = 100

  function totalRow(label: string, val: string, isBold = false, color = COLORS.darkGray) {
    doc.fontSize(9)
    doc.fillColor(color).font(isBold ? 'Helvetica-Bold' : 'Helvetica')
    doc.text(label, col1X + totalsX, y,         { width: labelW, align: 'right' })
    doc.text(val,   col1X + totalsX + labelW, y, { width: valW,   align: 'right' })
    y += 16
  }

  const partsTotal = wo.parts.reduce((s, p) => s + Number(p.subtotal), 0)
  totalRow('Repuestos:',    currency(partsTotal))
  totalRow('Mano de obra:', currency(wo.laborCost))
  if (Number(wo.discount) > 0) totalRow('Descuento:', `-${currency(wo.discount)}`)
  if (Number(wo.tax)      > 0) totalRow('IVA / Imp.:', currency(wo.tax))

  // Línea separadora
  doc.moveTo(col1X + totalsX, y).lineTo(col1X + totalsX + labelW + valW, y).stroke(COLORS.border)
  y += 6

  // Total final — caja destacada
  doc.rect(col1X + totalsX - 12, y - 4, labelW + valW + 12, 28).fill(COLORS.red)
  doc.fontSize(11).fillColor('#FFFFFF').font('Helvetica-Bold')
  doc.text('TOTAL:', col1X + totalsX, y + 4,        { width: labelW, align: 'right' })
  doc.text(currency(wo.total), col1X + totalsX + labelW, y + 4, { width: valW, align: 'right' })
  y += 40

  // ── OBSERVACIONES ──────────────────────────────────────
  if (wo.observations) {
    doc.fontSize(8).fillColor(COLORS.red).font('Helvetica-Bold').text('OBSERVACIONES', col1X, y)
    y += 12
    doc.fontSize(9).fillColor(COLORS.midGray).font('Helvetica')
    doc.text(wo.observations, col1X, y, { width: PAGE_WIDTH })
    y += 20
  }

  // ── FOOTER ─────────────────────────────────────────────
  const footerY = doc.page.height - 60
  doc.moveTo(40, footerY).lineTo(doc.page.width - 40, footerY).stroke(COLORS.border)
  doc.fontSize(8).fillColor(COLORS.lightGray).font('Helvetica')
  doc.text('MechPro — Sistema de Gestión para Talleres Mecánicos', 40, footerY + 10, { align: 'center', width: PAGE_WIDTH })
  doc.text(`Generado el ${formatDate(new Date())}`, 40, footerY + 22, { align: 'center', width: PAGE_WIDTH })

  doc.end()
}
