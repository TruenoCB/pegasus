package services

import (
	"crypto/tls"
	"fmt"
	"log"
	"pegasus/internal/config"
	"strconv"

	"gopkg.in/gomail.v2"
)

type NotificationService struct {
	cfg *config.Config
}

func NewNotificationService(cfg *config.Config) *NotificationService {
	return &NotificationService{cfg: cfg}
}

func (s *NotificationService) SendEmail(to []string, subject, body string) error {
	if len(to) == 0 {
		return nil
	}

	if s.cfg.SMTPUsername == "" || s.cfg.SMTPPassword == "" {
		log.Println("SMTP not configured, skipping email")
		// In dev mode, maybe just log the email content
		log.Printf("MOCK EMAIL to %v: %s\n%s", to, subject, body)
		return nil
	}

	port, _ := strconv.Atoi(s.cfg.SMTPPort)
	d := gomail.NewDialer(s.cfg.SMTPHost, port, s.cfg.SMTPUsername, s.cfg.SMTPPassword)
	d.TLSConfig = &tls.Config{InsecureSkipVerify: true} // For dev purposes

	m := gomail.NewMessage()
	m.SetHeader("From", s.cfg.SMTPUsername)
	m.SetHeader("To", to...)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}
