---
title: How to Build an MCP Server with FastMCP 2
diataxis: How-to Guide
domain: AI-Infrastructure
topic: AI-Frameworks
source: ''
---
# How to Build an MCP Server with FastMCP 2

---
created: 2026-07-27
type: howto
title: "How to Build an MCP Server with FastMCP 2"
domain: AI-Infrastructure
topic: AI-Frameworks/MCP
source: "Ebook: AI Agents and Applications by Roberto Infante"
source_book_id: calibrebook_494
source_chapter: "Chapter 13: Building and consuming MCP servers"
tags: [MCP, FastMCP, tool-server, AccuWeather, API-integration]
visibility: private
ai_tool_candidate: true
---

## Overview

The Model Context Protocol (MCP) standardizes how services expose tools to AI agents. FastMCP 2 is the official Python SDK for building MCP servers. This how-to covers building a weather MCP server using AccuWeather API as a practical example.

## Input Parameters

- **External API credentials** (e.g., AccuWeather API key)
- **Python environment** with FastMCP 2 installed
- **API endpoint** to wrap as an MCP tool

## Step-by-Step Procedure

### Step 1: Install FastMCP 2

```bash
pip install fastmcp aiohttp python-dotenv
```

### Step 2: Set Up Environment Variables

```env
ACCUWEATHER_API_KEY=<your-api-key>
```

Register at https://developer.accuweather.com/signup to get a free API key.

### Step 3: Create the MCP Server

```python
import os
from typing import Dict
from fastmcp import FastMCP
from dotenv import load_dotenv
from aiohttp import ClientSession

load_dotenv()

# Initialize FastMCP server
mcp = FastMCP("mcp-accuweather")

@mcp.tool(description="Get weather conditions for a location.")
async def get_weather_conditions(location: str) -> Dict:
    """Get weather conditions for a location."""
    api_key = os.getenv("ACCUWEATHER_API_KEY")
    base_url = "http://dataservice.accuweather.com"
    
    # Step 1: Search for location
    async with ClientSession() as session:
        location_search_url = f"{base_url}/locations/v1/cities/search"
        params = {"apikey": api_key, "q": location}
        
        async with session.get(location_search_url, params=params) as response:
            locations = await response.json()
            
            if response.status != 200:
                raise Exception(f"Error fetching location data: {response.status}")
            if not locations:
                raise Exception("Location not found")
            
            location_key = locations[0]["Key"]
            
            # Step 2: Get current conditions
            current_url = f"{base_url}/currentconditions/v1/{location_key}"
            params = {"apikey": api_key, "details": "true"}
            
            async with session.get(current_url, params=params) as response:
                conditions = await response.json()
                
                if conditions:
                    current = conditions[0]
                    current_data = {
                        "temperature": {
                            "value": current["Temperature"]["Metric"]["Value"],
                            "unit": current["Temperature"]["Metric"]["Unit"]
                        },
                        "weather_text": current["WeatherText"],
                        "relative_humidity": current.get("RelativeHumidity"),
                        "precipitation": current.get("HasPrecipitation", False),
                        "observation_time": current["LocalObservationDateTime"]
                    }
                else:
                    current_data = "No current conditions available"
                
                return {
                    "location": locations[0]["LocalizedName"],
                    "location_key": location_key,
                    "country": locations[0]["Country"]["LocalizedName"],
                    "current_conditions": current_data
                }

if __name__ == "__main__":
    mcp.run(
        transport="streamable-http",
        host="127.0.0.1",
        port=8020,
        path="/accu-mcp-server"
    )
```

### Step 4: Run the MCP Server

```bash
python accuweather_mcp.py
# Output: Uvicorn running on http://0.0.0.0:8020
```

### Step 5: Verify with MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

Configure in the web UI:
- **Transport Type**: Streamable HTTP
- **URL**: `http://127.0.0.1:8020/accu-mcp-server`
- **Connection Type**: Via Proxy
- **Authentication**: Disabled

Click **Tools** → **List Tools** → select `get_weather_conditions` → enter location → **Run Tool**

## Architecture

```
MCP Host (Agent)
    ↓ JSON-RPC 2.0
MCP Server (FastMCP)
    ↓ HTTP
External API (AccuWeather)
```

## Key Concepts

- **Transport options**: `streamable-http` (production), `stdio` (development/local)
- **Tool definition**: `@mcp.tool()` decorator with description and type hints
- **Async support**: Use `async def` for tool functions with async HTTP calls
- **Structured returns**: Return dictionaries with typed fields

## Error Handling

- Check API response status codes
- Validate location search results before proceeding
- Return structured error messages for missing data

## Verification

- MCP Inspector shows green "Connected" status
- Tool appears in the tools list
- Tool execution returns structured weather data
- MCP server logs show successful HTTP requests

## Related Notes

- [[How to Consume MCP Tools in LangChain LangGraph Agents]]
- [[How to Test MCP Servers with MCP Inspector]]
