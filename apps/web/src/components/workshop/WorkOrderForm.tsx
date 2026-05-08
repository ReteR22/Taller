import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { Button, Input, Select, Modal } from "@/components/ui";
import { apiClient } from "@/services/api";
import type { Client, Vehicle } from "@/types";

interface Part {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function WorkOrderForm({ open, onClose, onSaved }: Props) {
  const [step, setStep] = useState(1); // 1: vehículo, 2: trabajo, 3: repuestos
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Step 1 — selección
  const [clientId, setClientId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [mechanicId, setMechanicId] = useState("");
  const [, setMechanics] = useState<{ id: string; name: string }[]>([]);

  // Step 2 — trabajo
  const [description, setDescription] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [observations, setObservations] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [discount, setDiscount] = useState("0");
  const [deliveryDate, setDeliveryDate] = useState("");

  // Step 3 — repuestos
  const [parts, setParts] = useState<Part[]>([
    { name: "", quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      apiClient
        .get("/clients?limit=200")
        .then((r) => setClients(r.data.data ?? [])),
      apiClient.get("/auth/me").then((r) => setMechanicId(r.data.id)),
    ]).catch(console.error);

    // Cargar mecánicos (simplificado — en producción usar /api/users?role=MECHANIC)
    apiClient.get("/auth/me").then((r) => {
      setMechanics([{ id: r.data.id, name: r.data.name }]);
      setMechanicId(r.data.id);
    });
  }, [open]);

  useEffect(() => {
    if (!clientId) {
      setVehicles([]);
      setVehicleId("");
      return;
    }
    apiClient
      .get(`/vehicles?clientId=${clientId}&limit=50`)
      .then((r) => setVehicles(r.data.data ?? []))
      .catch(() => setVehicles([]));
  }, [clientId]);

  const partsTotal = parts.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
  const total = partsTotal + Number(laborCost || 0) - Number(discount || 0);

  function addPart() {
    setParts((prev) => [...prev, { name: "", quantity: 1, unitPrice: 0 }]);
  }
  function removePart(i: number) {
    setParts((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updatePart(i: number, field: keyof Part, val: string | number) {
    setParts((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)),
    );
  }

  async function handleSave() {
    if (!vehicleId || !mechanicId || !description) return;
    setSaving(true);
    try {
      await apiClient.post("/work-orders", {
        vehicleId,
        mechanicId,
        description,
        diagnosis: diagnosis || undefined,
        observations: observations || undefined,
        laborCost: Number(laborCost || 0),
        discount: Number(discount || 0),
        deliveryDate: deliveryDate
          ? new Date(deliveryDate).toISOString()
          : undefined,
        parts: parts.filter((p) => p.name.trim()),
      });
      onSaved();
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setStep(1);
    setClientId("");
    setVehicleId("");
    setDescription("");
    setDiagnosis("");
    setObservations("");
    setLaborCost("");
    setDiscount("0");
    setParts([{ name: "", quantity: 1, unitPrice: 0 }]);
    onClose();
  }

  const clientOptions = [
    { value: "", label: "Seleccioná un cliente…" },
    ...clients.map((c) => ({
      value: c.id,
      label: `${c.firstName} ${c.lastName}`,
    })),
  ];
  const vehicleOptions = [
    { value: "", label: "Seleccioná un vehículo…" },
    ...vehicles.map((v) => ({
      value: v.id,
      label: `${v.brand} ${v.model} ${v.year} — ${v.plate}`,
    })),
  ];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nueva Orden de Trabajo"
      size="xl"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex items-center gap-2 ${s < 3 ? "flex-1" : ""}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${step >= s ? "bg-primary text-white" : "bg-white/[0.06] text-white/30"}`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-0.5 transition-all ${step > s ? "bg-primary" : "bg-white/[0.08]"}`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-6 -mt-2 text-xs text-white/35">
        <span className={step === 1 ? "text-white" : ""}>Vehículo</span>
        <span className={step === 2 ? "text-white" : ""}>Trabajo</span>
        <span className={step === 3 ? "text-white" : ""}>Repuestos</span>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Select
            label="Cliente *"
            options={clientOptions}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
          {clientId && (
            <Select
              label="Vehículo *"
              options={vehicleOptions}
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            />
          )}
          <div className="flex justify-end pt-2">
            <Button disabled={!vehicleId} onClick={() => setStep(2)}>
              Siguiente →
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
              Descripción del trabajo *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describí el trabajo a realizar…"
              rows={3}
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/25 outline-none focus:border-primary/50 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
              Diagnóstico
            </label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Diagnóstico técnico encontrado…"
              rows={2}
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/25 outline-none focus:border-primary/50 transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mano de obra ($)"
              type="number"
              value={laborCost}
              onChange={(e) => setLaborCost(e.target.value)}
              placeholder="0"
            />
            <Input
              label="Descuento ($)"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
            />
          </div>
          <Input
            label="Fecha de entrega estimada"
            type="datetime-local"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
          <div className="flex justify-between pt-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              ← Anterior
            </Button>
            <Button disabled={!description} onClick={() => setStep(3)}>
              Siguiente →
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            {parts.map((part, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-end"
              >
                <Input
                  placeholder="Nombre del repuesto"
                  value={part.name}
                  onChange={(e) => updatePart(i, "name", e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Cant."
                  value={part.quantity}
                  min={1}
                  onChange={(e) =>
                    updatePart(i, "quantity", parseInt(e.target.value) || 1)
                  }
                />
                <Input
                  type="number"
                  placeholder="Precio"
                  value={part.unitPrice || ""}
                  min={0}
                  onChange={(e) =>
                    updatePart(i, "unitPrice", parseFloat(e.target.value) || 0)
                  }
                />
                <button
                  onClick={() => removePart(i)}
                  disabled={parts.length === 1}
                  className="w-8 h-10 flex items-center justify-center text-white/20 hover:text-red-400 disabled:opacity-30 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addPart}
            className="btn-ghost flex items-center gap-2 text-sm py-2"
          >
            <Plus size={14} /> Agregar repuesto
          </button>

          {/* Resumen de totales */}
          <div className="bg-surface border border-white/[0.06] rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-white/50">
              <span>Repuestos</span>
              <span>${partsTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Mano de obra</span>
              <span>${Number(laborCost || 0).toLocaleString()}</span>
            </div>
            {Number(discount) > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Descuento</span>
                <span>-${Number(discount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gold border-t border-white/[0.06] pt-2 mt-1">
              <span>TOTAL</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="secondary" onClick={() => setStep(2)}>
              ← Anterior
            </Button>
            <Button loading={saving} onClick={handleSave} icon={null}>
              {saving ? "Guardando…" : "Crear Orden"}
            </Button>
          </div>
        </motion.div>
      )}
    </Modal>
  );
}
