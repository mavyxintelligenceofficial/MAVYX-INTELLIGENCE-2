#!/bin/bash
# Mavyx Intelligence — Database Backup Script
# Per Volume V Chapter 7 §7.18: Disaster Recovery
# "Backup restoration, Infrastructure recovery, Data recovery"
#
# Usage:
#   ./scripts/backup-database.sh              # Full backup
#   ./scripts/backup-database.sh --restore    # Restore latest backup
#
# Backups are stored in infrastructure/backups/

set -e

BACKUP_DIR="infrastructure/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mavyx_backup_$TIMESTAMP.sql"
CONTAINER_NAME="mavyx-postgres"
DB_NAME="mavyx_intelligence"
DB_USER="mavyx"

# Create backup directory
mkdir -p "$BACKUP_DIR"

if [ "$1" = "--restore" ]; then
    # Restore the latest backup
    LATEST=$(ls -t $BACKUP_DIR/*.sql 2>/dev/null | head -1)
    if [ -z "$LATEST" ]; then
        echo "❌ No backup files found in $BACKUP_DIR"
        exit 1
    fi
    echo "⚠️  Restoring from: $LATEST"
    echo "   This will OVERWRITE the current database!"
    read -p "   Continue? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < "$LATEST"
        echo "✅ Database restored from $LATEST"
    else
        echo "❌ Restore cancelled"
    fi
else
    # Create a new backup
    echo "📦 Creating database backup..."
    docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > "$BACKUP_FILE"
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    BACKUP_FILE="$BACKUP_FILE.gz"
    
    # Get file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    echo "✅ Backup created: $BACKUP_FILE ($SIZE)"
    echo "   To restore: ./scripts/backup-database.sh --restore"
    
    # Keep only last 7 backups
    cd "$BACKUP_DIR"
    ls -t *.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm
    cd ../..
    echo "   (Keeping last 7 backups)"
fi
