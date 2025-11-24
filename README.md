# Wirtualna Rada Nadzorcza AI

Aplikacja Next.js umożliwiająca konsultacje z najlepszymi modelami AI, które wspólnie tworzą wirtualną radę nadzorczą.

## Funkcje

- **Konsultacje z wieloma modelami**: Zapytania są kierowane do trzech wiodących modeli AI:
  - **GPT-5.1** (OpenAI)
  - **Claude Sonnet 4.5** (Anthropic)
  - **Grok 4.1 Fast Reasoning** (xAI)

- **Synteza odpowiedzi**: Claude Sonnet 4.5 pełni rolę przewodniczącego, syntetyzując wszystkie odpowiedzi w jedną, autorytatywną odpowiedź

- **Interfejs czatu**: Nowoczesny interfejs w stylu Claude z możliwością prowadzenia rozmowy follow-up

- **Konfiguracja**: Klucze API konfigurowane są przez zmienne środowiskowe

## Rozpoczęcie pracy

### Wymagania

- Node.js 20+ 
- npm lub yarn
- Klucze API dla:
  - OpenAI (GPT-5.1)
  - Anthropic (Claude)
  - xAI (Grok)

### Instalacja

1. Sklonuj repozytorium:
```bash
git clone https://github.com/artur-t-96/LLM-Council-.git
cd LLM-Council-
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Skonfiguruj klucze API:

Utwórz plik `.env.local` w katalogu głównym:
```env
OPENAI_API_KEY=twoj_klucz_openai
ANTHROPIC_API_KEY=twoj_klucz_anthropic
XAI_API_KEY=twoj_klucz_xai
```

4. Uruchom serwer deweloperski:
```bash
npm run dev
```

5. Otwórz [http://localhost:3000](http://localhost:3000) w przeglądarce

## Użycie

1. Wpisz pytanie w polu tekstowym
2. Aplikacja wysyła zapytanie do wszystkich trzech modeli AI równolegle
3. Przewodniczący (Claude Sonnet 4.5) syntetyzuje odpowiedzi
4. Możesz kontynuować rozmowę zadając pytania follow-up

## Stack technologiczny

- **Framework**: Next.js 16 z TypeScript
- **Stylowanie**: Tailwind CSS
- **SDK AI**: 
  - OpenAI SDK
  - Anthropic SDK
  - xAI API (kompatybilne z OpenAI)

## Licencja

MIT
