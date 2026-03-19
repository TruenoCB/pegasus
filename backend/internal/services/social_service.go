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

func (s *SocialService) CreatePost(userID, content string) (*models.Post, error) {
	// First, explicitly create an Asset for this post
	asset := models.Asset{
		UserID:      userID,
		Type:        "POST",
		Title:       "User Post",
		Description: content, // Preview of content
		IsPublic:    true,
	}
	if err := s.db.Create(&asset).Error; err != nil {
		return nil, err
	}

	post := &models.Post{
		UserID:  userID,
		Content: content,
		AssetID: &asset.ID,
	}
	if err := s.db.Create(post).Error; err != nil {
		return nil, err
	}
	return post, nil
}

func (s *SocialService) GetPosts(limit, offset int) ([]models.Post, error) {
	var posts []models.Post
	err := s.db.Preload("User").Preload("Likes").Preload("Comments").Order("created_at desc").Limit(limit).Offset(offset).Find(&posts).Error
	return posts, err
}

func (s *SocialService) LikePost(userID, postID string) error {
	var existing models.Like
	err := s.db.Where("user_id = ? AND post_id = ?", userID, postID).First(&existing).Error
	if err == nil {
		// Already liked, unlike it
		return s.db.Delete(&existing).Error
	}
	
	like := models.Like{UserID: userID, PostID: postID}
	return s.db.Create(&like).Error
}

func (s *SocialService) CommentPost(userID, postID, content string) (*models.Comment, error) {
	comment := &models.Comment{
		UserID:  userID,
		PostID:  postID,
		Content: content,
	}
	if err := s.db.Create(comment).Error; err != nil {
		return nil, err
	}
	return comment, nil
}

func (s *SocialService) ToggleFollow(followerID, followingID string) error {
	var existing models.SocialRelation
	err := s.db.Where("follower_id = ? AND following_id = ? AND type = 'follow'", followerID, followingID).First(&existing).Error
	if err == nil {
		// Already following, unfollow
		return s.db.Delete(&existing).Error
	}

	relation := models.SocialRelation{
		FollowerID:  followerID,
		FollowingID: followingID,
		Type:        "follow",
	}
	return s.db.Create(&relation).Error
}

func (s *SocialService) GetFollowStatus(followerID, followingID string) (bool, error) {
	var count int64
	err := s.db.Model(&models.SocialRelation{}).Where("follower_id = ? AND following_id = ? AND type = 'follow'", followerID, followingID).Count(&count).Error
	return count > 0, err
}

func (s *SocialService) GetUserAssets(userID string) ([]models.Asset, error) {
	var assets []models.Asset
	err := s.db.Where("user_id = ?", userID).Order("created_at desc").Find(&assets).Error
	return assets, err
}

func (s *SocialService) GetProfileStats(userID string) (map[string]int64, error) {
	var postCount, followingCount, followerCount, assetCount int64
	
	s.db.Model(&models.Post{}).Where("user_id = ?", userID).Count(&postCount)
	s.db.Model(&models.SocialRelation{}).Where("follower_id = ? AND type = 'follow'", userID).Count(&followingCount)
	s.db.Model(&models.SocialRelation{}).Where("following_id = ? AND type = 'follow'", userID).Count(&followerCount)
	s.db.Model(&models.Asset{}).Where("user_id = ?", userID).Count(&assetCount)

	return map[string]int64{
		"posts":     postCount,
		"following": followingCount,
		"followers": followerCount,
		"assets":    assetCount,
	}, nil
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
