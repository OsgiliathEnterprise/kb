---
title: 'Active Defense Against Prompt Injection: LLM Honeypots and Decoy Systems'
diataxis: Explanation
domain: AI-Infrastructure
topic: Agent-Security
source: DZone AI/ML
source_url: https://dzone.com/articles/protect-ai-agents-from-prompt-injections
date: 2026-07-30
keywords:
- knowledge-base
- Agent-Security
- AI-Infrastructure
- explanations
---
# Active Defense Against Prompt Injection: LLM Honeypots and Decoy Systems

## Overview

Traditional prompt injection defense relies on passive filtering — blocking requests that match known attack patterns. This approach fails against autonomous AI attackers who simply pivot when blocked. **Active defense** flips the model: instead of blocking, the system silently routes attackers into a decoy environment, wasting their resources while gathering intelligence.

This article examines the architecture and implementation of MIRAGE, an open-source LLM honeypot system built in Go, using **Lobster Trap** for deep packet inspection (DPI) of prompts and a **threshold-based switcher** for routing.

## Why Passive Blocking Fails

| Passive Blocking | Active Defense (Honeypot) |
|-----------------|--------------------------|
| Drops request with "access denied" | Routes attacker to decoy persona |
| Gives attacker a hint to pivot | Attacker thinks they succeeded |
| Defender spends more time than attacker | Attacker burns real API tokens on hallucination |
| Game of whack-a-mole | Makes attack financially unsustainable |

## Architecture: The Lobster Trap + Switcher Model

### Component Overview

```
Incoming Prompt
       │
       ▼
┌──────────────┐
│  Lobster Trap │  ← Deep Packet Inspection (DPI)
│  (Sidecar)    │     Returns risk score: 0.0 → 1.0
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Switcher   │  ← Threshold logic (default: 0.6)
│  (Go Backend)│
└──────┬───────┘
       │
       ├─ Low Risk (< 0.6) ──→ Real AI Agent
       │
       └─ High Risk (≥ 0.6) ──→ Decoy Persona (Honeypot)
```

### Lobster Trap: Prompt DPI Engine

Lobster Trap runs as a **sidecar service** separate from the main Go API. It analyzes every incoming prompt in real-time for:
- Malicious patterns
- Exfiltration attempts
- Jailbreak techniques

Returns a **risk score from 0.0 to 1.0**. The sidecar pattern keeps heavy security processing isolated from the application.

### The Switcher: Threshold-Based Routing

The core engagement function in Go:

```go
// Switcher.Engage handles the "trap" activation.
func (sw *Switcher) Engage(ctx context.Context, sess *model.Session, 
    msg string, meta model.LobsterTrapMeta) (*SwitchResult, error) {
    // 1. Mark the session as 'honeypot' in Redis so it stays trapped.
    sess.Status = model.StatusHoneypot
    
    // 2. Select the decoy persona based on the detected intent.
    persona, _ := sw.store.GetPersona(ctx, sess.PersonaID)
    
    // 3. Call the decoy LLM (with timeout!)
    genCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()
    
    decoyResp, err := sw.generator.GenerateDecoyResponse(genCtx, persona, msg)
    if err != nil {
        return &SwitchResult{DecoyResponse: "Processing..."}, nil
    }
    
    // 4. Log the attack for the Intel dashboard.
    sw.store.SaveAttack(ctx, buildAttackRecord(sess, msg, decoyResp, meta))
    
    return &SwitchResult{DecoyResponse: decoyResp}, nil
}
```

### Redis Session Persistence

The decoy response must be **consistent** across the session. If the bot is pretending to be a Finance Assistant, it cannot suddenly switch to a general chatbot persona. Redis maintains the "legend" (consistent backstory) across session history.

## The Token Burning Concept

One of the most innovative aspects of this approach is **token burning**:

1. Autonomous agents use "long-term memory" (e.g., `memory.md`) to store reconnaissance data
2. The honeypot feeds the attacker **fake file paths** or **leaked (but fake) database schemas**
3. The agent records this as a victory in its memory
4. The agent keeps coming back to that fake data across sessions
5. The attacker burns **real API tokens** attacking a hallucination

This makes the attack **financially unsustainable** for the attacker while generating intelligence for the defender.

## Attack Theater Dashboard

The system includes a React frontend with WebSocket streaming from the Go backend. When Lobster Trap detects an injection:
- The dashboard lights up in real-time
- Shows **MITRE ATLAS techniques** being used
- Displays the attacker vs. decoy interaction live

This is more effective than reading log files — you can watch an AI attacker struggle against a decoy persona in real-time.

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend | Go | Concurrency handling, WebSocket management |
| DPI Engine | Lobster Trap | Real-time prompt analysis, risk scoring |
| Session Store | Redis | Consistent decoy persona across sessions |
| Frontend | React + WebSockets | Real-time attack visualization |
| Threat Intel | MITRE ATLAS | Attack technique classification |

## Future Roadmap

- **Dynamic Legend Generation**: AI-generated fake directory structures and database schemas
- **Automated IOC Export**: Push detected attacker IPs and payloads to MISP or Splunk
- **Decoy Persona Library**: Templates for Finance, HR, Engineering, and other domains

## Key Takeaways

1. **Stop just blocking, start deceiving**: Passive filters give attackers hints; honeypots waste their resources
2. **Sidecar architecture keeps security separate**: Lobster Trap as a dedicated DPI service
3. **Consistency matters**: The decoy must maintain its persona across the entire session
4. **Token burning makes attacks unsustainable**: Wasting attacker API credits is as valuable as blocking
5. **Real-time visualization beats log files**: Seeing attacks live improves incident response

## Excalidraw Diagram: Active Defense Flow

```excalidraw
* Excalidraw below
* You can draw in the message, and call draw_excalidraw to update the drawing

{"type":"default","values":{"appScale":1.0,"pageId":"p1","pages":{"p1":{"id":"p1","type":"tumbleweed","name":"Page 1","width":2200,"height":2200,"gridSize":20,"backgroundImageSrc":null,"backgroundImageSelectedZoomLevel":0,"isEmpty":false}},"exportPadding":120,"toView":null,"gridSettings":{"customSize":20,"circular":false,"type":"square","dashed":true},"viewBackgroundColor":"#FFFFFF","theme":"dark","strokeColor":"#e6422c","backgroundColor":"#FFFFFF","fontSize":20,"font":"Cascadia","strokeWidth":2,"roughness":0,"seed":117588423,"view":null,"gridMode":false,"gridModeEnabled":false,"gridStep":5,"gridCounter":3}}
text {"id":"1","x":300.0,"y":40.0,"text":"MIRAGE: Active Defense Against Prompt Injection","fontSize":24,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aV","seed":149553083,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"2","x":100.0,"y":130.0,"text":"Phase 1: Inspection","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aW","seed":154724707,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"3","x":100.0,"y":170.0,"text":"Lobster Trap DPI Engine","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aX","seed":134999955,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"4","x":100.0,"y":195.0,"text":"Risk Score: 0.0 → 1.0","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aY","seed":150582691,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"5","x":200.0,"y":220.0,"points":"[0,0],[1,0]","startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bb","seed":277501699,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
text {"id":"6","x":350.0,"y":130.0,"text":"Phase 2: Decision","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bc","seed":163038404,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"7","x":350.0,"y":170.0,"text":"Threshold: 0.6","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bd","seed":163038405,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"8","x":450.0,"y":200.0,"points":"[0,0],[0,1]","startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"be","seed":163038406,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
text {"id":"9","x":500.0,"y":210.0,"text":"< 0.6","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bf","seed":163038407,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"10","x":450.0,"y":200.0,"points":"[0,0],[1,0]","startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bg","seed":163038408,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
text {"id":"11","x":500.0,"y":190.0,"text":"≥ 0.6","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bh","seed":163038409,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"12","x":350.0,"y":280.0,"text":"Real AI Agent","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bi","seed":163038410,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"13","x":700.0,"y":130.0,"text":"Phase 3: Trapping","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bj","seed":163038411,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"14","x":700.0,"y":170.0,"text":"Decoy Persona (Honeypot)","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bk","seed":163038412,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"15","x":700.0,"y":195.0,"text":"Consistent via Redis session","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bl","seed":163038413,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"16","x":700.0,"y":220.0,"text":"Fake data → attacker burns tokens","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bm","seed":163038414,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"17","x":700.0,"y":245.0,"text":"MITRE ATLAS technique logging","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bn","seed":163038415,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"18","x":350.0,"y":350.0,"text":"Result: Attacker wastes resources, defender gains intel","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bo","seed":163038416,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
```

## References

- [Original Article: Protecting AI Agents from Prompt Injection Attacks](https://dzone.com/articles/protect-ai-agents-from-prompt-injections) — DZone AI/ML, July 2026
- [MIRAGE GitHub Repository](https://github.com/BrightGir/AI-Honeypot) — Open-source honeypot implementation
- [MITRE ATLAS Framework](https://atlas.mitre.org/) — Adversarial Threat Landscape for AI Systems
- [Lobster Trap DPI Engine](https://github.com/lobster-trap) — Deep packet inspection for LLM prompts
- [Token Burning in Agentic AI](https://dzone.com/articles/future-of-agentic-ai) — DZone concept reference
