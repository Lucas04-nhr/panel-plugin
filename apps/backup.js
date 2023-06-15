import a from "../model/tools.js"

let { MiaoPath, GspanelPath, BackupMiaoPath, BackupGspanelPath } = a.getConfig("path")
let { pluginINFO } = a.getConfig("info")
let b = a.getConfig("settings")

let miao = [BackupMiaoPath, MiaoPath]
let py = [BackupGspanelPath, GspanelPath]
let isMiao = "喵喵|miao"
let isPy = "(p|P)(y|Y)|(G|g)spanel"
let match = `(${isMiao}|${isPy})?(面板|备份)+`
let all = "(全部|所有|all)"
let clean = "(删除|清空|erase)"

export class backup extends plugin {
    constructor() {
        super({
            name: '备份',
            event: 'message',
            priority: -233,
            rule: [
                {
                    reg: `^#?(${clean}|恢复|备份)${all}?${match}$`,
                    fnc: 'do_backup',
                },
                {
                    reg: `^#?(打开|开启|关闭)(${all}|${isMiao}|${isPy})?(自动)?备份$`,
                    fnc: 'set_backup',
                    permission: 'master'
                },
            ]
        })
    }
    async set_backup(e) {
        let say = this.e.msg
        let command = [true, true]
        //command:是否对miao/gspanel设置项进行操作
        if (say.match(isPy))
            command[0] = false
        else if (say.match(isMiao)) {
            command[1] = false
        }
        let close = false
        if (say.match("关闭")) close = true

        let redo = [(b.backupMiao ^ close) && command[0], (b.backupGspanel ^ close) && command[1]]
        if (redo[0] && redo[1]) {
            this.reply(`喵喵自动备份和PY自动备份本就是${close ? "关闭" : "开启"}状态啦，不需要设置哦`)
            return false
        }
        let reply = ""
        if (redo[0]) {
            reply = `喵喵自动备份本就是${close ? "关闭" : "开启"}状态啦，不需要设置哦~\n`
            command[0] = false
        }
        else if (redo[1]) {
            reply = `PY自动备份本就是${close ? "关闭" : "开启"}状态啦，不需要设置哦~\n`
            command[1] = false
        }
        if (command[0] || command[1]) {
            let list = []
            let c = []
            if (command[0]) {
                b.backupMiao = !close
                list.push("喵喵")
                c.push("#清空所有喵喵备份")
            }
            if (command[1]) {
                b.backupGspanel = !close
                list.push("PY")
                c.push("#清空所有PY备份")
            }
            list = list.join("、")
            c = c.join("\n")
            reply += close ? `已关闭${list}自动备份，如不需要过去的备份数据请发送\n${c}` : `已打开${list}自动备份~在操作${list}面板时会进行备份`
            reply += "\n请手动重启已确保设置生效~ "
            fs.writeFileSync("plugins/panel-plugin/config/settings.json", JSON.stringify(b))
        }
        this.reply(reply)
    }

    async do_backup(e) {
        //1.确定路径
        let say = this.e.msg
        let path = miao
        if (say.match(isPy)) {
            path = py
        }
        //2.确定操作
        let method = this.copy
        if (say.match(clean)) {
            method = this.erase
        }
        else if (!say.match("恢复")) {
            path = [path[1], path[0]]
        }
        //3.判断操作范围并执行
        if (say.match(all)) {
            //如果请求对所有内容进行操作，那就需要判断请求者是不是bot主人。
            if (this.e.isMaster) {
                //对全部内容进行操作
                let list = fs.readdirSync(path[0])
                let start = await new Date().getTime()
                for (let i in list) {
                    method(list[i], path)
                    if (!(i % 20)) console.log(`${pluginINFO}当前进度：${i}/${list.length}，用时${(await new Date().getTime() - start) / 1000}s`)
                }
                this.reply("我滴任务！完成啦！")
            } else
                this.reply("但是我拒绝！")
        } else {
            //如果请求对单个内容进行操作，那就需要判断请求者的UID。
            let qq = await this.e.user_id
            let uid = await a.findUID(qq)
            let filename = uid + ".json"
            if (fs.existsSync(path[0] + filename))
                method(filename, path)
            else
                this.reply(`本地没有找到UID${uid}的${say.match("恢复|" + clean) ? "备份" : ""}面板数据捏，如果不是你的uid就重新绑定一下哟。`)
        }
    }

    async erase(uid_json, [at]) {
        //TODO

    }

    async copy(uid_json, [from, to]) {
        let file = JSON.stringify(a.getJSON(from + uid_json))
        fs.writeFileSync(to + uid_json, file)
    }

}