//如果你手贱关闭了自动备份，有可能会需要该功能。发送#修复全部面板bug
//作用是将所有以5结尾的attrIds换为以4结尾的(5结尾不应当存在)
import a from "../model/tools.js"

let { MiaoPath } = a.getConfig("path")
let { pluginINFO } = a.getConfig("info")
export class fix extends plugin {
    constructor() {
        super({
            name: 'bug修复',
            event: 'message',
            priority: -233,
            rule: [
                {
                    reg: '^#修复全部面板bug$',
                    fnc: 'fix_all',
                    permission: 'master'
                },
            ]
        })
    }
    async fix_all() {
        let list = fs.readdirSync(MiaoPath)
        let count = 0
        for (let i in list) {
            let should_fix = false
            let result = a.getJSON(MiaoPath + list[i])
            for (let j in result.avatars) {
                for (let k in result.avatars[j].artis) {
                    for (let l in result.avatars[j].artis[k].attrIds) {
                        let t = result.avatars[j].artis[k].attrIds[l]
                        if (t % 10 > 4) {
                            should_fix = true
                            console.log(pluginINFO + `定位到${list[i]}的${result.avatars[j].name}的圣遗物信息存在错误，即将修复：\n修复前：`)
                            console.log(result.avatars[j].artis[k])
                            // console.log(result.avatars[j].artis[k].attrIds[l])
                            result.avatars[j].artis[k].attrIds[l] -= t % 10 - 4
                            console.log("\n修复后：")
                            console.log(result.avatars[j].artis[k])
                        }
                    }
                }
            }
            if (should_fix) {
                count++
                fs.writeFileSync(MiaoPath + list[i], JSON.stringify(result))
                console.log(pluginINFO + `已修复${list[i]}！\n\n`)
            }
        }
        if (!count) {
            this.reply("本地没有任何面板出现圣遗物信息错误喵。")
        } else {
            this.reply(`本地总计${count}个面板出现圣遗物信息错误喵，已修复。以防万一，建议进行一次重启。`)
        }
    }
}