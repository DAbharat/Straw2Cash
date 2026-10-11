cat > scripts/stop.sh << 'SCRIPT_EOF'
#!/bin/bash
# Stop ECS task (night routine — saves ~$1/day)

export AWS_REGION=ap-south-1

GREEN='\033[0;32m'
NC='\033[0m'

echo ""
echo "🛑 Stopping ECS task (saves ~\$1/day)..."

aws ecs update-service \
  --cluster straw2cash-cluster \
  --service straw2cash-rules-service \
  --desired-count 0 \
  --region $AWS_REGION \
  --query "service.serviceName" --output text

echo ""
echo -e "${GREEN}✅ ECS task stopped${NC}"
echo "   Data preserved in DynamoDB"
echo "   Restart with: ./scripts/start.sh"
SCRIPT_EOF