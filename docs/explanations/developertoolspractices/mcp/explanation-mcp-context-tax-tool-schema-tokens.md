---
title: 'The MCP Context Tax: Measuring What Registered Tool Schemas Cost Every Turn'
diataxis: Explanation
domain: developer-tools-practices
topic: mcp
source: DEV.to Tech News
source_url: https://dev.to/eliashivemind/i-measured-my-mcp-servers-context-tax-before-adding-a-third-tool-40gg
date: 2026-11-20
keywords:
- knowledge-base
- mcp
- developer-tools-practices
- explanations
---
# The MCP Context Tax: Measuring What Registered Tool Schemas Cost Every Turn

"Context tax" = the recurring token cost every registered MCP tool imposes **whether or not it is ever called**. The mechanism: for a model to know a tool exists, the host sends the tool's *full definition* — name, description, and complete JSON Schema of its inputs — with **every request**. Every tool is a standing charge on every turn of an agent loop.

The source article's contribution is methodological: rather than arguing about the cost in the abstract, the author *measured their own server* (a two-tool image/video generation MCP server, `nova-ops-nim-mcp`) before deciding whether to add a third tool.

## The audit script (30 lines, no dependencies)

Token counts are tokenizer-dependent, so measure the **exact serialized size** and convert with two heuristics (4 chars/token and 3.6 chars/token):

```js
const tools = [ /* your tool definitions, as your host sends them */ ];

for (const t of tools) {
  const s = JSON.stringify(t);
  console.log(t.name, "chars=", s.length,
    "estTokens@4cpt=", Math.ceil(s.length / 4),
    "estTokens@3.6cpt=", Math.ceil(s.length / 3.6));
}
const all = JSON.stringify(tools);
const perTurn = Math.ceil(all.length / 4);
console.log("TOTAL tools=", tools.length, "chars=", all.length,
  "estTokensPerTurn@4cpt=", perTurn);
console.log("10-turn cumulative @4cpt=", perTurn * 10);
console.log("Share of a 200k window @4cpt=",
  (perTurn / 200000 * 100).toFixed(3) + "%");
```

Real output from the two-tool server, unedited:

```
nim_generate_image  chars=309  estTokens@4cpt=78   estTokens@3.6cpt=86
nim_generate_video  chars=478  estTokens@4cpt=120  estTokens@3.6cpt=133
TOTAL tools=2 chars=790 estTokensPerTurn@4cpt=198
10-turn cumulative @4cpt=1980
Share of a 200k window @4cpt=0.099%
```

## Reading the numbers honestly

- ~200 tokens/turn ≈ **0.1% of a 200k window** — negligible for two dissimilar tools; tool selection stays unambiguous.
- The **hard number is serialized size** (790 chars); the token figure is an estimate that moves with the model's tokenizer. Argue with the conversion factor, not the size.
- **Prompt caching changes the dollar cost, not the attention cost.** A cached prefix is billed cheaper, but the model still attends to every schema every turn — every schema competes with your actual task for attention.
- Extrapolation (arithmetic, not benchmark): tools averaging ~100 tokens × 50 tools ≈ **5,000 tokens of schema before the user types a word**; stacking several such servers multiplies it.

## The design rule the author adopted

The tax is not any single tool — it is the habit of registering an entire API surface "just in case". The adopted gate before adding tool #3: **each tool's schema must earn its per-turn cost**, measured (chars → estimated tokens/turn, cumulative across the expected agent-loop length), not guessed. Alternatives when a schema is too expensive: consolidate tools, shorten descriptions, flatten/simplify JSON Schemas, or move rarely-used capabilities behind a code-mode/meta-tool pattern (see related note on MCP code mode).

## Mental model

```
cost(server) = Σ tool_schema_tokens × turns            (attention cost, uncached)
             ≠ billed tokens when prompt caching applies (money, not attention)

Registering "just in case" =>  cost × unused_tools × turns, paid forever
```

## Related notes

- [Explanation: Tool Descriptions Are the Contract](explanation-tool-descriptions-are-the-contract.md)
- [Explanation: MCP Code Mode — Context Engineering by Calling Tools from a Program](explanation-mcp-code-mode-context-engineering.md)
- [Explanation: MCP Discovery Storms and SEP-2549 Caching](explanation-mcp-discovery-storms-sep-2549-caching.md)

## References

- [I Measured My MCP Server's Context Tax Before Adding a Third Tool (DEV.to)](https://dev.to/eliashivemind/i-measured-my-mcp-servers-context-tax-before-adding-a-third-tool-40gg)
- [nova-ops-nim-mcp (the measured server)](https://github.com/elias-hivemind/nova-ops-nim-mcp)
