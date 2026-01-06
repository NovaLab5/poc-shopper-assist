#!/bin/bash
set -e

# Start MongoDB in the background
echo "🚀 Starting MongoDB..."
docker-entrypoint.sh mongod --bind_ip_all &
MONGO_PID=$!

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
until mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  sleep 2
done

echo "✅ MongoDB is ready!"

# Check if sweetdill database exists
DB_EXISTS=$(mongosh --quiet --eval "db.getSiblingDB('sweetdill').stats().ok" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" = "0" ] || [ "$DB_EXISTS" = "1" ]; then
  # Check if sweetdill database has collections
  COLLECTIONS_COUNT=$(mongosh --quiet --eval "db.getSiblingDB('sweetdill').getCollectionNames().length" 2>/dev/null || echo "0")
  
  if [ "$COLLECTIONS_COUNT" = "0" ]; then
    echo "📦 No data found. Restoring from backup..."
    
    # Create admin user if it doesn't exist
    mongosh admin --eval "
      try {
        db.createUser({
          user: 'admin',
          pwd: 'sweetdill123',
          roles: [{ role: 'root', db: 'admin' }]
        });
        print('✅ Admin user created');
      } catch(e) {
        print('ℹ️  Admin user already exists');
      }
    " || true
    
    # Restore the database
    if [ -d "/docker-entrypoint-initdb.d/dump/sweetdill" ]; then
      echo "📦 Restoring sweetdill database (includes migrated products)..."
      mongorestore --username=admin --password=sweetdill123 --authenticationDatabase=admin --db=sweetdill /docker-entrypoint-initdb.d/dump/sweetdill
    fi
    
    echo "✅ Data restoration complete!"
  else
    echo "ℹ️  Data already exists. Skipping restoration."
  fi
fi

# Wait for MongoDB process
wait $MONGO_PID

