package repository

import (
	"errors"

	"github.com/pegasus/backend/internal/models"
	"gorm.io/gorm"
)

type RSSRepository struct {
	db *gorm.DB
}

func NewRSSRepository(db *gorm.DB) *RSSRepository {
	return &RSSRepository{db: db}
}

func (r *RSSRepository) CreateGroup(group *models.RSSGroup) error {
	return r.db.Create(group).Error
}

func (r *RSSRepository) CreateFeed(feed *models.RSSFeed) error {
	return r.db.Create(feed).Error
}

func (r *RSSRepository) FindFeedByURL(url string) (*models.RSSFeed, error) {
	var feed models.RSSFeed
	if err := r.db.Where("url = ?", url).First(&feed).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &feed, nil
}
