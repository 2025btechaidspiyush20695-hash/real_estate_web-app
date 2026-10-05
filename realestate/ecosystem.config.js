/**
 * PM2 production process manager config.
 *
 * Why PM2? It keeps the site alive forever:
 *  - auto-restarts the app if it ever crashes
 *  - restarts on memory leaks (max_memory_restart)
 *  - exponential backoff so a crash-loop can't thrash the server
 *  - starts the app on boot with: pm2 save && pm2 startup
 *
 * Usage on the VPS:
 *   npm i -g pm2
 *   NODE_ENV=production pm2 start ecosystem.config.js
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'gurukripa-estate',
      script: 'server/src/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Optional: point PM2 logs to files
      out_file: 'logs/pm2.out.log',
      error_file: 'logs/pm2.err.log',
      merge_logs: true,
      time: true,
    },
  ],
};
