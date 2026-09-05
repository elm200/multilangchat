# multilangchat

*(English: [README.md](README.md))*

多言語リアルタイム翻訳つきの、セルフホスト用の小さなチャットサーバー。

<img src="docs/screenshot.png" alt="multilangchat スクリーンショット" width="480">

参加者はそれぞれ自分の言語を選んで入室する。誰かが発言すると、その場にいる全員の言語へ
LLM がまとめて翻訳し、各自の画面には自分の言語で表示される。左側の「もくもく部屋」パネルには
在室者が 3x3 のマスに配置され、誰がどの言語で参加しているかが一目で分かる。

- 対応言語: 日本語、英語、中国語、韓国語、タイ語、ベトナム語、スペイン語。同時に最大5つまでの言語が使えます。
- 翻訳は [OpenRouter](https://openrouter.ai/) 経由の LLM 呼び出し
- 状態はメモリのみ。データベース不要。プロセスを止めれば履歴も在室者も消える

## 必要なもの

- Python 3.10 以降
- Node.js 20.19 以降(または 22.12 以降)
- OpenRouter の API キー

## 起動

```bash
cp .env.example .env
# .env に OPENROUTER_API_KEY を書く
./run.sh
```

`run.sh` は npm と venv のセットアップ、フロントエンドのビルドまで面倒を見る。
起動したら http://localhost:8000 を開く。

## 設定 (`.env`)

| 変数 | 既定 | 説明 |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | (必須) | OpenRouter の API キー |
| `OPENROUTER_MODEL` | `google/gemini-2.5-flash-lite` | 翻訳に使うモデル |
| `USER_PASSPHRASE` | (なし) | 設定すると入室時に合言葉を要求する |
| `OPENROUTER_ALLOW_TRAINING` | (なし) | `1` にすると、入力を学習に使いうる配信先も許可する |

セキュリティ・プライバシー上の注意点(API クレジット上限の設定、合言葉、無料モデルの
データポリシーなど)は [NOTES.md](NOTES.md) にまとめています。運用前に一読してください。

## ライセンス

MIT License (see [LICENSE](LICENSE)).

部屋パネルの画像とロジックは [mokumoku-suru-tameno-nanika](https://github.com/haya256/mokumoku-suru-tameno-nanika)、
国旗スプライトは [flag-icons](https://github.com/lipis/flag-icons) に由来します。
いずれも MIT License です。詳細は [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) を参照してください。
