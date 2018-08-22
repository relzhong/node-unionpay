
const axios = require('axios');
const crypto = require('crypto');
const iconv = require('iconv-lite');
const moment = require('moment');
const R = require('ramda');
const { isArray } = require('util');
const querystring = require('querystring');

class Unionpay {
  constructor(option) {
    this.version = '5.0.0';// 版本号，固定填写5.0.0
    this.encoding = 'UTF-8';
    this.signMethod = '01';// 01：表示采用RSA,固定填写：01
    this.txnType = '01';// 固定填写：01
    this.txnSubType = '01';// 固定填写：01
    this.bizType = '000000';// 产品类型，000201：B2C网关支付
    this.accessType = '0';// 0：商户直连接入1：收单机构接入
    this.currencyCode = '156';// 交易币种，币种格式必须为3位代码，境内客户取值：156（人民币） 固定填写：156
    this.frontTransUrl = 'https://gateway.95516.com/gateway/api/frontTransReq.do';// 前台交易请求地址
    this.appTransUrl = 'https://gateway.95516.com/gateway/api/appTransReq.do';// APP交易请求地址
    this.backTransUrl = 'https://gateway.95516.com/gateway/api/backTransReq.do';// 后台交易请求地址
    this.cardTransUrl = 'https://gateway.95516.com/gateway/api/cardTransReq.do';// 后台交易请求地址(若为有卡交易配置该地址)：
    this.queryTransUrl = 'https://gateway.95516.com/gateway/api/queryTrans.do';// 单笔查询请求地址
    this.batchTransUrl = 'https://gateway.95516.com/gateway/api/batchTrans.do';// 批量查询请求地址
    this.TransUrl = 'https://filedownload.95516.com/';// 文件传输类交易地址
    if (option.sandbox) {
      this.frontTransUrl = 'https://gateway.test.95516.com/gateway/api/frontTransReq.do';// 前台交易请求地址
      this.appTransUrl = 'https://gateway.test.95516.com/gateway/api/appTransReq.do';// APP交易请求地址
      this.backTransUrl = 'https://gateway.test.95516.com/gateway/api/backTransReq.do';// 后台交易请求地址
      this.cardTransUrl = 'https://gateway.test.95516.com/gateway/api/cardTransReq.do';// 后台交易请求地址(若为有卡交易配置该地址)：
      this.queryTransUrl = 'https://gateway.test.95516.com/gateway/api/queryTrans.do';// 单笔查询请求地址
      this.batchTransUrl = 'https://gateway.test.95516.com/gateway/api/batchTrans.do';// 批量查询请求地址
      this.TransUrl = 'https://filedownload.test.95516.com/';// 文件传输类交易地址
    }
    this.merId = option.merId;// 测试商户号，已被批准加入银联互联网系统的商户代码
    this.certId = option.certId; // 填写签名私钥证书的Serial Number，生产环境
    this.privateKey = option.privateKey;
    this.publicKey = option.publicKey;
    this.frontUrl = option.frontUrl;// 前台通知地址，前台返回商户结果时使用，例：https://xxx.xxx.com/xxx
    this.backUrl = option.backUrl;// 后台通知地址
    this.termId = option.termId;// 终端号
    if (option.openLog) {
      this.logger = console;
      if (option.logger) {
        this.logger = option.logger;
      }
    } else {
      this.logger = { info: () => {} };
    }
  }

  buildParams(params) {
    let ps = {
      version: this.version,
      encoding: this.encoding,
      signMethod: this.signMethod,
      txnType: this.txnType,
      txnSubType: this.txnSubType,
      bizType: this.bizType,
      accessType: this.accessType,
      backUrl: this.backUrl,
      currencyCode: this.currencyCode,
      merId: this.merId,
      txnTime: moment().format('YYYYMMDDHHmmss'), // 商户发送交易时间，例：20151118100505
      certId: this.certId, // 填写签名私钥证书的Serial Number，该值可通过SDK获取,测试环境
      termId: this.termId,
    };
    ps = Object.assign(ps, params);

    ps = R.filter(R.complement(R.isNil), ps);
    let prestr = Object.keys(ps).sort().map(k => `${k}=${ps[k]}`).join('&');
    prestr = iconv.encode(prestr, 'utf-8');

    // sha1
    const sha1 = crypto.createHash('sha1');
    sha1.update(prestr, 'utf8');
    const ss1 = sha1.digest('hex');

    // 私钥签名
    const sign = crypto.createSign('RSA-SHA1');
    sign.update(ss1);
    const sig = sign.sign(this.privateKey, 'base64');
    ps.signature = sig;
    return ps;
  }

  verify(params) {
    const signature_str = params.signature;
    params = R.omit([ 'signature' ], params);
    let prestr = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    prestr = iconv.encode(prestr, 'utf-8');
    // sha1
    const sha1 = crypto.createHash('sha1');
    sha1.update(prestr);
    const ss1 = sha1.digest('hex');
    // 公钥验签
    const verifier = crypto.createVerify('RSA-SHA1');
    verifier.update(ss1);
    return verifier.verify(this.publicKey, signature_str, 'base64');
  }

  parseResult(str) {
    return str.split('&').map(x => {
      const data = x.split(/=/);
      const key = data[0];
      const remain = data.slice(1);
      const value = isArray(remain) ? remain.join('=') : remain;
      return [ key, value ];
    }).reduce((a, b) => {
      a[b[0]] = b[1];
      return a;
    }, {});
  }

  // 银联二维码支付-二维码消费-被扫
  async microPay(option) {
    let req = {
      txnType: '01',
      txnSubType: '06', // 二维码消费
      channelType: '07', // 05：语音 07：互联网 08：移动
    };
    req = Object.assign(req, option);
    const reqdata = this.buildParams(req);
    this.logger.info('[unipay]', 'microPay req:', JSON.stringify(req));
    const res = await axios.post(this.backTransUrl, querystring.stringify(reqdata));
    const result = this.parseResult(res.data);
    this.logger.info('[unipay]', 'microPay res:', JSON.stringify(result));
    if (!this.verify(result)) throw new Error('Verify Fail');
    return result;
  }

  // 银联二维码支付-二维码消费-撤销
  async revoke(option) {
    let req = {
      txnType: '31',
      txnSubType: '00', // 二维码消费
      channelType: '07', // 05：语音 07：互联网 08：移动
    };
    req = Object.assign(req, option);
    const reqdata = this.buildParams(req);
    this.logger.info('[unipay]', 'revoke req:', JSON.stringify(req));
    const res = await axios.post(this.backTransUrl, querystring.stringify(reqdata));
    const result = this.parseResult(res.data);
    this.logger.info('[unipay]', 'revoke res:', JSON.stringify(result));
    if (!this.verify(result)) throw new Error('Verify Fail');
    return result;
  }

  // 银联二维码支付-二维码消费-退费(退货)
  async refund(option) {
    let req = {
      txnType: '04',
      txnSubType: '00', // 二维码消费
      channelType: '07', // 05：语音 07：互联网 08：移动
    };
    req = Object.assign(req, option);
    const reqdata = this.buildParams(req);
    const res = await axios.post(this.backTransUrl, querystring.stringify(reqdata));
    const result = this.parseResult(res.data);
    if (!this.verify(result)) throw new Error('Verify Fail');
    return result;
  }

  // 银联二维码支付-二维码消费-查询
  async query(option) {
    let req = {
      txnType: '00',
      txnSubType: '00', // 二维码消费
      channelType: '07', // 05：语音 07：互联网 08：移动
    };
    if (option.queryId) req.txnSubType = '02';
    req = Object.assign(req, option);
    const reqdata = this.buildParams(req);
    this.logger.info('[unipay]', 'query req:', JSON.stringify(req));
    const res = await axios.post(this.queryTransUrl, querystring.stringify(reqdata));
    const result = this.parseResult(res.data);
    this.logger.info('[unipay]', 'query res:', JSON.stringify(result));
    if (!this.verify(result)) throw new Error('Verify Fail');
    return result;
  }

  // 银联二维码支付-二维码消费-下载账单
  async downloadBill(option) {
    let req = {
      txnType: '76',
      txnSubType: '01', // 二维码消费
      channelType: '07', // 05：语音 07：互联网 08：移动
      backUrl: '',
      termId: '',
    };
    req = Object.assign(req, option);
    const reqdata = this.buildParams(req);
    this.logger.info('[unipay]', 'downloadBill req:', JSON.stringify(req));
    const res = await axios.post(this.TransUrl, querystring.stringify(reqdata));
    const result = this.parseResult(res.data);
    this.logger.info('[unipay]', 'microPay res:', result.respCode);
    if (!this.verify(result)) throw new Error('Verify Fail');
    return result;
  }

}

module.exports = Unionpay;
