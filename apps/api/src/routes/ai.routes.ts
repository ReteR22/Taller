import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import OpenAI from "openai";
import { prisma } from "../config/database";
import { authenticate, AuthRequest } from "../middlewares/auth.middleware";
import { logger } from "../utils/logger";

export const aiRouter = Router();
aiRouter.use(authenticate);

// Groq usa la API compatible con OpenAI — solo cambia baseURL y el modelo
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `Eres MechPro AI, un asistente experto en mecánica automotriz con más de 20 años de experiencia.
Ayudás a mecánicos profesionales con diagnóstico de fallas, procedimientos de reparación, especificaciones técnicas,
comparación de repuestos, torques, códigos OBD-II y mantenimiento preventivo.
Respondé de forma técnica y precisa. Usá markdown para estructurar respuestas complejas.
Si no estás seguro de algo, decilo claramente.`;

// ── POST /api/ai/chats ─────────────────────────────────────
aiRouter.post(
  "/chats",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { title, vehicleContext, folderId } = z
        .object({
          title: z.string().min(1).max(200),
          folderId: z.string().optional(),
          vehicleContext: z
            .object({
              brand: z.string(),
              model: z.string(),
              year: z.number().optional(),
              engineType: z.string().optional(),
              fuelType: z.string().optional(),
              mileage: z.number().optional(),
              symptoms: z.string().optional(),
            })
            .optional(),
        })
        .parse(req.body);

      const chat = await prisma.chat.create({
        data: {
          userId: req.user.id,
          title,
          folderId,
          model: GROQ_MODEL,
          vehicleContext: vehicleContext
            ? { create: vehicleContext }
            : undefined,
        },
        include: { vehicleContext: true, folder: true },
      });
      res.status(201).json(chat);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/ai/chats ──────────────────────────────────────
aiRouter.get(
  "/chats",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { folderId, q } = req.query;

      const where: any = { userId: req.user.id };
      if (folderId) where.folderId = folderId;
      if (q)
        where.OR = [
          { title: { contains: q } },
          { messages: { some: { content: { contains: q } } } },
        ];

      const chats = await prisma.chat.findMany({
        where,
        include: {
          vehicleContext: true,
          folder: true,
          tags: { include: { tag: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { content: true, role: true },
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      });
      res.json(chats);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/ai/chats/:id ──────────────────────────────────
aiRouter.get(
  "/chats/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const chat = await prisma.chat.findUniqueOrThrow({
        where: { id: req.params.id as string, userId: req.user.id },
        include: {
          vehicleContext: true,
          folder: true,
          tags: { include: { tag: true } },
          messages: { orderBy: { createdAt: "asc" } },
        },
      });
      res.json(chat);
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /api/ai/chats/:id/messages — STREAMING ───────────
aiRouter.post(
  "/chats/:id/messages",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { message } = z
        .object({ message: z.string().min(1) })
        .parse(req.body);

      const chat = await prisma.chat.findUniqueOrThrow({
        where: { id: req.params.id as string, userId: req.user.id },
        include: {
          messages: { orderBy: { createdAt: "asc" }, take: 20 },
          vehicleContext: true,
        },
      });

      // Guardar mensaje del usuario
      await prisma.message.create({
        data: { chatId: chat.id, role: "USER", content: message },
      });

      // Construir system prompt con contexto del vehículo
      let systemPrompt = SYSTEM_PROMPT;
      if (chat.vehicleContext) {
        const vc = chat.vehicleContext;
        systemPrompt += `\n\nVEHÍCULO EN CONTEXTO:\n`;
        systemPrompt += `- Marca/Modelo: ${vc.brand} ${vc.model}\n`;
        if (vc.year) systemPrompt += `- Año: ${vc.year}\n`;
        if (vc.engineType) systemPrompt += `- Motor: ${vc.engineType}\n`;
        if (vc.fuelType) systemPrompt += `- Combustible: ${vc.fuelType}\n`;
        if (vc.mileage) systemPrompt += `- Kilometraje: ${vc.mileage} km\n`;
        if (vc.symptoms) systemPrompt += `- Síntomas: ${vc.symptoms}\n`;
      }

      // Historial de mensajes para la API (formato OpenAI)
      const history = (chat as any).messages.map((m: any) => ({
        role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }));

      // SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.flushHeaders();

      let fullContent = "";
      let outputTokens = 0;

      // Streaming con el SDK de OpenAI (compatible con Groq)
      const stream = await groq.chat.completions.create({
        model: GROQ_MODEL,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: message },
        ],
        max_tokens: 2048,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (delta) {
          fullContent += delta;
          res.write(
            `data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`,
          );
        }
        // El uso de tokens viene en el último chunk (stream_options o usage)
        if (chunk.usage?.completion_tokens) {
          outputTokens = chunk.usage.completion_tokens;
        }
      }

      // Guardar respuesta en DB
      await prisma.message.create({
        data: {
          chatId: chat.id,
          role: "ASSISTANT",
          content: fullContent,
          tokens: outputTokens,
        },
      });
      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          totalTokens: { increment: outputTokens },
          updatedAt: new Date(),
        },
      });

      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
    } catch (err) {
      logger.error("Groq streaming error:", err);
      res.write(
        `data: ${JSON.stringify({ type: "error", message: "Error en el asistente" })}\n\n`,
      );
      res.end();
    }
  },
);

// ── DELETE /api/ai/chats/:id ───────────────────────────────
aiRouter.delete(
  "/chats/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await prisma.chat.delete({
        where: { id: req.params.id as string, userId: req.user.id },
      });
      res.json({ message: "Conversación eliminada" });
    } catch (err) {
      next(err);
    }
  },
);

// ── Folders ────────────────────────────────────────────────
aiRouter.get(
  "/folders",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const folders = await prisma.chatFolder.findMany({
        where: { userId: req.user.id },
        include: { _count: { select: { chats: true } } },
        orderBy: { createdAt: "asc" },
      });
      res.json(folders);
    } catch (err) {
      next(err);
    }
  },
);

aiRouter.post(
  "/folders",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, color } = z
        .object({ name: z.string().min(1), color: z.string().optional() })
        .parse(req.body);
      const folder = await prisma.chatFolder.create({
        data: { name, color, userId: req.user.id },
      });
      res.status(201).json(folder);
    } catch (err) {
      next(err);
    }
  },
);

// ── Tags ───────────────────────────────────────────────────
aiRouter.get(
  "/tags",
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
      res.json(tags);
    } catch (err) {
      next(err);
    }
  },
);
