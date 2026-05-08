import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Car,
  Wrench,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  X,
} from "lucide-react";
import { useClients, useDebounce, useVehicles } from "@/hooks";
import {
  Button,
  Input,
  Modal,
  PageHeader,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import type { Client } from "@/types";

// ── ClientForm ─────────────────────────────────────────────
function ClientForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Client>;
  onSave: (data: Partial<Client>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
    dni: initial?.dni ?? "",
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Requerido";
    if (!form.lastName.trim()) e.lastName = "Requerido";
    if (!form.phone.trim()) e.phone = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre *"
          value={form.firstName}
          error={errors.firstName}
          onChange={(e) =>
            setForm((p) => ({ ...p, firstName: e.target.value }))
          }
          placeholder="Juan"
        />
        <Input
          label="Apellido *"
          value={form.lastName}
          error={errors.lastName}
          onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
          placeholder="Pérez"
        />
      </div>
      <Input
        label="Teléfono *"
        value={form.phone}
        error={errors.phone}
        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
        placeholder="+54 376 400-0000"
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        placeholder="cliente@email.com"
      />
      <Input
        label="Dirección"
        value={form.address}
        onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
        placeholder="Av. San Martín 1234"
      />
      <Input
        label="DNI"
        value={form.dni}
        onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value }))}
        placeholder="25.123.456"
      />
      <div>
        <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
          Notas
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          rows={2}
          placeholder="Observaciones sobre el cliente…"
          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/25 outline-none focus:border-primary/50 transition-all resize-none"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={saving} className="flex-1">
          {initial ? "Guardar cambios" : "Crear cliente"}
        </Button>
      </div>
    </form>
  );
}

// ── ClientCard ─────────────────────────────────────────────
function ClientCard({
  client,
  index,
  onClick,
}: {
  client: Client;
  index: number;
  onClick: () => void;
}) {
  const initials = `${client.firstName[0]}${client.lastName[0]}`.toUpperCase();
  const hue =
    (client.firstName.charCodeAt(0) * 11 + client.lastName.charCodeAt(0) * 7) %
    360;
  const vehicles = client.vehicles?.length ?? 0;
  const orders =
    client.vehicles?.reduce(
      (s: number, v: any) => s + (v.workOrders?.length ?? 0),
      0,
    ) ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        type: "spring",
        stiffness: 280,
        damping: 24,
      }}
      onClick={onClick}
      className="bg-surface-raised border border-white/[0.08] rounded-xl p-5 cursor-pointer
                 hover:-translate-y-1 hover:border-white/15 hover:shadow-card-hover
                 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: `hsl(${hue},50%,35%)` }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">
            {client.firstName} {client.lastName}
          </p>
          <div className="flex items-center gap-1 text-xs text-white/35 mt-0.5">
            <Phone size={10} />
            <span>{client.phone}</span>
          </div>
        </div>
      </div>

      {client.email && (
        <div className="flex items-center gap-1.5 text-xs text-white/30 mb-3 truncate">
          <Mail size={10} className="flex-shrink-0" />
          <span className="truncate">{client.email}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          {
            icon: <Car size={12} />,
            value: vehicles,
            label: "Vehículos",
            color: "#3B82F6",
          },
          {
            icon: <Wrench size={12} />,
            value: orders,
            label: "Órdenes",
            color: "#EF4444",
          },
        ].map(({ icon, value, label, color }) => (
          <div
            key={label}
            className="bg-white/[0.03] rounded-lg p-2 text-center col-span-1"
          >
            <div className="flex justify-center mb-1" style={{ color }}>
              {icon}
            </div>
            <p className="text-sm font-bold">{value}</p>
            <p className="text-[10px] text-white/30">{label}</p>
          </div>
        ))}
        <div className="bg-white/[0.03] rounded-lg p-2 text-center col-span-1">
          <div className="flex justify-center mb-1 text-gold">
            <DollarSign size={12} />
          </div>
          <p className="text-[10px] text-white/30 mt-1">
            {new Date(client.createdAt).toLocaleDateString("es-AR", {
              month: "short",
              year: "2-digit",
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Client detail drawer ───────────────────────────────────
function ClientDrawer({
  client,
  onClose,
  onEdit,
}: {
  client: Client;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { data: vehicles, loading: loadingVehicles } = useVehicles(client.id);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md h-full bg-surface-raised border-l border-white/[0.08] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface-raised/90 backdrop-blur-sm border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-bold">
            {client.firstName} {client.lastName}
          </h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onEdit}>
              Editar
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Info */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider">
              Datos de contacto
            </h3>
            {[
              { icon: <Phone size={14} />, label: client.phone },
              { icon: <Mail size={14} />, label: client.email || "—" },
              { icon: <MapPin size={14} />, label: client.address || "—" },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 text-sm text-white/60"
              >
                <span className="text-white/25">{icon}</span>
                {label}
              </div>
            ))}
          </section>

          {/* Vehicles */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider">
                Vehículos
              </h3>
              <Badge>{vehicles.length}</Badge>
            </div>
            {loadingVehicles ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : vehicles.length === 0 ? (
              <p className="text-sm text-white/25">Sin vehículos registrados</p>
            ) : (
              <div className="space-y-2">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="bg-surface border border-white/[0.06] rounded-lg p-3 flex items-center gap-3"
                  >
                    <Car size={16} className="text-info flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">
                        {v.brand} {v.model} {v.year}
                      </p>
                      <p className="text-xs text-white/35">
                        {v.plate} · {v.engineType || "Motor no especificado"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-white/[0.06] text-white/50 text-xs font-semibold px-2 py-0.5 rounded-full">
      {children}
    </span>
  );
}

// ── Main page ──────────────────────────────────────────────
export function Clients() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const debouncedQ = useDebounce(search, 400);

  const { data, total, loading, create, update } = useClients(1, 24);

  // Note: Hook doesn't take q directly; simplified version
  const filtered = debouncedQ
    ? data.filter((c) =>
        `${c.firstName} ${c.lastName} ${c.phone} ${c.email}`
          .toLowerCase()
          .includes(debouncedQ.toLowerCase()),
      )
    : data;

  async function handleCreate(payload: Partial<Client>) {
    await create(payload);
    setShowForm(false);
  }
  async function handleUpdate(payload: Partial<Client>) {
    if (!editing) return;
    await update(editing.id, payload);
    setEditing(null);
    if (selected?.id === editing.id)
      setSelected({ ...selected, ...payload } as Client);
  }

  return (
    <>
      {/* New client modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nuevo Cliente"
      >
        <ClientForm onSave={handleCreate} onClose={() => setShowForm(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar Cliente"
      >
        {editing && (
          <ClientForm
            initial={editing}
            onSave={handleUpdate}
            onClose={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <ClientDrawer
            client={selected}
            onClose={() => setSelected(null)}
            onEdit={() => {
              setEditing(selected);
              setSelected(null);
            }}
          />
        )}
      </AnimatePresence>

      <div className="space-y-5">
        <PageHeader
          title="Clientes"
          subtitle={`${total} clientes registrados`}
          actions={
            <Button onClick={() => setShowForm(true)} icon={<Plus size={14} />}>
              Nuevo Cliente
            </Button>
          }
        />

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email…"
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
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No se encontraron clientes"
            description={
              search
                ? "Probá con otro término de búsqueda"
                : "Agregá el primer cliente del taller"
            }
            icon={
              <svg
                width={28}
                height={28}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            }
            action={
              !search && (
                <Button
                  onClick={() => setShowForm(true)}
                  icon={<Plus size={14} />}
                >
                  Nuevo Cliente
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((client, i) => (
              <ClientCard
                key={client.id}
                client={client}
                index={i}
                onClick={() => setSelected(client)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
