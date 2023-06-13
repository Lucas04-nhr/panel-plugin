import a from "../model/tools.js"

let { resource, MiaoPath, BackupMiaoPath } = a.getConfig("path")
let { redisStart, errorTIP, pluginINFO } = a.getConfig("info")
let { backupMiao } = a.getConfig("settings")

import fs from "fs"
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
                    fnc: 'compate_query'
                },
            ]
        })
    }
    async compate_all() {
        //TODO:统计
        let list = fs.readdirSync(MiaoPath)
        for (let i in list) {
            this.compate(list[i].replace(".json", ""))
        }
    }
    async compate_query() {
        let uid = await this.e.msg.match(/\d+/g)
        let qq = await this.e.user_id
        if (!uid) {
            //如果uid为空，即未输入uid。根据发言人QQ判断其uid，查找失败提示。
            uid = await a.findUID(qq)
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
                        // console.log(result.avatars[i].artis[j])
                        //如果是旧版圣遗物数据，则进行调整。
                        //先处理主词条
                        docker.mainId = attr_map[docker.main.key][0][0]
                        //TODO:再处理副词条
                        let list = []
                        let error = undefined
                        if (docker.star > 2) {
                            //一般都是四挡，除非3星都不到。
                            let list = []
                            //list用于记录副词条分布。元素格式：[key,value,dn,more]
                            //key:attrId只差最后一位
                            //value:具体多少词条(1.0档位)
                            //dn:至少几个词条
                            //more:还能多几个词条
                            for (let k in docker.attrs) {
                                let { key, value } = docker.attrs[k]
                                if (!key) {
                                    //没内容填空
                                    list.push([0, 0, 0, 0])
                                    continue;
                                }
                                //该词条非空，可以录入该词条非空，可以录入attrIds
                                value = Number((value / attr_map[key][docker.star]).toFixed(1))
                                if (!value) continue
                                key = docker.star + attr_map[key][0][1]
                                //TODO：判断有几个词条是合理的。
                                let dn = Math.ceil(value)
                                //最低不会比词条数还低
                                let up = Math.floor(value / 0.7)
                                //最高不会比词条数/0.7还高
                                if (up > 6 || up < dn) {
                                    error = `在UID${uid}的面板文件中出现了不可能存在的词条数故跳过该圣遗物，怀疑是星级不合理导致的。\n对应圣遗物是` + logger.red(`星级为${docker.star}的${docker.name}`) + `。请在游戏中检查该用户的${result.avatars[i].name}穿戴的${docker.name}是不是${docker.star}星圣遗物。如果是，请提交issue。`
                                    break
                                }
                                list.push([key, value, dn, up - dn])
                            }
                            if (list[3][1] == 0) console.log(list)

                        } else {
                            //TODO:二三档圣遗物([0.8,1.0],[0.7,0.85,1.0])
                        }
                        if (error) {
                            console.log(pluginINFO + error)
                            break
                        }
                        docker.attrIds = list
                        //最后删除旧的主副词条
                        delete docker.main
                        delete docker.attrs
                        //调整完毕，赋值。
                        result.avatars[i].artis[j] = docker
                        // console.log(result.avatars[i].artis[j])
                    }
                }
            }
            //TODO：测试完毕释放下行
            //fs.writeFileSync(target,JSON.stringify(result))
            return true
        } catch (e) {
            console.log(logger.red(pluginINFO + `UID${uid}报错：\n` + e))
            return `\n${pluginINFO}在处理UID${uid}的数据时：\n${logger.red(e)}`
        }
    }
}