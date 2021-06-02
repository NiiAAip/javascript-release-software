const core = require('@actions/core');
const github = require('@actions/github');
const exec = require("@actions/exec");
const toolCache = require("@actions/tool-cache");
const path = require("path");
const fs = require('fs');
const crypto = require('crypto');
const requestSync = require('sync-request');

const url = "http://gosspublic.alicdn.com/ossutil/1.6.7/ossutil64";

async function main() {
    var file_path = core.getInput('args');
    var ota_server_url = core.getInput('ota_server_url');
    var ota_server_user = core.getInput('ota_server_user');
    var ota_server_pwd = core.getInput('ota_server_pwd');
    var ota_software_token = core.getInput('ota_software_token');
    var aliyun_oss_endpoint = core.getInput('aliyun_oss_endpoint');
    var aliyun_access_id = core.getInput('aliyun_access_id');
    var aliyun_access_secret = core.getInput('aliyun_access_secret');
    var aliyun_oss_url = core.getInput('aliyun_oss_url');

    let toolPath = toolCache.find("ossutil", "1.6.7");
    if (!toolPath) {
        core.info(`downloading from ${url}`);
        toolPath = await toolCache.downloadTool(url);
        core.info(`downloaded to ${toolPath}`);
    }
    const bin = path.join(__dirname, ".bin");
    if (!fs.existsSync(bin)) {
        fs.mkdirSync(bin, {
            recursive: true
        });
    }
    fs.copyFileSync(toolPath, path.join(bin, "ossutil"));
    fs.chmodSync(path.join(bin, "ossutil"), 0o755);
    core.addPath(bin);
    await exec.exec("ossutil", [
        "config",
        "-e",
        aliyun_oss_endpoint,
        "-i",
        aliyun_access_id,
        "-k",
        aliyun_access_secret,
        "-L",
        "CH"
    ]);
    var exitCode = await exec.exec("ossutil", [
        "cp",
        "-rf",
        file_path,
        aliyun_oss_url
    ]);
    console.log(exitCode);
    if(exitCode != 0) {
        core.setFailed("ossutil upload Failed");
        return;
    }
    var array = file_path.match(/[0-9]+\.[0-9]+\.[0-9]+/g);
    var VERSION = array ? array[0] : "0.0.0"
    var MD5 = crypto.createHash('md5').update(fs.readFileSync(file_path), 'utf8').digest('hex');
    var JOB_ID = +new Date() / 1000;
    var PATH_ = core.getInput('aliyun_oss_url') + path.basename(file_path);

    var RESULT = `{
        "Version": "${VERSION}",
        "Job-ID": ${JOB_ID},
        "MD5": "${MD5}",
        "Release-Note": "",
        "Path": "${PATH_}",
        "Path2": "",
        "Path3": ""
    }`;
    console.log(RESULT)
    var form_data = {
        headers: { 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
        body: `'------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"username\"\r\n\r\n${ota_server_user}\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"password\"\r\n\r\n${ota_server_pwd}\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--'`
    }
    var res = requestSync('POST', ota_server_url + '/login', form_data);
    if (res.statusCode != 200) {
        core.setFailed(res.body.toString());
        return;
    }
    //Get cookies from response
    var responseCookies = res.headers['set-cookie'];
    var requestCookies = '';
    for (var i = 0; i < responseCookies.length; i++) {
        var oneCookie = responseCookies[i];
        oneCookie = oneCookie.split(';');
        requestCookies = requestCookies + oneCookie[0];
        if (i != responseCookies.length - 1) {
            requestCookies += '; '
        }
    }
    var res = requestSync('POST', ota_server_url + '/gitlab-webhook/release/', {
        headers: JSON.parse(`{ "Content-Type": "application/json", "Secret-Token": "${ota_software_token}", "Cookie": "${requestCookies}" }`),
        json: JSON.parse(RESULT)
    });
    if (res.statusCode != 200) {
        core.setFailed(res.body.toString());
        return;
    }
    var res = requestSync('POST', ota_server_url + '/logout', form_data);
}

main().catch(error => {
    core.setFailed(error.message);
});