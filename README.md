# PEGASUS & AURORA

PEGASUS is a next-generation social platform, and AURORA is its first AI-powered RSS aggregation product.

## 🚀 Deployment Options

We support two primary deployment strategies:

1.  **Split Deployment (NAS/Production)**: Best for environments where middleware (DB, Redis) is managed separately or persistent across updates.
2.  **All-in-One Deployment (Cloud/Demo)**: Best for quick starts, single-server deployments, or GitHub-based workflows.

### Option 1: Split Deployment (NAS Recommended)

Use this if you want to manage middleware separately from the application logic.

**Files Location**: `deploy/nas/`

1.  **Start Middleware**:
    ```bash
    docker compose -f deploy/nas/docker-compose.middleware.yml up -d
    ```
2.  **Start Application**:
    ```bash
    docker compose -f deploy/nas/docker-compose.app.yml up -d --build
    ```

### Option 2: All-in-One Deployment (Recommended for Quick Start)

Use this to spin up the entire stack (App + Middleware) with a single command. The application (Frontend + Backend) runs in a single optimized container.

**Files Location**: `deploy/aio/`

1.  **Start Everything**:
    ```bash
    docker compose -f deploy/aio/docker-compose.yml up -d --build
    ```

2.  **Access**:
    - Frontend: http://localhost
    - Backend API: http://localhost/api/

### 📦 Building Your Own Image

You can build a single Docker image containing both Frontend and Backend:

```bash
docker build -t your-repo/pegasus:latest -f deploy/aio/Dockerfile .
```

This image is self-contained (running Nginx + Go binary via Supervisor) and only requires external connection to MySQL/Redis/ES.

## ⚙️ Configuration (.env)

Create a `.env` file in the root directory:

```env
# AI Configuration
AI_PROVIDER=openai
AI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_sk_key
AI_MODEL=gpt-3.5-turbo

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Application Secrets
JWT_SECRET=change_this_to_a_secure_secret
```

## 🌟 Features

### AURORA (AI RSS Aggregator)
- **Smart Aggregation**: Create subscription groups for multiple RSS feeds.
- **AI Summarization**: Automatically generates Daily and Weekly reports using AI.
- **Email Notifications**: Receive formatted HTML reports directly to your inbox.
- **Deduplication**: Intelligent content hashing prevents duplicate summaries.

### PEGASUS (Core Platform)
- **SSO Gateway**: Single Sign-On with JWT authentication.
- **User Profiles**: Manage your identity and assets.
- **Asset System**: "Everything is an Asset" philosophy.

## 🛠 Development
- **Backend**: `cd backend && go run cmd/api/main.go`
- **Frontend**: `cd frontend && npm run dev`
