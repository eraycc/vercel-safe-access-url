const { createProxyMiddleware } = require("http-proxy-middleware");

// 从环境变量中读取密码和安全路径
const PASSWORD = process.env.NEXT_PUBLIC_SAFEPWD;
const SAFE_PATH = process.env.NEXT_PUBLIC_SAFEPATH || '/safe-api'; // 默认安全路径为/safe-api

module.exports = (req, res) => {
  // 检查请求路径是否以安全路径开头
  if (req.url.startsWith(SAFE_PATH)) {
    // 提取目标URL
    const targetUrl = req.url.slice(SAFE_PATH.length);
    
    // 验证目标URL是否以http://或https://开头
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      // 执行代理逻辑，直接转发到目标URL
      createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        pathRewrite: {
          [`^${SAFE_PATH}`]: '', // 移除安全路径前缀
        },
      })(req, res);
      return;
    } else {
      res.status(400).send('Invalid target URL');
      return;
    }
  }

  // 如果不是安全路径请求，继续原有的密码验证逻辑
  const safepwd = req.cookies.safepwd;
  if (safepwd === PASSWORD) {
    // 如果密码正确，移除 safepwd cookie 后再转发请求
    if (req.headers.cookie) {
      req.headers.cookie = req.headers.cookie
        .split(';')
        .map(cookie => cookie.trim())
        .filter(cookie => !cookie.startsWith('safepwd='))
        .join(';');
    }

    // 执行代理逻辑
    let target = process.env.NEXT_PUBLIC_ACCESSURL;
    
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {},
    })(req, res);
  } else {
    // 如果密码不正确或不存在，显示密码验证界面
    if (req.method === "POST") {
      // 处理用户提交的密码
      const userPassword = req.body.password;
      if (userPassword === PASSWORD) {
        // 如果密码正确，设置 cookie 并刷新页面
        res.setHeader("Set-Cookie", `safepwd=${userPassword}; Path=/; HttpOnly`);
        res.redirect("/");
      } else {
        // 如果密码错误，返回错误信息
        res.status(401).send("密码错误，请重试。");
      }
    } else {
      // 返回密码验证界面
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <style>
          body {
            background-color: #fbfbfb;
            font-family: Arial, sans-serif;
          }

          h1 {
            text-align: center;
            color: #444;
          }

          form {
            background-color: white;
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
            padding: 2rem;
            border-radius: 8px;
          }

          input {
            display: block;
            width: 100%;
            font-size: 18px;
            padding: 15px;
            border: solid 1px #ccc;
            border-radius: 4px;
            margin: 1rem 0;
          }

          button {
            padding: 15px;
            background-color: #0288d1;
            color: white;
            font-size: 18px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
          }

          button:hover {
            background-color: #039BE5;
          }
        </style>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>密码验证</title>
        </head>
        <body>
          <h1>请输入密码</h1>
          <form method="POST">
            <input type="password" name="password" required>
            <button type="submit">确认</button>
          </form>
        </body>
        </html>
      `);
    }
  }
};
