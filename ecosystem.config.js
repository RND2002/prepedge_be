module.exports = {
    apps: [
        {
            name: "prepedge-api",
            script: "./dist/index.js",
            instances: 1,
            exec_mode: "fork",
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};
