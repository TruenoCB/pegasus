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
	// Since daily, weekly, monthly are distinct scheduled runs,
	// we will always fetch the last 24h/7d/30d of content from the database.
	// We want to fetch items that fall within `since`, whether they were previously summarized or not,
	// to build a comprehensive weekly/monthly report.
	// For 'daily', we use GetUnsummarizedItems to avoid repeating same news in the same day.
	// For 'weekly'/'monthly', we can fetch all items in that period to create an overarching summary.

	var items []models.AISummary
	var emails []string

	if group.NotificationEmails != "" {
		json.Unmarshal([]byte(group.NotificationEmails), &emails)
	}

	if reportType == "daily" {
		var urls []string
		if err := json.Unmarshal([]byte(group.FeedConfigs), &urls); err != nil {
			return nil, err
		}
		
		// Clean URLs identically to how they are stored in DB
		var cleanURLs []string
		for _, u := range urls {
			clean := strings.TrimSpace(strings.ReplaceAll(u, "`", ""))
			clean = strings.TrimSpace(strings.ReplaceAll(clean, "'", ""))
			cleanURLs = append(cleanURLs, clean)
		}

		var feedIDs []string
		s.db.Model(&models.RSSFeed{}).Where("url IN ?", cleanURLs).Pluck("id", &feedIDs)

		if len(feedIDs) == 0 {
			return nil, fmt.Errorf("no matching feeds found in database for group URLs")
		}

		if err := s.db.Where("feed_id IN ? AND created_at > ?", feedIDs, since).Find(&items).Error; err != nil {
			return nil, err
		}
	} else {
		// For weekly/monthly, fetch reports that were generated within the time window
		var oldReports []models.SummaryReport
		if err := s.db.Where("group_id = ? AND created_at >= ?", groupID, since).Order("created_at desc").Find(&oldReports).Error; err != nil {
			return nil, err
		}

		if len(oldReports) == 0 {
			return nil, fmt.Errorf("no daily reports found for %s summary", reportType)
		}

		// Convert old reports into mock items for summarization
		for _, r := range oldReports {
			items = append(items, models.AISummary{
				OriginalTitle:   fmt.Sprintf("Daily Report (%s)", r.CreatedAt.Format("2006-01-02")),
				OriginalContent: r.Content,
			})
		}
	}

	if len(items) == 0 {
		return nil, fmt.Errorf("no items found for report")
	}

	// 4. Map Phase: Summarize individual items if daily (to avoid token limit)
	var contentBuilder strings.Builder
	contentBuilder.WriteString(fmt.Sprintf("Report for %s (%s)\n\n", group.Name, reportType))

	if reportType == "daily" {
		for _, item := range items {
			// individual map summary
			mapPrompt := "Please summarize the core points of the following text in 50-100 words."
			itemSummary, err := s.aiService.GenerateReport(item.OriginalContent, mapPrompt)
			if err != nil {
				// fallback to original if map fails
				if len(item.OriginalContent) > 300 {
					itemSummary = item.OriginalContent[:300] + "..."
				} else {
					itemSummary = item.OriginalContent
				}
			}
			contentBuilder.WriteString(fmt.Sprintf("- %s\n%s\n\n", item.OriginalTitle, itemSummary))
		}
	} else {
		for _, item := range items {
			contentBuilder.WriteString(fmt.Sprintf("- %s\n%s\n\n", item.OriginalTitle, item.OriginalContent))
		}
	}

	// 5. Reduce Phase: AI Summarize
	fullContent := contentBuilder.String()

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
