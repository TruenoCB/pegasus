package services

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/mmcdole/gofeed"
	"gorm.io/gorm"

	"pegasus/internal/models"
)

type RSSService struct {
	db *gorm.DB
	fp *gofeed.Parser
}

func NewRSSService(db *gorm.DB) *RSSService {
	return &RSSService{
		db: db,
		fp: gofeed.NewParser(),
	}
}

func (s *RSSService) CreateGroup(userID, name, desc string, urls []string, emails []string, promptConfig string, emailPromptConfig string, frequency string) (*models.RSSGroup, error) {
	urlsJson, _ := json.Marshal(urls)
	emailsJson, _ := json.Marshal(emails)

	// Create Asset first
	asset := models.Asset{
		ID:          uuid.New().String(),
		UserID:      userID,
		Type:        "RSS_GROUP",
		Title:       name,
		Description: desc,
		Data:        "{}",
	}
	if err := s.db.Create(&asset).Error; err != nil {
		return nil, err
	}

	if frequency == "" {
		frequency = "daily" // default to daily instead of weekly
	}

	group := models.RSSGroup{
		ID:                 uuid.New().String(),
		AssetID:            asset.ID,
		Name:               name,
		Description:        desc,
		FeedConfigs:        string(urlsJson),
		NotificationEmails: string(emailsJson),
		PromptConfig:       promptConfig,
		EmailPromptConfig:  emailPromptConfig,
		ReportFrequency:    frequency,
	}
	if err := s.db.Create(&group).Error; err != nil {
		return nil, err
	}

	return &group, nil
}

func (s *RSSService) GetGroupByID(groupID string) (*models.RSSGroup, error) {
	var group models.RSSGroup
	err := s.db.Where("id = ?", groupID).First(&group).Error
	return &group, err
}

func (s *RSSService) GetUserGroups(userID string) ([]models.RSSGroup, error) {
	var groups []models.RSSGroup
	// Join with Assets to get groups for this user
	err := s.db.Table("rss_groups").
		Select("rss_groups.*").
		Joins("JOIN assets ON assets.id = rss_groups.asset_id").
		Where("assets.user_id = ?", userID).
		Find(&groups).Error
	return groups, err
}

func (s *RSSService) UpdateGroup(userID, groupID, name string, urls []string, emails []string, promptConfig string, emailPromptConfig string, frequency string) error {
	var group models.RSSGroup

	// First check if the group exists and belongs to the user
	err := s.db.Joins("JOIN assets ON assets.id = rss_groups.asset_id").
		Where("rss_groups.id = ? AND assets.user_id = ?", groupID, userID).
		First(&group).Error

	if err != nil {
		return err
	}

	urlsJson, _ := json.Marshal(urls)
	emailsJson, _ := json.Marshal(emails)

	// Update both Asset and Group
	s.db.Model(&models.Asset{}).Where("id = ?", group.AssetID).Updates(map[string]interface{}{
		"title": name,
	})

	if frequency == "" {
		frequency = "daily"
	}

	return s.db.Model(&group).Updates(map[string]interface{}{
		"name":                name,
		"feed_configs":        string(urlsJson),
		"notification_emails": string(emailsJson),
		"prompt_config":       promptConfig,
		"email_prompt_config": emailPromptConfig,
		"report_frequency":    frequency,
	}).Error
}

func (s *RSSService) SaveSummaryReport(userID, groupID, title, content string) (*models.SummaryReport, error) {
	// Create Asset first
	asset := models.Asset{
		ID:          uuid.New().String(),
		UserID:      userID,
		Type:        "SUMMARY_REPORT",
		Title:       title,
		Description: "AI Generated Summary Report",
		Data:        "{}",
	}
	if err := s.db.Create(&asset).Error; err != nil {
		return nil, err
	}

	report := models.SummaryReport{
		ID:      uuid.New().String(),
		AssetID: asset.ID,
		GroupID: &groupID,
		Title:   title,
		Content: content,
	}
	if err := s.db.Create(&report).Error; err != nil {
		return nil, err
	}

	return &report, nil
}

func (s *RSSService) GetSummaryReports(userID string) ([]models.SummaryReport, error) {
	var reports []models.SummaryReport
	err := s.db.Table("summary_reports").
		Select("summary_reports.*").
		Joins("JOIN assets ON assets.id = summary_reports.asset_id").
		Where("assets.user_id = ?", userID).
		Order("summary_reports.created_at desc").
		Find(&reports).Error
	return reports, err
}

func (s *RSSService) FetchAndParse(url string) (*models.RSSFeed, []models.AISummary, error) {
	feed, err := s.fp.ParseURL(url)
	if err != nil {
		return nil, nil, err
	}

	rssFeed := &models.RSSFeed{
		URL:         url,
		Title:       feed.Title,
		Description: feed.Description,
		LastFetch:   time.Now(),
	}

	var items []models.AISummary
	for _, item := range feed.Items {
		items = append(items, models.AISummary{
			OriginalTitle:   item.Title,
			OriginalContent: item.Description + "\n" + item.Content,
			Link:            item.Link,
		})
	}

	return rssFeed, items, nil
}
func (s *RSSService) FetchAndSave(url string) error {
	feed, err := s.fp.ParseURL(url)
	if err != nil {
		return err
	}

	rssFeed := models.RSSFeed{
		ID:  uuid.New().String(),
		URL: url,
	}
	// Find or create feed
	if err := s.db.Where("url = ?", url).FirstOrCreate(&rssFeed).Error; err != nil {
		return err
	}

	// Update feed metadata
	rssFeed.Title = feed.Title
	rssFeed.Description = feed.Description
	rssFeed.LastFetch = time.Now()
	s.db.Save(&rssFeed)

	for _, item := range feed.Items {
		content := item.Description + "\n" + item.Content
		hash := generateHash(item.Title + content)

		var exists int64
		s.db.Model(&models.AISummary{}).Where("content_hash = ?", hash).Count(&exists)
		if exists > 0 {
			continue
		}

		summary := models.AISummary{
			ID:              uuid.New().String(),
			FeedID:          rssFeed.ID,
			ContentHash:     hash,
			OriginalTitle:   item.Title,
			OriginalContent: content,
			Link:            item.Link,
			CreatedAt:       time.Now(), // or item.PublishedParsed if available
		}
		if item.PublishedParsed != nil {
			summary.CreatedAt = *item.PublishedParsed
		}

		s.db.Create(&summary)
	}

	return nil
}

func (s *RSSService) GetUnsummarizedItems(groupID string, since time.Time) ([]models.AISummary, []string, error) {
	var group models.RSSGroup
	if err := s.db.First(&group, "id = ?", groupID).Error; err != nil {
		return nil, nil, err
	}

	var urls []string
	json.Unmarshal([]byte(group.FeedConfigs), &urls)

	var feedIDs []string
	s.db.Model(&models.RSSFeed{}).Where("url IN ?", urls).Pluck("id", &feedIDs)

	if len(feedIDs) == 0 {
		return nil, nil, nil
	}

	var items []models.AISummary
	if err := s.db.Where("feed_id IN ? AND created_at > ?", feedIDs, since).Find(&items).Error; err != nil {
		return nil, nil, err
	}

	var emails []string
	json.Unmarshal([]byte(group.NotificationEmails), &emails)

	return items, emails, nil
}

func (s *RSSService) GetPopularSources() ([]models.PopularSource, error) {
	// Dynamically calculate popular sources from all user RSSGroups
	var allGroups []models.RSSGroup
	if err := s.db.Find(&allGroups).Error; err != nil {
		return nil, err
	}

	urlCounts := make(map[string]int)
	urlNames := make(map[string]string)

	for _, group := range allGroups {
		var urls []string
		if json.Unmarshal([]byte(group.FeedConfigs), &urls) == nil {
			for _, url := range urls {
				urlCounts[url]++
				// Just use the group name as a fallback name for the source if not set
				if urlNames[url] == "" {
					urlNames[url] = group.Name + " Source"
				}
			}
		}
	}

	// Fetch preset sources to mix them in or use their metadata (like icons/real names)
	var presetSources []models.PopularSource
	s.db.Find(&presetSources)
	presetMap := make(map[string]models.PopularSource)
	for _, p := range presetSources {
		presetMap[p.URL] = p
	}

	var finalSources []models.PopularSource

	// Add dynamically found sources
	for url, count := range urlCounts {
		if preset, exists := presetMap[url]; exists {
			preset.Subscribers = count // Real count
			finalSources = append(finalSources, preset)
			delete(presetMap, url) // mark as processed
		} else {
			finalSources = append(finalSources, models.PopularSource{
				ID:          uuid.New().String(),
				Name:        urlNames[url],
				URL:         url,
				Category:    "Community",
				IconType:    "Globe", // default icon
				Subscribers: count,
			})
		}
	}

	// Add remaining presets that no one subscribed to yet (so the page isn't empty initially)
	for _, p := range presetMap {
		p.Subscribers = 0 // base value
		finalSources = append(finalSources, p)
	}

	// Sort by subscribers descending
	for i := 0; i < len(finalSources); i++ {
		for j := i + 1; j < len(finalSources); j++ {
			if finalSources[i].Subscribers < finalSources[j].Subscribers {
				finalSources[i], finalSources[j] = finalSources[j], finalSources[i]
			}
		}
	}

	// Return top 10
	if len(finalSources) > 10 {
		finalSources = finalSources[:10]
	}

	return finalSources, nil
}

func (s *RSSService) SeedPopularSources() {
	var count int64
	s.db.Model(&models.PopularSource{}).Count(&count)
	if count == 0 {
		// Default seed list with mock numbers replaced by 0 (or a default base)
		sources := []models.PopularSource{
			{ID: uuid.New().String(), Name: "TechCrunch", URL: "https://techcrunch.com/feed/", Category: "Technology", Subscribers: 0, IconType: "Cpu"},
			{ID: uuid.New().String(), Name: "Hacker News", URL: "https://news.ycombinator.com/rss", Category: "Technology", Subscribers: 0, IconType: "TrendingUp"},
			{ID: uuid.New().String(), Name: "The Verge", URL: "https://techcrunch.com/feed/", Category: "Startups", Subscribers: 0, IconType: "Globe"},
			{ID: uuid.New().String(), Name: "Wired", URL: "https://www.wired.com/feed/rss", Category: "Technology", Subscribers: 0, IconType: "Newspaper"},
		}
		s.db.Create(&sources)
	}
}

func generateHash(s string) string {
	h := sha256.New()
	h.Write([]byte(s))
	return hex.EncodeToString(h.Sum(nil))
}
