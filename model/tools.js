let { resource } = getConfig("path")
let { redisStart } = getConfig("info")
function getJSON(url) {
    //获取指定绝对路径的json
    return JSON.parse(fs.readFileSync(url))
}

function getConfig(name) {
    //获取config
    return getJSON(`plugins/panel-plugin/config/${name}.json`)
}

function getHtml(name) {
    //获取html相关设置
    return getJSON(`plugins/panel-plugin/resources/html/config/${name}.json`)
}

async function download(url, filename) {
    //下载必要资源到resource文件夹
    let response = url + filename
    response = await fetch(response)
    response = await response.text()
    fs.writeFileSync(resource + filename, response)
}
async function findUID(QQ) {
    //根据QQ号判断对应uid，返回null表示没有对应uid。
    let uid = await redis.get(redisStart + QQ)
    return uid
}

export default {
    getJSON, getConfig, getHtml, download, findUID
}