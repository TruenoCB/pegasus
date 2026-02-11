package main

import (
	"log"
	"pegasus/internal/config"
	"pegasus/internal/handlers"
	"pegasus/internal/models"
	"pegasus/internal/services"

	"github.com/gin-gonic/gin"
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
		// Auto Migrate
		db.AutoMigrate(&models.User{}, &models.Asset{}, &models.RSSGroup{}, &models.RSSFeed{}, &models.AISummary{}, &models.SocialRelation{})
	}

	// Initialize Services
	aiService := services.NewAIService(cfg)
	esService := services.NewESService(cfg)
	rssService := services.NewRSSService(db)

	// Initialize Handlers
	aiHandler := handlers.NewAIHandler(aiService, esService)
	rssHandler := handlers.NewRSSHandler(rssService)

	// Setup Router
	r := gin.Default()

	// CORS Middleware (Simple)
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
		api.POST("/ai/summarize", aiHandler.Summarize)
		api.POST("/rss/fetch", rssHandler.Fetch)
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})
	}

	r.Run(":" + cfg.Port)
}
