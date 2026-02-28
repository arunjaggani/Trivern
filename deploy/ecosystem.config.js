// PM2 Ecosystem Config — Trivern Next.js
// This keeps your Next.js app alive 24/7 on the VPS

module.exports = {
    apps: [
        {
            name: "trivern",
            script: "node_modules/.bin/next",
            args: "start",
            cwd: "/var/www/trivern",
            instances: 1,
            exec_mode: "fork",
            env: {
                NODE_ENV: "production",
                PORT: 3000,
            },
            // Auto-restart on crash
            max_restarts: 10,
            restart_delay: 5000,
            // Logging
            log_file: "/var/log/trivern/app.log",
            error_file: "/var/log/trivern/error.log",
            out_file: "/var/log/trivern/out.log",
            merge_logs: true,
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            // Memory management
            max_memory_restart: "500M",
        },
    ],
};
