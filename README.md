# multilangchat

*(日本語: [README_ja.md](README_ja.md))*

A small self-hosted chat server with live multilingual translation.

<img src="docs/screenshot.png" alt="multilangchat screenshot" width="480">

Each participant joins with their own language. When someone sends a message, an LLM
translates it into every language present in the room, and everyone sees it in their own
language. The "focus room" panel on the left arranges participants in a 3x3 grid, showing
at a glance who is in the room and in which language.

- Supported languages: Japanese, English, Chinese, Korean, Thai, Vietnamese and Spanish. You can use up to five languages ​​simultaneously.
- Translation is done via LLM calls through [OpenRouter](https://openrouter.ai/)
- State lives in memory only. No database. Stop the process and history and participants
  are gone

## Requirements

- Python 3.10+
- Node.js 20.19+ (or 22.12+)
- An OpenRouter API key

## Running it

```bash
cp .env.example .env
# put your OPENROUTER_API_KEY in .env
./run.sh
```

`run.sh` handles npm/venv setup and the frontend build. Once it's running, open
http://localhost:8000.

## Configuration (`.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | (required) | Your OpenRouter API key |
| `OPENROUTER_MODEL` | `google/gemini-2.5-flash-lite` | Model used for translation |
| `USER_PASSPHRASE` | (none) | If set, requires a passphrase to join |
| `OPENROUTER_ALLOW_TRAINING` | (none) | Set to `1` to also allow endpoints that may train on input |

Security and privacy notes (setting an API credit limit, the passphrase, free-model data
policy, etc.) are collected in [NOTES.md](NOTES.md) (Japanese). Please read it before
running this beyond a quick local test.

## License

MIT License (see [LICENSE](LICENSE)).

The room panel's artwork and logic come from
[mokumoku-suru-tameno-nanika](https://github.com/haya256/mokumoku-suru-tameno-nanika), and
the flag sprites from [flag-icons](https://github.com/lipis/flag-icons). Both are MIT
licensed. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for details.
