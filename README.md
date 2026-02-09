# demonstração-back

API Express com SQLite na porta 3000.

## Rotas

- `GET /health`
- `GET /items`
- `GET /items/:id`
- `POST /items`

### Exemplo de body (POST /items)

```json
{
  "name": "Item de exemplo"
}
```

## Como rodar

```bash
npm install
npm run dev
```

Ou em modo produção:

```bash
npm start
```
