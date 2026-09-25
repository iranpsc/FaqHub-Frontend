## FAQ Q&A Platform (Laravel + Vue 3)

A modern, RTL-friendly Q&A platform where users can ask questions, answer, comment, vote, and curate content. It features role/level-based moderation, OAuth login, and a Vue 3 SPA frontend powered by TailwindCSS and Vite.

### Key Features
- **Questions**: create, read, update, delete; tag with multiple tags; belong to a category; auto-slugging; view counters; pagination
- **Answers**: reply to questions; publish moderation; mark correctness by higher-level users; sorting by votes, comments, recency
- **Comments**: on questions and answers; publish moderation; voting
- **Voting**: up/down votes on questions, answers, and comments; real-time counts returned by API
- **Publishing workflow**: higher-level users can publish content of lower-level users; some high-level users auto-publish their own questions
- **Pin/Feature**: users can pin questions for themselves; authorized users can feature/unfeature
- **Search & Filtering**: full-text search by title, filters for category/tags/solved/unanswered; sort by created date, votes, answers, views
- **Dashboards**: recommended and popular questions, daily activity feed, active users, global stats
- **OAuth + API tokens**: external OAuth for login, then Laravel Sanctum bearer token for API
- **Notifications**: queued email notifications to question owners upon answers and comments
- **Persian/RTL**: RTL layout, Persian text strings, right-to-left UI and date support

### Tech Stack
- **Backend**: Laravel 12, PHP 8.2, Laravel Sanctum 4.x, Laravel Notifications/Queues, Eloquent ORM
- **Frontend**: Vue 3, Vue Router 4, TailwindCSS 3, Vite 6, Axios, NProgress, SweetAlert2, PrimeVue (and related themes), Select2, TinyMCE Vue integration
- **Database**: Laravel-supported drivers (MySQL, PostgreSQL, SQLite, etc.)
- **Testing**: PHPUnit 11, Laravel Test utilities, Faker
- **Utilities**: `sadegh19b/laravel-persian-validation` for Persian validation messages

### High-level Architecture
- SPA served from `resources/views/app.blade.php` with `@vite` assets; any web path is handled by a catch-all route and rendered by Vue Router
- RESTful API under `/api/*` serving JSON resources with dedicated controllers and policies
- Vue 3 app manages routes, auth state, modals, and global loading with NProgress; Axios adds bearer token automatically
- Queue workers deliver email notifications asynchronously

## Getting Started

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+ and npm
- A database (MySQL, PostgreSQL, or SQLite for local/dev)

### Setup
1. Install PHP dependencies:
   - `composer install`
2. Install JS dependencies:
   - `npm install`
3. Environment:
   - Copy `.env.example` to `.env` and configure database and app URLs
   - Set OAuth and mail variables (see below)
4. Generate app key:
   - `php artisan key:generate`
5. Migrate (and optionally seed):
   - `php artisan migrate`
   - Optional: `php artisan db:seed`
6. Storage symlink (for uploaded files):
   - `php artisan storage:link`

### Running in development
- One-shot dev (runs server, queue, logs, Vite) using concurrently:
  - `composer run dev`

Or run individually in separate terminals:
- PHP server: `php artisan serve`
- Queue worker: `php artisan queue:listen --tries=1`
- Logs: `php artisan pail --timeout=0`
- Vite: `npm run dev`

### Production notes
- Run a persistent queue worker (e.g., Supervisor) to process notifications
- Configure mail provider and `QUEUE_CONNECTION`
- Serve built assets: `npm run build`

## Authentication Flow
The app uses an external OAuth provider for login, then issues a Laravel Sanctum personal access token for API calls.

1. Frontend requests `GET /api/auth/redirect`
2. Backend returns OAuth authorization URL; browser is redirected to the OAuth server
3. After user authorization, OAuth provider redirects to `GET /api/auth/callback`
4. Backend exchanges code for access token, fetches user info, signs user in, and redirects back to the SPA with a query param `?token=...`
5. Frontend stores `auth_token` in `localStorage` and attaches it to subsequent API requests via Axios

Configure in `config/services.php` using environment variables:
- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`
- `OAUTH_SERVER_URL` (e.g., `https://accounts.example.com`)
- `APP_URL` (used for redirect and return)

## Roles, Levels, and Permissions
- **User.level**: numeric level that governs moderation powers
  - Higher-level users can publish content of lower-level users
  - Users with level ≥ 3 auto-publish their own questions
- **User.role**: `admin` can bypass certain restrictions (e.g., delete any question/answer)

Authorization is enforced via policies and controller `authorize` calls; routes requiring auth use `auth:sanctum`. Some list/show endpoints accept optional auth via custom `auth.optional` middleware to tailor visibility.

## Scoring System (Gamification)
- Create answer: **+5** to answer owner
- Create comment: **+2** to comment owner
- Publish question: **+2** to publisher
- Publish answer: **+3** to publisher
- Upvote received on question/answer: **+10** to content owner
- Downvote received on question/answer: **-2** to content owner
- Toggle answer correctness by qualified marker:
  - Mark correct: **+10** to answer owner, **+2** to marker
  - Unmark correct: **-10** to answer owner, **+2** to marker
- First-time email verification update: **+10** to the user

## API Overview

Base URL: `/api`

### Auth
- `GET /auth/redirect` → returns OAuth authorization URL
- `GET /auth/callback` → OAuth callback; redirects to app with `?token=`
- `GET /auth/me` → current user (auth)
- `POST /auth/logout` → revoke tokens (auth)

### Questions
- `GET /questions` → list with filters, sorting, pagination
- `GET /questions/search?q=...&limit=...` → search published questions
- `GET /questions/recommended` → recommended questions
- `GET /questions/popular?period=week|month|year|all` → popular questions
- `GET /questions/{slug}` → show (increments views)
- `POST /questions` → create (auth)
- `PUT /questions/{id}` → update (owner/moderator)
- `DELETE /questions/{id}` → delete (owner/admin)
- `POST /questions/{id}/publish` → publish (higher-level user)
- `POST /questions/{id}/vote` → vote `{ type: up|down }` (auth)
- `POST /questions/{id}/pin` / `DELETE /questions/{id}/pin` → pin/unpin for current user (auth)
- `POST /questions/{id}/feature` / `DELETE /questions/{id}/feature` → feature/unfeature (authorized)

### Answers
- `GET /questions/{id}/answers` → list (visible to user based on auth/level)
- `POST /questions/{id}/answers` → create (auth)
- `PUT /answers/{id}` → update (owner)
- `DELETE /answers/{id}` → delete (owner/admin)
- `POST /answers/{id}/publish` → publish (higher-level user)
- `POST /answers/{id}/vote` → vote `{ type: up|down }` (auth)
- `POST /answers/{id}/toggle-correctness` → toggle correctness (level ≥ 4 and not the owner; precedence to highest-level marks)

### Comments
- `GET /questions/{id}/comments` and `GET /answers/{id}/comments` → list
- `POST /questions/{id}/comments` and `POST /answers/{id}/comments` → create (auth)
- `PUT /comments/{id}` → update (owner)
- `DELETE /comments/{id}` → delete (owner/admin)
- `POST /comments/{id}/publish` → publish (authorized)
- `POST /comments/{id}/vote` → vote `{ type: up|down }` (auth)

### Categories & Tags
- `GET /categories` and `GET /categories/{slug}`
- `GET /categories/popular`
- `GET /categories/{slug}/questions`
- `GET /tags` and `GET /tags/{slug}/questions`

### Authors & Users
- `GET /authors` and `GET /authors/{id}`
- `GET /user/profile` / `GET /user/stats` / `GET /user/activity` (auth)
- `POST /user/update-image` (auth)

### File Uploads (auth)
- `POST /upload/tinymce-image` → TinyMCE image
- `POST /upload/file` → generic file
- `DELETE /upload/file` → delete

### Example: Authenticated request
```bash
curl -H "Authorization: Bearer <SANCTUM_TOKEN>" -H "Accept: application/json" \
  https://your-app.test/api/questions
```

## Search and Filtering
`GET /api/questions` accepts rich parameters:
- **Filtering**: `category_id`, `tags` (comma-separated tag IDs), `filter` in `unanswered|unsolved|solved`
- **Sorting**: `sort=created_at|votes|answers_count|views_count` with `order=asc|desc`
- Legacy params still supported: `newest`, `oldest`, `most_votes`, `most_answers`, `most_views`, `unanswered`, `unsolved`

## Frontend Overview
- **SPA routing**: `/` home, `/questions/:slug`, `/authors`, `/authors/:id`, `/categories`, `/categories/:slug`, `/tags`, `/tags/:slug`, `/profile` (requires auth), `/activities`
- **Auth UX**: when a protected route is hit without a token, the app calls `/api/auth/redirect` and navigates to OAuth
- **Dark mode**: Tailwind `darkMode: 'class'`, theme toggles via composable
- **Global services**: Axios instance (`resources/js/services/api.js`), and an in-app `questionService` event bus

## Notifications & Queues
- Email notifications are sent to question owners on answers and comments (`App\Notifications\QuestionInteractionNotification`)
- Notifications implement `ShouldQueue` → ensure a queue worker is running
- Configure mailer in `.env` (`MAIL_MAILER`, `MAIL_HOST`, etc.)

## Tests
- Run: `composer test`
- Feature tests cover: questions CRUD, search/filter, visibility scopes; answers CRUD, publishing, voting; comments CRUD; correctness marking workflow and quotas; policies and scoring effects

## Project Structure (selected)
- `app/Http/Controllers/Api/*` – REST API controllers (Questions, Answers, Comments, Dashboard, etc.)
- `app/Http/Middleware/OptionalAuthSanctum.php` – optional bearer auth to tailor visibility
- `app/Http/Resources/*` – API resources/transformers
- `app/Models/*` – Eloquent models and query scopes (published/visible, pin/feature status)
- `app/Services/QuestionFilterService.php` – filtering/sorting logic for questions
- `resources/js` – Vue 3 SPA (components, pages, composables, router)
- `routes/api.php` – API routes; `routes/web.php` – SPA catch-all

## Environment Variables
Set at minimum:
- App: `APP_NAME`, `APP_URL`, `APP_ENV`, `APP_DEBUG`
- DB: `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- Queue: `QUEUE_CONNECTION`
- Mail: `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENCRYPTION`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`
- OAuth: `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `OAUTH_SERVER_URL`

## Use Cases
- **Community support forum** for Persian-speaking users with moderation by trusted members
- **Internal knowledge base** where senior staff curate and publish content created by juniors
- **Education Q&A** where instructors mark correct answers and surface curated content

## Deployment (Production Server)

This frontend is a **Next.js 15** app. In production it listens on **port 3005** and talks to the FAQ API (`NEXT_PUBLIC_API_URL`, default `https://api.faqhub.ir/api`).

**Recommended approach:** Docker. **Alternative:** Node + PM2 on the host.

### Prerequisites

- Linux server with Docker Engine + Docker Compose **or** Node.js 20+ and npm
- Git access to this repository
- Firewall/reverse proxy allowing inbound HTTPS (and optionally SSH)
- Outbound HTTPS to the API host (`api.faqhub.ir` or your own API)

### Environment variables

| Variable | When | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_API_URL` | **Build time** (required for client) | Public API base URL, e.g. `https://api.faqhub.ir/api` |
| `NODE_ENV` | Runtime | Must be `production` |
| `PORT` | Runtime | App port (default `3005`) |
| `HOSTNAME` | Runtime (Docker) | Bind address; use `0.0.0.0` in containers |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical site URL for SEO/metadata |

> `NEXT_PUBLIC_*` values are inlined into the client bundle at **build** time. Changing them later requires a rebuild (or a new image), not only a container restart.

### Option A — Docker (recommended)

1. **Clone and enter the project** on the server:
   ```bash
   git clone https://github.com/iranpsc/faq-frontend.git
   cd faq-frontend
   git checkout main   # or your release tag/branch
   ```

2. **Set production API URL** (optional override) in `docker-compose.yml` under `build.args` and `environment`, or pass build args:
   ```bash
   docker compose build --build-arg NEXT_PUBLIC_API_URL=https://api.faqhub.ir/api
   ```

3. **Build and start** in detached mode:
   ```bash
   docker compose up --build -d
   ```

4. **Verify**:
   ```bash
   docker compose ps
   docker compose logs -f --tail=100
   curl -I http://127.0.0.1:3005/
   ```
   Expect the container status `healthy` and HTTP `200` from the homepage.

5. **Updates / redeploy**:
   ```bash
   git pull
   docker compose up --build -d
   ```

6. **Stop**:
   ```bash
   docker compose down
   ```

The image uses a multi-stage build with Next.js `output: "standalone"`, runs as a non-root user, exposes **3005**, and includes a healthcheck on `/`.

### Option B — Node.js + PM2

Use this if you prefer running the app directly on the host (see `ecosystem.config.js`).

1. **Install dependencies and build**:
   ```bash
   git clone https://github.com/iranpsc/faq-frontend.git
   cd faq-frontend
   npm ci
   export NODE_ENV=production
   export NEXT_PUBLIC_API_URL=https://api.faqhub.ir/api
   npm run build
   ```

2. **Start with PM2**:
   ```bash
   npm install -g pm2
   mkdir -p logs
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup    # enable start on reboot (follow printed instructions)
   ```

3. **Useful PM2 commands**:
   ```bash
   pm2 status
   pm2 logs faq-frontend
   pm2 reload ecosystem.config.js --env production   # zero-downtime reload after rebuild
   ```

4. **Redeploy**:
   ```bash
   git pull
   npm ci
   NEXT_PUBLIC_API_URL=https://api.faqhub.ir/api npm run build
   pm2 reload ecosystem.config.js --env production
   ```

### Reverse proxy (HTTPS)

Do not expose port 3005 publicly if you terminate TLS at a reverse proxy. Point your domain at the proxy and forward to `http://127.0.0.1:3005`.

**Nginx example:**

```nginx
server {
    listen 443 ssl http2;
    server_name faqhub.ir www.faqhub.ir;

    # ssl_certificate     /path/to/fullchain.pem;
    # ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Reload Nginx after changes: `sudo nginx -t && sudo systemctl reload nginx`.

### Checklist before go-live

- [ ] `NEXT_PUBLIC_API_URL` points at the production API and the app was **rebuilt** with that value  
- [ ] Homepage returns `200` on `http://127.0.0.1:3005/`  
- [ ] HTTPS reverse proxy is configured; HTTP redirects to HTTPS if required  
- [ ] Process manager (Docker `restart: unless-stopped` or PM2 startup) survives reboot  
- [ ] API CORS / CSP allow this frontend origin  
- [ ] Logs are monitored (`docker compose logs` or `pm2 logs`)

## License
This project is open-sourced software licensed under the MIT license.
