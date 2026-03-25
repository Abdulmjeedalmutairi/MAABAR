const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api/apollo',
    createProxyMiddleware({
      target: 'https://api.apollo.io',
      changeOrigin: true,
      pathRewrite: { '^/api/apollo': '' },
    })
  );
};
