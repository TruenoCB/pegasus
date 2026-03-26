package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"gopkg.in/yaml.v3"
)

type Config struct {
	DatabaseURL      string `yaml:"database_url"`
	RedisURL         string `yaml:"redis_url"`
	ElasticsearchURL string `yaml:"elasticsearch_url"`
	JWTSecret        string `yaml:"jwt_secret"`
	Port             string `yaml:"port"`

	// AI Configuration
	AIProvider string `yaml:"ai_provider"`
	AIBaseURL  string `yaml:"ai_base_url"`
	AIKey      string `yaml:"ai_key"`
	AIModel    string `yaml:"ai_model"`

	// SMTP Configuration
	SMTPHost     string `yaml:"smtp_host"`
	SMTPPort     string `yaml:"smtp_port"`
	SMTPUsername string `yaml:"smtp_username"`
	SMTPPassword string `yaml:"smtp_password"`
}

func LoadConfig() *Config {
	// Try loading .env, but don't fail if it doesn't exist
	_ = godotenv.Load()

	// Default config
	cfg := &Config{
		DatabaseURL:      "root:pegasus_password@tcp(localhost:3306)/pegasus?charset=utf8mb4&parseTime=True&loc=Local",
		RedisURL:         "localhost:6379",
		ElasticsearchURL: "http://localhost:9200",
		JWTSecret:        "dev_secret_key_12345",
		Port:             "8080",
		AIProvider:       "openai",
		AIBaseURL:        "https://api.openai.com/v1",
		AIModel:          "gpt-3.5-turbo",
		SMTPHost:         "smtp.gmail.com",
		SMTPPort:         "587",
	}

	// 1. Try loading from YAML config
	yamlData, err := os.ReadFile("config.yaml")
	if err == nil {
		if err := yaml.Unmarshal(yamlData, cfg); err != nil {
			log.Printf("Error parsing config.yaml: %v", err)
		} else {
			log.Println("Loaded configuration from config.yaml")
		}
	} else {
		log.Println("No config.yaml found, relying on environment variables or defaults")
	}

	// 2. Override with Env Vars if they exist (Env vars take precedence)
	if val := os.Getenv("DATABASE_URL"); val != "" { cfg.DatabaseURL = val }
	if val := os.Getenv("REDIS_URL"); val != "" { cfg.RedisURL = val }
	if val := os.Getenv("ELASTICSEARCH_URL"); val != "" { cfg.ElasticsearchURL = val }
	if val := os.Getenv("JWT_SECRET"); val != "" { cfg.JWTSecret = val }
	if val := os.Getenv("PORT"); val != "" { cfg.Port = val }
	if val := os.Getenv("AI_PROVIDER"); val != "" { cfg.AIProvider = val }
	if val := os.Getenv("AI_BASE_URL"); val != "" { cfg.AIBaseURL = val }
	if val := os.Getenv("OPENAI_API_KEY"); val != "" { cfg.AIKey = val }
	if val := os.Getenv("AI_MODEL"); val != "" { cfg.AIModel = val }
	if val := os.Getenv("SMTP_HOST"); val != "" { cfg.SMTPHost = val }
	if val := os.Getenv("SMTP_PORT"); val != "" { cfg.SMTPPort = val }
	if val := os.Getenv("SMTP_USERNAME"); val != "" { cfg.SMTPUsername = val }
	if val := os.Getenv("SMTP_PASSWORD"); val != "" { cfg.SMTPPassword = val }

	return cfg
}
