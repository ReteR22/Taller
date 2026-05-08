import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Car, Gauge, Fuel, Calendar, ChevronRight } from "lucide-react";
import { useVehicles, useClients } from "@/hooks";
import {
  Button,
  Input,
  Select,
  Modal,
  PageHeader,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import type { FuelType, Vehicle } from "@/types";

const FUEL_LABELS: Record<FuelType, { label: string; color: string }> = {
  GASOLINE: { label: "Nafta", color: "#F59E0B" },
  DIESEL: { label: "Diesel", color: "#6B7280" },
  ELECTRIC: { label: "Eléctrico", color: "#34D399" },
  HYBRID: { label: "Híbrido", color: "#60A5FA" },
  GNC: { label: "GNC", color: "#8B5CF6" },
};

function VehicleCard({
  vehicle,
  index,
  onClick,
}: {
  vehicle: Vehicle;
  index: number;
  onClick: () => void;
}) {
  const fuel = FUEL_LABELS[vehicle.fuelType];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-surface-raised border border-white/[0.08] rounded-xl p-5
                 hover:-translate-y-1 hover:border-white/15 hover:shadow-card-hover
                 transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-info/15 rounded-xl flex items-center justify-center">
            <Car size={18} className="text-info" />
          </div>
          <div>
            <p className="font-bold">
              {vehicle.brand} {vehicle.model}
            </p>
            <p className="text-xs text-white/40 font-mono mt-0.5">
              {vehicle.plate}
            </p>
          </div>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
          style={{
            color: fuel.color,
            background: `${fuel.color}18`,
            borderColor: `${fuel.color}35`,
          }}
        >
          {fuel.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/[0.03] rounded-lg p-2 flex flex-col items-center">
          <Calendar size={12} className="text-white/25 mb-1" />
          <p className="text-sm font-bold">{vehicle.year}</p>
          <p className="text-[10px] text-white/30">Año</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-2 flex flex-col items-center">
          <Gauge size={12} className="text-white/25 mb-1" />
          <p className="text-sm font-bold">
            {vehicle.mileage ? `${Math.round(vehicle.mileage / 1000)}k` : "—"}
          </p>
          <p className="text-[10px] text-white/30">km</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-2 flex flex-col items-center">
          <Fuel size={12} className="text-white/25 mb-1" />
          <p className="text-[11px] font-semibold text-white/70 truncate w-full text-center">
            {vehicle.engineType ?? "—"}
          </p>
          <p className="text-[10px] text-white/30">Motor</p>
        </div>
      </div>

      {/* Client name */}
      {vehicle.client && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
          <span className="text-xs text-white/35">
            {vehicle.client.firstName} {vehicle.client.lastName}
          </span>
          <ChevronRight
            size={13}
            className="text-white/20 group-hover:text-white/40 transition-colors"
          />
        </div>
      )}
    </motion.div>
  );
}

function VehicleForm({
  onSave,
  onClose,
  clients,
  clientsLoading,
}: {
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
  clients: { id: string; firstName: string; lastName: string }[];
  clientsLoading: boolean;
}) {
  const [form, setForm] = useState({
    clientId: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    plate: "",
    engineType: "",
    fuelType: "GASOLINE" as FuelType,
    mileage: "",
    color: "",
    vin: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        year: Number(form.year),
        mileage: form.mileage ? Number(form.mileage) : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const clientOptions = clientsLoading
    ? [{ value: "", label: "Cargando clientes…" }]
    : [
        { value: "", label: "Seleccioná un cliente…" },
        ...clients.map((c) => ({
          value: c.id,
          label: `${c.firstName} ${c.lastName}`,
        })),
      ];
  const fuelOptions = Object.entries(FUEL_LABELS).map(([v, l]) => ({
    value: v,
    label: l.label,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Cliente *"
        options={clientOptions}
        value={form.clientId}
        onChange={(e) => set("clientId", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Marca *"
          value={form.brand}
          onChange={(e) => set("brand", e.target.value)}
          placeholder="Toyota"
        />
        <Input
          label="Modelo *"
          value={form.model}
          onChange={(e) => set("model", e.target.value)}
          placeholder="Corolla"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Año *"
          type="number"
          value={form.year}
          onChange={(e) => set("year", e.target.value)}
          min={1960}
          max={2030}
        />
        <Input
          label="Patente *"
          value={form.plate}
          onChange={(e) => set("plate", e.target.value.toUpperCase())}
          placeholder="ABC 123"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Motor"
          value={form.engineType}
          onChange={(e) => set("engineType", e.target.value)}
          placeholder="1.8L 2ZR"
        />
        <Select
          label="Combustible"
          options={fuelOptions}
          value={form.fuelType}
          onChange={(e) => set("fuelType", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Kilometraje"
          type="number"
          value={form.mileage}
          onChange={(e) => set("mileage", e.target.value)}
          placeholder="65000"
        />
        <Input
          label="Color"
          value={form.color}
          onChange={(e) => set("color", e.target.value)}
          placeholder="Blanco"
        />
      </div>
      <Input
        label="VIN (opcional)"
        value={form.vin}
        onChange={(e) => set("vin", e.target.value)}
        placeholder="1HGCM82633A004352"
      />
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={saving}
          className="flex-1"
          disabled={!form.clientId || !form.brand || !form.model || !form.plate}
        >
          Registrar Vehículo
        </Button>
      </div>
    </form>
  );
}

export function Vehicles() {
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState("");
  const { data, loading, create } = useVehicles();
  const { data: clients, loading: clientsLoading } = useClients(1, 100); // Cargar más clientes para el select

  const filtered = search
    ? data.filter((v) =>
        `${v.brand} ${v.model} ${v.plate}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : data;

  return (
    <>
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Registrar Vehículo"
        size="lg"
      >
        <VehicleForm
          clients={clients}
          clientsLoading={clientsLoading}
          onSave={async (data) => {
            await create(data);
            setShowForm(false);
          }}
          onClose={() => setShowForm(false)}
        />
      </Modal>

      <Modal
        open={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        title="Detalles del Vehículo"
        size="lg"
      >
        {selectedVehicle && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-info/15 rounded-xl flex items-center justify-center">
                <Car size={20} className="text-info" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {selectedVehicle.brand} {selectedVehicle.model}
                </h3>
                <p className="text-sm text-white/60">{selectedVehicle.plate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-white/70">Año</label>
                <p className="text-lg font-semibold">{selectedVehicle.year}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70">
                  Kilometraje
                </label>
                <p className="text-lg font-semibold">
                  {selectedVehicle.mileage
                    ? `${selectedVehicle.mileage.toLocaleString()} km`
                    : "No registrado"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70">
                  Combustible
                </label>
                <p className="text-lg font-semibold">
                  {FUEL_LABELS[selectedVehicle.fuelType].label}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70">
                  Motor
                </label>
                <p className="text-lg font-semibold">
                  {selectedVehicle.engineType || "No especificado"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70">
                  Color
                </label>
                <p className="text-lg font-semibold">
                  {selectedVehicle.color || "No especificado"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70">VIN</label>
                <p className="text-sm font-mono">
                  {selectedVehicle.vin || "No registrado"}
                </p>
              </div>
            </div>

            {selectedVehicle.client && (
              <div className="pt-4 border-t border-white/10">
                <label className="text-sm font-medium text-white/70">
                  Cliente
                </label>
                <p className="text-lg font-semibold">
                  {selectedVehicle.client.firstName}{" "}
                  {selectedVehicle.client.lastName}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <div className="space-y-5">
        <PageHeader
          title="Vehículos"
          subtitle={`${data.length} vehículos registrados`}
          actions={
            <Button onClick={() => setShowForm(true)} icon={<Plus size={14} />}>
              Nuevo Vehículo
            </Button>
          }
        />

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por marca, modelo o patente…"
          className="max-w-sm"
          icon={
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          }
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No hay vehículos"
            description="Registrá el primer vehículo del taller"
            icon={<Car size={28} />}
            action={
              !search && (
                <Button
                  onClick={() => setShowForm(true)}
                  icon={<Plus size={14} />}
                >
                  Nuevo Vehículo
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((v, i) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                index={i}
                onClick={() => setSelectedVehicle(v)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
