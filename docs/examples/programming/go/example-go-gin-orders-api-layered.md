---
title: Building a REST API in Go with Gin — Layered Orders API
diataxis: Example
domain: programming
topic: go
source: DEV.to Tech News
source_url: https://dev.to/mihirmohapatra/building-my-first-real-api-in-go-with-gin-3kio
date: 2026-09-10
keywords:
- knowledge-base
- go
- programming
- examples
---
# Building a REST API in Go with Gin — Layered Orders API

A worked example that wires a small **Orders API** (create, fetch by ID, list) into a running server that accepts requests and talks to a store. It is simple enough that the routing and middleware patterns stay clear, but complex enough that Go's error handling and concurrency patterns actually matter. The whole thing is ~120 lines across four flat packages.

## Why Gin

Go's standard `net/http` is genuinely capable — you can write a production API with nothing else. Gin is worth reaching for because it adds three things that remove a lot of boilerplate:

- a **clean router** with path parameters and route groups,
- a **middleware chain** that composes nicely,
- **response helpers** (`c.JSON`, `c.AbortWithStatusJSON`) that cut boilerplate.

It is the closest thing Go has to a lightweight Express or Axum — fast, minimal, and it does not try to own your entire architecture.

A quick decision rule before you reach for it: if the whole service is one or two handlers with no middleware, no validation, and no path parameters, the standard library alone is genuinely enough — zero dependencies is a real property worth keeping (and Go 1.22's `ServeMux` gained method-aware, path-parameter routing, which covers more than it used to). Gin earns its keep as soon as you have a **router with path parameters and route groups**, **binding-based validation** on request bodies, or a **composable middleware chain** — which is exactly the shape most real services take.

```bash
go mod init orders-api
go get github.com/gin-gonic/gin
```

## Project structure

The standard Go flat-package layout — no `src/`, no deep nesting, no framework-imposed folders:

```
orders-api/
├── main.go
├── handler/
│   └── order.go
├── model/
│   └── order.go
├── store/
│   └── order.go
└── middleware/
    └── logger.go
```

Each layer depends on the one below it, and none import each other in circles: `handler` owns HTTP concerns, `model` owns data shapes, `store` owns persistence, `middleware` owns cross-cutting logging.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "b1", "type": "rectangle", "x": 260, "y": 20, "width": 240, "height": 70,
      "strokeColor": "#1e1e1e", "backgroundColor": "#c4e0f2", "fillStyle": "solid", "strokeWidth": 2,
      "text": { "content": "HTTP client\n(POST/GET /api/v1/orders)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b2", "type": "rectangle", "x": 260, "y": 140, "width": 240, "height": 70,
      "strokeColor": "#1e1e1e", "backgroundColor": "#d9ccff", "fillStyle": "solid", "strokeWidth": 2,
      "text": { "content": "middleware.Logger()\n(timing, request log)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b3", "type": "rectangle", "x": 260, "y": 260, "width": 240, "height": 70,
      "strokeColor": "#1e1e1e", "backgroundColor": "#f9e0a3", "fillStyle": "solid", "strokeWidth": 2,
      "text": { "content": "handler.OrderHandler\n(ShouldBindJSON, errors.Is)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b4", "type": "rectangle", "x": 260, "y": 380, "width": 240, "height": 70,
      "strokeColor": "#1e1e1e", "backgroundColor": "#c9e7c9", "fillStyle": "solid", "strokeWidth": 2,
      "text": { "content": "store.OrderStore (iface)\n→ inMemoryStore (RWMutex)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b5", "type": "rectangle", "x": 560, "y": 380, "width": 200, "height": 70,
      "strokeColor": "#1e1e1e", "backgroundColor": "#f9d3d3", "fillStyle": "solid", "strokeWidth": 2,
      "text": { "content": "model.Order\n(→ pgx later)", "fontSize": 14, "fontFamily": 1 }
    },
    { "id": "a1", "type": "arrow", "x": 380, "y": 90, "width": 0, "height": 50, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "strokeWidth": 2, "points": [[0,0],[0,50]] },
    { "id": "a2", "type": "arrow", "x": 380, "y": 210, "width": 0, "height": 50, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "strokeWidth": 2, "points": [[0,0],[0,50]] },
    { "id": "a3", "type": "arrow", "x": 380, "y": 330, "width": 0, "height": 50, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "strokeWidth": 2, "points": [[0,0],[0,50]] },
    { "id": "a4", "type": "arrow", "x": 500, "y": 415, "width": 60, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "strokeWidth": 2, "points": [[0,0],[60,0]] }
  ]
}
```

## The model

```go
// model/order.go
package model

import "time"

type Order struct {
    ID        string    `json:"id"`
    Customer  string    `json:"customer"`
    Amount    float64   `json:"amount"`
    Status    string    `json:"status"`
    CreatedAt time.Time `json:"created_at"`
}

type CreateOrderRequest struct {
    Customer string  `json:"customer" binding:"required"`
    Amount   float64 `json:"amount"   binding:"required,gt=0"`
}
```

Two things to note:
- **Struct tags** (`json:"id"`) control serialisation — without them Gin would use the field name as-is, so `CreatedAt` would become `CreatedAt` in the JSON rather than `created_at`.
- **`binding` tags** are Gin's built-in validation: `binding:"required"` rejects blank fields, `gt=0` rejects zero or negative amounts. This is the closest Go gets to Java Bean Validation annotations, except it is enforced at the **handler layer** rather than the model layer.

## The store

For now the store is in-memory — a map behind a `sync.RWMutex`. The interface is the important part; a real database (e.g. pgx) is a one-line swap in `main.go` because the handler depends on the interface, not the concrete type.

```go
// store/order.go
package store

import (
    "errors"
    "sync"
    "time"

    "orders-api/model"

    "github.com/google/uuid"
)

var ErrNotFound = errors.New("order not found")

type OrderStore interface {
    Create(req model.CreateOrderRequest) (model.Order, error)
    GetByID(id string) (model.Order, error)
    List() ([]model.Order, error)
}

type inMemoryStore struct {
    mu     sync.RWMutex
    orders map[string]model.Order
}

func NewInMemoryStore() OrderStore {
    return &inMemoryStore{orders: make(map[string]model.Order)}
}

func (s *inMemoryStore) Create(req model.CreateOrderRequest) (model.Order, error) {
    order := model.Order{
        ID:        uuid.New().String(),
        Customer:  req.Customer,
        Amount:    req.Amount,
        Status:    "pending",
        CreatedAt: time.Now(),
    }
    s.mu.Lock()
    s.orders[order.ID] = order
    s.mu.Unlock()
    return order, nil
}

func (s *inMemoryStore) GetByID(id string) (model.Order, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    order, ok := s.orders[id]
    if !ok {
        return model.Order{}, ErrNotFound
    }
    return order, nil
}

func (s *inMemoryStore) List() ([]model.Order, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    orders := make([]model.Order, 0, len(s.orders))
    for _, o := range s.orders {
        orders = append(orders, o)
    }
    return orders, nil
}
```

`sync.RWMutex` lets multiple concurrent reads proceed at the same time but serialises writes — the right primitive for a read-heavy in-memory store. The `OrderStore` interface is defined **here**, in the `store` package, for organisation; the handler still depends on the interface, not the concrete type.

## The handler

```go
// handler/order.go
package handler

import (
    "errors"
    "net/http"

    "orders-api/model"
    "orders-api/store"

    "github.com/gin-gonic/gin"
)

type OrderHandler struct {
    store store.OrderStore
}

func NewOrderHandler(s store.OrderStore) *OrderHandler {
    return &OrderHandler{store: s}
}

func (h *OrderHandler) Create(c *gin.Context) {
    var req model.CreateOrderRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    order, err := h.store.Create(req)
    if err != nil {
        c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "could not create order"})
        return
    }

    c.JSON(http.StatusCreated, order)
}

func (h *OrderHandler) GetByID(c *gin.Context) {
    id := c.Param("id")

    order, err := h.store.GetByID(id)
    if err != nil {
        if errors.Is(err, store.ErrNotFound) {
            c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "order not found"})
            return
        }
        c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "could not fetch order"})
        return
    }

    c.JSON(http.StatusOK, order)
}

func (h *OrderHandler) List(c *gin.Context) {
    orders, err := h.store.List()
    if err != nil {
        c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "could not list orders"})
        return
    }
    c.JSON(http.StatusOK, orders)
}
```

- **`ShouldBindJSON`** is where the `binding` tags from the model earn their keep — it validates and decodes the request body in one call, returning a descriptive error if anything fails.
- **`errors.Is(err, store.ErrNotFound)`** unwraps through layers and matches the sentinel; the handler translates a store-layer sentinel into an HTTP 404 at the HTTP boundary.
- The handler does not know or care whether the store is in-memory or PostgreSQL — it just speaks to the interface.

## Middleware: request logging

```go
// middleware/logger.go
package middleware

import (
    "fmt"
    "time"

    "github.com/gin-gonic/gin"
)

func Logger() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        c.Next()
        fmt.Printf("[%s] %s %s %d (%s)\n",
            start.Format("15:04:05"),
            c.Request.Method,
            c.Request.URL.Path,
            c.Writer.Status(),
            time.Since(start),
        )
    }
}
```

`c.Next()` hands control to the next handler in the chain; execution returns here after the response is written — which is why `time.Since(start)` gives the actual request duration. This is the middleware pattern in every Gin-based service: **wrap, call `Next()`, do something with what happened after**.

## Wiring it together

```go
// main.go
package main

import (
    "orders-api/handler"
    "orders-api/middleware"
    "orders-api/store"

    "github.com/gin-gonic/gin"
)

func main() {
    s := store.NewInMemoryStore()
    h := handler.NewOrderHandler(s)

    r := gin.New()
    r.Use(middleware.Logger())

    api := r.Group("/api/v1")
    {
        orders := api.Group("/orders")
        orders.POST("", h.Create)
        orders.GET("", h.List)
        orders.GET("/:id", h.GetByID)
    }

    r.Run(":8080")
}
```

- **`gin.New()`** instead of `gin.Default()` gives a blank engine — no built-in logger or recovery middleware added automatically, since we provide our own.
- **`r.Group`** nesting gives every orders route the `/api/v1/orders` prefix without repeating it on each registration.

Hitting `POST /api/v1/orders` with a JSON body gives a real response — with validation, error handling, and request logging — in about 120 lines across all files.

## What this draws on (from the series)

- **Interfaces:** `OrderStore` is a single-responsibility interface Go favours — three methods, defined by the consumer (the handler), satisfied **implicitly** by the concrete store.
- **Concurrency:** `sync.RWMutex` in the store is the in-memory safe-concurrency answer; with a real database the connection pool handles it instead.
- **Error handling:** `errors.Is(err, store.ErrNotFound)` translating a store-layer sentinel into HTTP 404 is the wrapping pattern paying off at the HTTP boundary.

## What comes next

The series continues with **testing** — table-driven tests, the `httptest` package for handler tests without spinning up a real server, and the benchmarking habits that matter once the in-memory store is swapped for a real database.

## References

- [Building My First Real API in Go — with Gin (DEV.to, 2026-06-22)](https://dev.to/mihirmohapatra/building-my-first-real-api-in-go-with-gin-3kio)
- [Is net/http All You Need, or Does Gin Offer More? (DEV.to)](https://dev.to/leapcell/is-nethttp-all-you-need-or-does-gin-offer-more-4k4c)
- [Gin (gin-gonic/gin) — documentation and examples](https://github.com/gin-gonic/gin)
- [Go standard library: net/http (docs)](https://pkg.go.dev/net/http)
