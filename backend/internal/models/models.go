package models

import (
	"time"
)

type User struct {
	ID           string           `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	Email        string           `gorm:"uniqueIndex;type:varchar(255);not null" json:"email"`
	PasswordHash string           `gorm:"type:varchar(255);not null" json:"-"`
	Name         string           `gorm:"type:varchar(100);not null" json:"name"`
	AvatarURL    string           `gorm:"type:varchar(500)" json:"avatar_url"`
	Bio          string           `gorm:"type:text" json:"bio"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
	Assets       []Asset          `gorm:"foreignKey:UserID" json:"assets,omitempty"`
	Following    []SocialRelation `gorm:"foreignKey:FollowerID" json:"following,omitempty"`
	Followers    []SocialRelation `gorm:"foreignKey:FollowingID" json:"followers,omitempty"`
}

type Asset struct {
	ID          string    `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	UserID      string    `gorm:"type:varchar(36);not null;index" json:"user_id"`
	Type        string    `gorm:"type:enum('RSS_GROUP', 'REPORT', 'POST', 'COLLECTION');not null" json:"type"`
	Title       string    `gorm:"type:varchar(255);not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	IsPublic    bool      `gorm:"default:false;index" json:"is_public"`
	IsCopyable  bool      `gorm:"default:false" json:"is_copyable"`
	Metadata    string    `gorm:"type:json" json:"metadata"` // Stored as JSON string
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type RSSGroup struct {
	ID              string    `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	AssetID         string    `gorm:"type:varchar(36);not null;index" json:"asset_id"`
	Name            string    `gorm:"type:varchar(255);not null" json:"name"`
	Description     string    `gorm:"type:text" json:"description"`
	FeedConfigs     string    `gorm:"type:json" json:"feed_configs"`
	ReportFrequency string    `gorm:"type:enum('daily', 'weekly', 'monthly');default:'weekly'" json:"report_frequency"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type RSSFeed struct {
	ID          string    `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	URL         string    `gorm:"uniqueIndex;type:varchar(500);not null" json:"url"`
	Title       string    `gorm:"type:varchar(255)" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	LastFetch   time.Time `json:"last_fetch"`
	CreatedAt   time.Time `json:"created_at"`
}

type AISummary struct {
	ID              string    `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	FeedID          string    `gorm:"type:varchar(36);not null;index" json:"feed_id"`
	ContentHash     string    `gorm:"uniqueIndex;type:varchar(64);not null" json:"content_hash"`
	OriginalTitle   string    `gorm:"type:varchar(255)" json:"original_title"`
	OriginalContent string    `gorm:"type:text" json:"original_content"`
	Summary         string    `gorm:"type:text" json:"summary"`
	KeyPoints       string    `gorm:"type:json" json:"key_points"`
	Language        string    `gorm:"type:varchar(10);default:'zh'" json:"language"`
	CreatedAt       time.Time `json:"created_at"`
}

type SocialRelation struct {
	ID          string    `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	FollowerID  string    `gorm:"type:varchar(36);not null;index" json:"follower_id"`
	FollowingID string    `gorm:"type:varchar(36);not null;index" json:"following_id"`
	Type        string    `gorm:"type:enum('follow', 'friend', 'block');default:'follow'" json:"type"`
	CreatedAt   time.Time `json:"created_at"`
}
