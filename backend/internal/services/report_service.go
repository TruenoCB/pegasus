package services

import (
	"encoding/json"
	"fmt"
	"pegasus/internal/models"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReportService struct {
	db                  *gorm.DB
	rssService          *RSSService
	aiService           *AIService
	notificationService *NotificationService
}

func NewReportService(db *gorm.DB, rss *RSSService, ai *AIService, ns *NotificationService) *ReportService {
	return &ReportService{
		db:                  db,
		rssService:          rss,
		aiService:           ai,
		notificationService: ns,
	}
}

func (s *ReportService) GenerateReport(groupID string, reportType string) (*models.Report, error) {
	// 1. Determine time range
	now := time.Now()
	var since time.Time
	switch reportType {
	case "daily":
		since = now.Add(-24 * time.Hour)
	case "weekly":
		since = now.Add(-7 * 24 * time.Hour)
	case "monthly":
		since = now.Add(-30 * 24 * time.Hour)
	default:
		return nil, fmt.Errorf("invalid report type: %s", reportType)
	}

	// 2. Refresh feeds (ensure we have latest data)
	// We need to get group details first to get URLs
	var group models.RSSGroup
	if err := s.db.First(&group, "id = ?", groupID).Error; err != nil {
		return nil, err
	}
	var urls []string
	json.Unmarshal([]byte(group.FeedConfigs), &urls)
	
	for _, url := range urls {
		// Ignore errors here to not fail entire report if one feed fails
		_ = s.rssService.FetchAndSave(url)
	}

	// 3. Get Items
	items, emails, err := s.rssService.GetUnsummarizedItems(groupID, since)
	if err != nil {
		return nil, err
	}

	if len(items) == 0 {
		return nil, fmt.Errorf("no items found for report")
	}

	// 4. Aggregate Content
	var contentBuilder strings.Builder
	contentBuilder.WriteString(fmt.Sprintf("Report for %s (%s)\n\n", group.Name, reportType))
	for _, item := range items {
		contentBuilder.WriteString(fmt.Sprintf("- %s\n%s\n\n", item.OriginalTitle, item.OriginalContent))
	}

	// 5. AI Summarize
	// Truncate if too long (simple approach)
	fullContent := contentBuilder.String()
	if len(fullContent) > 10000 {
		fullContent = fullContent[:10000] + "...(truncated)"
	}
	
	summary, err := s.aiService.Summarize(fullContent, "zh") // Default to Chinese
	if err != nil {
		return nil, err
	}

	// 6. Save Report
	report := models.Report{
		ID:          uuid.New().String(),
		RSSGroupID:  groupID,
		Type:        reportType,
		Content:     summary,
		Status:      "completed",
		GeneratedAt: time.Now(),
	}
	if err := s.db.Create(&report).Error; err != nil {
		return nil, err
	}

	// 7. Send Notification
	subject := fmt.Sprintf("[%s Report] %s", strings.Title(reportType), group.Name)
	// Convert Markdown summary to HTML (simple replace for now, or just send as pre)
	htmlBody := fmt.Sprintf("<h2>%s</h2><pre style='white-space: pre-wrap;'>%s</pre>", subject, summary)
	
	go s.notificationService.SendEmail(emails, subject, htmlBody)

	return &report, nil
}
