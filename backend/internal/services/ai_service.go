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
