
const fs = require('fs');
const path = require('path');
const UnionPay = require('../index');

// var privateKey = fs.readFileSync(path.resolve(__dirname, '../bin/acp700000000000001.pem')); //商户测试私钥,使用openssl从pfx文件中生成并去除密码
const privateKey = fs.readFileSync(path.resolve(__dirname, './acp_test_sign.pem')); // 私钥
// var publicKey = fs.readFileSync(path.resolve(__dirname, '../bin/acp20151027.cer')); //银联测试公钥
const publicKey = fs.readFileSync(path.resolve(__dirname, './verify_sign_acp.cer')); // 公钥

const sdk = new UnionPay({
  privateKey,
  publicKey,
  merId: '700000000000001',
  certId: '40220995861346480087409489142384722381',
  termId: '00000011',
  frontUrl: 'http://www.rest.org',
  backUrl: 'http://www.rest.org',
  sandbox: true,
  openLog: true,
});


sdk.microPay({
  orderId: 'W165416123121',
  qrNo: '6222674044229453590',
  txnAmt: '1',
}).then(res => console.log(res));

// sdk.revoke({
//   orderId: 'W165416234563',
//   origQryId: '20180812300382099911',
//   txnAmt: '1',
// }).then(res => console.log(res));

// sdk.refund({
//   orderId: 'W165416234561',
//   origQryId: '20180812158110755741',
//   txnAmt: '1',
// }).then(res => console.log(res));

// sdk.query({
//   // queryId: '20180812158110755741',
//   orderId: 'W165416234561',
//   // txnTime: '20180812051852',
// }).then(res => console.log(res));

// sdk.downloadBill({
//   settleDate: '0119',
//   fileType: '00',
// }).then(res => {
//   console.log(res);
//   const zlib = require('zlib');
//   fs.writeFileSync(res.fileName, zlib.inflateSync(new Buffer(res.fileContent, 'base64')));
// });
