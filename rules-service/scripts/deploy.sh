#!/bin/bash
# ─── Straw2Cash Java Backend Deploy Script ───
# Usage: ./scripts/deploy.sh

set -e

export AWS_REGION=ap-south-1
export AWS_ACCOUNT_ID=458526671159
export ECR_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/straw2cash-rules-service
export ECS_CLUSTER=straw2cash-cluster
export ECS_SERVICE=straw2cash-rules-service
export ALB_URL=https://straw2cash.duckdns.org

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "════════════════════════════════════════════════════"
echo "  🚀 Straw2Cash Backend Deploy"
echo "════════════════════════════════════════════════════"
echo ""

# ─── Step 1: Verify AWS credentials ─────────
echo -e "${BLUE}[1/6]${NC} Verifying AWS credentials..."
CALLER=$(aws sts get-caller-identity --region $AWS_REGION --query "Account" --output text 2>/dev/null)
if [ "$CALLER" != "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ AWS credentials not configured or wrong account${NC}"
    echo "   Expected: $AWS_ACCOUNT_ID"
    echo "   Got: $CALLER"
    exit 1
fi
echo -e "${GREEN}✅ AWS account: $CALLER${NC}"
echo ""

# ─── Step 2: ECR login ──────────────────────
echo -e "${BLUE}[2/6]${NC} Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com 2>&1 | grep -i succeeded
echo -e "${GREEN}✅ ECR login successful${NC}"
echo ""

# ─── Step 3: Docker build ───────────────────
echo -e "${BLUE}[3/6]${NC} Building Docker image (this takes 1-2 min)..."
docker build --platform=linux/amd64 -t $ECR_URI:latest . 2>&1 | tail -3
echo -e "${GREEN}✅ Docker image built${NC}"
echo ""

# ─── Step 4: Push to ECR ────────────────────
echo -e "${BLUE}[4/6]${NC} Pushing to ECR..."
docker push $ECR_URI:latest 2>&1 | tail -2
echo -e "${GREEN}✅ Image pushed to ECR${NC}"
echo ""

# ─── Step 5: Force ECS redeploy ─────────────
echo -e "${BLUE}[5/6]${NC} Triggering ECS redeploy..."
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --force-new-deployment \
  --region $AWS_REGION \
  --query "service.serviceName" --output text
echo -e "${GREEN}✅ Redeploy triggered${NC}"
echo ""

# ─── Step 6: Wait for healthy task ──────────
echo -e "${BLUE}[6/6]${NC} Waiting for deployment (max 4 min)..."
echo ""

TG_ARN=$(aws elbv2 describe-target-groups \
  --names straw2cash-tg \
  --region $AWS_REGION \
  --query "TargetGroups[0].TargetGroupArn" --output text)

HEALTHY=0
for i in {1..24}; do
    sleep 10

    RUNNING=$(aws ecs describe-services \
      --cluster $ECS_CLUSTER \
      --services $ECS_SERVICE \
      --region $AWS_REGION \
      --query "services[0].runningCount" --output text)

    HEALTH=$(aws elbv2 describe-target-health \
      --target-group-arn $TG_ARN \
      --region $AWS_REGION \
      --query "TargetHealthDescriptions[0].TargetHealth.State" --output text 2>/dev/null || echo "unknown")

    echo "   [${i}0s] Running: $RUNNING | Health: $HEALTH"

    if [ "$HEALTH" = "healthy" ]; then
        HEALTHY=1
        break
    fi
done

echo ""

# ─── Verify API ─────────────────────────────
if [ "$HEALTHY" = "1" ]; then
    echo "════════════════════════════════════════════════════"
    echo "  ✅ Deployment complete"
    echo "════════════════════════════════════════════════════"

    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $ALB_URL/api/v1/health)
    echo ""
    echo "  API status: HTTP $RESPONSE"
    curl -s $ALB_URL/api/v1/health
    echo ""
    echo ""
    echo "  URL: $ALB_URL"
    echo "════════════════════════════════════════════════════"
else
    echo -e "${YELLOW}⚠️  Task did not become healthy in time${NC}"
    echo "   Check logs: ./scripts/logs.sh"
    exit 1
fi
