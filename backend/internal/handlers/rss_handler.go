package handlers

import (
	"net/http"
	"pegasus/internal/services"

	"github.com/gin-gonic/gin"
)

type RSSHandler struct {
	rssService *services.RSSService
}

func NewRSSHandler(rss *services.RSSService) *RSSHandler {
	return &RSSHandler{rssService: rss}
}

type FetchRequest struct {
	URL string `json:"url" binding:"required"`
}

func (h *RSSHandler) Fetch(c *gin.Context) {
	var req FetchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	feed, items, err := h.rssService.FetchAndParse(req.URL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"feed":  feed,
		"items": items, // In real world, we might limit this or just return count
	})
}
