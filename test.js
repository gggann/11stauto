const axios = require('axios');

// 你想要查询的 prd_no 数组
const prdNos = [
  '8649940187',
  '8657782870',
];

// API 地址
const apiUrl = 'http://10.240.129.13:3201/get-prd-info';

// 发送 POST 请求
axios.post(apiUrl, { prdNos })
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
