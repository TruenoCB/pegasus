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
	Location     string           `gorm:"type:varchar(100)" json:"location"` // E.g. "Earth"
	Website      string           `gorm:"type:varchar(255)" json:"website"`  // E.g. "pegasus.io/u/bo"
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
	Assets       []Asset          `gorm:"foreignKey:UserID" json:"assets,omitempty"`
	Following    []SocialRelation `gorm:"foreignKey:FollowerID" json:"following,omitempty"`
	Followers    []SocialRelation `gorm:"foreignKey:FollowingID" json:"followers,omitempty"`
}

type Asset struct {
	ID          string    `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	UserID      string    `gorm:"type:varchar(36);not null;index" json:"user_id"`
	User        User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Type        string    `gorm:"type:varchar(50);not null;index" json:"type"` // e.g., 'RSS_GROUP', 'POST', 'SUMMARY_REPORT'
	Title       string    `gorm:"type:varchar(255)" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	Data        string    `gorm:"type:json" json:"data"` // Flexible storage for asset-specific data
	IsPublic    bool      `gorm:"default:false" json:"is_public"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type RSSGroup struct {
	ID                 string    `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	AssetID            string    `gorm:"type:varchar(36);not null;index;unique" json:"asset_id"` // Links to Asset table, 1-to-1
	Name               string    `gorm:"type:varchar(255);not null" json:"name"`
	Description        string    `gorm:"type:text" json:"description"`
	FeedConfigs        string    `gorm:"type:text" json:"feed_configs"`        // JSON array of feed URLs
	NotificationEmails string    `gorm:"type:text" json:"notification_emails"` // JSON array of emails
	PromptConfig       string    `gorm:"type:text" json:"prompt_config"`       // Custom prompt for AI summarization
	ReportFrequency    string    `gorm:"type:varchar(255);default:'daily'" json:"report_frequency"` // Comma-separated: "daily,weekly,monthly"
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type SummaryReport struct {
	ID        string    `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	AssetID   string    `gorm:"type:varchar(36);not null;index;unique" json:"asset_id"` // Links to Asset table, 1-to-1
	GroupID   *string   `gorm:"type:varchar(36);index" json:"group_id,omitempty"`       // The RSS Group it was generated from
	Title     string    `gorm:"type:varchar(255);not null" json:"title"`
	Content   string    `gorm:"type:text;not null" json:"content"` // The Markdown summary content
	CreatedAt time.Time `json:"created_at"`
}

type Report struct {
	ID          string    `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	RSSGroupID  string    `gorm:"type:varchar(36);not null;index" json:"rss_group_id"`
	Type        string    `gorm:"type:enum('daily', 'weekly', 'monthly');not null" json:"type"`
	Content     string    `gorm:"type:text" json:"content"` // Markdown/HTML
	Status      string    `gorm:"type:enum('generating', 'completed', 'failed');default:'generating'" json:"status"`
	GeneratedAt time.Time `json:"generated_at"`
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

type Post struct {
	ID          string    `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	AssetID     *string   `gorm:"type:varchar(36);index" json:"asset_id,omitempty"`      // Links to Asset table
	QuotePostID *string   `gorm:"type:varchar(36);index" json:"quote_post_id,omitempty"` // For nested quotes
	UserID      string    `gorm:"type:varchar(36);not null;index" json:"user_id"`
	User        User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Content     string    `gorm:"type:text;not null" json:"content"`
	Likes       []Like    `gorm:"foreignKey:PostID" json:"likes,omitempty"`
	Comments    []Comment `gorm:"foreignKey:PostID" json:"comments,omitempty"`
	Asset       *Asset    `gorm:"foreignKey:AssetID" json:"asset,omitempty"`
	QuotedPost  *Post     `gorm:"foreignKey:QuotePostID" json:"quoted_post,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Like struct {
	ID        string    `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	PostID    string    `gorm:"type:varchar(36);not null;index" json:"post_id"`
	UserID    string    `gorm:"type:varchar(36);not null;index" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

type Comment struct {
	ID        string    `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	PostID    string    `gorm:"type:varchar(36);not null;index" json:"post_id"`
	UserID    string    `gorm:"type:varchar(36);not null;index" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type Message struct {
	ID         string    `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	SenderID   string    `gorm:"type:varchar(36);not null;index" json:"sender_id"`
	ReceiverID string    `gorm:"type:varchar(36);not null;index" json:"receiver_id"`
	Content    string    `gorm:"type:text;not null" json:"content"`
	IsRead     bool      `gorm:"default:false" json:"is_read"`
	CreatedAt  time.Time `json:"created_at"`
}

type PopularSource struct {
	ID          string `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	Name        string `gorm:"type:varchar(255);not null" json:"name"`
	URL         string `gorm:"uniqueIndex;type:varchar(500);not null" json:"url"`
	Category    string `gorm:"type:varchar(100)" json:"category"`
	IconType    string `gorm:"type:varchar(50)" json:"icon_type"` // e.g. "Cpu", "TrendingUp"
	Subscribers int    `gorm:"default:0" json:"subscribers"`
}
