#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Stopping middleware...${NC}"
docker compose -f docker-compose.middleware.yml down

echo -e "${GREEN}Starting middleware with fresh configuration...${NC}"
docker compose -f docker-compose.middleware.yml up -d

echo -e "${GREEN}Waiting for services to be healthy...${NC}"
sleep 5
docker compose -f docker-compose.middleware.yml ps

echo -e "${GREEN}Middleware setup complete!${NC}"
