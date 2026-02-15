package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"pegasus/internal/config"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/elastic/go-elasticsearch/v8/esapi"
)

type ESService struct {
	client *elasticsearch.Client
	index  string
}

func NewESService(cfg *config.Config) *ESService {
	es, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{cfg.ElasticsearchURL},
	})
	if err != nil {
		log.Printf("Error creating ES client: %v", err)
		return nil
	}

	return &ESService{
		client: es,
		index:  "pegasus_content",
	}
}

func (s *ESService) IndexSummary(id, title, summary, url string) error {
	if s.client == nil {
		return fmt.Errorf("ES client not initialized")
	}

	doc := map[string]interface{}{
		"title":     title,
		"summary":   summary,
		"url":       url,
		"timestamp": "now",
	}

	data, err := json.Marshal(doc)
	if err != nil {
		return err
	}

	req := esapi.IndexRequest{
		Index:      s.index,
		DocumentID: id,
		Body:       bytes.NewReader(data),
		Refresh:    "true",
	}

	res, err := req.Do(context.Background(), s.client)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.IsError() {
		return fmt.Errorf("error indexing document: %s", res.String())
	}

	return nil
}

func (s *ESService) Search(query string) ([]map[string]interface{}, error) {
	if s.client == nil {
		return nil, fmt.Errorf("ES client not initialized")
	}

	var buf bytes.Buffer
	queryMap := map[string]interface{}{
		"query": map[string]interface{}{
			"multi_match": map[string]interface{}{
				"query":  query,
				"fields": []string{"title", "summary"},
			},
		},
	}
	if err := json.NewEncoder(&buf).Encode(queryMap); err != nil {
		return nil, err
	}

	res, err := s.client.Search(
		s.client.Search.WithContext(context.Background()),
		s.client.Search.WithIndex(s.index),
		s.client.Search.WithBody(&buf),
		s.client.Search.WithTrackTotalHits(true),
	)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.IsError() {
		return nil, fmt.Errorf("error searching: %s", res.String())
	}

	var r map[string]interface{}
	if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
		return nil, err
	}

	var results []map[string]interface{}
	if hits, ok := r["hits"].(map[string]interface{})["hits"].([]interface{}); ok {
		for _, hit := range hits {
			if source, ok := hit.(map[string]interface{})["_source"].(map[string]interface{}); ok {
				results = append(results, source)
			}
		}
	}

	return results, nil
}
