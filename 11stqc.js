const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3201;

// 中间件设置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置数据库连接
const dbConfig = {
  user: 'an',
  password: '123',
  server: '10.240.129.13', // 请再次检查此IP是否正确且可访问
  database: 'wmp',
  options: {
    encrypt: false, // 如果需要加密连接，设置为 true
    trustServerCertificate: true // 如果本地开发或特定场景需要，请添加此项，并为生产环境审查其安全性
  }
};

// 使用连接池，避免每次请求都重新连接数据库
const poolPromise = sql.connect(dbConfig);

// 批量查询 prd_no 的 API
app.post('/get-prd-info', async (req, res) => {
  const { prdNos } = req.body; // 从请求体中获取 prd_no 数组
  
  if (!Array.isArray(prdNos) || prdNos.length === 0) {
    return res.status(400).send('Invalid prd_no list');
  }

  try {
    const pool = await poolPromise; // 从连接池中获取连接
    
    // 使用 SQL 查询的 IN 参数化
    const query = `
      SELECT * 
      FROM dbo.qc 
      WHERE prd_no IN (${prdNos.map((_, idx) => `@prd_no${idx}`).join(', ')})
    `;
    
    const request = pool.request();

    // 为每个 prd_no 添加参数
    prdNos.forEach((prdNo, idx) => {
      request.input(`prd_no${idx}`, sql.NVarChar, prdNo);
    });

    const result = await request.query(query);
    
    // 返回查询结果
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// 启动 Express 服务器
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
