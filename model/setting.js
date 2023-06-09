//不清楚适配锅巴需求的代码结构，项目页翻烂了也没看到文档，所以直接照抄的别人的setting.js。我看大伙的setting.js都差不多，应该没啥问题。

import chokidar from 'chokidar'
import fs from 'node:fs'
const _path = process.cwd().replace(/\\/g, '/')
class Setting {
    constructor() {
        this.configPath = `${_path}/plugins/panel-plugin/config/`
        this.config = {}
        this.watcher = { config: {} }
    }
    merge() {
        let sets = {}
        let appsConfig = fs.readdirSync(this.configPath).filter(file => file.endsWith(".json"));
        for (let appConfig of appsConfig) {
            let filename = appConfig.replace(/.json/g, '').trim()
            sets[filename] = this.getConfig(filename)
        }
        return sets
    }
    analysis(config) {
        for (let key of Object.keys(config)) {
            this.setConfig(key, config[key])
        }
    }
    getData(path, filename) {
        path = `${this.dataPath}${path}/`
        try {
            if (!fs.existsSync(`${path}${filename}.json`)) { return }
            return JSON.parse(fs.readFileSync(`${path}${filename}.json`, 'utf8'))
        } catch (error) {
            logger.error(`[${filename}] 读取失败 ${error}`)
            return false
        }
    }
    setData(path, filename, data) {
        path = `${this.dataPath}${path}/`
        try {
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path, { recursive: true });
            }
            fs.writeFileSync(`${path}${filename}.json`, JSON.stringify(data), 'utf8')
        } catch (error) {
            logger.error(`[${filename}] 写入失败 ${error}`)
            return false
        }
    }
    getconfigSet(app) {
        return this.getJson(app, 'config')
    }
    getConfig(app) {
        return { ...this.getconfigSet(app), ...this.getJson(app, 'config') }
    }
    setConfig(app, Object) {
        return this.setJson(app, 'config', { ...this.getconfigSet(app), ...Object })
    }
    setJson(app, type, Object) {
        let file = this.getFilePath(app, type)
        try {
            fs.writeFileSync(file, JSON.stringify(Object), 'utf8')
        } catch (error) {
            logger.error(`[${app}] 写入失败 ${error}`)
            return false
        }
    }
    getJson(app, type) {
        let file = this.getFilePath(app, type)
        if (this[type][app]) return this[type][app]
        try {
            this[type][app] = JSON.parse(fs.readFileSync(file, 'utf8'))
        } catch (error) {
            logger.error(`[${app}] 格式错误 ${error}`)
            return false
        }
        this.watch(file, app, type)
        return this[type][app]
    }
    getFilePath(app, type) {
        if (type === 'config') return `${this.configPath}${app}.json`
        else {
            try {
                if (!fs.existsSync(`${this.configPath}${app}.json`)) {
                    fs.copyFileSync(`${this.configPath}${app}.json`, `${this.configPath}${app}.json`)
                }
            } catch (error) {
                logger.error(`缺失默认文件[${app}]${error}`)
            }
            return `${this.configPath}${app}.json`
        }
    }
    watch(file, app, type = 'config') {
        if (this.watcher[type][app]) return

        const watcher = chokidar.watch(file)
        watcher.on('change', path => {
            delete this[type][app]
            logger.mark(`[插件][修改配置文件][${type}][${app}]`)
            if (this[`change_${app}`]) {
                this[`change_${app}`]()
            }
        })
        this.watcher[type][app] = watcher
    }
}
export default new Setting()