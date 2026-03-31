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

func (s *SocialService) GetSavedAssets(userID string) ([]models.Asset, error) {
	var assets []models.Asset
	err := s.db.Table("assets").
		Joins("JOIN saved_assets ON assets.id = saved_assets.asset_id").
		Where("saved_assets.user_id = ?", userID).
		Order("saved_assets.created_at desc").
		Find(&assets).Error
	return assets, err
}

func (s *SocialService) ToggleSaveAsset(userID, assetID string) error {
	var existing models.SavedAsset
	err := s.db.Where("user_id = ? AND asset_id = ?", userID, assetID).First(&existing).Error
	if err == nil {
		// Already saved, unsave
		return s.db.Delete(&existing).Error
	}

	saved := models.SavedAsset{
		ID:      uuid.New().String(),
		UserID:  userID,
		AssetID: assetID,
	}
	return s.db.Create(&saved).Error
}

func (s *SocialService) GetAssetDetails(assetID string) (interface{}, error) {
	var asset models.Asset
	if err := s.db.Where("id = ?", assetID).First(&asset).Error; err != nil {
		return nil, err
	}

	switch asset.Type {
	case "RSS_GROUP":
		var group models.RSSGroup
		if err := s.db.Where("asset_id = ?", assetID).First(&group).Error; err != nil {
			return nil, err
		}
		return map[string]interface{}{
			"asset": asset,
			"group": group,
		}, nil
	case "SUMMARY_REPORT":
		var report models.SummaryReport
		if err := s.db.Where("asset_id = ?", assetID).First(&report).Error; err != nil {
			return nil, err
		}
		return map[string]interface{}{
			"asset":  asset,
			"report": report,
		}, nil
	default:
		return map[string]interface{}{
			"asset": asset,
		}, nil
	}
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

type UserWithFollowStatus struct {
	models.User
	IsFollowing bool `json:"is_following"`
}

func (s *SocialService) GetUsers(query string, mutualWithUserID string, currentUserID string) ([]UserWithFollowStatus, error) {
	var users []models.User
	dbQuery := s.db.Table("users").Select("users.id", "users.name", "users.email", "users.avatar_url")

	if mutualWithUserID != "" {
		// Only mutual followers
		dbQuery = dbQuery.Joins("JOIN social_relations r1 ON users.id = r1.following_id AND r1.follower_id = ? AND r1.type = 'follow'", mutualWithUserID).
			Joins("JOIN social_relations r2 ON users.id = r2.follower_id AND r2.following_id = ? AND r2.type = 'follow'", mutualWithUserID)
	}

	if query != "" {
		dbQuery = dbQuery.Where("users.name LIKE ? OR users.email LIKE ?", "%"+query+"%", "%"+query+"%")
	}

	// Exclude current user
	if currentUserID != "" {
		dbQuery = dbQuery.Where("users.id != ?", currentUserID)
	}

	err := dbQuery.Limit(50).Find(&users).Error
	if err != nil {
		return nil, err
	}

	var result []UserWithFollowStatus
	for _, u := range users {
		isFollowing := false
		if currentUserID != "" {
			s.db.Model(&models.SocialRelation{}).Where("follower_id = ? AND following_id = ? AND type = 'follow'", currentUserID, u.ID).Select("count(*) > 0").Scan(&isFollowing)
		}
		result = append(result, UserWithFollowStatus{User: u, IsFollowing: isFollowing})
	}

	return result, nil
}

func (s *SocialService) GetFollowers(userID string, currentUserID string) ([]UserWithFollowStatus, error) {
	var users []models.User
	// Join users table with social_relations where users.id = social_relations.follower_id
	dbQuery := s.db.Table("users").
		Select("users.id", "users.name", "users.email", "users.avatar_url").
		Joins("JOIN social_relations ON users.id = social_relations.follower_id").
		Where("social_relations.following_id = ? AND social_relations.type = 'follow'", userID)

	err := dbQuery.Limit(50).Find(&users).Error
	if err != nil {
		return nil, err
	}

	var result []UserWithFollowStatus
	for _, u := range users {
		isFollowing := false
		if currentUserID != "" {
			s.db.Model(&models.SocialRelation{}).Where("follower_id = ? AND following_id = ? AND type = 'follow'", currentUserID, u.ID).Select("count(*) > 0").Scan(&isFollowing)
		}
		result = append(result, UserWithFollowStatus{User: u, IsFollowing: isFollowing})
	}

	return result, nil
}

func (s *SocialService) GetUserByID(userID string) (*models.User, error) {
	var user models.User
	err := s.db.Select("id", "name", "email", "avatar_url", "bio", "location", "website").Where("id = ?", userID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}
