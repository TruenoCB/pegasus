package handlers

import (
	"net/http"
	"pegasus/internal/services"

	"github.com/gin-gonic/gin"
)

type AIHandler struct {
	aiService *services.AIService
	esService *services.ESService
}

func NewAIHandler(ai *services.AIService, es *services.ESService) *AIHandler {
	return &AIHandler{aiService: ai, esService: es}
}

type SummarizeRequest struct {
	Content string `json:"content" binding:"required"`
	Title   string `json:"title"` // Optional, for indexing
	Lang    string `json:"lang"`
	URL     string `json:"url"`   // Optional, for indexing
}

func (h *AIHandler) Summarize(c *gin.Context) {
	var req SummarizeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	lang := req.Lang
	if lang == "" {
		lang = "zh" // Default to Chinese
	}

	summary, err := h.aiService.Summarize(req.Content, lang)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Index to ES if title is provided
	if req.Title != "" && h.esService != nil {
		// Use a simple ID generation or let ES generate one (if I changed the code, but here I need an ID)
		// For now, just use current time as ID for simplicity or ignore error
		_ = h.esService.IndexSummary(req.URL, req.Title, summary, req.URL)
	}

	c.JSON(http.StatusOK, gin.H{
		"summary": summary,
	})
}
