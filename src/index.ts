import { Database } from "bun:sqlite";
import { existsSync, readFileSync } from "fs";

function splitCsvRow(line: string): string[] {
  return line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
}

const db = new Database(":memory:");
db.run(`
  CREATE TABLE statystyki (
    region TEXT,
    rok INTEGER,
    wypadki INTEGER,
    ranni INTEGER,
    zabici INTEGER,
    kolizje INTEGER
  )
`);

const csvPath = existsSync("data/wypadki.csv") ? "data/wypadki.csv" : "data/sample.csv";
const meta = existsSync("data/meta.json")
  ? JSON.parse(readFileSync("data/meta.json", "utf-8"))
  : { sources: [{ title: "dane.gov.pl — Zdarzenia w ruchu drogowym", url: "https://dane.gov.pl" }] };

const lines = readFileSync(csvPath, "utf-8").trim().split(/\r?\n/).slice(1);
const insert = db.prepare("INSERT INTO statystyki VALUES (?, ?, ?, ?, ?, ?)");

for (const line of lines) {
  const [region, rok, wypadki, ranni, zabici, kolizje] = splitCsvRow(line);
  if (region) {
    insert.run(
      region,
      Number(rok) || 2023,
      Number(wypadki) || 0,
      Number(ranni) || 0,
      Number(zabici) || 0,
      Number(kolizje) || 0
    );
  }
}

export interface RegionStat {
  region: string;
  rok: number;
  wypadki: number;
  ranni: number;
  zabici: number;
  kolizje: number;
}

export async function searchAccidents(query: string, year = "all"): Promise<RegionStat[]> {
  const param = `%${query}%`;
  if (year && year !== "all") {
    return db
      .query(
        `SELECT region, rok, wypadki, ranni, zabici, kolizje
         FROM statystyki
         WHERE lower(region) LIKE lower(?) AND rok = ?
         ORDER BY wypadki DESC`
      )
      .all(param, Number(year)) as RegionStat[];
  }
  return db
    .query(
      `SELECT region, rok, wypadki, ranni, zabici, kolizje
       FROM statystyki
       WHERE lower(region) LIKE lower(?)
       ORDER BY rok DESC, wypadki DESC`
    )
    .all(param) as RegionStat[];
}

const years = (db.query("SELECT DISTINCT rok FROM statystyki ORDER BY rok DESC").all() as { rok: number }[]).map(
  (r) => r.rok
);

const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bezpieczna Trasa — Statystyki dane.gov.pl</title>
  <style>
    :root {
      --bg: #09090b; --surface: #121215; --surface-hover: #1a1a1f;
      --border: #26262b; --text: #f4f4f5; --muted: #a1a1aa;
      --accent: #e11d48; --accent-soft: rgba(225, 29, 72, 0.14); --ok: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: radial-gradient(circle at top right, #1f0a12 0%, var(--bg) 42%);
      color: var(--text); min-height: 100vh; padding: 32px 20px 60px;
    }
    .container { max-width: 1040px; margin: 0 auto; }
    header {
      display: flex; justify-content: space-between; align-items: flex-end;
      flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding-bottom: 18px;
      border-bottom: 1px solid var(--border);
    }
    .brand-tag {
      display: inline-flex; align-items: center; gap: 8px; font-size: 12px;
      font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--accent); margin-bottom: 6px;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 10px var(--accent); }
    h1 { font-size: 28px; font-weight: 700; }
    .subtitle { color: var(--muted); font-size: 14px; margin-top: 4px; }
    .api-badge {
      font-family: ui-monospace, Menlo, monospace; font-size: 12px;
      background: var(--surface); border: 1px solid var(--border);
      padding: 8px 12px; border-radius: 8px; color: var(--muted);
    }
    .api-badge strong { color: var(--ok); }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin-bottom: 22px; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; }
    .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 6px; }
    .card-value { font-size: 24px; font-weight: 700; }
    .card-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
    .controls { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; align-items: center; }
    .search-wrap { flex: 1; min-width: 240px; }
    .search-wrap input {
      width: 100%; padding: 12px 16px; background: var(--surface); color: var(--text);
      border: 1px solid var(--border); border-radius: 10px; font-size: 15px; outline: none;
    }
    .search-wrap input:focus { border-color: var(--accent); }
    .pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .pill {
      padding: 10px 14px; background: var(--surface); color: var(--muted);
      border: 1px solid var(--border); border-radius: 10px; font-size: 13px;
      font-weight: 600; cursor: pointer;
    }
    .pill.active { background: var(--accent); color: #fff; border-color: var(--accent); }
    .table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em;
      color: var(--muted); text-align: left; padding: 14px 16px;
      border-bottom: 1px solid var(--border); background: #0e0e11; white-space: nowrap;
    }
    td { padding: 14px 16px; border-bottom: 1px solid var(--border); font-size: 14px; }
    tbody tr:hover { background: var(--surface-hover); }
    .region { font-weight: 600; color: #fff; text-transform: uppercase; }
    .num { font-family: ui-monospace, Menlo, monospace; font-weight: 600; }
    .dead { color: #fb7185; }
    .risk-badge { display: inline-block; padding: 4px 9px; border-radius: 6px; font-size: 11px; font-weight: 700; }
    .risk-high { background: var(--accent-soft); color: #fb7185; border: 1px solid rgba(225,29,72,0.35); }
    .risk-mid { background: rgba(245,158,11,0.14); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
    .risk-low { background: rgba(16,185,129,0.14); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
    .bar-cell { display: flex; align-items: center; gap: 10px; }
    .bar-track { flex: 1; height: 6px; background: #232329; border-radius: 999px; overflow: hidden; min-width: 70px; }
    .bar-fill { height: 100%; background: linear-gradient(90deg, #e11d48, #fb7185); }
    .sources { margin-top: 20px; font-size: 12px; color: var(--muted); line-height: 1.7; }
    .sources a { color: #fb7185; text-decoration: none; }
    .sources a:hover { text-decoration: underline; }
    .empty { text-align: center; padding: 36px; color: var(--muted); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <div class="brand-tag"><span class="dot"></span> Oficjalne dane • dane.gov.pl</div>
        <h1>Bezpieczna Trasa</h1>
        <p class="subtitle">Zdarzenia drogowe w podziale na województwa i powiaty (bezpieczeństwo rowerzystów i UTO)</p>
      </div>
      <div class="api-badge">Bun + SQLite RAM • Czas API: <strong id="latency">—</strong></div>
    </header>

    <section class="stats">
      <div class="card">
        <div class="card-label">Wypadki</div>
        <div class="card-value" id="stat-wypadki">0</div>
        <div class="card-sub">Suma w widoku</div>
      </div>
      <div class="card">
        <div class="card-label">Ranni</div>
        <div class="card-value" id="stat-ranni">0</div>
        <div class="card-sub">Poszkodowani w zdarzeniach</div>
      </div>
      <div class="card">
        <div class="card-label">Zabici</div>
        <div class="card-value dead" id="stat-zabici">0</div>
        <div class="card-sub">Ofiary śmiertelne</div>
      </div>
      <div class="card">
        <div class="card-label">Kolizje</div>
        <div class="card-value" id="stat-kolizje">0</div>
        <div class="card-sub">Zdarzenia bez ofiar</div>
      </div>
    </section>

    <section class="controls">
      <div class="search-wrap">
        <input id="q" placeholder="Wpisz województwo lub powiat (np. Mazowieckie, Śląskie)..." autocomplete="off" />
      </div>
      <div class="pills" id="year-pills">
        <button class="pill active" data-year="all">Wszystkie lata</button>
        ${years.map((y) => `<button class="pill" data-year="${y}">${y}</button>`).join("")}
      </div>
    </section>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Województwo / Powiat</th>
            <th>Rok</th>
            <th>Wypadki</th>
            <th>Ranni</th>
            <th>Zabici</th>
            <th>Kolizje</th>
            <th>Zagrożenie</th>
          </tr>
        </thead>
        <tbody id="res"></tbody>
      </table>
    </div>

    <div class="sources" id="sources"></div>
  </div>

  <script>
    let currentYear = "all";
    const input = document.getElementById("q");
    const fmt = (n) => Number(n || 0).toLocaleString("pl-PL");

    function getRiskBadge(wypadki, maxVal) {
      const ratio = maxVal > 0 ? wypadki / maxVal : 0;
      if (ratio >= 0.65) return '<span class="risk-badge risk-high">WYSOKIE</span>';
      if (ratio >= 0.35) return '<span class="risk-badge risk-mid">ŚREDNIE</span>';
      return '<span class="risk-badge risk-low">NISKIE</span>';
    }

    async function search() {
      const t0 = performance.now();
      const res = await fetch('/api/search?q=' + encodeURIComponent(input.value.trim()) + '&year=' + encodeURIComponent(currentYear));
      const payload = await res.json();
      const data = payload.rows;

      document.getElementById("latency").textContent = (performance.now() - t0).toFixed(1) + " ms";
      document.getElementById("stat-wypadki").textContent = fmt(data.reduce((a, r) => a + r.wypadki, 0));
      document.getElementById("stat-ranni").textContent = fmt(data.reduce((a, r) => a + r.ranni, 0));
      document.getElementById("stat-zabici").textContent = fmt(data.reduce((a, r) => a + r.zabici, 0));
      document.getElementById("stat-kolizje").textContent = fmt(data.reduce((a, r) => a + r.kolizje, 0));

      if (payload.meta?.sources?.length) {
        document.getElementById("sources").innerHTML =
          "<strong>Oficjalne źródła pobrane z dane.gov.pl:</strong><br>" +
          payload.meta.sources.map(s => '• <a href="' + s.url + '" target="_blank">' + s.title + '</a>').join("<br>");
      }

      const maxVal = data.length > 0 ? Math.max(...data.map(d => d.wypadki)) : 1;
      const tbody = document.getElementById("res");
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">Brak wyników dla podanego zapytania.</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(r => {
        const pct = Math.max(6, Math.round((r.wypadki / maxVal) * 100));
        return \`
          <tr>
            <td class="region">\${r.region}</td>
            <td class="num">\${r.rok}</td>
            <td>
              <div class="bar-cell">
                <span class="num">\${fmt(r.wypadki)}</span>
                <div class="bar-track"><div class="bar-fill" style="width:\${pct}%"></div></div>
              </div>
            </td>
            <td class="num">\${fmt(r.ranni)}</td>
            <td class="num dead">\${fmt(r.zabici)}</td>
            <td class="num">\${fmt(r.kolizje)}</td>
            <td>\${getRiskBadge(r.wypadki, maxVal)}</td>
          </tr>\`;
      }).join("");
    }

    input.addEventListener("input", search);
    document.querySelectorAll(".pill").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".pill").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentYear = btn.dataset.year;
        search();
      });
    });
    search();
  </script>
</body>
</html>`;

if (import.meta.main) {
  const port = Number(process.env.PORT) || 3000;
  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      if (url.pathname === "/api/search") {
        const q = url.searchParams.get("q") || "";
        const year = url.searchParams.get("year") || "all";
        const rows = await searchAccidents(q, year);
        return Response.json({ meta, rows });
      }
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    },
  });
  console.log(`Serwer działa na http://localhost:${port}`);
}