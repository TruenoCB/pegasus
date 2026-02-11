package repository

import (
	"context"
	"log"

	"github.com/olivere/elastic/v7"
)

type ElasticRepository struct {
	client *elastic.Client
}

func NewElasticRepository(client *elastic.Client) *ElasticRepository {
	return &ElasticRepository{client: client}
}

const IndexName = "pegasus_content"

type ContentDocument struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	Summary   string `json:"summary"`
	Type      string `json:"type"` // RSS, REPORT, etc.
	CreatedAt string `json:"created_at"`
}

func (r *ElasticRepository) IndexContent(doc ContentDocument) error {
	_, err := r.client.Index().
		Index(IndexName).
		Id(doc.ID).
		BodyJson(doc).
		Do(context.Background())
	if err != nil {
		log.Printf("Error indexing document: %v", err)
		return err
	}
	return nil
}

// EnsureIndex checks if index exists, if not creates it with mapping
func (r *ElasticRepository) EnsureIndex() error {
	exists, err := r.client.IndexExists(IndexName).Do(context.Background())
	if err != nil {
		return err
	}
	if !exists {
		mapping := `
{
	"settings":{
		"number_of_shards":1,
		"number_of_replicas":0
	},
	"mappings":{
		"properties":{
			"title":{
				"type":"text"
			},
			"content":{
				"type":"text"
			},
			"summary":{
				"type":"text"
			},
			"type":{
				"type":"keyword"
			},
			"created_at":{
				"type":"date"
			}
		}
	}
}
`
		_, err := r.client.CreateIndex(IndexName).BodyString(mapping).Do(context.Background())
		if err != nil {
			return err
		}
	}
	return nil
}
