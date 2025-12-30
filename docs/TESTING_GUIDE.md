# Database Testing Guide

This guide provides detailed, step-by-step instructions for testing each database connector in the DB Migrate tool. Follow the instructions for your specific database type to ensure successful connections.

---

## Table of Contents

1. [Firebase Firestore](#firebase-firestore)
2. [PostgreSQL](#postgresql)
3. [Supabase](#supabase)
4. [MongoDB](#mongodb)

---

## Firebase Firestore

Firebase Firestore is a NoSQL document database. The connector supports two authentication methods: Service Account JSON (recommended for production) and Client Config (development only).

### Prerequisites

- A Firebase project with Firestore enabled
- Firebase Admin SDK credentials (Service Account JSON) **OR** Firebase Client SDK configuration
- At least one collection in your Firestore database

### Method 1: Service Account JSON (Recommended)

This is the **recommended method** for production and is the most secure approach.

#### Step 1: Obtain Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the **⚙️ Settings (gear icon)** → **Project settings**
4. Navigate to the **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** in the confirmation dialog
7. A JSON file will be downloaded (e.g., `your-project-firebase-adminsdk-xxxxx.json`)

#### Step 2: Prepare the Service Account JSON

Open the downloaded JSON file. It should look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

**Important**: Copy the **entire JSON content**, including all fields.

#### Step 3: Configure Connection in DB Migrate

1. Start the application:

   ```bash
   npm run dev
   ```

2. Navigate to **Step 2: Connection Setup** in the migration wizard

3. In the **Source Database** section:
   - **Database Type**: Select "Firebase Firestore"
   - **Project ID**: Enter your Firebase project ID (e.g., `your-project-id`)
   - **Service Account JSON**: Paste the **entire JSON content** from the service account file

4. Click **Test Connection**

#### Step 4: Expected Result

- ✅ **Success**: You should see a green success message: "Successfully connected to Firestore. Found X collections."
- ❌ **Failure**: If you see an error, check:
  - The JSON is valid and complete (all fields present)
  - The `project_id` matches your Firebase project
  - Firestore is enabled in your Firebase project
  - The service account has Firestore read permissions

#### Step 5: Discover Collections

After a successful connection test:

1. Click **Discover Collections**
2. You should see a list of all collections in your Firestore database
3. Each collection shows:
   - Collection name
   - Document count (if available)
   - Schema information (inferred from sample documents)

### Method 2: Client Config (Development Only)

⚠️ **Warning**: This method is **NOT recommended for production**. Use it only for local development when you don't have service account credentials.

#### Step 1: Obtain Firebase Client Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **⚙️ Settings (gear icon)** → **Project settings**
4. Scroll down to the **Your apps** section
5. If you don't have a web app, click **</> (Web)** to add one
6. Copy the Firebase configuration object:

```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
}
```

#### Step 2: Configure Connection

1. In the connection form:
   - **Database Type**: Firebase Firestore
   - **Project ID**: Enter your project ID
   - **Service Account JSON**: Leave **empty**
   - Fill in the client config fields:
     - API Key
     - Auth Domain
     - Database URL (optional)
     - Storage Bucket
     - Messaging Sender ID
     - App ID
     - Measurement ID (optional)

2. Click **Test Connection**

#### Step 3: Expected Result

- ✅ **Success**: Connection successful message
- ❌ **Failure**: This method may fail if Firestore security rules don't allow unauthenticated access. Use Service Account JSON instead.

### Troubleshooting Firebase Firestore

| Error                                        | Solution                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| "Failed to initialize Firebase"              | Check that the service account JSON is valid JSON and contains all required fields |
| "Permission denied"                          | Ensure the service account has Firestore read permissions in IAM                   |
| "Project not found"                          | Verify the `project_id` matches your Firebase project ID exactly                   |
| "Firestore is not enabled"                   | Enable Firestore in Firebase Console → Firestore Database                          |
| Connection succeeds but no collections found | Create at least one collection in Firestore with some documents                    |

---

## PostgreSQL

PostgreSQL is a powerful open-source relational database. The connector supports standard PostgreSQL connections with SSL support.

### Prerequisites

- A PostgreSQL database server (local or remote)
- Database credentials (username, password, database name)
- Network access to the PostgreSQL server (if remote)
- PostgreSQL version 9.6 or higher

### Step 1: Prepare Connection Details

You need the following information:

- **Host**: The PostgreSQL server hostname or IP address
  - Local: `localhost` or `127.0.0.1`
  - Remote: e.g., `db.example.com` or `192.168.1.100`
- **Port**: PostgreSQL port (default: `5432`)
- **Database**: The name of the database to connect to
- **User**: PostgreSQL username
- **Password**: PostgreSQL password
- **SSL**: Whether to use SSL (required for most cloud providers)
- **Schema**: Database schema (default: `public`)

### Step 2: Create a Test Database (If Needed)

If you don't have a database yet, create one:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create a database
CREATE DATABASE test_migration;

# Create a user (optional)
CREATE USER test_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE test_migration TO test_user;

# Exit
\q
```

### Step 3: Create Test Tables (Optional)

To test the discovery feature, create some test tables:

```sql
-- Connect to your database
\c test_migration

-- Create a test table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  age INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create another table with foreign key
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product_name VARCHAR(255),
  amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (name, email, age) VALUES
  ('John Doe', 'john@example.com', 30),
  ('Jane Smith', 'jane@example.com', 25);

INSERT INTO orders (user_id, product_name, amount) VALUES
  (1, 'Laptop', 999.99),
  (1, 'Mouse', 29.99),
  (2, 'Keyboard', 79.99);
```

### Step 4: Configure Connection in DB Migrate

1. In the connection form:
   - **Database Type**: Select "PostgreSQL"
   - **Host**: Enter your PostgreSQL host
   - **Port**: Enter the port (default: `5432`)
   - **Database**: Enter the database name
   - **User**: Enter your PostgreSQL username
   - **Password**: Enter your password
   - **SSL**: Check if your server requires SSL (usually required for cloud providers)
   - **Schema**: Enter schema name (default: `public`)

2. Click **Test Connection**

### Step 5: Expected Result

- ✅ **Success**: You should see: "Successfully connected to PostgreSQL: PostgreSQL X.X.X on platform..."
- ❌ **Failure**: Common errors:
  - "Connection refused": Check host, port, and firewall settings
  - "password authentication failed": Verify username and password
  - "database does not exist": Check database name
  - "SSL required": Enable SSL checkbox

### Step 6: Discover Tables

After a successful connection test:

1. Click **Discover Tables**
2. You should see all tables in the specified schema
3. Each table shows:
   - Table name
   - Column count
   - Schema details (columns, types, nullable, defaults)
   - Primary keys (marked with 🔑 PK badge)
   - Foreign keys (relationships to other tables)

### Step 7: Preview Table Data

1. Click **Preview** on any table
2. A modal will show:
   - Full schema information (columns, types, constraints)
   - Primary keys list
   - Foreign keys with relationships
   - First 10 rows of data in JSON format

### Troubleshooting PostgreSQL

| Error                            | Solution                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| "Connection refused"             | Check that PostgreSQL is running: `pg_isready` or `sudo systemctl status postgresql` |
| "password authentication failed" | Verify username and password. Check `pg_hba.conf` for authentication settings        |
| "database does not exist"        | Verify database name. List databases: `psql -U postgres -l`                          |
| "SSL required"                   | Enable SSL checkbox. Most cloud providers require SSL                                |
| "timeout"                        | Check firewall rules. Ensure port 5432 is open                                       |
| "permission denied"              | Grant necessary privileges: `GRANT CONNECT ON DATABASE dbname TO username;`          |
| No tables discovered             | Ensure tables exist in the specified schema. Check schema name (default: `public`)   |

### Testing with Cloud PostgreSQL Providers

#### AWS RDS PostgreSQL

```javascript
{
  host: "your-db-instance.xxxxx.us-east-1.rds.amazonaws.com",
  port: 5432,
  database: "your_database",
  user: "your_username",
  password: "your_password",
  ssl: true  // Required for RDS
}
```

#### Google Cloud SQL (PostgreSQL)

```javascript
{
  host: "your-instance-ip",  // Use Public IP or Cloud SQL Proxy
  port: 5432,
  database: "your_database",
  user: "your_username",
  password: "your_password",
  ssl: true  // Required
}
```

#### Heroku Postgres

Use the connection string provided in Heroku dashboard, or parse it:

```javascript
// Connection string format:
// postgres://user:password@host:port/database

{
  host: "ec2-xxx-xxx-xxx.compute-1.amazonaws.com",
  port: 5432,
  database: "dxxxxxxxxxxxxx",
  user: "xxxxxxxxxxxxx",
  password: "xxxxxxxxxxxxx",
  ssl: true  // Required for Heroku
}
```

---

## Supabase

Supabase is a PostgreSQL-based platform, so the connector extends the PostgreSQL connector. You can use either a connection string or individual connection parameters.

### Prerequisites

- A Supabase project (create one at [supabase.com](https://supabase.com))
- Database password (set when creating the project)
- Connection details from Supabase dashboard

### Method 1: Connection String (Recommended)

#### Step 1: Obtain Connection String

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Settings** → **Database**
4. Scroll down to **Connection string** section
5. Select **URI** tab
6. Copy the connection string (format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)

**Important**: Replace `[YOUR-PASSWORD]` with your actual database password.

#### Step 2: Configure Connection

1. In the connection form:
   - **Database Type**: Select "Supabase"
   - **Connection String**: Paste the full connection string
   - Leave other fields empty (they will be parsed from the connection string)

2. Click **Test Connection**

#### Step 3: Expected Result

- ✅ **Success**: "Successfully connected to Supabase: PostgreSQL X.X.X..."
- ❌ **Failure**: Check that:
  - Connection string is correctly formatted
  - Password is correct (replace `[YOUR-PASSWORD]` with actual password)
  - No extra spaces or characters in the connection string

### Method 2: Individual Parameters

#### Step 1: Obtain Connection Details

From Supabase Dashboard → Settings → Database, note:

- **Host**: `db.xxxxx.supabase.co` (found in connection string)
- **Port**: `5432` (default, or from connection string)
- **Database**: Usually `postgres`
- **User**: Usually `postgres`
- **Password**: Your database password (set during project creation)

#### Step 2: Configure Connection

1. In the connection form:
   - **Database Type**: Select "Supabase"
   - **Host**: Enter the Supabase host
   - **Port**: Enter `5432`
   - **Database**: Enter `postgres` (or your custom database name)
   - **User**: Enter `postgres`
   - **Password**: Enter your database password
   - **SSL**: Enabled by default (required for Supabase)
   - **Schema**: `public` (default)

2. Click **Test Connection**

#### Step 3: Expected Result

- ✅ **Success**: Connection successful message
- ❌ **Failure**: Verify all parameters are correct, especially password

### Step 4: Discover Tables

1. Click **Discover Tables**
2. Supabase tables will be listed (including system tables like `auth.users`)
3. You can preview any table to see schema details, primary keys, and foreign keys

### Step 5: Create Test Tables (Optional)

You can create test tables using Supabase SQL Editor:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run SQL:

```sql
-- Create a test table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data
INSERT INTO products (name, price, description) VALUES
  ('Laptop', 999.99, 'High-performance laptop'),
  ('Mouse', 29.99, 'Wireless mouse'),
  ('Keyboard', 79.99, 'Mechanical keyboard');
```

3. Refresh the discovery in DB Migrate to see the new table

### Troubleshooting Supabase

| Error                            | Solution                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| "Connection failed"              | Verify connection string format. Ensure password is correctly replaced in connection string                  |
| "password authentication failed" | Check your database password in Supabase Dashboard → Settings → Database                                     |
| "SSL required"                   | SSL is enabled by default for Supabase. If disabled, re-enable it                                            |
| "Connection timeout"             | Check your network/firewall. Supabase requires SSL connection                                                |
| "database does not exist"        | Use `postgres` as database name (default) or check your custom database name                                 |
| Connection string parsing error  | Ensure connection string is complete and properly formatted: `postgresql://user:password@host:port/database` |

### Important Notes for Supabase

- ✅ **SSL is required**: Supabase always requires SSL connections
- ✅ **Default database**: Usually `postgres`
- ✅ **Default user**: Usually `postgres`
- ✅ **Schema**: Default schema is `public`
- ⚠️ **Connection pooling**: Supabase uses connection pooling. The connector uses direct connections
- ⚠️ **Password**: Set during project creation. Reset in Dashboard → Settings → Database if needed

---

## MongoDB

⚠️ **Status**: MongoDB connector is currently a **stub implementation** and is not fully functional yet.

### Current Status

The MongoDB connector package exists but the implementation is incomplete. Attempting to test a MongoDB connection will result in an error: "MongoDB connector is not yet implemented".

### Planned Implementation

When implemented, the MongoDB connector will support:

- Connection via connection string (MongoDB URI format)
- Database selection
- Collection discovery
- Schema inference from documents
- Batch reading and writing
- Index information

### Expected Configuration (When Implemented)

```javascript
{
  type: "mongodb",
  connectionString: "mongodb://username:password@host:port/database?options",
  database: "your_database_name",
  options: {
    // Optional MongoDB driver options
  }
}
```

### Connection String Format

```
mongodb://[username:password@]host[:port][/database][?options]
```

Examples:

- Local: `mongodb://localhost:27017/myapp`
- Atlas: `mongodb+srv://username:password@cluster.mongodb.net/database`
- With auth: `mongodb://admin:secret@localhost:27017/mydb`

### Testing MongoDB (Future)

Once implemented, testing will follow these steps:

1. **Obtain MongoDB Connection String**:
   - Local MongoDB: `mongodb://localhost:27017/database_name`
   - MongoDB Atlas: Connection string from Atlas dashboard
   - Other providers: Provider-specific connection string

2. **Configure Connection**:
   - Database Type: MongoDB
   - Connection String: Paste MongoDB URI
   - Database: Database name
   - Options: Optional MongoDB driver options (JSON format)

3. **Test Connection**: Should verify connection and list available databases/collections

4. **Discover Collections**: List all collections in the specified database

### Contributing MongoDB Support

If you'd like to help implement the MongoDB connector, see:

- [Connector Guide](connector-guide.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- Package: `packages/connectors-mongo/`

---

## General Testing Tips

### 1. Start with Simple Tests

- Test connection first (most basic operation)
- Then test discovery (list collections/tables)
- Finally test data preview

### 2. Use Test Data

Create small test datasets to verify functionality:

- 5-10 records is sufficient for testing
- Include various data types (strings, numbers, dates, etc.)
- Test with NULL/empty values

### 3. Check Logs

- Backend logs: Check terminal running `npm run dev:api`
- Browser console: Check browser DevTools for frontend errors
- Network tab: Inspect API requests/responses

### 4. Verify Credentials

- Double-check all credentials are correct
- Ensure credentials have necessary permissions (read, list, etc.)
- For cloud providers, check IP whitelisting/security groups

### 5. Network Considerations

- Firewall rules may block connections
- VPN might be required for private databases
- Cloud providers often require SSL/TLS

### 6. Schema Considerations

- **Firestore**: Schema is inferred from documents (may vary)
- **PostgreSQL/Supabase**: Schema is explicit (columns, types, constraints)
- **MongoDB**: Schema is inferred (flexible structure)

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [main README](../README.md) for general information
2. Review [CONTRIBUTING.md](../CONTRIBUTING.md) for development setup
3. Open an issue on GitHub with:
   - Database type and version
   - Error messages (full stack trace)
   - Configuration (sanitized, no passwords)
   - Steps to reproduce

---

## Security Reminders

🔒 **Important Security Practices**:

- ✅ Never commit credentials or connection strings to version control
- ✅ Use environment variables for sensitive data in production
- ✅ Test with read-only credentials when possible
- ✅ Use separate test databases, not production data
- ✅ Rotate credentials regularly
- ✅ Review connection strings before pasting (remove passwords from logs)

---

**Last Updated**: See [CHANGELOG.md](../CHANGELOG.md) for updates to this guide.
