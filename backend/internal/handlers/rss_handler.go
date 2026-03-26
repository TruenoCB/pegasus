package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"pegasus/internal/services"
	"time"

	"github.com/gin-gonic/gin"
)

func NewRSSHandler(rss *services.RSSService, ai *services.AIService, notificationService *services.NotificationService) *RSSHandler {
	return &RSSHandler{
		rssService:          rss,
		aiService:           ai,
		notificationService: notificationService,
	}
}

type RSSHandler struct {
	rssService          *services.RSSService
	aiService           *services.AIService
	notificationService *services.NotificationService
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
			"title":     item.OriginalTitle,
			"link":      req.URL,                                   // Using feed URL as fallback since link isn't in AISummary yet
			"summary":   item.OriginalContent,                      // Fallback to content if no AI summary yet
			"keyPoints": []string{"Point 1", "Point 2", "Point 3"}, // Dummy points
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"feed":      feed,
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
	Name              string   `json:"name" binding:"required"`
	Description       string   `json:"description"`
	URLs              []string `json:"urls" binding:"required"`
	Emails            []string `json:"emails"`
	PromptConfig      string   `json:"prompt_config"`
	EmailPromptConfig string   `json:"email_prompt_config"`
	Frequency         string   `json:"frequency"` // "daily", "weekly", "monthly"
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	group, err := h.rssService.CreateGroup(userID, req.Name, req.Description, req.URLs, req.Emails, req.PromptConfig, req.EmailPromptConfig, req.Frequency)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, group)
}

func (h *RSSHandler) GetMyGroups(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	groups, err := h.rssService.GetUserGroups(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, groups)
}

type GenerateGroupReportRequest struct {
	GroupID   string `json:"group_id" binding:"required"`
	SendEmail bool   `json:"send_email"`
}

func (h *RSSHandler) UpdateGroup(c *gin.Context) {
	userID := c.GetString("user_id")
	groupID := c.Param("id")

	var req struct {
		Name              string   `json:"name" binding:"required"`
		URLs              []string `json:"urls" binding:"required"`
		PromptConfig      string   `json:"prompt_config"`
		EmailPromptConfig string   `json:"email_prompt_config"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.rssService.UpdateGroup(userID, groupID, req.Name, req.URLs, req.PromptConfig, req.EmailPromptConfig)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func (h *RSSHandler) GenerateGroupReport(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req GenerateGroupReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Get Group details
	group, err := h.rssService.GetGroupByID(req.GroupID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "group not found"})
		return
	}

	// Respond immediately to let frontend know it's started
	c.JSON(http.StatusAccepted, gin.H{"status": "generating", "message": "Report generation started in background"})

	// 2. Run the rest of the process asynchronously
	go func() {
		// 2. Fetch all feeds
		var urls []string
		if err := json.Unmarshal([]byte(group.FeedConfigs), &urls); err != nil {
			return
		}

		var allItemsContent string
		for _, url := range urls {
			_, items, err := h.rssService.FetchAndParse(url)
			if err == nil {
				for _, item := range items {
					// Only take the first 500 chars to avoid huge context
					content := item.OriginalContent
					if len(content) > 500 {
						content = content[:500] + "..."
					}
					allItemsContent += fmt.Sprintf("Title: %s\nContent: %s\n\n", item.OriginalTitle, content)
				}
			}
		}

		// 3. Generate AI Report using prompt config
		reportContent, err := h.aiService.GenerateReport(allItemsContent, group.PromptConfig)
		if err != nil {
			return
		}

		// 4. Save as permanent asset
		title := fmt.Sprintf("Report for %s - %s", group.Name, time.Now().Format("2006-01-02"))
		_, err = h.rssService.SaveSummaryReport(userID, group.ID, title, reportContent)
		if err != nil {
			return
		}

		// 5. Send email if requested
		if req.SendEmail && group.NotificationEmails != "" {
			var emails []string
			if err := json.Unmarshal([]byte(group.NotificationEmails), &emails); err == nil && len(emails) > 0 {

				emailContent := reportContent
				// Apply custom email formatting prompt if configured in the group
				if group.EmailPromptConfig != "" {
					formattedContent, err := h.aiService.GenerateReport(reportContent, group.EmailPromptConfig)
					if err == nil && formattedContent != "" {
						emailContent = formattedContent
					}
				}

				h.notificationService.SendEmail(emails, title, emailContent)
			}
		}
	}()
}

func (h *RSSHandler) GetSummaryReports(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	reports, err := h.rssService.GetSummaryReports(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}
