import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { z } from "zod";

const { Pool } = pg;
const app = express();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false })
  : null;

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

const dealSchema = z.object({
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(30).max(2000),
  sector: z.string().trim().min(2).max(80),
  stage: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  city: z.string().trim().max(100).optional(),
  targetAmount: z.number().positive(),
  minimumTicket: z.number().nonnegative().optional(),
  currency: z.string().length(3).default("USD"),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().email(),
});

app.get("/api/health", async (_req, res) => {
  if (!pool) return res.status(503).json({ ok: false, database: "not_configured" });
  try {
    await pool.query("select 1");
    res.json({ ok: true, database: "connected" });
  } catch {
    res.status(503).json({ ok: false, database: "unavailable" });
  }
});

app.get("/api/deals", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database is not configured" });
  const { sector, stage, country } = req.query;
  const values = [];
  const filters = ["status = 'published'"];
  for (const [column, value] of [["sector", sector], ["stage", stage], ["country", country]]) {
    if (typeof value === "string" && value) {
      values.push(value);
      filters.push(`${column} = $${values.length}`);
    }
  }
  const result = await pool.query(
    `select id, title, slug, summary, sector, stage, country, city, target_amount as "targetAmount", committed_amount as "committedAmount", minimum_ticket as "minimumTicket", currency, status, published_at as "publishedAt" from deals where ${filters.join(" and ")} order by featured desc, published_at desc limit 100`,
    values,
  );
  res.json({ deals: result.rows });
});

app.post("/api/deals", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database is not configured" });
  const parsed = dealSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid submission", details: parsed.error.flatten() });
  const d = parsed.data;
  const slug = `${d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
  const result = await pool.query(
    `insert into deals (title, slug, summary, sector, stage, country, city, target_amount, minimum_ticket, currency, contact_name, contact_email, status)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'submitted') returning id, slug, status, created_at as "createdAt"`,
    [d.title, slug, d.summary, d.sector, d.stage, d.country, d.city ?? null, d.targetAmount, d.minimumTicket ?? 0, d.currency.toUpperCase(), d.contactName, d.contactEmail.toLowerCase()],
  );
  res.status(201).json(result.rows[0]);
});

app.use(express.static(path.join(root, "dist"), { maxAge: "1h" }));
app.get("*", (_req, res) => res.sendFile(path.join(root, "dist", "index.html")));

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => console.log(`WTC Accra Investment Exchange listening on ${port}`));
