package repository

import (
	"errors"

	"pegasus/internal/models"

	"gorm.io/gorm"
)

type AssetRepository struct {
	db *gorm.DB
}

func NewAssetRepository(db *gorm.DB) *AssetRepository {
	return &AssetRepository{db: db}
}

func (r *AssetRepository) Create(asset *models.Asset) error {
	return r.db.Create(asset).Error
}

func (r *AssetRepository) FindByUserID(userID string) ([]models.Asset, error) {
	var assets []models.Asset
	if err := r.db.Where("user_id = ?", userID).Find(&assets).Error; err != nil {
		return nil, err
	}
	return assets, nil
}

func (r *AssetRepository) FindByID(id string) (*models.Asset, error) {
	var asset models.Asset
	if err := r.db.Where("id = ?", id).First(&asset).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &asset, nil
}
