# Projeto KRATOS — Proposta de Evolução

> **Assistente estratégico de market-share em rebocagem portuária**
> Foco: Porto do Rio de Janeiro / Baía de Guanabara
>
> Documento estratégico — versão 1.0 · 2026-05-30 · autor da base: Jossian Brito

---

## 1. Visão

**KRATOS** não é um rastreador de navios. É um **co-piloto estratégico de operações
de rebocagem** que observa a Baía de Guanabara 24/7, entende o "tabuleiro" (maré,
vento, janelas de manobra, programação da praticagem), antecipa os movimentos dos
rebocadores **concorrentes** e recomenda ao operador onde há oportunidade de manobra
**sem comprometer a própria escala**.

O princípio de produto: **mostrar que o assistente está atento é metade do valor** —
independentemente do resultado de cada manobra. KRATOS está sempre um passo à frente,
e demonstra isso ao usuário de forma visível e contínua.

> KRATOS é a evolução e o rebranding do atual *"Assistente de estratégias (Grok)"*
> já presente na produção (`tuglife.live/aisstream/dashboard`).

---

## 2. Diagnóstico do estado atual (o que existe de verdade)

A análise cruzou **três fontes**: o repositório GitHub (`jbvix/aisstreamvector`), o
**site em produção** (`https://tuglife.live/aisstream/`) e o **ambiente cPanel**.

### 2.1 O que já está construído em produção

A produção está **muito mais avançada** do que o `main.py` deste repositório sugere.
O frontend de produção consome endpoints que **não existem** no `main.py` versionado:

| Capacidade em produção | Endpoint | No `main.py` do repo? |
|---|---|---|
| Assistente estratégico (Grok) com memória | `/api/strategy-assistant`, `/api/dashboard/strategy-assistant` | ❌ Não |
| Sincronização com a Praticagem | `/api/praticagem/saa-sync`, `/api/saa-maneuvers/sync-praticagem` | ❌ Não |
| Geofences com ocupação | `/api/geofences`, `/api/geofences/occupancy` | ❌ Não |
| Dashboard estratégico (Chart.js) | `/api/dashboard/overview`, `/api/overview` | ❌ Não |
| Relay AIS + áreas + modo | `/api/status`, `/api/areas`, `/api/vessels`, `/api/mode`, `/api/area` | ✅ Sim |

O frontend de produção já menciona, hoje: **praticagem (124x)**, **geofence (313x)**,
**rebocador (92x)**, **market (27x)**, **concorrentes**, **maré**, **vento** e um
**"Assistente de estratégias (Grok)"** com campo de *aprendizado/memória*
("Em navio >300m, priorizar 4 rebocadores").

A produção roda em **Python 3.11.14** via Passenger (`passenger_wsgi.py`), com
`DEFAULT_AREA=rio` e o assistente apoiado em **xAI Grok (`grok-3-mini`)**.

### 2.2 Ecossistema maior (cPanel Git Version Control)

O servidor hospeda **4 repositórios** relacionados — KRATOS é parte de um conjunto:

- `aisstream_app` — a aplicação em produção (a mais avançada)
- `tugmaster` — (frota/rebocadores?)
- `sisnav-costeiro` — (navegação costeira?)
- `chart_server` — (servidor de cartas/gráficos?)

> Recomendação: mapear papel de cada repo e definir a arquitetura do conjunto
> (ver §6). Estes repos provavelmente contêm peças reaproveitáveis para o KRATOS.

### 2.3 ⚠️ Achados críticos (resolver ANTES de evoluir)

| # | Achado | Risco | Ação |
|---|--------|-------|------|
| **C1** | **Repositório GitHub defasado em relação à produção.** O `aisstream_app` no cPanel está à frente; o `main.py` daqui não tem Grok, praticagem, geofences nem dashboard. | **Deploy a partir deste repo destruiria features de produção** (assistente, praticagem, geofences). | Reconciliar: tornar o repo de produção a fonte de verdade e espelhá-lo no GitHub **antes** de qualquer deploy. |
| **C2** | **Segredos expostos.** `AISSTREAM_API_KEY` está commitada no `.env` do git; `XAI_API_KEY` também trafega na configuração. | Chaves podem ser usadas/esgotadas por terceiros. | **Revogar e regerar** ambas as chaves; usar apenas variáveis de ambiente do cPanel; manter `.env` fora do git (já corrigido neste branch). |
| **C3** | **Estado 100% em memória** (`deque`, dicts globais no `main.py`). | Reinício do app → perda de histórico; inviabiliza análise de movimento, market-share e memória da concorrência. | Persistência (SQLite → Postgres + camada de séries temporais). |
| **C4** | **Frontend não versionado no GitHub.** Existia apenas no servidor. | Risco de perda total da UI. | Snapshot ao vivo trazido para `frontend/` neste branch (pode divergir do fonte do servidor — ver §6.1). |

---

## 3. Estratégia de produto — "o jogo"

KRATOS opera em 4 camadas de inteligência crescente. As camadas 1–2 já existem
parcialmente em produção; o valor está em fechar 3–4.

**Camada 1 — Consciência situacional** *(parcialmente pronta)*
- Plotagem em tempo real de navios e rebocadores na Baía de Guanabara.
- **Identificar/rotular rebocadores da concorrência** por MMSI/nome (catálogo de
  frotas: Wilson Sons, Saam Smit, Camorim, etc.).
- Geofences operacionais com **ocupação** (canal, fundeio, berços, área de espera).

**Camada 2 — Contexto ambiental (o "tabuleiro")** *(parcialmente pronta)*
- **Maré** (altura/corrente → janelas de manobra por calado).
- **Vento** (limita manobras de embarcações altas / porta-contêineres).
- **Programação da Praticagem** (entradas/saídas previstas → demanda futura de
  rebocagem). Já há sincronização "SAA" em produção — aprofundar e historizar.

**Camada 3 — Predição (estar um passo à frente)** *(a construir)*
- Cruzar programação da praticagem + comportamento dos rebocadores concorrentes para
  **prever qual rebocador vai atender qual manobra**.
- Detectar padrões ("o rebocador X desloca-se ao fundeio ~40min antes de saída de
  petroleiro").
- Calcular **ETA de oportunidade** vs. **conflito com a própria escala**.

**Camada 4 — Recomendação (a voz do KRATOS)** *(a construir / evoluir o Grok)*
- Alertas proativos de oportunidade ("manobra Z disponível; você chega em 22min,
  concorrente em 35min").
- **Dashboard de market-share**: manobras nossas vs. concorrência (7/30 dias),
  participação por berço/armador.
- **Registro de atenção**: log de toda oportunidade detectada — inclusive as não
  perseguidas — para evidenciar vigilância contínua.

---

## 4. KRATOS como assistente (evolução do Grok atual)

Hoje existe um *"Assistente de estratégias (Grok)"* com pergunta livre e nota de
aprendizado/memória. Proposta de evolução:

1. **Rebranding** para **KRATOS**, com identidade e voz próprias (persona de
   estrategista calmo, que conhece maré, vento, frota e praticagem).
2. **Memória estruturada** (RAG): persistir aprendizados, padrões da concorrência e
   histórico de manobras — e injetá-los no contexto do modelo.
3. **Proatividade**: além de responder, **gerar insights automáticos** disparados por
   eventos (nova programação da praticagem, rebocador concorrente cruzando geofence).
4. **Explicabilidade**: cada recomendação cita os fatos que a sustentam (maré X, vento
   Y, ETA concorrente Z) — transparência reforça a confiança e "mostra que está atento".
5. **Boas práticas de API** (xAI/Grok): *prompt caching* do contexto fixo (catálogo de
   frota, regras), limites de custo, e fallback gracioso quando a API falha.

---

## 5. UX / UI — "Sala de Comando KRATOS"

- **Tema command-center** escuro de alta densidade (a base visual atual — `#071424`
  / `#10253d` / acento `#35c8ff` — já é adequada; refinar contraste e hierarquia).
- **Mapa central** (Leaflet/MapLibre) com camadas alternáveis: rebocadores
  (nossos × concorrentes em cores distintas), navios em manobra, geofences com
  ocupação, vetores de maré/vento.
- **Painel KRATOS** — feed de insights em linguagem natural, ordenados por urgência;
  cada card com ação ("traçar rota", "ignorar", "registrar atenção").
- **Indicador "vivo" do KRATOS** — pulsação/heartbeat sempre visível, comunicando
  vigilância contínua.
- **Dashboard de market-share** — participação de manobras, tendência, ranking por
  concorrente (evoluir o dashboard Chart.js existente).
- **Timeline preditiva** — próximas 6–12h de manobras previstas pela praticagem, com o
  palpite do KRATOS de quem atenderá cada uma.
- **Responsivo / mobile-aware** — operador frequentemente em campo/embarcação.

---

## 6. Arquitetura proposta

```
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND — "Sala de Comando KRATOS"                          │
│  Mapa + Painel de insights + Indicador KRATOS + Dashboard     │
└───────────────▲─────────────────────────▲────────────────────┘
                │ WebSocket (tracks)       │ REST (insights, KPIs)
┌───────────────┴─────────────────────────┴────────────────────┐
│  BACKEND FastAPI/Passenger (Python 3.11)                      │
│  ├─ Relay AIS (existente)                                     │
│  ├─ Ingestores: Praticagem (SAA) · Maré · Vento (agendados)  │
│  ├─ Geofences + ocupação (existente)                         │
│  ├─ Motor KRATOS: regras + predição + memória (Grok)         │
│  └─ Persistência (SQLite→Postgres + séries temporais)        │
└──────────────────────────────────────────────────────────────┘
        │ possível integração com o ecossistema cPanel:
        └─ tugmaster · sisnav-costeiro · chart_server
```

### 6.1 Reconciliação do repositório (passo zero, bloqueante)

O GitHub e a produção **divergiram**. Antes de qualquer evolução:

1. Trazer o conteúdo do repo de produção `aisstream_app` (cPanel) como fonte de
   verdade — via `git pull` do clone SSH do cPanel, ou empurrando o repo do cPanel
   para o GitHub.
2. Confirmar que o `main.py` versionado passa a conter Grok, praticagem, geofences e
   dashboard (hoje **não contém**).
3. Só então retomar deploys a partir do GitHub.

> Neste branch foi trazido um **snapshot ao vivo** do frontend (`frontend/index.html`,
> `frontend/dashboard.html`) baixado de `tuglife.live` — útil para referência, mas o
> fonte autoritativo está no servidor e deve substituir este snapshot na reconciliação.

---

## 7. Roadmap por fases

| Fase | Foco | Entregáveis |
|------|------|-------------|
| **0 — Higiene** | Segurança & sincronização | Revogar/regerar chaves; `.env` fora do git (✅ feito); **reconciliar repo ↔ produção (C1)**; persistência básica |
| **1 — Consciência** | Foco Guanabara | Catálogo de frotas concorrentes; rótulos por MMSI; geofences com ocupação; rebranding **KRATOS**; refino do tema command-center |
| **2 — Contexto** | Dados externos | Ingestão/historização de Praticagem (SAA) + Maré + Vento; timeline preditiva |
| **3 — Inteligência** | A "voz" do KRATOS | Motor de inferência; alertas proativos de oportunidade; memória estruturada do assistente |
| **4 — Market-share** | Resultado | Dashboard de participação (nós × concorrência); scoring oportunidade × conflito de escala; registro de atenção |

---

## 8. Próximos passos imediatos

1. **Revogar e regerar** `AISSTREAM_API_KEY` e `XAI_API_KEY` (apenas o titular pode).
2. **Reconciliar** este repositório com o `aisstream_app` de produção (C1).
3. Definir o papel de `tugmaster`, `sisnav-costeiro` e `chart_server` no conjunto.
4. Aprovar este documento como norte e abrir as issues da Fase 0/1.
