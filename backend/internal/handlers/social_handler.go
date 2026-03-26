package handlers

import (
	"net/http"
	"pegasus/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

type SocialHandler struct {
	socialService *services.SocialService
}

func NewSocialHandler(socialService *services.SocialService) *SocialHandler {
	return &SocialHandler{socialService: socialService}
}

type CreatePostRequest struct {
	Content     string  `json:"content" binding:"required"`
	AssetID     *string `json:"asset_id,omitempty"`
	QuotePostID *string `json:"quote_post_id,omitempty"`
}

func (h *SocialHandler) CreatePost(c *gin.Context) {
	userID := c.GetString("user_id")

	var req CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post, err := h.socialService.CreatePost(userID, req.Content, req.AssetID, req.QuotePostID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, post)
}

func (h *SocialHandler) GetPosts(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	posts, err := h.socialService.GetPosts(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, posts)
}

func (h *SocialHandler) LikePost(c *gin.Context) {
	userID := c.GetString("user_id")
	postID := c.Param("id")

	if err := h.socialService.LikePost(userID, postID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

type CommentRequest struct {
	Content string `json:"content" binding:"required"`
}

func (h *SocialHandler) CommentPost(c *gin.Context) {
	userID := c.GetString("user_id")
	postID := c.Param("id")
	
	var req CommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comment, err := h.socialService.CommentPost(userID, postID, req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, comment)
}

func (h *SocialHandler) ToggleFollow(c *gin.Context) {
	followerID := c.GetString("user_id")
	followingID := c.Param("id")

	if err := h.socialService.ToggleFollow(followerID, followingID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func (h *SocialHandler) GetUserAssets(c *gin.Context) {
	userID := c.GetString("user_id")

	assets, err := h.socialService.GetUserAssets(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, assets)
}

func (h *SocialHandler) GetProfileStats(c *gin.Context) {
	userID := c.Param("id")
	if userID == "me" {
		userID = c.GetString("user_id")
	}

	stats, err := h.socialService.GetProfileStats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

type SendMessageRequest struct {
	ReceiverID string `json:"receiver_id" binding:"required"`
	Content    string `json:"content" binding:"required"`
}

func (h *SocialHandler) SendMessage(c *gin.Context) {
	senderID := c.GetString("user_id")
	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg, err := h.socialService.SendMessage(senderID, req.ReceiverID, req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, msg)
}

func (h *SocialHandler) GetMessages(c *gin.Context) {
	user1 := c.GetString("user_id")
	user2 := c.Query("with_user_id")
	if user2 == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "with_user_id is required"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	messages, err := h.socialService.GetMessages(user1, user2, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, messages)
}

func (h *SocialHandler) GetUsers(c *gin.Context) {
	query := c.Query("q")
	mutualOnly := c.Query("mutual") == "true"
	currentUserID := c.GetString("user_id")
	
	mutualWithUserID := ""
	if mutualOnly {
		mutualWithUserID = currentUserID
	}

	users, err := h.socialService.GetUsers(query, mutualWithUserID, currentUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *SocialHandler) GetFollowers(c *gin.Context) {
	userID := c.Param("id")
	if userID == "me" {
		userID = c.GetString("user_id")
	}
	currentUserID := c.GetString("user_id")

	followers, err := h.socialService.GetFollowers(userID, currentUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, followers)
}

func (h *SocialHandler) GetUser(c *gin.Context) {
	userID := c.Param("id")
	if userID == "me" {
		userID = c.GetString("user_id")
	}

	user, err := h.socialService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}
