cat > scripts/start.sh << 'SCRIPT_EOF'
#!/bin/bash
# Start ECS task (morning routine)

export AWS_REGION=ap-south-1
export ALB_URL=https://straw2cash.duckdns.org

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🚀 Starting ECS task...${NC}"

aws ecs update-service \
  --cluster straw2cash-cluster \
  --service straw2cash-rules-service \
  --desired-count 1 \
  --region $AWS_REGION \
  --query "service.serviceName" --output text

echo -e "${BLUE}⏳ Waiting for task to become healthy (max 3 min)...${NC}"
echo ""

TG_ARN=$(aws elbv2 describe-target-groups \
  --names straw2cash-tg \
  --region $AWS_REGION \
  --query "TargetGroups[0].TargetGroupArn" --output text)

for i in {1..18}; do
    sleep 10
    HEALTH=$(aws elbv2 describe-target-health \
      --target-group-arn $TG_ARN \
      --region $AWS_REGION \
      --query "TargetHealthDescriptions[0].TargetHealth.State" --output text 2>/dev/null || echo "unknown")
    echo "   [${i}0s] Health: $HEALTH"
    if [ "$HEALTH" = "healthy" ]; then
        echo ""
        echo -e "${GREEN}✅ Backend is UP${NC}"
        curl -s $ALB_URL/api/v1/health
        echo ""
        exit 0
    fi
done

echo ""
echo -e "${BLUE}⚠️  Still warming up. Check with: ./scripts/status.sh${NC}"
SCRIPT_EOF