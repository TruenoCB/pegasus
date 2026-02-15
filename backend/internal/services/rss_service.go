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

func (s *RSSService) CreateGroup(userID, name, desc string, urls []string, emails []string) (*models.RSSGroup, error) {
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
	}
	if err := s.db.Create(&group).Error; err != nil {
		return nil, err
	}

	return &group, nil
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

func generateHash(s string) string {
	h := sha256.New()
	h.Write([]byte(s))
	return hex.EncodeToString(h.Sum(nil))
}
