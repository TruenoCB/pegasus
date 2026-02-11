## 1. 架构设计

```mermaid
graph TD
    A[用户浏览器] --> B[Nginx反向代理]
    B --> C[Next.js前端应用]
    C --> D[Node.js后端API]
    D --> E[MySQL数据库]
    D --> F[Redis缓存]
    D --> G[AI服务]
    
    subgraph "前端层"
        C
    end
    
    subgraph "服务层"
        D
        G
    end
    
    subgraph "数据层"
        E
        F
    end
    
    subgraph "基础设施"
        B
    end
```

## 2. 技术描述
- **前端**: Next.js@14 + React@18 + TailwindCSS@3
- **初始化工具**: create-next-app
- **后端**: Node.js@20 + Express@4 (集成在Next.js API Routes中)
- **数据库**: MySQL 8.0 (Docker部署)
- **缓存**: Redis 7.0 (Docker部署，V1版本可简化使用内存缓存)
- **AI服务**: OpenAI API / 其他LLM服务
- **部署**: Docker Compose，支持NAS一键部署

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | PEGASUS主页面，产品导航 |
| /auth/login | SSO登录页面 |
| /auth/callback | 登录回调处理 |
| /profile/[userId] | 用户个人主页 |
| /social | 社交中心，关注流 |
| /aurora | AURORA子产品主页 |
| /aurora/discover | 发现页面，热门订阅组 |
| /aurora/subscriptions | 订阅管理页面 |
| /aurora/report/[reportId] | 报告阅读页面 |
| /aurora/profile/subscriptions | 我的订阅组 |
| /api/auth/* | 认证相关API |
| /api/users/* | 用户管理API |
| /api/assets/* | 资产管理API |
| /api/rss/* | RSS相关API |
| /api/ai/* | AI服务API |

## 4. API定义

### 4.1 用户认证API
```
POST /api/auth/login
```

请求参数：
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| email | string | 是 | 用户邮箱 |
| password | string | 是 | 密码 |

响应：
```json
{
  "token": "jwt_token_string",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "用户名"
  }
}
```

### 4.2 资产管理API
```
GET /api/assets/user/[userId]
```

响应：
```json
{
  "assets": [
    {
      "id": "asset_id",
      "type": "RSS_GROUP",
      "title": "我的科技订阅",
      "description": "精选科技资讯",
      "isPublic": true,
      "isCopyable": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 4.3 RSS订阅API
```
POST /api/rss/subscription-group
```

请求参数：
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| name | string | 是 | 订阅组名称 |
| feeds | array | 是 | RSS源URL数组 |
| isPublic | boolean | 否 | 是否公开 |

### 4.4 AI总结API
```
POST /api/ai/summarize
```

请求参数：
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| content | string | 是 | 需要总结的内容 |
| type | string | 是 | 总结类型(daily/weekly/monthly) |
| language | string | 否 | 目标语言 |

## 5. 服务器架构

```mermaid
graph TD
    A[客户端请求] --> B[API网关]
    B --> C[认证中间件]
    C --> D[业务控制器]
    D --> E[服务层]
    E --> F[数据访问层]
    F --> G[(MySQL)]
    E --> H[外部服务]
    H --> I[AI服务]
    
    subgraph "控制器层"
        D
    end
    
    subgraph "服务层"
        E
    end
    
    subgraph "数据层"
        F
        G
    end
```

## 6. 数据模型

### 6.1 核心实体关系
```mermaid
erDiagram
    USERS ||--o{ ASSETS : owns
    USERS ||--o{ SOCIAL_RELATIONS : follows
    ASSETS ||--o{ RSS_GROUPS : contains
    RSS_GROUPS ||--o{ RSS_FEEDS : includes
    RSS_FEEDS ||--o{ AI_SUMMARIES : summarizes
    AI_SUMMARIES ||--o{ REPORTS : generates
    USERS ||--o{ CONVERSATIONS : participates
    
    USERS {
        string id PK
        string email UK
        string password_hash
        string name
        string avatar_url
        datetime created_at
        datetime updated_at
    }
    
    ASSETS {
        string id PK
        string user_id FK
        string type
        string title
        text description
        boolean is_public
        boolean is_copyable
        json metadata
        datetime created_at
    }
    
    RSS_GROUPS {
        string id PK
        string asset_id FK
        string name
        text description
        json feed_configs
        datetime created_at
    }
    
    RSS_FEEDS {
        string id PK
        string url UK
        string title
        string description
        datetime last_fetch
        datetime created_at
    }
    
    AI_SUMMARIES {
        string id PK
        string feed_id FK
        string content_hash UK
        text original_content
        text summary
        string language
        json keywords
        datetime created_at
    }
    
    REPORTS {
        string id PK
        string user_id FK
        string group_id FK
        string type
        json summary_data
        text content
        string language
        datetime created_at
    }
    
    SOCIAL_RELATIONS {
        string id PK
        string follower_id FK
        string following_id FK
        string type
        datetime created_at
    }
    
    CONVERSATIONS {
        string id PK
        json participants
        string type
        datetime created_at
        datetime updated_at
    }
```

### 6.2 数据定义语言

**用户表 (users)**
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);
```

**资产表 (assets)**
```sql
CREATE TABLE assets (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    type ENUM('RSS_GROUP', 'REPORT', 'POST', 'COLLECTION') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_copyable BOOLEAN DEFAULT false,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_public (is_public),
    INDEX idx_created_at (created_at)
);
```

**RSS组表 (rss_groups)**
```sql
CREATE TABLE rss_groups (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    asset_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    feed_configs JSON,
    auto_generate_report BOOLEAN DEFAULT true,
    report_frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'weekly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    INDEX idx_asset_id (asset_id)
);
```

**RSS源表 (rss_feeds)**
```sql
CREATE TABLE rss_feeds (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    url VARCHAR(500) UNIQUE NOT NULL,
    title VARCHAR(255),
    description TEXT,
    website_url VARCHAR(500),
    last_fetch TIMESTAMP,
    fetch_status ENUM('active', 'error', 'disabled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_url (url),
    INDEX idx_last_fetch (last_fetch)
);
```

**AI摘要表 (ai_summaries)**
```sql
CREATE TABLE ai_summaries (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    feed_id VARCHAR(36) NOT NULL,
    content_hash VARCHAR(64) UNIQUE NOT NULL,
    original_title VARCHAR(255),
    original_content TEXT,
    summary TEXT,
    key_points JSON,
    language VARCHAR(10) DEFAULT 'zh',
    word_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feed_id) REFERENCES rss_feeds(id) ON DELETE CASCADE,
    INDEX idx_content_hash (content_hash),
    INDEX idx_feed_id (feed_id),
    INDEX idx_created_at (created_at)
);
```

**报告表 (reports)**
```sql
CREATE TABLE reports (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    group_id VARCHAR(36) NOT NULL,
    type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    summary_data JSON,
    language VARCHAR(10) DEFAULT 'zh',
    is_public BOOLEAN DEFAULT false,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES rss_groups(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_group_id (group_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);
```

**社交关系表 (social_relations)**
```sql
CREATE TABLE social_relations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    follower_id VARCHAR(36) NOT NULL,
    following_id VARCHAR(36) NOT NULL,
    type ENUM('follow', 'friend', 'block') DEFAULT 'follow',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_relation (follower_id, following_id, type),
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id)
);
```

## 7. Docker部署配置

**docker-compose.yml**
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: pegasus-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: pegasus
      MYSQL_USER: pegasus
      MYSQL_PASSWORD: pegasus_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    
  redis:
    image: redis:7-alpine
    container_name: pegasus-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    
  app:
    build: .
    container_name: pegasus-app
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://pegasus:pegasus_password@mysql:3306/pegasus
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your_jwt_secret
      OPENAI_API_KEY: your_openai_key
    depends_on:
      - mysql
      - redis
    volumes:
      - ./uploads:/app/uploads

volumes:
  mysql_data:
  redis_data:
```

## 8. 性能优化策略

### 8.1 AI摘要缓存
- 使用内容哈希作为唯一标识，相同内容只生成一次摘要
- Redis缓存AI摘要结果，TTL设置为24小时
- 热门内容预生成摘要，减少实时计算延迟

### 8.2 RSS抓取优化
- 增量更新机制，只抓取更新的文章
- 并发控制，避免对RSS源服务器造成压力
- 失败重试机制，指数退避算法

### 8.3 数据库优化
- 合理的索引设计，覆盖常用查询场景
- 读写分离，查询走从库，写入走主库
- 定期归档历史数据，保持活跃数据集大小

## 9. 安全设计

### 9.1 认证授权
- JWT Token认证，支持刷新机制
- 密码加密存储，使用bcrypt算法
- API接口限流，防止恶意调用

### 9.2 数据安全
- SQL注入防护，使用参数化查询
- XSS攻击防护，输入输出转义
- CORS配置，限制跨域请求来源

### 9.3 隐私保护
- 用户数据脱敏展示
- 敏感操作二次验证
- 数据删除的级联处理