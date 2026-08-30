module.exports = {
  apps: [
    {
      name: 'faq-frontend',
      script: './start.sh',
      cwd: './',
      // Next.js is a single server; use 1 instance to avoid port conflicts and reduce RAM
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'https://api.faqhub.ir/api'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'https://api.faqhub.ir/api'
      },
      // Logging (ensure ./logs directory exists before starting)
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Restart when process exceeds 1G to avoid swap (server has limited RAM)
      watch: false,
      max_memory_restart: '1G',

      // Health monitoring
      min_uptime: '10s',
      max_restarts: 10,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'https://github.com/iranpsc/faq-frontend.git',
      path: '/var/www/faq-frontend',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --only=production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
