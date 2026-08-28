#!/bin/bash
set -e

# Setup rclone for afriMarket S3 backup uploads
# Run on the production server: bash scripts/setup-rclone-s3.sh
#
# Required env vars (or pass as arguments):
#   AWS_ACCESS_KEY_ID     - S3 access key
#   AWS_SECRET_ACCESS_KEY - S3 secret key
#   S3_BUCKET            - S3 bucket name (e.g. afri-market-backups)
#   S3_ENDPOINT          - S3 endpoint URL (optional, for non-AWS S3-compatible storage)
#   S3_REGION            - S3 region (default: us-east-1)

RCLONE_REMOTE="afrimarket-s3"
AWS_KEY="${AWS_ACCESS_KEY_ID:-${1:-}}"
AWS_SECRET="${AWS_SECRET_ACCESS_KEY:-${2:-}}"
BUCKET="${S3_BUCKET:-${3:-afri-market-backups}}"
ENDPOINT="${S3_ENDPOINT:-}"
REGION="${S3_REGION:-us-east-1}"

if [ -z "$AWS_KEY" ] || [ -z "$AWS_SECRET" ]; then
  echo "Usage: AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy S3_BUCKET=name bash $0"
  echo "  Or: bash $0 <access_key> <secret_key> [bucket] [endpoint] [region]"
  exit 1
fi

# Install rclone if missing
if ! command -v rclone >/dev/null 2>&1; then
  echo "Installing rclone..."
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq && apt-get install -y -qq rclone
  elif command -v yum >/dev/null 2>&1; then
    yum install -y -q rclone || curl https://rclone.org/install.sh | bash
  else
    curl https://rclone.org/install.sh | bash
  fi
fi

# Remove existing config if re-running
rclone config delete "$RCLONE_REMOTE" 2>/dev/null || true

# Create config
RCLONE_CONFIG_DIR="${HOME}/.config/rclone"
mkdir -p "$RCLONE_CONFIG_DIR"

cat > "$RCLONE_CONFIG_DIR/rclone.conf" <<EOF
[$RCLONE_REMOTE]
type = s3
provider = AWS
access_key_id = $AWS_KEY
secret_access_key = $AWS_SECRET
region = $REGION
EOF

if [ -n "$ENDPOINT" ]; then
  echo "endpoint = $ENDPOINT" >> "$RCLONE_CONFIG_DIR/rclone.conf"
fi

echo ""
echo "rclone remote '$RCLONE_REMOTE' configured."
echo "Verifying..."

# Test connection
if rclone lsd "${RCLONE_REMOTE}:/${BUCKET}/" >/dev/null 2>&1; then
  echo "S3 bucket accessible: ${RCLONE_REMOTE}:${BUCKET}"
else
  echo "Creating bucket if needed..."
  rclone mkdir "${RCLONE_REMOTE}:${BUCKET}" 2>/dev/null || true
  if rclone lsd "${RCLONE_REMOTE}:/${BUCKET}/" >/dev/null 2>&1; then
    echo "S3 bucket ready: ${RCLONE_REMOTE}:${BUCKET}"
  else
    echo "WARNING: Could not verify bucket access. Check credentials and endpoint."
    echo "The backup script will log a warning but backups will still save locally."
  fi
fi

echo ""
echo "Done. The backup script will now upload to s3://${BUCKET}/database/"
