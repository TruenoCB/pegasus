package main

import (
	"fmt"
	"log"
	"net/http"
	"pegasus/internal/config"
	"pegasus/internal/handlers"
	"pegasus/internal/models"
	"pegasus/internal/repository"
	"pegasus/internal/services"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	cfg := config.LoadConfig()

	// Initialize DB
	db, err := gorm.Open(mysql.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Printf("Failed to connect to database (might be starting up): %v", err)
	} else {
		sqlDB, _ := db.DB()
		sqlDB.SetConnMaxLifetime(time.Minute * 3)
		sqlDB.SetMaxOpenConns(10)
		sqlDB.SetMaxIdleConns(10)

		// Auto Migrate
		db.AutoMigrate(
			&models.User{},
			&models.Asset{},
			&models.RSSGroup{},
			&models.RSSFeed{},
			&models.AISummary{},
			&models.SocialRelation{},
			&models.Report{},
			&models.Post{},
			&models.Like{},
			&models.Comment{},
			&models.Message{},
			&models.PopularSource{},
			&models.SummaryReport{},
		)

		// Seed dummy popular sources for demo
		rssService := services.NewRSSService(db)
		rssService.SeedPopularSources()
	}

	// Initialize Repositories
	userRepo := repository.NewUserRepository(db)

	// Initialize Services
	authService := services.NewAuthService(userRepo, cfg.JWTSecret)
	aiService := services.NewAIService(cfg)
	esService := services.NewESService(cfg)
	rssService := services.NewRSSService(db)
	notificationService := services.NewNotificationService(cfg)
	reportService := services.NewReportService(db, rssService, aiService, notificationService)
	socialService := services.NewSocialService(db)

	// Initialize and Start Scheduler
	schedulerService := services.NewSchedulerService(db, reportService)
	schedulerService.Start()
	defer schedulerService.Stop()

	// Initialize Handlers
	authHandler := handlers.NewAuthHandler(authService)
	aiHandler := handlers.NewAIHandler(aiService, esService)
	rssHandler := handlers.NewRSSHandler(rssService, aiService)
	reportHandler := handlers.NewReportHandler(reportService)
	socialHandler := handlers.NewSocialHandler(socialService)

	// Setup Router
	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api")
	{
		// Public Routes
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})

		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// Protected Routes
		protected := api.Group("/")
		protected.Use(AuthMiddleware(cfg.JWTSecret))
		{
			protected.GET("/auth/me", authHandler.Me)

			protected.POST("/ai/summarize", aiHandler.Summarize)

			protected.POST("/rss/fetch", rssHandler.Fetch)
			protected.POST("/rss/process", rssHandler.Process)
			protected.POST("/rss/group", rssHandler.CreateGroup)
			protected.PUT("/rss/groups/:id", rssHandler.UpdateGroup)
			protected.GET("/rss/groups/me", rssHandler.GetMyGroups)
			protected.POST("/rss/groups/report", rssHandler.GenerateGroupReport)
			protected.GET("/rss/reports/me", rssHandler.GetSummaryReports)
			protected.GET("/rss/popular", rssHandler.GetPopularSources)

			protected.POST("/report/generate", reportHandler.Generate)

			// Social
			protected.POST("/social/posts", socialHandler.CreatePost)
			protected.GET("/social/posts", socialHandler.GetPosts)
			protected.POST("/social/posts/:id/like", socialHandler.LikePost)
			protected.POST("/social/posts/:id/comment", socialHandler.CommentPost)
			protected.GET("/social/users/:id", socialHandler.GetUser)
			protected.POST("/social/users/:id/follow", socialHandler.ToggleFollow)
			protected.GET("/social/users/:id/stats", socialHandler.GetProfileStats)
			protected.GET("/social/users/me/assets", socialHandler.GetUserAssets)

			// Chat
			protected.GET("/chat/users", socialHandler.GetUsers)
			protected.POST("/chat/messages", socialHandler.SendMessage)
			protected.GET("/chat/messages", socialHandler.GetMessages)
		}
	}

	r.Run(":" + cfg.Port)
}

func AuthMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if userID, ok := claims["user_id"].(string); ok {
				c.Set("user_id", userID)
			}
		}

		c.Next()
	}
}
