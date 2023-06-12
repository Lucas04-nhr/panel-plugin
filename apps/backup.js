import a from "../model/tools.js"
import fs from "fs"

let { MiaoPath, GspanelPath, BackupMiaoPath, BackupGspanelPath } = a.getConfig("path")
let { pluginINFO } = a.getConfig("info")

let miao = [BackupMiaoPath, MiaoPath]
let py = [BackupGspanelPath, GspanelPath]
let isPy = "(p|P)(y|Y)|(G|g)spanel"
let match = `(喵喵|miao|${isPy})?(面板|备份)+`
let all = "(全部|所有|all)"
let clean = "(删除|清空|erase)"

export class backup extends plugin {
    constructor() {
        super({
            name: '备份',
            event: 'message',
            priority: -233,
            rule: [
                //暂处测试阶段，建议不要使用此处命令。
                {
                    reg: `^#?(${clean}|恢复|备份)${all}?${match}$`,
                    fnc: 'do_backup',
                },
            ]
        })
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
        let warning = false
        if (say.match(clean)) {
            method = this.erase
            if (!say.match("备份")) {
                //尝试删除非备份的面板数据，需要警告确认
                warning = "你正在尝试删除本地面板数据\n如果你很清楚你在做什么请回复“是”继续，回复其他任何内容取消。"
                path = [path[1], path[0]]
            }
        }
        else if (!say.match("恢复")) {
            path = [path[1], path[0]]
        }

        if (warning) {
            this.reply(warning)
            let will = this.setContext('ask')
            console.log(will)
            if (!will) return false
            console.log("我超")
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
            //TODO:uid
            let filename = uid + ".json"
            if (fs.existsSync(path[0] + filename))
                method(filename, path)
            else
                this.reply(`本地没有找到UID${uid}的${say.match("恢复|" + clean) ? "备份" : ""}面板数据捏，如果不是你的uid就重新绑定一下哟。`)
        }
    }

    async ask() {
        if (/^是$/.test(this.e.msg)) {
            console.log("寄")
            return true
        }
        this.reply("好的喵，已取消操作。")
        this.finish('ask')

        return false
    }

    async do_it() {

    }

    async erase(uid_json, [at]) {
        //TODO
        console.log("yes")
        console.log(ori_path)
    }

    async copy(uid_json, [from, to]) {
        let file = JSON.stringify(a.getJSON(from + uid_json))
        fs.writeFileSync(to + uid_json, file)
    }

}