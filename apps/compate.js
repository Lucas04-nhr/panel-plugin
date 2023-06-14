import a from "../model/tools.js"

let { resource, MiaoPath, BackupMiaoPath } = a.getConfig("path")
let { pluginINFO } = a.getConfig("info")
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
                    fnc: 'compate_query'
                },
            ]
        })
    }
    async compate_all() {
        //TODO:统计
        let list = fs.readdirSync(MiaoPath)
        let start = await new Date().getTime()
        for (let i in list) {
            this.compate(list[i].replace(".json", ""))
            if (!(i % 20)) console.log(`${pluginINFO}当前进度：${i}/${list.length}，用时${(await new Date().getTime() - start) / 1000}s`)
        }
        this.reply("完成全部处理~请尽快进行一次重启，否则请求面板时会导致兼容处理失效。")
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
                        if (typeof (docker.level) != "number") {
                            //level被人为修改过，为避免届时无法计算主词条，默认为对应星级的满级。
                            let level = docker.star * 4
                            docker.level = level
                            console.log(pluginINFO + `UID${uid}的${result.avatars[i].name}携带的${docker.name}的等级信息被修改为了文本，为避免后续伴生BUG已将其等级改为${level}`)
                        }
                        docker.mainId = attr_map[docker.main.key][0][0]

                        let list = []
                        let error = undefined
                        if (docker.star > 2) {
                            //一般都是四挡，除非3星都不到。
                            for (let k in docker.attrs) {
                                let { key, value } = docker.attrs[k]
                                if (!key) break;
                                //该词条非空，可以录入该词条非空，可以录入attrIds
                                value = Number((value / attr_map[key][docker.star]).toFixed(1))
                                if (value > 1.0 && value < 1.4 || value < 0.7) {
                                    error = `在UID${uid}的面板文件中出现了不可能存在的词条数故跳过该圣遗物，怀疑是星级不合理导致的。\n对应圣遗物是` + logger.red(`星级为${docker.star}的${docker.name}`) + `。请在游戏中检查该用户的${result.avatars[i].name}穿戴的${docker.name}是不是${docker.star}星圣遗物。如果是请提交issue，请务必附带游戏内截图以及本地文件截图。`
                                    break
                                }
                                key = Number(docker.star + attr_map[key][0][1]) * 10

                                //DELAY:精确强化次数使其合理 
                                let time = Math.round(value / 0.85)
                                //理想情况词条数/0.85就是强化次数+1

                                let left = value * 10 - time * 7
                                //如果按0.7最低档位分配，还差left/10的词条数未分配

                                let level = Math.floor(left / time)
                                //一个一个分配，则至少都是第level+1个档位

                                let overflow = value * 10 - (level + 7) * time
                                //如此分配下来，剩几个0.1就有几个词条是需要再+1档位的

                                left = time - overflow

                                level++
                                while (left--) {
                                    list.push(key + level)
                                }

                                level++
                                while (overflow--) {
                                    list.push(key + level)
                                }


                            }

                        } else {
                            //TODO:二三档圣遗物([0.8,1.0],[0.7,0.85,1.0])

                            error = `暂不支持二星及以下圣遗物的兼容处理。`
                            break
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
                    }
                }
            }
            fs.writeFileSync(target, JSON.stringify(result))
            return true
        } catch (e) {
            console.log(logger.red(pluginINFO + `UID${uid}报错：\n` + e))
            return `\n${pluginINFO}在处理UID${uid}的数据时：\n${logger.red(e)}`
        }
    }
}