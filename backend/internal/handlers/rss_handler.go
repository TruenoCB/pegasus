package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"pegasus/internal/models"
	"pegasus/internal/services"
	"regexp"
	"strings"
	"sync"
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

type UpdateGroupRequest struct {
	Name              string   `json:"name" binding:"required"`
	URLs              []string `json:"urls" binding:"required"`
	Emails            []string `json:"emails"`
	PromptConfig      string   `json:"prompt_config"`
	EmailPromptConfig string   `json:"email_prompt_config"`
	Frequency         string   `json:"frequency"` // "daily", "weekly", "monthly"
}

func (h *RSSHandler) UpdateGroup(c *gin.Context) {
	userID := c.GetString("user_id")
	groupID := c.Param("id")

	var req UpdateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.rssService.UpdateGroup(userID, groupID, req.Name, req.URLs, req.Emails, req.PromptConfig, req.EmailPromptConfig, req.Frequency)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func fetchArticleText(url string) string {
	if url == "" {
		return ""
	}
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return ""
	}
	defer resp.Body.Close()

	// Read a limited amount of bytes to prevent memory issues
	bodyBytes := make([]byte, 1024*100) // max 100KB
	n, _ := resp.Body.Read(bodyBytes)
	html := string(bodyBytes[:n])

	// very naive HTML strip
	re := regexp.MustCompile(`(?s)<script.*?>.*?</script>|<style.*?>.*?</style>|<[^>]+>`)
	text := re.ReplaceAllString(html, " ")

	// collapse whitespace
	reSpace := regexp.MustCompile(`\s+`)
	text = reSpace.ReplaceAllString(text, " ")

	text = strings.TrimSpace(text)

	if len(text) > 4000 {
		text = text[:4000] // limit to 4000 chars per article to avoid massive tokens
	}
	return text
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

		type itemSummary struct {
			title   string
			summary string
		}
		var summaries []itemSummary
		var wg sync.WaitGroup
		var mu sync.Mutex

		for _, url := range urls {
			_, items, err := h.rssService.FetchAndParse(url)
			if err == nil {
				for _, item := range items {
					wg.Add(1)
					go func(it models.AISummary) {
						defer wg.Done()

						// Map phase: Fetch linked content
						text := fetchArticleText(it.Link)

						// If scraping failed or returned too little content, ask LLM to extract links
						if len(text) < 100 {
							fallbackPrompt := "The following is an RSS item content. It might contain a link to the full article. Please extract the main URL from it. Only output the URL, nothing else:\n\n" + it.OriginalContent
							extractedLink, err := h.aiService.GenerateReport(it.OriginalContent, fallbackPrompt)
							if err == nil && strings.HasPrefix(extractedLink, "http") {
								text = fetchArticleText(strings.TrimSpace(extractedLink))
							}
						}

						if text == "" {
							text = it.OriginalContent
						}
						if len(text) > 4000 {
							text = text[:4000]
						}

						// Summarize individual article
						mapPrompt := "Please summarize the core points of the following article in 100-150 words. Extract the most valuable factual information and ignore ads or navigation text."
						summary, err := h.aiService.GenerateReport(text, mapPrompt)
						if err != nil {
							// fallback
							if len(text) > 300 {
								summary = text[:300] + "..."
							} else {
								summary = text
							}
						}

						mu.Lock()
						summaries = append(summaries, itemSummary{title: it.OriginalTitle, summary: summary})
						mu.Unlock()
					}(item)
				}
			}
		}
		wg.Wait()

		var allItemsContent string
		for _, s := range summaries {
			allItemsContent += fmt.Sprintf("Title: %s\nSummary: %s\n\n", s.title, s.summary)
		}

		// 3. Reduce phase: Generate AI Report using prompt config
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
