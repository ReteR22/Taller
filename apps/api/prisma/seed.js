"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed...');
    // ── Usuarios ──────────────────────────────────────────────
    const adminPass = await bcryptjs_1.default.hash('admin123', 10);
    const mechPass = await bcryptjs_1.default.hash('mecanico123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@mechpro.com' },
        update: {},
        create: {
            email: 'admin@mechpro.com',
            password: adminPass,
            name: 'Pablo Administrador',
            role: 'ADMIN',
        },
    });
    const mechanic = await prisma.user.upsert({
        where: { email: 'mecanico@mechpro.com' },
        update: {},
        create: {
            email: 'mecanico@mechpro.com',
            password: mechPass,
            name: 'Lucas Mecánico',
            role: 'MECHANIC',
        },
    });
    console.log('✅ Usuarios creados');
    // ── Clientes ──────────────────────────────────────────────
    const client1 = await prisma.client.upsert({
        where: { email: 'carlos.mendez@email.com' },
        update: {},
        create: {
            firstName: 'Carlos',
            lastName: 'Méndez',
            email: 'carlos.mendez@email.com',
            phone: '+54 376 412-3456',
            address: 'Av. Corrientes 1234, Posadas',
            dni: '25.123.456',
        },
    });
    const client2 = await prisma.client.upsert({
        where: { email: 'ana.gomez@email.com' },
        update: {},
        create: {
            firstName: 'Ana',
            lastName: 'Gómez',
            email: 'ana.gomez@email.com',
            phone: '+54 376 423-7890',
            address: 'San Martín 567, Posadas',
        },
    });
    console.log('✅ Clientes creados');
    // ── Vehículos ─────────────────────────────────────────────
    const vehicle1 = await prisma.vehicle.upsert({
        where: { plate: 'ABC123' },
        update: {},
        create: {
            clientId: client1.id,
            brand: 'Toyota',
            model: 'Corolla',
            year: 2020,
            plate: 'ABC123',
            color: 'Blanco',
            engineType: '1.8L 2ZR-FAE',
            fuelType: 'GASOLINE',
            mileage: 68000,
        },
    });
    const vehicle2 = await prisma.vehicle.upsert({
        where: { plate: 'XYZ789' },
        update: {},
        create: {
            clientId: client2.id,
            brand: 'Ford',
            model: 'Focus',
            year: 2018,
            plate: 'XYZ789',
            color: 'Gris',
            engineType: '2.0L',
            fuelType: 'GASOLINE',
            mileage: 95000,
        },
    });
    console.log('✅ Vehículos creados');
    // ── Repuestos (catálogo) ───────────────────────────────────
    await prisma.part.upsert({
        where: { code: 'BUJ-NGK-001' },
        update: {},
        create: { name: 'Bujías NGK Iridio (set x4)', code: 'BUJ-NGK-001', brand: 'NGK', price: 4800, stock: 12, category: 'Encendido' },
    });
    await prisma.part.upsert({
        where: { code: 'ACE-5W30-001' },
        update: {},
        create: { name: 'Aceite Motor 5W30 Sintético 4L', code: 'ACE-5W30-001', brand: 'Mobil', price: 6200, stock: 20, category: 'Lubricantes' },
    });
    await prisma.part.upsert({
        where: { code: 'FIL-ACE-001' },
        update: {},
        create: { name: 'Filtro de Aceite', code: 'FIL-ACE-001', brand: 'Mann', price: 1200, stock: 15, category: 'Filtros' },
    });
    console.log('✅ Repuestos creados');
    // ── Orden de trabajo de ejemplo ───────────────────────────
    const existingWO = await prisma.workOrder.findUnique({ where: { number: 'WO-2025-0001' } });
    if (!existingWO) {
        await prisma.workOrder.create({
            data: {
                number: 'WO-2025-0001',
                vehicleId: vehicle1.id,
                mechanicId: mechanic.id,
                status: 'IN_PROGRESS',
                description: 'Mantenimiento general 60.000 km + revisión sistema de encendido',
                diagnosis: 'Bujías desgastadas, filtros sucios, aceite degradado',
                laborCost: 3500,
                discount: 0,
                tax: 0,
                total: 15700,
                deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                parts: {
                    create: [
                        { name: 'Bujías NGK Iridio (set x4)', quantity: 1, unitPrice: 4800, subtotal: 4800 },
                        { name: 'Aceite Motor 5W30 Sintético 4L', quantity: 1, unitPrice: 6200, subtotal: 6200 },
                        { name: 'Filtro de Aceite', quantity: 1, unitPrice: 1200, subtotal: 1200 },
                    ],
                },
            },
        });
    }
    console.log('✅ Orden de trabajo creada');
    // ── Tags de IA ────────────────────────────────────────────
    const tagsData = [
        { name: 'motor', color: '#EF4444' },
        { name: 'inyección', color: '#3B82F6' },
        { name: 'transmisión', color: '#8B5CF6' },
        { name: 'frenos', color: '#F97316' },
        { name: 'OBD', color: '#F59E0B' },
        { name: 'mantenimiento', color: '#34D399' },
        { name: 'eléctrico', color: '#06B6D4' },
        { name: 'suspensión', color: '#EC4899' },
    ];
    for (const tag of tagsData) {
        await prisma.tag.upsert({ where: { name: tag.name }, update: {}, create: tag });
    }
    console.log('✅ Tags creados');
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('  🚀 Seed completado! Datos de acceso:');
    console.log('  Admin:    admin@mechpro.com / admin123');
    console.log('  Mecánico: mecanico@mechpro.com / mecanico123');
    console.log('═══════════════════════════════════════════');
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map