package services

import (
	"pegasus/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SocialService struct {
	db *gorm.DB
}

func NewSocialService(db *gorm.DB) *SocialService {
	return &SocialService{db: db}
}

func (s *SocialService) CreatePost(userID, content string, assetID *string, quotePostID *string) (*models.Post, error) {
	// Optional: we can still implicitly create an asset for pure text posts,
	// but let's just make the post directly. If they attach an asset, we link it.

	post := &models.Post{
		ID:          uuid.New().String(),
		UserID:      userID,
		Content:     content,
		AssetID:     assetID,
		QuotePostID: quotePostID,
	}
	if err := s.db.Create(post).Error; err != nil {
		return nil, err
	}
	return post, nil
}

func (s *SocialService) GetPosts(limit, offset int) ([]models.Post, error) {
	var posts []models.Post
	err := s.db.Preload("User").
		Preload("Likes").
		Preload("Comments").
		Preload("Comments.User").
		Preload("Asset").
		Preload("QuotedPost").
		Preload("QuotedPost.User").
		Preload("QuotedPost.Asset").
		Order("created_at desc").Limit(limit).Offset(offset).Find(&posts).Error
	return posts, err
}

func (s *SocialService) LikePost(userID, postID string) error {
	var existing models.Like
	err := s.db.Where("user_id = ? AND post_id = ?", userID, postID).First(&existing).Error
	if err == nil {
		// Already liked, unlike it
		return s.db.Delete(&existing).Error
	}

	like := models.Like{
		ID:     uuid.New().String(),
		UserID: userID,
		PostID: postID,
	}
	return s.db.Create(&like).Error
}

func (s *SocialService) CommentPost(userID, postID, content string) (*models.Comment, error) {
	comment := &models.Comment{
		ID:      uuid.New().String(),
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
		ID:          uuid.New().String(),
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
		ID:         uuid.New().String(),
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

func (s *SocialService) GetUsers(query string, mutualWithUserID string) ([]models.User, error) {
	var users []models.User
	dbQuery := s.db.Select("id", "name", "email", "avatar_url")

	if mutualWithUserID != "" {
		// Only mutual followers
		dbQuery = dbQuery.Joins("JOIN social_relations r1 ON users.id = r1.following_id AND r1.follower_id = ? AND r1.type = 'follow'", mutualWithUserID).
			Joins("JOIN social_relations r2 ON users.id = r2.follower_id AND r2.following_id = ? AND r2.type = 'follow'", mutualWithUserID)
	}

	if query != "" {
		dbQuery = dbQuery.Where("name LIKE ? OR email LIKE ?", "%"+query+"%", "%"+query+"%")
	}
	err := dbQuery.Find(&users).Error
	return users, err
}

func (s *SocialService) GetUserByID(userID string) (*models.User, error) {
	var user models.User
	err := s.db.Select("id", "name", "email", "avatar_url", "bio").Where("id = ?", userID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}
