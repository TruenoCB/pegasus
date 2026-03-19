package services

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"pegasus/internal/models"
	"time"

	"github.com/mmcdole/gofeed"
	"gorm.io/gorm"
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

func (s *RSSService) CreateGroup(userID, name, desc string, urls []string, emails []string, promptConfig string) (*models.RSSGroup, error) {
	urlsJson, _ := json.Marshal(urls)
	emailsJson, _ := json.Marshal(emails)

	// Create Asset first
	asset := models.Asset{
		UserID:      userID,
		Type:        "RSS_GROUP",
		Title:       name,
		Description: desc,
	}
	if err := s.db.Create(&asset).Error; err != nil {
		return nil, err
	}

	group := models.RSSGroup{
		AssetID:            asset.ID,
		Name:               name,
		Description:        desc,
		FeedConfigs:        string(urlsJson),
		NotificationEmails: string(emailsJson),
		PromptConfig:       promptConfig,
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

func (s *RSSService) SaveSummaryReport(userID, groupID, title, content string) (*models.SummaryReport, error) {
	// Create Asset first
	asset := models.Asset{
		UserID:      userID,
		Type:        "SUMMARY_REPORT",
		Title:       title,
		Description: "AI Generated Summary Report",
	}
	if err := s.db.Create(&asset).Error; err != nil {
		return nil, err
	}

	report := models.SummaryReport{
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
		})
	}

	return rssFeed, items, nil
}
func (s *RSSService) FetchAndSave(url string) error {
	feed, err := s.fp.ParseURL(url)
	if err != nil {
		return err
	}

	rssFeed := models.RSSFeed{URL: url}
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
			FeedID:          rssFeed.ID,
			ContentHash:     hash,
			OriginalTitle:   item.Title,
			OriginalContent: content,
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
	var sources []models.PopularSource
	err := s.db.Order("subscribers desc").Find(&sources).Error
	return sources, err
}

func (s *RSSService) SeedPopularSources() {
	var count int64
	s.db.Model(&models.PopularSource{}).Count(&count)
	if count == 0 {
		sources := []models.PopularSource{
			{Name: "TechCrunch", URL: "https://techcrunch.com/feed/", Category: "Technology", IconType: "Cpu", Subscribers: 1205},
			{Name: "36Kr", URL: "https://36kr.com/feed", Category: "Business", IconType: "TrendingUp", Subscribers: 890},
			{Name: "The Verge", URL: "https://www.theverge.com/rss/index.xml", Category: "Tech/Culture", IconType: "Globe", Subscribers: 2300},
			{Name: "BBC News", URL: "http://feeds.bbci.co.uk/news/rss.xml", Category: "World", IconType: "Newspaper", Subscribers: 5000},
		}
		s.db.Create(&sources)
	}
}

func generateHash(s string) string {
	h := sha256.New()
	h.Write([]byte(s))
	return hex.EncodeToString(h.Sum(nil))
}
