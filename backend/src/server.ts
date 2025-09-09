// backend/src/server.ts
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { z, ZodError } from 'zod';

// Swagger
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// ---------- Middleware ----------
app.use(
  cors({
    origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// ---------- Swagger (full paths + requestBody) ----------
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: { title: 'Mini-CRM API', version: '1.0.0' },
    servers: [{ url: `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    paths: {
      '/auth/signup': {
        post: {
          summary: 'Create user',
          tags: ['auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'demo@mini-crm.test' },
                    password: { type: 'string', minLength: 4, example: 'Demo#1234' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Created' }, 400: { description: 'Bad request' }, 409: { description: 'Email exists' } },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Login',
          tags: ['auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'demo@mini-crm.test' },
                    password: { type: 'string', example: 'Demo#1234' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Token',
              content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } } } } },
            },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/contacts': {
        get: {
          summary: 'List contacts (current user)',
          tags: ['contacts'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'pageSize', schema: { type: 'integer', default: 10 } },
          ],
          responses: { 200: { description: 'OK' } },
        },
        post: {
          summary: 'Create contact',
          tags: ['contacts'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email'],
                  properties: {
                    name: { type: 'string', example: 'Alice' },
                    email: { type: 'string', example: 'alice@acme.com' },
                    company: { type: 'string', example: 'Acme' },
                    phone: { type: 'string', example: '555-1234' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/contacts/{id}': {
        get: {
          summary: 'Get one contact (must own)',
          tags: ['contacts'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } },
        },
        patch: {
          summary: 'Update contact (must own)',
          tags: ['contacts'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    company: { type: 'string' },
                    phone: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } },
        },
        delete: {
          summary: 'Delete contact (must own)',
          tags: ['contacts'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'OK' } },
        },
      },
      '/contacts/{id}/notes': {
        get: {
          summary: 'List notes for a contact (must own contact)',
          tags: ['notes'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'OK' } },
        },
        post: {
          summary: 'Create note for a contact (must own contact)',
          tags: ['notes'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['body'], properties: { body: { type: 'string' } } } } },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/deals': {
        get: {
          summary: 'List deals (current user via contact ownership)',
          tags: ['deals'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'pageSize', schema: { type: 'integer', default: 10 } },
          ],
          responses: { 200: { description: 'OK' } },
        },
        post: {
          summary: 'Create deal for a contact (must own the contact)',
          tags: ['deals'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'contactId'],
                  properties: {
                    title: { type: 'string', example: 'Website Redesign' },
                    amount: { type: 'number', example: 12000 },
                    stage: { type: 'string', example: 'Prospect' },
                    contactId: { type: 'integer', example: 1 },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/deals/{id}': {
        patch: {
          summary: 'Update deal (must own via contact)',
          tags: ['deals'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    amount: { type: 'number' },
                    stage: { type: 'string', example: 'Qualified' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'OK' } },
        },
        delete: {
          summary: 'Delete deal (must own via contact)',
          tags: ['deals'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'OK' } },
        },
      },
      '/analytics': {
        get: {
          summary: 'Analytics (current user)',
          tags: ['analytics'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'OK' } },
        },
      },
      '/analytics:recalc': {
        post: {
          summary: 'Recalculate analytics',
          tags: ['analytics'],
          security: [{ bearerAuth: [] }],
          responses: { 202: { description: 'Started' } },
        },
      },
    },
  },
  apis: [], // using inline 'paths' above
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------- Auth helpers ----------
type JWTPayload = { sub: number; email: string };
type AuthedRequest = Request & { user?: JWTPayload };

function signToken(userId: number, email: string) {
  return jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: '1d' });
}

function auth(req: AuthedRequest, res: Response, next: NextFunction) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : h;
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET) as JWTPayload;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}

async function ensureOwnsContact(contactId: number, uid: number) {
  const c = await prisma.contact.findUnique({ where: { id: contactId }, select: { ownerId: true } });
  if (!c || c.ownerId !== uid) {
    const err: any = new Error('NOT_YOURS');
    err.status = 403;
    throw err;
  }
}
async function ensureOwnsDeal(dealId: number, uid: number) {
  const d = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { contact: { select: { ownerId: true } } },
  });
  if (!d || d.contact?.ownerId !== uid) {
    const err: any = new Error('NOT_YOURS');
    err.status = 403;
    throw err;
  }
}

// ---------- Zod validation helpers ----------
function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (e) {
      if (e instanceof ZodError) return res.status(400).json({ error: 'validation failed', details: e.issues });
      next(e);
    }
  };
}
function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: any, res: any, next: any) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (e) {
      if (e instanceof ZodError) return res.status(400).json({ error: 'validation failed', details: e.issues });
      next(e);
    }
  };
}

// ---------- Schemas ----------
const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

const ContactsQuerySchema = z.object({
  search: z.string().optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
});

const ContactCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional().default(''),
  phone: z.string().optional().default(''),
});
const ContactUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
});

const NoteCreateSchema = z.object({ body: z.string().min(1) });

const DealCreateSchema = z.object({
  title: z.string().min(1),
  amount: z.coerce.number().optional().default(0),
  stage: z.string().optional().default('Prospect'),
  contactId: z.coerce.number().int().min(1),
});
const DealUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  amount: z.coerce.number().optional(),
  stage: z.string().optional(),
});

// ---------- Root & health ----------
app.get('/', (_req, res) => {
  res.status(200).send('Mini-CRM API is running. Try GET /health or open /docs for Swagger.');
});
app.get('/health', (_req, res) => res.json({ ok: true }));

// ---------- Auth ----------
app.post('/auth/signup', validateBody(AuthSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof AuthSchema>;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'email already exists' });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hash } });
  res.status(201).json({ id: user.id, email: user.email });
});

app.post('/auth/login', validateBody(AuthSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof AuthSchema>;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  const token = signToken(user.id, user.email);
  res.json({ token });
});

// ---------- Contacts ----------
app.get('/contacts', auth, validateQuery(ContactsQuerySchema), async (req: AuthedRequest, res) => {
  const { search, page, pageSize } = req.query as z.infer<typeof ContactsQuerySchema>;
  const uid = req.user!.sub;
  const skip = (page - 1) * pageSize;

  const where: any = { ownerId: uid };
  if (search) {
    // avoid Prisma 'mode' for SQLite compatibility
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { company: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.contact.findMany({ where, skip, take: pageSize, orderBy: { id: 'desc' } }),
    prisma.contact.count({ where }),
  ]);
  res.json({ items, total, page, pageSize });
});

app.post('/contacts', auth, validateBody(ContactCreateSchema), async (req: AuthedRequest, res) => {
  const data = req.body as z.infer<typeof ContactCreateSchema>;
  const uid = req.user!.sub;
  const contact = await prisma.contact.create({ data: { ...data, ownerId: uid } });
  res.status(201).json(contact);
});

app.get('/contacts/:id', auth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });
  const c = await prisma.contact.findUnique({ where: { id } });
  if (!c || c.ownerId !== req.user!.sub) return res.status(404).json({ error: 'not found' });
  res.json(c);
});

app.patch('/contacts/:id', auth, validateBody(ContactUpdateSchema), async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });
  await ensureOwnsContact(id, req.user!.sub);

  const data = req.body as z.infer<typeof ContactUpdateSchema>;
  const updated = await prisma.contact.update({
    where: { id },
    data: {
      name: data.name ?? undefined,
      email: data.email ?? undefined,
      company: data.company ?? undefined,
      phone: data.phone ?? undefined,
    },
  });
  res.json(updated);
});

app.delete('/contacts/:id', auth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  await ensureOwnsContact(id, req.user!.sub);
  // cleanup children first (if no CASCADE)
  await prisma.note.deleteMany({ where: { contactId: id } });
  await prisma.deal.deleteMany({ where: { contactId: id } });
  await prisma.contact.delete({ where: { id } });

  res.json({ ok: true });
});

// ---------- Notes ----------
app.get('/contacts/:id/notes', auth, async (req: AuthedRequest, res) => {
  const contactId = Number(req.params.id);
  if (Number.isNaN(contactId)) return res.status(400).json({ error: 'invalid id' });
  await ensureOwnsContact(contactId, req.user!.sub);

  const notes = await prisma.note.findMany({ where: { contactId }, orderBy: { id: 'desc' } });
  res.json({ items: notes });
});

app.post('/contacts/:id/notes', auth, validateBody(NoteCreateSchema), async (req: AuthedRequest, res) => {
  const contactId = Number(req.params.id);
  if (Number.isNaN(contactId)) return res.status(400).json({ error: 'invalid id' });
  await ensureOwnsContact(contactId, req.user!.sub);

  const { body } = req.body as z.infer<typeof NoteCreateSchema>;
  const note = await prisma.note.create({ data: { body, contactId, authorId: req.user!.sub } });
  res.status(201).json(note);
});

// ---------- Deals ----------
app.post('/deals', auth, validateBody(DealCreateSchema), async (req: AuthedRequest, res) => {
  const { title, amount, stage, contactId } = req.body as z.infer<typeof DealCreateSchema>;
  await ensureOwnsContact(contactId, req.user!.sub);

  const deal = await prisma.deal.create({
    data: { title, amount: Number(amount ?? 0), stage, contactId },
  });
  res.status(201).json(deal);
});

app.get('/deals', auth, validateQuery(ContactsQuerySchema.pick({ page: true, pageSize: true })), async (req: AuthedRequest, res) => {
  const { page, pageSize } = req.query as { page: number; pageSize: number };
  const uid = req.user!.sub;
  const skip = (page - 1) * pageSize;

  const where = { contact: { ownerId: uid } };

  const [items, total] = await Promise.all([
    prisma.deal.findMany({ where, skip, take: pageSize, orderBy: { id: 'desc' }, include: { contact: true } }),
    prisma.deal.count({ where }),
  ]);
  res.json({ items, total, page, pageSize });
});

app.patch('/deals/:id', auth, validateBody(DealUpdateSchema), async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  await ensureOwnsDeal(id, req.user!.sub);
  const data = req.body as z.infer<typeof DealUpdateSchema>;

  const updated = await prisma.deal.update({
    where: { id },
    data: {
      title: data.title ?? undefined,
      stage: data.stage ?? undefined,
      amount: data.amount != null ? Number(data.amount) : undefined,
    },
  });
  res.json(updated);
});

app.delete('/deals/:id', auth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  await ensureOwnsDeal(id, req.user!.sub);
  await prisma.deal.delete({ where: { id } });
  res.json({ ok: true });
});

// ---------- Analytics ----------
type Analytics = {
  updatedAt: Date;
  dealsByStage: Array<{ stage: string; count: number; amount: number }>;
  dealsByMonth: Array<{ month: string; count: number; amount: number }>;
};
const analyticsCache = new Map<number, Analytics>();

async function computeAnalytics(uid: number): Promise<Analytics> {
  const deals = await prisma.deal.findMany({ where: { contact: { ownerId: uid } }, select: { amount: true, stage: true, createdAt: true } });

  const stageMap = new Map<string, { count: number; amount: number }>();
  const monthMap = new Map<string, { count: number; amount: number }>();

  for (const d of deals) {
    const st = String(d.stage || 'Unspecified');
    const month = d.createdAt.toISOString().slice(0, 7); // YYYY-MM

    const s = stageMap.get(st) || { count: 0, amount: 0 };
    s.count += 1; s.amount += Number(d.amount) || 0; stageMap.set(st, s);

    const m = monthMap.get(month) || { count: 0, amount: 0 };
    m.count += 1; m.amount += Number(d.amount) || 0; monthMap.set(month, m);
  }

  return {
    updatedAt: new Date(),
    dealsByStage: [...stageMap].map(([stage, v]) => ({ stage, ...v })),
    dealsByMonth: [...monthMap].map(([month, v]) => ({ month, ...v })),
  };
}

app.get('/analytics', auth, async (req, res) => {
  const uid = req.user!.sub;
  if (!analyticsCache.has(uid)) analyticsCache.set(uid, await computeAnalytics(uid));
  res.json(analyticsCache.get(uid));
});

app.post('/analytics:recalc', auth, async (req, res) => {
  const uid = req.user!.sub;
  setTimeout(async () => {
    analyticsCache.set(uid, await computeAnalytics(uid));
    console.log('Analytics recomputed for user', uid);
  }, 100);
  res.status(202).json({ message: 'Recalculation started' });
});

// ---------- Error handler ----------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.status === 403 || err?.message === 'NOT_YOURS') {
    return res.status(403).json({ error: 'forbidden' });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'validation failed', details: err.issues });
  }
  console.error(err);
  res.status(500).json({ error: 'server error' });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
