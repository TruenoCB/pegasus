package services

import (
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

	// Upsert Feed
	if err := s.db.Where(models.RSSFeed{URL: url}).FirstOrCreate(rssFeed).Error; err != nil {
		return nil, nil, err
	}

	var items []models.AISummary
	for _, item := range feed.Items {
		// In a real app, we would check if item exists, check hash, etc.
		// For now, just return them as candidates for summarization
		items = append(items, models.AISummary{
			OriginalTitle:   item.Title,
			OriginalContent: item.Description + "\n" + item.Content,
			FeedID:          rssFeed.ID,
		})
	}

	return rssFeed, items, nil
}
