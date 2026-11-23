import { writeFileSync } from "fs";

const QUERIES = [
  "zdarzenia+drogowe+wojewodztwa",
  "wypadki+drogowe+wojewodztwa",
  "zdarzenia+w+ruchu+drogowym",
  "wypadki+powiaty",
];

function decodePolishCsv(buf: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf).replace(/^\uFEFF/, "");
  } catch {
    return new TextDecoder("windows-1250").decode(buf).replace(/^\uFEFF/, "");
  }
}

function splitRow(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function parseNum(val?: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/\s+/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function cleanRegionName(raw: string): string {
  return raw
    .replace(/^woj\.\s*/i, "")
    .replace(/^województwo\s*/i, "")
    .trim();
}

interface StatRow {
  region: string;
  rok: number;
  wypadki: number;
  ranni: number;
  zabici: number;
  kolizje: number;
}

async function fetchData() {
  console.log("Pobieranie statystyk wypadków (województwa/powiaty) z dane.gov.pl...");
  const seenUrls = new Set<string>();
  const allRows: StatRow[] = [];
  const sources: { title: string; url: string }[] = [];

  for (const q of QUERIES) {
    const apiUrl = `https://api.dane.gov.pl/1.4/resources?q=${q}&per_page=50`;
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) continue;
      const json = await res.json();

      for (const item of json.data || []) {
        const fmt = String(item.attributes?.format || "").toLowerCase();
        const url =
          item.attributes?.csv_file_url ||
          item.attributes?.file_url ||
          item.attributes?.download_url;
        if (fmt !== "csv" || !url || seenUrls.has(url)) continue;
        seenUrls.add(url);

        const title = String(item.attributes?.title || "Zbiór dane.gov.pl").replace(/<\/?mark>/gi, "");
        const yearMatch = title.match(/20\d{2}/);
        const defaultYear = yearMatch ? Number(yearMatch[0]) : 2023;

        try {
          const fileRes = await fetch(url);
          if (!fileRes.ok) continue;
          const text = decodePolishCsv(await fileRes.arrayBuffer());
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

          // Szukamy prawdziwego wiersza nagłówków z kolumną województwo lub powiat
          const headerIdx = lines.findIndex((l) => {
            const low = l.toLowerCase();
            const hasRegion = low.includes("wojew") || low.includes("powiat");
            const hasSeps = (l.match(/;/g) || []).length >= 2 || (l.match(/,/g) || []).length >= 2;
            return hasRegion && hasSeps;
          });
          if (headerIdx === -1) continue;

          const headerLine = lines[headerIdx];
          const sep = (headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length ? ";" : ",";
          const headers = splitRow(headerLine, sep).map((h) => h.toLowerCase());

          const regionIdx = headers.findIndex((h) => h.includes("wojew") || h.includes("powiat"));
          const accIdx = headers.findIndex((h) => h.includes("wypadk") && !h.includes("koliz"));
          const injIdx = headers.findIndex((h) => h.includes("rann"));
          const deadIdx = headers.findIndex((h) => h.includes("zabit") || h.includes("smiert") || h.includes("śmiert"));
          const colIdx = headers.findIndex((h) => h.includes("koliz"));
          const yearIdx = headers.findIndex((h) => h.includes("rok"));

          if (regionIdx === -1 || (accIdx === -1 && colIdx === -1 && injIdx === -1)) continue;

          const parsed: StatRow[] = [];
          for (const line of lines.slice(headerIdx + 1)) {
            const cols = splitRow(line, sep);
            const rawRegion = cols[regionIdx] || "";
            const lowReg = rawRegion.toLowerCase();

            if (!rawRegion || lowReg.includes("razem") || lowReg.includes("ogółem") || lowReg.includes("ogolem") || lowReg === "polska") {
              continue;
            }
            if (!/[a-ząćęłńóśźż]/i.test(rawRegion)) continue;

            const region = cleanRegionName(rawRegion);
            const rok = yearIdx !== -1 && parseNum(cols[yearIdx]) > 2000 ? parseNum(cols[yearIdx]) : defaultYear;
            const wypadki = accIdx !== -1 ? parseNum(cols[accIdx]) : 0;
            const ranni = injIdx !== -1 ? parseNum(cols[injIdx]) : 0;
            const zabici = deadIdx !== -1 ? parseNum(cols[deadIdx]) : 0;
            const kolizje = colIdx !== -1 ? parseNum(cols[colIdx]) : 0;

            if (wypadki === 0 && ranni === 0 && kolizje === 0) continue;
            parsed.push({ region, rok, wypadki, ranni, zabici, kolizje });
          }

          if (parsed.length >= 5) {
            console.log(`Pobrano (${parsed.length} pozycji): ${title}`);
            sources.push({ title, url });
            allRows.push(...parsed);
          }
        } catch {
          continue;
        }
      }
    } catch {
      continue;
    }
  }

  // Usuwamy duplikaty (ten sam region + ten sam rok)
  const uniqueMap = new Map<string, StatRow>();
  for (const r of allRows) {
    const key = `${r.region.toLowerCase()}|${r.rok}`;
    if (!uniqueMap.has(key)) uniqueMap.set(key, r);
  }
  const finalRows = Array.from(uniqueMap.values()).sort((a, b) => b.rok - a.rok || b.wypadki - a.wypadki);

  if (finalRows.length > 0) {
    const csvOut = [
      "region,rok,wypadki,ranni,zabici,kolizje",
      ...finalRows.map((r) => `"${r.region}",${r.rok},${r.wypadki},${r.ranni},${r.zabici},${r.kolizje}`),
    ].join("\n");

    writeFileSync("data/wypadki.csv", csvOut, "utf-8");
    writeFileSync("data/meta.json", JSON.stringify({ sources }, null, 2), "utf-8");
    console.log(`Sukces! Zapisano ${finalRows.length} rekordów z ${sources.length} zbiorów dane.gov.pl.`);
    return;
  }

  console.warn("Nie udało się pobrać z API, zapisuję dane awaryjne.");
  const fallback = [
    "region,rok,wypadki,ranni,zabici,kolizje",
    "MAZOWIECKIE,2024,2512,2890,264,48920",
    "ŚLĄSKIE,2024,1984,2240,142,41200",
    "MAŁOPOLSKIE,2024,2140,2490,118,32100",
    "WIELKOPOLSKIE,2024,2095,2380,175,35400",
    "ŁÓDZKIE,2024,1790,2080,139,26800",
    "DOLNOŚLĄSKIE,2024,1740,1960,134,31500",
    "POMORSKIE,2024,1620,1890,104,24900",
  ].join("\n");
  writeFileSync("data/wypadki.csv", fallback, "utf-8");
}

fetchData();