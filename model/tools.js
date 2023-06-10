let { resource } = getConfig("path")

function getJSON(url) {
    //获取指定绝对路径的json
    return JSON.parse(fs.readFileSync(url))
}

function getConfig(name) {
    //获取config
    return getJSON(`plugins/panel-plugin/config/${name}.json`)
}

async function download(url, filename) {
    //下载必要资源到resource文件夹
    let response = url + filename
    response = await fetch(response)
    response = await response.text()
    fs.writeFileSync(resource + filename, response)
}


export default {
    getJSON, getConfig, download
}