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

# Create admin user if it doesn't exist
echo "👤 Setting up admin user..."
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

# Check if sweetdill database has any products
PRODUCTS_COUNT=$(mongosh --username=admin --password=sweetdill123 --authenticationDatabase=admin --quiet --eval "db.getSiblingDB('sweetdill').products.countDocuments()" 2>/dev/null || echo "0")

echo "📊 Current products count: $PRODUCTS_COUNT"

if [ "$PRODUCTS_COUNT" = "0" ]; then
  echo "📦 No data found. Restoring from backup..."

  # Restore the database
  if [ -d "/docker-entrypoint-initdb.d/dump/sweetdill" ]; then
    echo "📦 Restoring sweetdill database (includes migrated products)..."
    mongorestore --username=admin --password=sweetdill123 --authenticationDatabase=admin --db=sweetdill /docker-entrypoint-initdb.d/dump/sweetdill
    echo "✅ Data restoration complete!"
  else
    echo "⚠️  Dump directory not found at /docker-entrypoint-initdb.d/dump/sweetdill"
  fi
else
  echo "ℹ️  Database already contains $PRODUCTS_COUNT products. Skipping restoration."
fi

# Wait for MongoDB process
wait $MONGO_PID

