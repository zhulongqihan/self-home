// 全局错误处理中间件

function notFound(req, res, next) {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`
  })
}

// 注意：Express 4 错误中间件必须 4 个参数
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[Error]', err)
  res.status(err.status || 500).json({
    status: 'error',
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Internal server error'
  })
}

module.exports = { notFound, errorHandler }