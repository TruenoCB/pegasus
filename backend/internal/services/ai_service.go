package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"pegasus/internal/config"
	"time"
)

type AIService struct {
	cfg *config.Config
}

func NewAIService(cfg *config.Config) *AIService {
	return &AIService{cfg: cfg}
}

type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func (s *AIService) Summarize(content string, lang string) (string, error) {
	if s.cfg.AIKey == "" || s.cfg.AIKey == "dummy-key" {
		return "Mock Summary: This is an automatically generated summary of the provided content. In a production environment with a valid API key, this would be a real AI-generated summary.", nil
	}

	prompt := fmt.Sprintf("Please summarize the following content into a concise report. Provide 3 key points. Translate to %s if needed. Return ONLY the summary text.", lang)

	reqBody := ChatRequest{
		Model: s.cfg.AIModel,
		Messages: []Message{
			{Role: "system", Content: "You are a helpful news assistant."},
			{Role: "user", Content: fmt.Sprintf("%s\n\nContent:\n%s", prompt, content)},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	// Handle trailing slash in BaseURL
	url := fmt.Sprintf("%s/chat/completions", s.cfg.AIBaseURL)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.cfg.AIKey))

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("AI API Error: %s", string(body))
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(body, &chatResp); err != nil {
		return "", err
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("no response from AI")
	}

	return chatResp.Choices[0].Message.Content, nil
}

func (s *AIService) GenerateReport(content, promptConfig string) (string, error) {
	if s.cfg.AIKey == "" || s.cfg.AIKey == "dummy-key" {
		return fmt.Sprintf("# Mock AI Report\n\n**Generated using prompt:**\n_%s_\n\nThis is a mock report aggregating multiple RSS feeds. It would normally contain a structured markdown document summarizing the key insights, trends, and actionable intelligence extracted from the provided feeds.", promptConfig), nil
	}

	systemPrompt := "You are a professional AI research analyst. You will be provided with a collection of recent RSS feed items. Your task is to generate a comprehensive, well-structured Markdown report."
	if promptConfig != "" {
		systemPrompt = promptConfig
	}

	reqBody := ChatRequest{
		Model: s.cfg.AIModel,
		Messages: []Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: fmt.Sprintf("Here are the latest items from the RSS feeds. Please analyze them and generate the report:\n\n%s", content)},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("%s/chat/completions", s.cfg.AIBaseURL)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.cfg.AIKey))

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("AI API Error: %s", string(body))
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(body, &chatResp); err != nil {
		return "", err
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("no response from AI")
	}

	return chatResp.Choices[0].Message.Content, nil
}
