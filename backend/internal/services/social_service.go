package services

import (
	"pegasus/internal/models"
	"gorm.io/gorm"
)

type SocialService struct {
	db *gorm.DB
}

func NewSocialService(db *gorm.DB) *SocialService {
	return &SocialService{db: db}
}

func (s *SocialService) CreatePost(userID string, content string, assetID *string) (*models.Post, error) {
	post := &models.Post{
		UserID:  userID,
		Content: content,
		AssetID: assetID,
	}
	if err := s.db.Create(post).Error; err != nil {
		return nil, err
	}
	return post, nil
}

func (s *SocialService) GetPosts(limit, offset int) ([]models.Post, error) {
	var posts []models.Post
	err := s.db.Preload("User").Order("created_at desc").Limit(limit).Offset(offset).Find(&posts).Error
	return posts, err
}

func (s *SocialService) SendMessage(senderID, receiverID, content string) (*models.Message, error) {
	msg := &models.Message{
		SenderID:   senderID,
		ReceiverID: receiverID,
		Content:    content,
	}
	if err := s.db.Create(msg).Error; err != nil {
		return nil, err
	}
	return msg, nil
}

func (s *SocialService) GetMessages(user1, user2 string, limit, offset int) ([]models.Message, error) {
	var messages []models.Message
	err := s.db.Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		user1, user2, user2, user1,
	).Order("created_at asc").Limit(limit).Offset(offset).Find(&messages).Error
	return messages, err
}

func (s *SocialService) GetUsers() ([]models.User, error) {
	var users []models.User
	err := s.db.Select("id", "name", "email", "avatar_url").Find(&users).Error
	return users, err
}
