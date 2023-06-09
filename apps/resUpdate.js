import YAML from 'yaml'

let { resource, MiaoResourecePath, GenshinDataRepoDownload } = getJSON("plugins/panel-plugin/config/path.json")
let { pluginINFO } = getJSON("plugins/panel-plugin/config/info.json")


export class resUpdate extends plugin {
    constructor() {
        super({
            name: '面板资源更新',
            event: 'message',
            priority: -233,
            rule: [
                //以下命令都是尝试主动更新数据，如果你没有遇到BUG请不要尝试发送以下命令(以免bug)
                {
                    reg: '^#?武器数据更新$',
                    fnc: 'weaponUpdate',
                    permission: 'master'
                },
                {
                    reg: '^#?主角命座更新$',
                    fnc: 'playerUpdate',
                    permission: 'master'
                },
                {
                    reg: '^#?属性映射更新$',
                    fnc: 'attrUpdate',
                    permission: 'master'
                },
                {
                    reg: '^#?圣遗物套装更新$',
                    fnc: 'relicUpdate',
                    permission: 'master'
                },
                {
                    reg: '^#?圣遗物主词条更新$',
                    fnc: 'relicMainUpdate',
                    permission: 'master'
                },
                {
                    reg: '^#?面板路径更新$',
                    fnc: 'updateGspanelPath',
                    permission: 'master'
                },
            ]
        })
    }

    async weaponUpdate() {
        //#武器数据更新
        //数据来源：https://gitlab.com/Dimbreath/AnimeGameData/-/blob/master/ExcelBinOutput/WeaponExcelConfigData.json
        let TimeStart = await new Date().getTime()
        try {
            await download(GenshinDataRepoDownload, "WeaponExcelConfigData.json")
            let TimeDownload = await new Date().getTime()
            console.log(pluginINFO.concat(`下载完成！用时${TimeDownload - TimeStart}ms`))

            let temp = resource.concat("WeaponExcelConfigData.json")
            let ori = getJSON(temp)
            let WeaponID_To_IconName = await {}
            for (let i in ori) {
                WeaponID_To_IconName[ori[i].id] = ori[i].icon
            }
            fs.writeFileSync(resource.concat(`WeaponID_To_IconName.json`), JSON.stringify(WeaponID_To_IconName))
            let FileSize = fs.statSync(temp).size
            fs.rmSync(temp)
            let TimeEnd = await new Date().getTime()
            this.reply(`成功更新武器图标数据~\n本次更新总计用时${TimeEnd - TimeStart}ms~\n其中下载资源花费${TimeDownload - TimeStart}ms~\n为避免空间浪费删除了非必要文件：\nWeaponExcelConfigData.json\n文件大小${(FileSize / 1024).toFixed(2)}KB`)
        } catch (e) {
            console.log(pluginINFO.concat(e))
            let TimeEnd = await new Date().getTime()
            this.reply(`更新失败了呜呜呜，请检查后台日志确认原因。用时${TimeEnd - TimeStart}ms`)
        }
    }
    async playerUpdate() {
        //#主角命座更新
        //数据来源：https://gitlab.com/Dimbreath/AnimeGameData/-/blob/master/ExcelBinOutput/AvatarTalentExcelConfigData.json
        let TimeStart = await new Date().getTime()
        try {
            await download(GenshinDataRepoDownload, "AvatarTalentExcelConfigData.json")
            let TimeDownload = await new Date().getTime()
            console.log(pluginINFO.concat(`下载完成！用时${TimeDownload - TimeStart}ms`))
            let ori = getJSON(resource.concat("AvatarTalentExcelConfigData.json"))
            //如果版本有更新，需要手动维护后续元素映射transElem。
            let Temp_PlayerElem_To_ConsIconName = { "风": [], "岩": [], "雷": [], "草": [], "水": [], "火": [], "冰": [] }
            let transElem = { "915": "风", "917": "岩", "914": "雷", "913": "草" }
            for (let i in ori) {
                if (ori[i].mainCostItemId > 1000) continue
                let element = transElem[ori[i].mainCostItemId]
                Temp_PlayerElem_To_ConsIconName[element].push(ori[i].icon)
            }
            fs.writeFileSync(resource.concat("PlayerElem_To_ConsIconName.json"), JSON.stringify(Temp_PlayerElem_To_ConsIconName))
            let FileSize = fs.statSync(resource.concat("AvatarTalentExcelConfigData.json")).size
            fs.rmSync(resource.concat("AvatarTalentExcelConfigData.json"))
            let TimeEnd = await new Date().getTime()
            this.reply(`成功更新主角命座图标数据~\n本次更新总计用时${TimeEnd - TimeStart}ms~\n其中下载资源花费${TimeDownload - TimeStart}ms~\n为避免空间浪费删除了非必要文件：\nAvatarTalentExcelConfigData.json\n文件大小${(FileSize / 1024).toFixed(2)}KB`)
        } catch (e) {
            console.log(pluginINFO.concat(e))
            let TimeEnd = await new Date().getTime()
            this.reply(`更新失败了呜呜呜，请检查后台日志确认原因。用时${TimeEnd - TimeStart}ms`)
        }
    }
    async attrUpdate() {
        //#属性映射更新
        //数据来源：https://gitee.com/yoimiya-kokomi/miao-plugin/blob/master/resources/meta/artifact/meta.js
        let TimeStart = await new Date().getTime()
        try {
            let { mainIdMap, attrIdMap } = await import("../../miao-plugin/resources/meta/artifact/meta.js")
            let ori = {
                ...mainIdMap,
                ...attrIdMap
            }
            for (let i in ori) try {
                if (ori[i].key.search(/Plus|mastery/g) == -1) {
                    //如果value是百分数，为了格式统一将其扩大为100倍
                    ori[i].value = Number((Number(ori[i].value) * 100).toFixed(5))
                } else {
                    ori[i].value = Number((Number(ori[i].value)).toFixed(5))
                }
            } catch (e) { }
            fs.writeFileSync(resource.concat("attr_map.json"), JSON.stringify(ori))
            let TimeEnd = await new Date().getTime()
            this.reply(`成功更新属性映射数据~\n本次更新总计用时${TimeEnd - TimeStart}ms~`)
        } catch (e) {
            console.log(pluginINFO.concat(e))
            let TimeEnd = await new Date().getTime()
            this.reply(`更新失败了呜呜呜，请检查后台日志确认原因。用时${TimeEnd - TimeStart}ms`)
        }
    }
    async relicUpdate() {
        //#圣遗物套装更新
        //中文数据来源：https://gitee.com/yoimiya-kokomi/miao-plugin/blob/master/resources/meta/artifact/data.json
        //圣遗物属性数据来源：https://gitee.com/yoimiya-kokomi/miao-plugin/blob/master/resources/meta/artifact/calc.js
        //圣遗物id数据来源：https://gitlab.com/Dimbreath/AnimeGameData/-/blob/master/ExcelBinOutput/ReliquaryCodexExcelConfigData.json
        let TimeStart = await new Date().getTime()
        try {
            let data_chs
            try {
                data_chs = getJSON(MiaoResourecePath.concat("artifact/data.json"))
            } catch (emiao) {
                console.log(pluginINFO.concat(emiao))
                let TimeEnd = await new Date().getTime()
                this.reply(`更新失败，推测原因为未正确安装喵喵插件或未正确配置本js插件。请检查后台日志确认详细原因。\n用时${TimeEnd - TimeStart}ms`)
                return false
            }
            let TimeStartDownload = await new Date().getTime()
            await download(GenshinDataRepoDownload, "ReliquaryCodexExcelConfigData.json")
            let TimeDownload = await new Date().getTime()
            console.log(pluginINFO.concat(`下载完成！用时${TimeDownload - TimeStartDownload}ms`))
            let ori = getJSON(resource.concat("ReliquaryCodexExcelConfigData.json"))
            let capId_to_suitId = await {}
            for (let i in ori) {
                capId_to_suitId["n" + ori[i].capId] = ori[i].suitId
            }
            ori = fs.readFileSync(MiaoResourecePath.concat("artifact/calc.js")).toString().replaceAll(`'`, `"`).replaceAll(`Pct`, ``)
            let relic = await {}

            let trans = {
                //属性翻译，用于圣遗物词条。
                "hpPlus": "生命值", "hp": "生命值百分比", "atkPlus": "攻击力", "atk": "攻击力百分比", "defPlus": "防御力", "def": "防御力百分比", "recharge": "充能效率", "mastery": "元素精通", "cpct": "暴击率", "cdmg": "暴击伤害", "heal": "治疗加成", "pyro": "火伤加成", "electro": "雷伤加成", "cryo": "冰伤加成", "hydro": "水伤加成", "anemo": "风伤加成", "geo": "岩伤加成", "dendro": "草伤加成", "phy": "物伤加成",
            }

            for (let i in data_chs) {
                let set = await data_chs[i].sets
                for (let j in set) {
                    //录入：圣遗物名称→套装名称
                    relic[set[j].name] = data_chs[i].name
                }
                let SetID = capId_to_suitId[set[5].id]
                //录入：套装名称→套装id
                relic[data_chs[i].name] = SetID
                let start = ori.indexOf(data_chs[i].name)
                let end = ori.indexOf(")", start)
                let SetEffect = ori.substring(start, end)
                if (SetEffect.includes("attr(")) {
                    //如果有需要考虑的套装效果再执行。由于所考虑的套装都是二件套，所以内容不再塞入生效套装数量，只存放属性名和数值
                    start = SetEffect.indexOf("attr(") + 5
                    SetEffect = JSON.parse(`[${SetEffect.substring(start)}]`)
                    if (SetEffect[0] == "shield") continue
                    if (SetEffect[0] == "dmg") {
                        SetEffect[0] = SetEffect[2].concat("元素伤害加成")
                    } else {
                        if (SetEffect[0] == "phy") {
                            SetEffect[0] = "物理伤害加成"
                        } else {
                            if (SetEffect[0] == "recharge") {
                                SetEffect[0] = "元素充能效率"
                            } else {
                                let t = trans[SetEffect[0]]
                                if (t) {
                                    SetEffect[0] = t
                                } else {
                                    console.log(pluginINFO.concat(SetEffect[2]))
                                }
                            }
                        }
                    }
                    SetEffect = await [SetEffect[0], SetEffect[1]]
                    //录入：套装id→套装效果
                    relic[SetID] = SetEffect
                }
            }
            let FileSize = fs.statSync(resource.concat("ReliquaryCodexExcelConfigData.json")).size
            fs.rmSync(resource.concat("ReliquaryCodexExcelConfigData.json"))
            fs.writeFileSync(resource.concat("dataRelicSet.json"), JSON.stringify(relic))
            let TimeEnd = await new Date().getTime()
            this.reply(`成功更新圣遗物套装数据~\n本次更新总计用时${TimeEnd - TimeStart}ms~\n其中下载资源花费${TimeDownload - TimeStartDownload}ms~\n为避免空间浪费删除了非必要文件：\nReliquaryCodexExcelConfigData.json\n文件大小${(FileSize / 1024).toFixed(2)}KB`)
        } catch (e) {
            console.log(pluginINFO.concat(e))
            let TimeEnd = await new Date().getTime()
            this.reply(`更新失败了呜呜呜，请检查后台日志确认原因。用时${TimeEnd - TimeStart}ms`)
        }
    }
    async relicMainUpdate() {
        //#圣遗物主词条更新
        //数据来源：https://gitlab.com/Dimbreath/AnimeGameData/-/blob/master/ExcelBinOutput/ReliquaryLevelExcelConfigData.json
        let TimeStart = await new Date().getTime()
        try {
            await download(GenshinDataRepoDownload, "ReliquaryLevelExcelConfigData.json")
            let TimeDownload = await new Date().getTime()
            console.log(pluginINFO.concat(`下载完成！用时${TimeDownload - TimeStart}ms`))
            let ori = getJSON(resource.concat("ReliquaryLevelExcelConfigData.json"))
            let translate = {
                //如有新增主属性请手动添加
                "FIGHT_PROP_HP": "hpPlus",
                "FIGHT_PROP_HP_PERCENT": "hp",
                "FIGHT_PROP_ATTACK": "atkPlus",
                "FIGHT_PROP_ATTACK_PERCENT": "atk",
                "FIGHT_PROP_DEFENSE": "defPlus",
                "FIGHT_PROP_DEFENSE_PERCENT": "def",
                "FIGHT_PROP_CRITICAL": "cpct",
                "FIGHT_PROP_CRITICAL_HURT": "cdmg",
                "FIGHT_PROP_CHARGE_EFFICIENCY": "recharge",
                "FIGHT_PROP_HEAL_ADD": "heal",
                "FIGHT_PROP_ELEMENT_MASTERY": "mastery",
                "FIGHT_PROP_FIRE_ADD_HURT": "pyro",
                "FIGHT_PROP_ELEC_ADD_HURT": "electro",
                "FIGHT_PROP_WATER_ADD_HURT": "hydro",
                "FIGHT_PROP_WIND_ADD_HURT": "anemo",
                "FIGHT_PROP_ROCK_ADD_HURT": "geo",
                "FIGHT_PROP_GRASS_ADD_HURT": "dendro",
                "FIGHT_PROP_ICE_ADD_HURT": "cryo",
                "FIGHT_PROP_PHYSICAL_ADD_HURT": "phy",
                "FIGHT_PROP_FIRE_SUB_HURT": "SKIP"
            }
            let result = {
                //如有新增主属性请手动添加
                "hpPlus": [[], [], [], [], [], []], "hp": [[], [], [], [], [], []], "atkPlus": [[], [], [], [], [], []], "atk": [[], [], [], [], [], []], "defPlus": [[], [], [], [], [], []], "def": [[], [], [], [], [], []], "recharge": [[], [], [], [], [], []], "mastery": [[], [], [], [], [], []], "cpct": [[], [], [], [], [], []], "cdmg": [[], [], [], [], [], []], "heal": [[], [], [], [], [], []], "pyro": [[], [], [], [], [], []], "electro": [[], [], [], [], [], []], "cryo": [[], [], [], [], [], []], "hydro": [[], [], [], [], [], []], "anemo": [[], [], [], [], [], []], "geo": [[], [], [], [], [], []], "dendro": [[], [], [], [], [], []], "phy": [[], [], [], [], [], []],
            }
            for (let i = 1; i < ori.length; i++) {
                for (let j in ori[i].addProps) {
                    let Effect = ori[i].addProps[j]
                    Effect.propType = translate[Effect.propType]
                    if (Effect.propType == "SKIP") continue
                    if (Effect.value < 1) {
                        //如果value是百分数，为了格式统一将其扩大为100倍
                        Effect.value = Number((Effect.value * 100).toFixed(3))
                    } else {
                        Effect.value = Number(Effect.value.toFixed(3))
                    }
                    result[Effect.propType][ori[i].rank][ori[i].level - 1] = Effect.value
                }
            }
            let FileSize = fs.statSync(resource.concat("ReliquaryLevelExcelConfigData.json")).size
            fs.rmSync(resource.concat("ReliquaryLevelExcelConfigData.json"))
            fs.writeFileSync(resource.concat("dataRelicMain.json"), JSON.stringify(result))
            let TimeEnd = await new Date().getTime()
            this.reply(`成功更新圣遗物主词条数据~\n本次更新总计用时${TimeEnd - TimeStart}ms~\n其中下载资源花费${TimeDownload - TimeStart}ms~\n为避免空间浪费删除了非必要文件：\nReliquaryLevelExcelConfigData.json\n文件大小${(FileSize / 1024).toFixed(2)}KB`)
        } catch (e) {
            console.log(pluginINFO.concat(e))
            let TimeEnd = await new Date().getTime()
            this.reply(`更新失败了呜呜呜，请检查后台日志确认原因。用时${TimeEnd - TimeStart}ms`)
        }
    }
    async updateGspanelPath() {
        //#面板路径更新
        //请不要让路径存在多个"/Yunzai/"
        //仅当路径指定在"/Yunzai/"目录内时有效，其他情况请不要使用此函数
        let py_config_path = "plugins/py-plugin/config.yaml"
        let py_config
        try {
            py_config = YAML.parse(fs.readFileSync(py_config_path, 'utf8'))
        } catch (e) {
            this.reply(`没有发现文件${py_config_path}，可能是你没有正确安装py插件。具体报错可查看后台日志。`)
            logger.error(pluginINFO + e)
            return false
        }
        let py_gspanel_path = py_config.resources_dir
        if (!py_gspanel_path) {
            this.reply(`没有在${py_config_path}找到resources_dir，可能是你没有做配置。`)
            return false
        }

        //安装正确且有指定路径
        let result = py_gspanel_path.indexOf("/Yunzai/")
        if (result == -1) {
            this.reply(`仅当你配置的gspanel路径指定在"/Yunzai/"目录内时有效，其他情况请不要使用此函数，而是根据自己情况来设置！`)
            return false
        }

        //指定路径有Yunzai
        result = py_gspanel_path.substring(result + 8)
        result += "/gspanel/cache/"

        let path_path = "plugins/panel-plugin/config/path.json"
        let cfg = getJSON(path_path)
        cfg.GspanelPath = result
        fs.writeFileSync(path_path, JSON.stringify(cfg))
        this.reply(`成功根据你的py-plugin配置设置了正确的gspanel路径：\n${result}`)
    }
}
async function download(url, filename) {
    //下载必要资源到resource文件夹
    let response = url + filename
    response = await fetch(response)
    response = await response.text()
    fs.writeFileSync(resource + filename, response)
}

function getJSON(url) {
    //获取指定绝对路径的json
    return JSON.parse(fs.readFileSync(url))
}
