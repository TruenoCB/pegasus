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

type ProcessRequest struct {
	URL string `json:"url" binding:"required"`
}

func (h *RSSHandler) Process(c *gin.Context) {
	var req ProcessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	feed, items, err := h.rssService.FetchAndParse(req.URL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// For the frontend "AI Analyze" button, we need to return summaries
	// Ideally this should trigger the AI service, but for now we'll format the items to match what frontend expects
	var summaries []map[string]interface{}
	for _, item := range items {
		summaries = append(summaries, map[string]interface{}{
			"title": item.OriginalTitle,
			"link":  req.URL, // Using feed URL as fallback since link isn't in AISummary yet
			"summary": item.OriginalContent, // Fallback to content if no AI summary yet
			"keyPoints": []string{"Point 1", "Point 2", "Point 3"}, // Dummy points
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"feed": feed,
		"summaries": summaries,
	})
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

func (h *RSSHandler) GetPopularSources(c *gin.Context) {
	sources, err := h.rssService.GetPopularSources()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sources)
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
