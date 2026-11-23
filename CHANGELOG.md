# Changelog

Wszystkie istotne zmiany w projekcie są dokumentowane w tym pliku.

## [1.0.0] - 2026-11-21
### Dodano
* Wyszukiwarka niebezpiecznych ulic i miast oparta o Bun + DuckDB (`src/index.ts`).
* Skrypt pobierający metadane/dane z API `dane.gov.pl` (`scripts/fetch-data.ts`).
* Próbka danych testowych (`data/sample.csv`) oraz testy automatyczne (`tests/app.test.ts`).
* Konteneryzacja Docker i `docker-compose.yml`.
* Pipeline CI w GitHub Actions (testy + linter) oraz szablony Issue/PR.
* Dokumentacja projektowa zgodna z ISO 21513, PMI oraz ISO 10013 (`docs/`).
