import a from "../model/tools.js"

let { resource, MiaoPath, GspanelPath, BackupMiaoPath } = a.getConfig("path")
let { redisStart, errorTIP, pluginINFO } = a.getConfig("info")
let { backupMiao } = a.getConfig("settings")

//attr_map:属性id到属性英文的映射
let attr_map = a.getJSON(resource + "attr_map.json")

export class compate extends plugin {
    constructor() {
        super({
            name: '旧面板转新版',
            event: 'message',
            priority: -233,
            rule: [
                {
                    reg: '^#?(兼容|调整)(全部|所有)旧?(喵喵)?面(板|包)$',
                    fnc: 'compate_all',
                    permission: 'master'
                },
                {
                    reg: '^#?(兼容|调整)旧?(喵喵)?面(板|包)(\\d{9})?$',
                    fnc: 'compate_query',
                    permission: 'master'
                },
            ]
        })
    }
    async compate_all() {
        //TODO
    }
    async compate_query() {
        let uid = await this.e.msg.match(/\d+/g)
        let qq = await this.e.user_id
        if (!uid) {
            //如果uid为空，即未输入uid。根据发言人QQ判断其uid，查找失败提示。
            uid = await this.findUID(qq)
            if (!uid) {
                //如果uid为空，即redis没有绑定数据
                this.reply("哎呀！你好像没有绑定原神uid呢！发送“#绑定123456789”来绑定你的原神uid！")
                return false
            }
        } else {
            uid = uid[0]
        }
        if (!fs.existsSync(MiaoPath + uid + ".json")) {
            this.reply("没有面板数据是不可以调整的！发送“#更新面板”来更新面板数据~")
            return false
        }

        let result = await this.compate(uid)
        if (result == true) this.reply(`成功调整UID${uid}的面板数据~\n旧的面板数据都转换为了新版本支持的格式`)
        else this.reply(`调整UID${uid}的面板数据失败了orz，报错信息：\n${result}`)

    }
    async compate(uid) {
        try {
            let target = MiaoPath + uid + ".json"
            let result = a.getJSON(target)
            let old = BackupMiaoPath + uid + ".json"
            if (backupMiao && !fs.existsSync(old)) {
                //如果没有备份且需要备份，则进行一次备份。
                fs.writeFileSync(old, JSON.stringify(result))
            }
            for (let i in result.avatars) {
                for (let j in result.avatars[i].artis) {
                    let docker = result.avatars[i].artis[j]
                    if (docker.main) {
                        console.log(result.avatars[i].artis[j])
                        //如果是旧版圣遗物数据，则进行调整。
                        //主词条
                        docker.mainId = attr_map[docker.main.key][0]
                        delete docker.main
                        //TODO:副词条

                        //调整完毕，赋值。
                        result.avatars[i].artis[j] = docker
                        console.log(result.avatars[i].artis[j])
                    }
                }
            }
            //TODO：测试完毕释放下行
            //fs.writeFileSync(target,JSON.stringify(result))
            return true
        } catch (e) {
            console.log(logger.red(`${pluginINFO}UID${uid}报错：\n${e}`))
            return `\n${pluginINFO}在处理UID${uid}的数据时：\n${logger.red(e)}`
        }
    }
    async findUID(QQ) {
        //根据QQ号判断对应uid，返回null表示没有对应uid。
        let uid = await redis.get(redisStart + QQ)
        return uid
    }
}