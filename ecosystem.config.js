// pm2 konfigurácia — web (Next.js) aj worker ako dva procesy.
// Na serveri: pm2 start ecosystem.config.js && pm2 save
module.exports = {
  apps: [
    {
      name: 'tichucko-web',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3007',
      env: { NODE_ENV: 'production', PORT: '3007' },
    },
    {
      name: 'tichucko-worker',
      cwd: __dirname,
      script: 'worker/worker.js',
      node_args: '--env-file=.env.local',
      env: { NODE_ENV: 'production', PORT: '3007' },
    },
  ],
}
