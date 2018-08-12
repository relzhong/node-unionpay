const pem = require('pem');
const fs = require('fs');
const pfx = fs.readFileSync('acp_test_sign.p12');
pem.readPkcs12(pfx, { p12Password: '000000' }, (err, cert) => {
  // cert.key就是私钥
  console.log(cert.key);
});

const wopenssl = require('wopenssl');
const p12 = wopenssl.pkcs12.extract(__dirname + '/acp_test_sign.p12', '000000');
const certs = wopenssl.x509.parseCert(p12.certificate);
console.log(certs);
// certs里面的Serial就是certId, 但是是16进制的， 然后使用python int("1149699808", 16)将其转换为10进制
