from fastapi import FastAPI
from fastapi_camelcase import CamelModel
import coolname

class Lobby(CamelModel):
    id: str

app = FastAPI()

lobbies = dict[str, Lobby]

@app.get("/player_name")
async def player_name():
    return " ".join(x.capitalize() for x in coolname.generate(2))

@app.post("/lobby/new")
async def lobby_new() -> Lobby:
    return Lobby(id=coolname.generate_slug(3))

@app.post("/lobby/join/{lobby_id}")
async def lobby_id(lobby_id: str):
    lobby = lobbies.get(lobby_id)
    if lobby is None:
        raise HTTPException(status_code=404, detail="Lobby not found")