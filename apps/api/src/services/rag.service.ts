import { prisma } from '../config/database'
import { logger }  from '../utils/logger'

interface RAGOptions {
  brand?: string | null
  model?: string | null
  topK?:  number
}

interface RetrievedChunk {
  title:      string
  content:    string
  documentId: string
  type:       string
  score:      number
}

class RAGService {
  /**
   * Recupera los fragmentos más relevantes de la base de conocimiento.
   * Usa MySQL FULLTEXT search como búsqueda primaria.
   */
  async retrieve(query: string, options: RAGOptions = {}): Promise<RetrievedChunk[]> {
    const { brand, model, topK = 5 } = options

    try {
      // Construcción dinámica del WHERE para MySQL FULLTEXT
      // Nota: Prisma raw query para MATCH ... AGAINST
      const brandFilter = brand ? `AND (d.brand IS NULL OR d.brand = '${brand.replace(/'/g,"''")}')` : ''
      const modelFilter = model ? `AND (d.model IS NULL OR d.model = '${model.replace(/'/g,"''")}')` : ''

      const results = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          d.id    AS documentId,
          d.title AS title,
          d.type  AS type,
          c.content,
          MATCH(c.content) AGAINST(? IN NATURAL LANGUAGE MODE) AS score
        FROM document_chunks c
        JOIN knowledge_documents d ON d.id = c.document_id
        WHERE
          d.is_active = 1
          AND MATCH(c.content) AGAINST(? IN NATURAL LANGUAGE MODE) > 0
          ${brandFilter}
          ${modelFilter}
        ORDER BY score DESC
        LIMIT ?
      `, query, query, topK)

      return results
    } catch (err) {
      // Fallback: LIKE search si FULLTEXT no está disponible
      logger.warn('RAG FULLTEXT search falló, usando LIKE fallback:', err)
      return this.fallbackSearch(query, options)
    }
  }

  /**
   * Fallback con búsqueda LIKE si FULLTEXT no está configurado
   */
  private async fallbackSearch(query: string, options: RAGOptions): Promise<RetrievedChunk[]> {
    const { brand, model, topK = 5 } = options
    const terms = query.split(' ').filter(t => t.length > 3).slice(0, 5)

    const chunks = await prisma.documentChunk.findMany({
      where: {
        document: {
          isActive: true,
          ...(brand && { OR: [{ brand: null }, { brand }] }),
          ...(model && { OR: [{ model: null }, { model }] }),
        },
        OR: terms.map(t => ({ content: { contains: t } })),
      },
      include: { document: { select: { id: true, title: true, type: true } } },
      take: topK,
    })

    return chunks.map(c => ({
      documentId: c.document.id,
      title:      c.document.title,
      type:       c.document.type,
      content:    c.content,
      score:      1,
    }))
  }

  /**
   * Indexa un documento: lo divide en chunks y los guarda en DB.
   * Llamar después de crear/actualizar un KnowledgeDocument.
   */
  async indexDocument(documentId: string): Promise<void> {
    const doc = await prisma.knowledgeDocument.findUniqueOrThrow({
      where: { id: documentId },
    })

    // Eliminar chunks anteriores
    await prisma.documentChunk.deleteMany({ where: { documentId } })

    // Dividir en chunks de ~1500 chars con 200 de overlap
    const chunks = this.chunkText(doc.content, 1500, 200)

    // Insertar en lotes para no saturar la BD
    const BATCH = 20
    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH)
      await prisma.documentChunk.createMany({
        data: batch.map((content, j) => ({
          documentId,
          content,
          chunkIndex: i + j,
        })),
      })
    }

    logger.info(`RAG: indexados ${chunks.length} chunks para "${doc.title}"`)
  }

  /**
   * Re-indexa todos los documentos activos.
   * Útil al cambiar la estrategia de chunking.
   */
  async reindexAll(): Promise<void> {
    const docs = await prisma.knowledgeDocument.findMany({ where: { isActive: true } })
    logger.info(`RAG: re-indexando ${docs.length} documentos…`)
    for (const doc of docs) {
      await this.indexDocument(doc.id)
    }
    logger.info('RAG: re-indexación completada')
  }

  /**
   * Divide texto en chunks con overlap para evitar cortar contexto.
   */
  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = []
    // Intentar dividir en párrafos primero
    const paragraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 30)

    let currentChunk = ''
    for (const para of paragraphs) {
      if ((currentChunk + '\n\n' + para).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        // Overlap: tomar las últimas palabras del chunk anterior
        const words = currentChunk.split(' ')
        currentChunk = words.slice(-Math.floor(overlap / 6)).join(' ') + '\n\n' + para
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para
      }
    }
    if (currentChunk.trim().length > 30) chunks.push(currentChunk.trim())

    // Si no hay párrafos, dividir por caracteres
    if (chunks.length === 0) {
      let start = 0
      while (start < text.length) {
        chunks.push(text.slice(start, start + chunkSize))
        start += chunkSize - overlap
      }
    }

    return chunks
  }
}

export const ragService = new RAGService()
