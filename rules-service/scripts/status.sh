#!/bin/bash
# Quick status check

export AWS_REGION=ap-south-1
export ALB_URL=https://straw2cash.duckdns.org

echo ""
echo "════════════════════════════════════════"
echo "  Straw2Cash Backend Status"
echo "════════════════════════════════════════"
echo ""
echo "ECS Service:"
aws ecs describe-services \
  --cluster straw2cash-cluster \
  --services straw2cash-rules-service \
  --region $AWS_REGION \
  --query "services[0].{Running:runningCount,Desired:desiredCount,Failed:deployments[0].failedTasks}" \
  --output table

echo ""
echo "API Health:"
curl -s $ALB_URL/api/v1/health
echo ""
echo ""
echo "Tables:"
curl -s $ALB_URL/api/v1/status | python -m json.tool 2>/dev/null || curl -s $ALB_URL/api/v1/status
echo ""
