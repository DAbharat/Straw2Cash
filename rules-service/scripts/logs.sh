cat > scripts/logs.sh << 'SCRIPT_EOF'
#!/bin/bash
# Live tail CloudWatch logs (Ctrl+C to exit)

export AWS_REGION=ap-south-1

echo "📡 Streaming logs from /ecs/straw2cash-rules-task..."
echo "   Press Ctrl+C to stop"
echo ""

aws logs tail /ecs/straw2cash-rules-task --follow --region $AWS_REGION
SCRIPT_EOF