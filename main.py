"""シンプルなWebSocketチャットサーバー。

任意の人数のクライアントが接続し、送信したメッセージ全員にブロードキャストする。
左側の「もくもく部屋」パネル用に、接続中のユーザーを3x3(最大9部屋)に割り当てて
在室状況もあわせて配信する。

もくもく部屋パネル(部屋画像・キャラスプライトとその配置/アニメーションロジック)は
haya256さんの以下のリポジトリ(MIT License)を参考にしている:
https://github.com/haya256/mokumoku-suru-tameno-nanika

ユーザー管理:
サーバーが発行する User ID(公開してよい識別子)と User Token(本人確認用の秘密)で
在室者を管理する。在室枠は User ID 単位であり、同じ User ID からの複数の
WebSocket接続(同じブラウザの複数タブ)は同じ枠を共有する。退室すると、その
User ID はサーバーのメモリから完全に削除される(再入室すると新しいUser IDが
発行される)。逆にWebSocketが(退室操作を伴わず)切断されただけでは在室状態は
消さない(=幽霊ユーザーを許容する。寿命の短いプロセスなので許容範囲とみなす)。
"""

from __future__ import annotations

import asyncio
import json
import os
import random
import re
import secrets
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

load_dotenv()

# translationはimport時に環境変数を読むため、load_dotenv()の後にimportする。
from translation import translate_history_batch, translate_message  # noqa: E402

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
PUBLIC_DIR = Path(__file__).parent / "public"

# public/ はViteのビルド出力。ハッシュ付きファイル名(index-<hash>.js等)だけ長期キャッシュする。
app.mount("/assets", StaticFiles(directory=PUBLIC_DIR / "assets"), name="assets")

HASHED_ASSET_RE = re.compile(r"-[0-9a-zA-Z_-]{8,}\.(js|css)$")


@app.middleware("http")
async def cache_headers(request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path == "/":
        # index.htmlは常に再検証させる(最新のハッシュ付き参照を拾わせるため)。
        response.headers["Cache-Control"] = "no-cache"
    elif path.startswith("/assets/") and HASHED_ASSET_RE.search(path):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response


INDEX_HTML = (PUBLIC_DIR / "index.html").read_text(encoding="utf-8")

ROOM_COUNT = 9
HISTORY_LIMIT = 30
# アイドル状態が続くとNAT/ブラウザ側のタイムアウトで切断されることがあるため、
# 定期pingで生存確認し、応答が無いソケットは刈り取る。
HEARTBEAT_INTERVAL_SECONDS = 30
HEARTBEAT_TIMEOUT_SECONDS = 90
MESSAGE_MAX_LENGTH = 300
# フロントの maxlength と合わせる。UI制約だけでは防げないためサーバー側でも切り詰める。
NAME_MAX_LENGTH = 20
# 未設定(空文字含む)なら合言葉チェック自体を省略する。
USER_PASSPHRASE = os.environ.get("USER_PASSPHRASE") or None
# 合言葉を連続で間違えたときに次の試行を受け付けるまで待たせる時間の上限(秒)。
LOGIN_BLOCK_MAX_SECONDS = 60

# フロントエンド(frontend/src/i18n/)がサポートする言語コードと合わせる。
SUPPORTED_LANGS = {"ja", "en", "zh", "ko", "th", "vi", "es"}
DEFAULT_LANG = "en"
# 部屋に同時に存在しうる言語の上限(退室者の言語も含めて数える)。
ROOM_LANG_LIMIT = 5


def resolve_lang(candidate: str) -> str:
    return candidate if candidate in SUPPORTED_LANGS else DEFAULT_LANG


@dataclass
class User:
    user_id: str
    token: str
    name: str
    room: int
    lang: str
    pose: int = field(default_factory=lambda: random.randint(0, 2))
    sockets: set[WebSocket] = field(default_factory=set)


class ConnectionManager:
    def __init__(self) -> None:
        self.users: dict[str, User] = {}
        self.socket_user: dict[WebSocket, str] = {}
        # メモリ上だけの直近会話ログ。再接続時に配信して画面を復元する。
        self.history: list[dict] = []
        # 一度登場した言語は退室後も残る(ROOM_LANG_LIMIT判定・履歴一括翻訳のトリガーに使う)。
        self.room_langs: set[str] = set()
        # 同じ新言語への一括翻訳(履歴バックフィル)が同時に二重実行されるのを防ぐ。
        self.lang_lock = asyncio.Lock()
        # 合言葉はプロセス全体で共有する秘密のため、接続元ごとでなくグローバルに失敗回数を数える。
        self.login_failures = 0
        self.login_blocked_until = 0.0
        self._next_msg_id = 1

    def allocate_msg_id(self) -> int:
        msg_id = self._next_msg_id
        self._next_msg_id += 1
        return msg_id

    def free_room(self) -> int | None:
        used = {u.room for u in self.users.values()}
        free_rooms = [room for room in range(1, ROOM_COUNT + 1) if room not in used]
        return random.choice(free_rooms) if free_rooms else None

    def create_user(self, name: str, lang: str, websocket: WebSocket) -> User:
        room = self.free_room() or 0
        user = User(
            user_id=secrets.token_hex(8),
            token=secrets.token_hex(16),
            name=name,
            room=room,
            lang=lang,
        )
        user.sockets.add(websocket)
        self.users[user.user_id] = user
        self.socket_user[websocket] = user.user_id
        return user

    def attach(self, user_id: str, token: str, websocket: WebSocket) -> User | None:
        """既存の User に新しいソケットを合流させる(タブ追加・リロード)。"""
        user = self.users.get(user_id)
        if user is None or not secrets.compare_digest(user.token, token):
            return None
        user.sockets.add(websocket)
        self.socket_user[websocket] = user_id
        return user

    def detach(self, websocket: WebSocket) -> None:
        """ソケットの切断。Userそのものはレジストリに残す(幽霊ユーザー)。"""
        user_id = self.socket_user.pop(websocket, None)
        if user_id is None:
            return
        user = self.users.get(user_id)
        if user:
            user.sockets.discard(websocket)

    def leave(self, user_id: str) -> User | None:
        """明示的な退室。Userをレジストリから完全に削除する。"""
        user = self.users.pop(user_id, None)
        if user is None:
            return None
        for ws in user.sockets:
            self.socket_user.pop(ws, None)
        return user

    def user_count(self) -> int:
        return len(self.users)

    def rooms_state(self) -> list[dict]:
        return [
            {"room": u.room, "name": u.name, "pose": u.pose, "lang": u.lang}
            for u in self.users.values()
            if u.room
        ]

    async def broadcast(self, payload: dict) -> None:
        self.history.append(dict(payload))
        del self.history[:-HISTORY_LIMIT]
        payload["rooms"] = self.rooms_state()
        message = json.dumps(payload, ensure_ascii=False)
        dead = []
        for user in self.users.values():
            for ws in user.sockets:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead.append(ws)
        for ws in dead:
            self.detach(ws)

    async def send_to_user(self, user: User, payload: dict) -> None:
        """特定の1ユーザーの全ソケットにだけ送る。historyには積まない
        (発言者本人への翻訳前の即時エコー用)。"""
        message = json.dumps(payload, ensure_ascii=False)
        dead = []
        for ws in user.sockets:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.detach(ws)

    async def send_history(self, websocket: WebSocket) -> None:
        await websocket.send_text(
            json.dumps({"type": "history", "messages": self.history}, ensure_ascii=False)
        )


manager = ConnectionManager()


def timestamp() -> str:
    return datetime.now().strftime("%H:%M:%S")


@app.get("/", response_class=HTMLResponse)
async def index() -> str:
    return INDEX_HTML


@app.get("/favicon.svg")
async def favicon() -> FileResponse:
    return FileResponse(PUBLIC_DIR / "favicon.svg", media_type="image/svg+xml")


@app.get("/config")
async def config() -> dict:
    return {"passphraseRequired": USER_PASSPHRASE is not None}


async def _send_json(websocket: WebSocket, payload: dict) -> None:
    await websocket.send_text(json.dumps(payload, ensure_ascii=False))


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    user: User | None = None
    try:
        raw = await websocket.receive_text()
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            await websocket.close()
            return
        # JSONとして妥当でもdictとは限らない("x"/null/123等)。.get()呼び出し前に弾く。
        if not isinstance(data, dict):
            await websocket.close()
            return

        msg_type = data.get("type")
        is_new_login = msg_type == "login"

        if msg_type == "login":
            name = str(data.get("name", "")).strip()[:NAME_MAX_LENGTH] or "Anonymous"
            passphrase = str(data.get("passphrase", ""))
            lang = resolve_lang(str(data.get("lang", "")))
            if USER_PASSPHRASE is not None:
                # sleepでの遅延は並列接続で回避されるため使わない。判定前に時刻ゲートを置き、
                # 全体の試行レートを制限する。
                now = time.monotonic()
                if now < manager.login_blocked_until:
                    # ロックアウト中も理由を変えない(制限に掛かったことを攻撃者に教えない)。
                    await _send_json(websocket, {"type": "login_error", "reason": "passphrase"})
                    await websocket.close()
                    return
                if not secrets.compare_digest(passphrase, USER_PASSPHRASE):
                    manager.login_failures += 1
                    manager.login_blocked_until = now + min(
                        2**manager.login_failures, LOGIN_BLOCK_MAX_SECONDS
                    )
                    await _send_json(websocket, {"type": "login_error", "reason": "passphrase"})
                    await websocket.close()
                    return
                manager.login_failures = 0
                manager.login_blocked_until = 0.0

            async with manager.lang_lock:
                if lang not in manager.room_langs:
                    if len(manager.room_langs) >= ROOM_LANG_LIMIT:
                        await _send_json(websocket, {"type": "login_error", "reason": "room_full_langs"})
                        await websocket.close()
                        return
                    chat_history = [h for h in manager.history if h.get("type") == "chat"]
                    translated = await translate_history_batch(chat_history, lang)
                    for entry in manager.history:
                        if entry.get("type") == "chat" and entry["id"] in translated:
                            entry.setdefault("translations", {})[lang] = translated[entry["id"]]
                    manager.room_langs.add(lang)

            user = manager.create_user(name, lang, websocket)
            await _send_json(
                websocket,
                {
                    "type": "login_ok",
                    "userId": user.user_id,
                    "token": user.token,
                    "rooms": manager.rooms_state(),
                },
            )

        elif msg_type == "resume":
            user_id = str(data.get("userId", ""))
            token = str(data.get("token", ""))
            user = manager.attach(user_id, token, websocket)
            if user is None:
                await _send_json(websocket, {"type": "resume_error"})
                await websocket.close()
                return
            await _send_json(websocket, {"type": "resume_ok", "rooms": manager.rooms_state()})

        else:
            await websocket.close()
            return

        await manager.send_history(websocket)

        if is_new_login:
            await manager.broadcast(
                {
                    "type": "system",
                    "id": manager.allocate_msg_id(),
                    "time": timestamp(),
                    "event": "joined",
                    "name": user.name,
                    "count": manager.user_count(),
                }
            )

        last_seen = time.monotonic()
        while True:
            try:
                raw = await asyncio.wait_for(
                    websocket.receive_text(), timeout=HEARTBEAT_INTERVAL_SECONDS
                )
            except asyncio.TimeoutError:
                if time.monotonic() - last_seen > HEARTBEAT_TIMEOUT_SECONDS:
                    await websocket.close()
                    return
                await _send_json(websocket, {"type": "ping"})
                continue
            last_seen = time.monotonic()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if not isinstance(data, dict):
                continue
            msg_type = data.get("type")

            if msg_type == "pong":
                continue

            if msg_type == "chat":
                text = str(data.get("text", "")).strip()[:MESSAGE_MAX_LENGTH]
                if not text:
                    continue
                msg_id = manager.allocate_msg_id()
                base_payload = {
                    "type": "chat",
                    "id": msg_id,
                    "time": timestamp(),
                    "name": user.name,
                    "userId": user.user_id,
                    "lang": user.lang,
                    "text": text,
                }
                # 本人には即座に原文だけ届け、翻訳完了を待たせない。正式配信はbroadcast()で
                # 行い、フロント側は同じidのエントリを差し替える。
                await manager.send_to_user(
                    user, {**base_payload, "translations": {}, "rooms": manager.rooms_state()}
                )

                target_langs = sorted({u.lang for u in manager.users.values()} - {user.lang})
                translations: dict[str, str] = {}
                if target_langs:
                    chat_history = [h for h in manager.history if h.get("type") == "chat"]
                    translations = await translate_message(chat_history, user.lang, text, target_langs)
                await manager.broadcast({**base_payload, "translations": translations})

            elif msg_type == "leave":
                left_user = manager.leave(user.user_id)
                if left_user:
                    for ws in left_user.sockets:
                        try:
                            await _send_json(ws, {"type": "left"})
                            await ws.close()
                        except Exception:
                            pass
                    await manager.broadcast(
                        {
                            "type": "system",
                            "id": manager.allocate_msg_id(),
                            "time": timestamp(),
                            "event": "left",
                            "name": left_user.name,
                            "count": manager.user_count(),
                        }
                    )
                return

    except WebSocketDisconnect:
        pass
    finally:
        # どの終了経路でも必ずソケットを回収する。leave済みなら detach は何もしない。
        manager.detach(websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
