const pem = require('pem');
const fs = require('fs');

// 获取证书私钥
const pfx = fs.readFileSync('acp_test_sign.pfx');
pem.readPkcs12(pfx, { p12Password: '000000' }, (err, cert) => {
  // cert.key就是私钥
  console.log(cert.key);
});

// 获取证书id
// 先把p12证书导出crt
// openssl pkcs12 -in acp_test_sign.p12 -clcerts -nokeys -out acp_test_sign.crt
const wopenssl = require('wopenssl');
const Decimal = require('decimal.js');
const certs = wopenssl.x509.parseCert(__dirname + '/acp_test_sign.crt');
console.log((new Decimal('0x' + certs.serial)).toFixed());

