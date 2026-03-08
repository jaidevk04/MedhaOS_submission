# Database Migration Scripts

## Overview
MedhaOS uses a safe migration strategy that preserves your data across restarts.

## Scripts

### migrate-safe.js (Default)
- **Command**: `npm run migrate --prefix backend`
- **Behavior**: Checks if tables exist before running migrations
- **Use Case**: Normal startup - preserves existing data
- **Safe**: ✅ Yes - will NOT delete your data

### migrate.js (Reset)
- **Command**: `npm run migrate:reset --prefix backend`
- **Behavior**: Drops all tables and recreates from scratch
- **Use Case**: When you want to reset to a clean state
- **Safe**: ⚠️ No - will DELETE all data

## How It Works

When you run `./START_ALL.sh`, it uses the safe migration script that:
1. Checks if the `patients` table exists
2. If tables exist → Skips migration and shows current data count
3. If tables don't exist → Runs full migration with seed data

## Data Persistence

Your data is stored in a Docker volume (`postgres_data`) which persists across:
- Container restarts
- System reboots
- Docker Compose down/up cycles

## When to Reset Database

Only use `npm run migrate:reset` when you want to:
- Clear all test data
- Start fresh with seed data
- Fix database corruption issues

## Example Usage

```bash
# Normal startup (preserves data)
./START_ALL.sh

# Reset database (deletes all data)
npm run migrate:reset --prefix backend
```
