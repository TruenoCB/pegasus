package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL      string
	RedisURL         string
	ElasticsearchURL string
	JWTSecret        string
	Port             string

	// AI Configuration
	AIProvider string // e.g., "openai", "deepseek", "moonshot"
	AIBaseURL  string
	AIKey      string
	AIModel    string

	// SMTP Configuration
	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
}

func LoadConfig() *Config {
	// Try loading .env, but don't fail if it doesn't exist (prod envs might set vars directly)
	_ = godotenv.Load()

	return &Config{
		DatabaseURL:      getEnv("DATABASE_URL", "root:pegasus_password@tcp(localhost:3306)/pegasus?charset=utf8mb4&parseTime=True&loc=Local"),
		RedisURL:         getEnv("REDIS_URL", "localhost:6379"),
		ElasticsearchURL: getEnv("ELASTICSEARCH_URL", "http://localhost:9200"),
		JWTSecret:        getEnv("JWT_SECRET", "dev_secret_key_12345"),
		Port:             getEnv("PORT", "8080"),

		AIProvider: getEnv("AI_PROVIDER", "openai"),
		AIBaseURL:  getEnv("AI_BASE_URL", "https://api.openai.com/v1"),
		AIKey:      getEnv("OPENAI_API_KEY", ""),
		AIModel:    getEnv("AI_MODEL", "gpt-3.5-turbo"),

		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnv("SMTP_PORT", "587"),
		SMTPUsername: getEnv("SMTP_USERNAME", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	log.Printf("Using default for %s: %s", key, fallback)
	return fallback
}
