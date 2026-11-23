# Raport końcowy projektu (ISO 21513)

| Pole | Wartość |
| :--- | :--- |
| **ID dokumentu** | `DOC-ISO21513-01` |
| **Wersja** | `1.0` |
| **Autor** | Zespół Projektowy Bezpieczna Trasa |
| **Data utworzenia** | `2026-11-21` |
| **Status** | Zatwierdzony |

## 1. Cel projektu
Celem projektu **Bezpieczna Trasa** było stworzenie otwartego narzędzia (open source) wykorzystującego publiczne dane z portalu `dane.gov.pl`, które ułatwia rowerzystom i użytkownikom hulajnóg elektrycznych (UTO) identyfikację najbardziej niebezpiecznych ulic w polskich miastach.

## 2. Osiągnięte rezultaty
* Zbudowano działającą aplikację webową i API (`/api/search`) w środowisku **Bun** z silnikiem analitycznym **DuckDB**.
* Utworzono skrypt `scripts/fetch-data.ts` pobierający dane z API `dane.gov.pl` z mechanizmem fallback na próbkę lokalną.
* Przygotowano pełną strukturę repozytorium open source (licencja MIT, README, CONTRIBUTING, CODE_OF_CONDUCT, CHANGELOG, szablony GitHub).
* Skonfigurowano automatyczne CI (GitHub Actions) uruchamiające testy i linter przy każdym Pull Requeście.
* Zapewniono uruchomienie aplikacji jedną komendą przez `docker compose up`.

## 3. Porównanie z planem
| Obszar | Plan | Realizacja | Odchylenie |
| :--- | :--- | :--- | :--- |
| Czas realizacji | 1 tydzień | 1 tydzień | Brak |
| Stack technologiczny | Bun + DuckDB | Bun + DuckDB | Brak |
| Integracja danych | Automatyczny skrypt API | Zrealizowano + fallback CSV | Zwiększona niezawodność |
| Deploy | Jedna komenda (Docker) | `docker compose up` | Brak |

## 4. Wpływ społeczny
Projekt obniża barierę dostępu do danych o bezpieczeństwie ruchu drogowego. Zamiast ręcznie przeszukiwać surowe pliki CSV z portali rządowych, każdy użytkownik może w kilka sekund sprawdzić statystyki dla swojej okolicy.

## 5. Wnioski
Połączenie Bun i DuckDB pozwala budować lekkie aplikacje analityczne bez konieczności stawiania osobnego serwera bazodanowego. Projekt stanowi solidną bazę do dalszego rozwoju (np. dodanie mapy interaktywnej Leaflet).

## Historia zmian
| Wersja | Data | Autor | Opis zmian |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-11-21 | Zespół Projektowy | Utworzenie wersji końcowej raportu |
