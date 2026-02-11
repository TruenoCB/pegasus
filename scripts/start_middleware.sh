#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Stopping and cleaning up middleware...${NC}"
docker compose -f docker-compose.middleware.yml down -v

echo -e "${GREEN}Pruning unused volumes to ensure clean state...${NC}"
# Be careful with prune in production, but for dev setup it's fine to ask or force if we know scope
docker volume rm pegasus_mysql_data pegasus_redis_data pegasus_es_data 2>/dev/null || true

echo -e "${GREEN}Starting middleware...${NC}"
docker compose -f docker-compose.middleware.yml up -d

echo -e "${GREEN}Waiting for services to be healthy...${NC}"
sleep 5
docker compose -f docker-compose.middleware.yml ps

echo -e "${GREEN}Middleware setup complete!${NC}"
echo -e "You can now run: ${GREEN}docker compose -f docker-compose.app.yml up --build${NC}"
