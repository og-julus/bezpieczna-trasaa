# Bezpieczna Trasa

Otwarta wyszukiwarka najniebezpieczniejszych ulic i skrzyżowań dla rowerzystów oraz użytkowników hulajnóg elektrycznych (UTO) na podstawie otwartych danych publicznych.

## Problem społeczny
Liczba kolizji z udziałem rowerów i UTO w miastach rośnie, a oficjalne statystyki są rozproszone w surowych zbiorach danych. **Bezpieczna Trasa** pobiera dane z portalu `dane.gov.pl`, analizuje je lokalnie w locie przez **DuckDB** i wystawia prostą wyszukiwarkę webową.

## Źródło danych
Dane pochodzą z otwartego API portalu **[dane.gov.pl](https://dane.gov.pl)** (zbiory dotyczące zdarzeń drogowych). Duże pliki CSV nie są trzymane w repozytorium — skrypt `scripts/fetch-data.ts` pobiera je automatycznie. Do testów i lokalnego uruchomienia służy mała próbka w `data/sample.csv`.

## Stack technologiczny
* **Bun** – szybki runtime JS/TS, serwer HTTP i runner testów
* **DuckDB** – silnik analityczny SQL działający bezpośrednio na plikach CSV
* **Docker / Docker Compose** – uruchomienie jedną komendą

## Szybki start (1 komenda — Docker)
```bash
docker compose up --build
```
Aplikacja będzie dostępna pod adresem: `http://localhost:3000`

## Uruchomienie lokalne (Bun)
1. Skopiuj plik środowiskowy:
   ```bash
   cp .env.example .env
   ```
2. Zainstaluj zależności:
   ```bash
   bun install
   ```
3. Pobierz dane z API:
   ```bash
   bun run fetch-data
   ```
4. Uruchom aplikację:
   ```bash
   bun run start
   ```
5. Uruchom testy:
   ```bash
   bun test
   ```

## Dokumentacja projektu
Pełna dokumentacja zgodna ze standardami znajduje się w katalogu `docs/`:
* `docs/RAPORT_KONCOWY_ISO21513.md` – Raport końcowy (ISO 21513)
* `docs/LESSONS_LEARNED_PMI.md` – Wnioski z projektu (PMI)
* `docs/KONTROLA_DOKUMENTOW_ISO10013.md` – Rejestr i kontrola dokumentów (ISO 10013)

## Licencja
Projekt udostępniony na licencji [MIT](LICENSE).
