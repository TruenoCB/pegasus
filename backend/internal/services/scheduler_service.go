package services

import (
	"log"
	"pegasus/internal/models"

	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
)

type SchedulerService struct {
	db            *gorm.DB
	reportService *ReportService
	cron          *cron.Cron
}

func NewSchedulerService(db *gorm.DB, reportService *ReportService) *SchedulerService {
	return &SchedulerService{
		db:            db,
		reportService: reportService,
		cron:          cron.New(), // Default supports standard cron format (minute, hour, dom, month, dow)
	}
}

func (s *SchedulerService) Start() {
	// Daily report: run every day at 08:00
	_, err := s.cron.AddFunc("0 8 * * *", func() {
		s.generateReports("daily")
	})
	if err != nil {
		log.Printf("Failed to add daily cron job: %v", err)
	}

	// Weekly report: run every Monday at 08:00
	_, err = s.cron.AddFunc("0 8 * * 1", func() {
		s.generateReports("weekly")
	})
	if err != nil {
		log.Printf("Failed to add weekly cron job: %v", err)
	}

	// Monthly report: run on the 1st of every month at 08:00
	_, err = s.cron.AddFunc("0 8 1 * *", func() {
		s.generateReports("monthly")
	})
	if err != nil {
		log.Printf("Failed to add monthly cron job: %v", err)
	}

	s.cron.Start()
	log.Println("✅ Scheduler service started for periodic reports")
}

func (s *SchedulerService) Stop() {
	s.cron.Stop()
	log.Println("🛑 Scheduler service stopped")
}

func (s *SchedulerService) generateReports(frequency string) {
	log.Printf("🔄 Starting scheduled task: generating %s reports...", frequency)
	
	var groups []models.RSSGroup
	if err := s.db.Where("report_frequency = ?", frequency).Find(&groups).Error; err != nil {
		log.Printf("❌ Failed to fetch groups for %s reports: %v", frequency, err)
		return
	}

	if len(groups) == 0 {
		log.Printf("ℹ️ No RSS groups found with %s frequency", frequency)
		return
	}

	for _, group := range groups {
		log.Printf("⏳ Generating %s report for group [%s] %s...", frequency, group.ID, group.Name)
		_, err := s.reportService.GenerateReport(group.ID, frequency)
		if err != nil {
			log.Printf("❌ Failed to generate report for group %s: %v", group.ID, err)
		} else {
			log.Printf("✅ Successfully generated and sent report for group %s", group.ID)
		}
	}
}
