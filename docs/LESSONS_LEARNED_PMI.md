# Lessons Learned (PMI)

| Pole | Wartość |
| :--- | :--- |
| **ID dokumentu** | `DOC-PMI-LL-01` |
| **Wersja** | `1.0` |
| **Autor** | Zespół Projektowy Bezpieczna Trasa |
| **Data utworzenia** | `2026-11-21` |
| **Status** | Zatwierdzony |

## 1. Co zadziałało dobrze
* **Wybór DuckDB:** Możliwość wykonywania zapytań SQL bezpośrednio na plikach CSV bez stawiania PostgreSQL/MySQL drastycznie przyspieszyła prace.
* **Runtime Bun:** Wbudowany serwer HTTP, obsługa TypeScriptu bez dodatkowej konfiguracji oraz szybki `bun test` ograniczyły liczbę zależności.
* **Docker Compose:** Uruchomienie projektu jedną komendą wyeliminowało problem "u mnie działa".

## 2. Co nie zadziałało / napotkane problemy
* **Niespójność formatów danych w API publicznym:** Zbiory na `dane.gov.pl` pochodzą od różnych instytucji i często mają inne nazwy kolumn lub kodowanie znaków.
* **Konieczność obsługi błędów sieciowych:** Zewnętrzne API potrafi odpowiadać wolno lub zwracać limity zapytań podczas budowania obrazu Dockera.

## 3. Co zrobilibyśmy inaczej
* Od początku dodalibyśmy walidację schematu pobieranego pliku CSV (np. przez bibliotekę `zod`), aby szybciej wyłapywać zmiany w strukturze danych rządowych.
* Rozdzielilibyśmy warstwę frontendu do osobnego pliku HTML/CSS dla większej czytelności.

## 4. Rekomendacje dla przyszłych projektów
* Zawsze trzymać małą, reprezentatywną próbkę danych (`data/sample.csv`) w repozytorium do testów CI, a duże zbiory wykluczać w `.gitignore`.
* Automatyzować sprawdzanie stylu kodu (linter) i testów od pierwszego commita.

## Historia zmian
| Wersja | Data | Autor | Opis zmian |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-11-21 | Zespół Projektowy | Utworzenie dokumentu Lessons Learned |
