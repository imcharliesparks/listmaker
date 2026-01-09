# Comprehensive Server Setup Guide

Complete step-by-step guide for setting up your Pinterest-style list app backend.


## Step 2: Install Dependencies

```bash
# Core dependencies
npm install express cors dotenv
npm install @clerk/backend @clerk/express
npm install pg
npm install axios cheerio
npm install sharp

# Development dependencies
npm install -D typescript @types/node @types/express @types/cors
npm install -D ts-node nodemon
npm install -D @types/pg
```


## Step 5: Create Project Structure

```bash
mkdir -p src/{config,middleware,routes,controllers,services,models,types,utils}
touch src/index.ts
touch .env .gitignore
```

Your structure should look like:
```
listapp-server/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── routes/
│   │   ├── lists.ts
│   │   ├── items.ts
│   │   └── auth.ts
│   ├── controllers/
│   │   ├── listsController.ts
│   │   ├── itemsController.ts
│   │   └── authController.ts
│   ├── services/
│   │   ├── urlMetadataService.ts
│   │   └── imageService.ts
│   ├── models/
│   │   └── db.sql
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── .env
├── .gitignore
├── package.json
└── tsconfig.json
```

## Step 6: Setup Clerk Authentication

### Get Clerk API Keys:
1. Go to Clerk Dashboard → API Keys
2. Copy your Secret Key (starts with `sk_test_` or `sk_live_`)
3. Copy your Publishable Key (starts with `pk_test_` or `pk_live_`)

### Create `.env` file:

```env
PORT=3000
NODE_ENV=development

# Clerk
CLERK_SECRET_KEY=sk_test_your_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=listapp
DB_USER=postgres
DB_PASSWORD=yourpassword

# Optional
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
```

**Note:** No separate Clerk config file needed; SDK auto-initializes from environment variables.

## Step 7: Setup PostgreSQL Database

### Install PostgreSQL (if not installed):
- macOS: `brew install postgresql`
- Ubuntu: `sudo apt-get install postgresql`
- Windows: Download from postgresql.org

### Create Database:

```bash
# Start PostgreSQL service
# macOS: brew services start postgresql
# Ubuntu: sudo service postgresql start

# Create database
psql postgres
CREATE DATABASE listapp;
\q
```

### Create `src/config/database.ts`:

```typescript
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
```

### Create `src/models/db.sql`:

```sql
-- Users table (using Clerk User ID as primary key)
CREATE TABLE users (
  id VARCHAR(128) PRIMARY KEY, -- Clerk User ID (format: user_xxxxx)
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lists table
CREATE TABLE lists (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  cover_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items table
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title VARCHAR(500),
  description TEXT,
  thumbnail_url TEXT,
  source_type VARCHAR(50), -- 'youtube', 'amazon', 'twitter', 'website', etc.
  metadata JSONB, -- Store platform-specific data
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_items_list_id ON items(list_id);
CREATE INDEX idx_items_source_type ON items(source_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Run the SQL schema:

```bash
psql -d listapp -f src/models/db.sql
```

## Step 8: Create TypeScript Types

### `src/types/index.ts`:

```typescript
export interface User {
  id: string; // Firebase UID
  email: string;
  display_name?: string;
  photo_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface List {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  is_public: boolean;
  cover_image?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Item {
  id: number;
  list_id: number;
  url: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  source_type?: string;
  metadata?: any;
  position: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export interface UrlMetadata {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  sourceType?: string;
  metadata?: any;
}
```

## Step 9: Create Authentication Middleware

### `src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { AuthRequest } from '../types';

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

/**
 * Authentication middleware using Clerk session tokens.
 * Verifies the Bearer token and attaches user info to req.user.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      // Verify Clerk session token
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      if (!payload || !payload.sub) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      const userId = payload.sub;

      // Fetch user details from Clerk to get email
      const user = await clerkClient.users.getUser(userId);

      // Get primary email address
      const email = user.emailAddresses.find(
        e => e.id === user.primaryEmailAddressId
      )?.emailAddress;

      if (!email) {
        return res.status(401).json({ error: 'User email not available' });
      }

      // Attach user info to request (maintaining same interface as Firebase)
      (req as AuthRequest).user = {
        uid: userId,
        email,
      };

      next();
    } catch (verifyError) {
      console.error('Token verification error:', verifyError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

## Step 10: Create URL Metadata Service

### `src/services/urlMetadataService.ts`:

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';
import { UrlMetadata } from '../types';

export class UrlMetadataService {
  async extractMetadata(url: string): Promise<UrlMetadata> {
    try {
      // Detect source type
      const sourceType = this.detectSourceType(url);

      // Handle specific platforms
      if (sourceType === 'youtube') {
        return await this.extractYouTubeMetadata(url);
      }

      // Default: scrape Open Graph tags
      return await this.extractOpenGraphMetadata(url);
    } catch (error) {
      console.error('Error extracting metadata:', error);
      return {
        url,
        title: url,
        sourceType: 'website',
      };
    }
  }

  private detectSourceType(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    if (url.includes('amazon.')) {
      return 'amazon';
    }
    if (url.includes('twitter.com') || url.includes('x.com')) {
      return 'twitter';
    }
    if (url.includes('instagram.com')) {
      return 'instagram';
    }
    return 'website';
  }

  private async extractOpenGraphMetadata(url: string): Promise<UrlMetadata> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ListAppBot/1.0)',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    const metadata: UrlMetadata = {
      url,
      title:
        $('meta[property="og:title"]').attr('content') ||
        $('title').text() ||
        url,
      description:
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content'),
      thumbnail:
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content'),
      sourceType: this.detectSourceType(url),
    };

    return metadata;
  }

  private async extractYouTubeMetadata(url: string): Promise<UrlMetadata> {
    // Extract video ID
    const videoId = this.extractYouTubeId(url);

    if (!videoId) {
      return { url, sourceType: 'youtube' };
    }

    // Use oEmbed API (no API key required)
    try {
      const response = await axios.get(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );

      return {
        url,
        title: response.data.title,
        description: response.data.author_name,
        thumbnail: response.data.thumbnail_url,
        sourceType: 'youtube',
        metadata: {
          videoId,
          channelName: response.data.author_name,
        },
      };
    } catch (error) {
      // Fallback to basic scraping
      return await this.extractOpenGraphMetadata(url);
    }
  }

  private extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^&\s]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }
}

export default new UrlMetadataService();
```

## Step 11: Create Controllers

### `src/controllers/authController.ts`:

```typescript
import { Response } from 'express';
import { AuthRequest } from '../types';
import pool from '../config/database';

export const syncUser = async (req: AuthRequest, res: Response) => {
  try {
    const { uid, email } = req.user!;
    const { displayName, photoUrl } = req.body;

    // Insert or update user
    const query = `
      INSERT INTO users (id, email, display_name, photo_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        photo_url = EXCLUDED.photo_url,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [uid, email, displayName, photoUrl]);

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [uid]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};
```

### `src/controllers/listsController.ts`:

```typescript
import { Response } from 'express';
import { AuthRequest } from '../types';
import pool from '../config/database';

export const createList = async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;
    const { title, description, isPublic } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const query = `
      INSERT INTO lists (user_id, title, description, is_public)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [uid, title, description, isPublic || false]);

    res.status(201).json({ list: result.rows[0] });
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({ error: 'Failed to create list' });
  }
};

export const getUserLists = async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;

    const query = `
      SELECT l.*, COUNT(i.id) as item_count
      FROM lists l
      LEFT JOIN items i ON l.id = i.list_id
      WHERE l.user_id = $1
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `;

    const result = await pool.query(query, [uid]);

    res.json({ lists: result.rows });
  } catch (error) {
    console.error('Error getting lists:', error);
    res.status(500).json({ error: 'Failed to get lists' });
  }
};

export const getListById = async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;
    const { id } = req.params;

    const query = `
      SELECT * FROM lists 
      WHERE id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [id, uid]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }

    res.json({ list: result.rows[0] });
  } catch (error) {
    console.error('Error getting list:', error);
    res.status(500).json({ error: 'Failed to get list' });
  }
};

export const updateList = async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;
    const { id } = req.params;
    const { title, description, isPublic } = req.body;

    const query = `
      UPDATE lists 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          is_public = COALESCE($3, is_public)
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `;

    const result = await pool.query(query, [title, description, isPublic, id, uid]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }

    res.json({ list: result.rows[0] });
  } catch (error) {
    console.error('Error updating list:', error);
    res.status(500).json({ error: 'Failed to update list' });
  }
};

export const deleteList = async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM lists WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({ error: 'Failed to delete list' });
  }
};
```

### `src/controllers/itemsController.ts`:

```typescript
import { Response } from 'express';
import { AuthRequest } from '../types';
import pool from '../config/database';
import urlMetadataService from '../services/urlMetadataService';

export const addItem = async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;
    const { listId, url } = req.body;

    if (!listId || !url) {
      return res.status(400).json({ error: 'List ID and URL are required' });
    }

    // Verify list belongs to user
    const listCheck = await pool.query(
      'SELECT * FROM lists WHERE id = $1 AND user_id = $2',
      [listId, uid]
    );

    if (listCheck.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Extract metadata from URL
    const metadata = await urlMetadataService.extractMetadata(url);

    // Get next position
    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM items WHERE list_id = $1',
      [listId]
    );
    const nextPosition = positionResult.rows[0].next_position;

    // Insert item
    const query = `
      INSERT INTO items (list_id, url, title, description, thumbnail_url, source_type, metadata, position)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      listId,
      url,
      metadata.title,
      metadata.description,
      metadata.thumbnail,
      metadata.sourceType,
      JSON.stringify(metadata.metadata),
      nextPosition,
    ]);

    res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
};

export const getListItems = async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;
    const { listId } = req.params;

    // Verify list belongs to user
    const listCheck = await pool.query(
      'SELECT * FROM lists WHERE id = $1 AND user_id = $2',
      [listId, uid]
    );

    if (listCheck.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }

    const result = await pool.query(
      'SELECT * FROM items WHERE list_id = $1 ORDER BY position ASC',
      [listId]
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ error: 'Failed to get items' });
  }
};

export const deleteItem = async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user!;
    const { id } = req.params;

    // Verify item belongs to user's list
    const itemCheck = await pool.query(
      `SELECT i.* FROM items i 
       JOIN lists l ON i.list_id = l.id 
       WHERE i.id = $1 AND l.user_id = $2`,
      [id, uid]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await pool.query('DELETE FROM items WHERE id = $1', [id]);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
};
```

## Step 12: Create Routes

### `src/routes/auth.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { syncUser, getCurrentUser } from '../controllers/authController';

const router = Router();

router.post('/sync', authenticate, syncUser);
router.get('/me', authenticate, getCurrentUser);

export default router;
```

### `src/routes/lists.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createList,
  getUserLists,
  getListById,
  updateList,
  deleteList,
} from '../controllers/listsController';

const router = Router();

router.use(authenticate); // All routes require authentication

router.post('/', createList);
router.get('/', getUserLists);
router.get('/:id', getListById);
router.put('/:id', updateList);
router.delete('/:id', deleteList);

export default router;
```

### `src/routes/items.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  addItem,
  getListItems,
  deleteItem,
} from '../controllers/itemsController';

const router = Router();

router.use(authenticate); // All routes require authentication

router.post('/', addItem);
router.get('/list/:listId', getListItems);
router.delete('/:id', deleteItem);

export default router;
```

## Step 13: Create Main Server File

### `src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import pool from './config/database';
// Clerk SDK auto-initializes from CLERK_SECRET_KEY env var

// Routes
import authRoutes from './routes/auth';
import listsRoutes from './routes/lists';
import itemsRoutes from './routes/items';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/items', itemsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});
```

## Step 14: Update .gitignore

```
node_modules/
dist/
.env
firebase-service-account.json
*.log
.DS_Store
```

## Step 15: Run the Server

```bash
# Start development server
npm run dev
```

Your server should now be running on `http://localhost:3000`!

## Testing Your API

You can test with curl or Postman:

```bash
# Health check
curl http://localhost:3000/health

# After getting Clerk session token from client:
# Sync user
curl -X POST http://localhost:3000/api/auth/sync \
  -H "Authorization: Bearer YOUR_CLERK_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"John Doe","photoUrl":"https://example.com/photo.jpg"}'

# Create a list
curl -X POST http://localhost:3000/api/lists \
  -H "Authorization: Bearer YOUR_CLERK_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Favorite Videos","description":"Cool stuff I found"}'

# Add an item
curl -X POST http://localhost:3000/api/items \
  -H "Authorization: Bearer YOUR_CLERK_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"listId":1,"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## Next Steps

1. **Add more metadata extractors** for Amazon, Twitter, Instagram
2. **Implement image upload/storage** using Firebase Storage or AWS S3
3. **Add pagination** for lists and items
4. **Implement search functionality**
5. **Add list sharing and collaboration features**
6. **Rate limiting** to prevent abuse
7. **Caching** for metadata extraction
8. **Implement proper logging** (Winston, Pino)

You now have a fully functional backend server! Let me know if you need help with any specific part or want to add more features.