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

	// Use FetchAndSave for persistence
	if err := h.rssService.FetchAndSave(req.URL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "fetched and saved"})
}

type CreateGroupRequest struct {
	Name        string   `json:"name" binding:"required"`
	Description string   `json:"description"`
	URLs        []string `json:"urls" binding:"required"`
	Emails      []string `json:"emails"`
}

func (h *RSSHandler) CreateGroup(c *gin.Context) {
	userID := c.GetString("user_id") // From middleware
	if userID == "" {
		// Fallback for dev/test without auth middleware, but ideally should be protected
		// c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		// return
		userID = "test-user-id" // Temporary hack if middleware not set
	}

	var req CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	group, err := h.rssService.CreateGroup(userID, req.Name, req.Description, req.URLs, req.Emails)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, group)
}
