import a from "../model/tools.js"

let { resource, MiaoPath, GspanelPath, MiaoResourecePath, BackupGspanelPath } = a.getJSON("plugins/panel-plugin/config/path.json")
let { redisStart, errorTIP, pluginINFO } = a.getJSON("plugins/panel-plugin/config/info.json")

let { backupGspanel } = a.getConfig("settings")

// console.log(MiaoResourecePath.toString())
if (!fs.existsSync(GspanelPath)) {
    logger.error(errorTIP)
}

//char_data_Gspanel:Gspanel面板的所有角色的资料
let char_data_Gspanel = a.getJSON(GspanelPath + "../char-data.json")
//WeaponID_To_IconName:武器ID到图标名称的映射
let WeaponID_To_IconName = a.getJSON(resource + "WeaponID_To_IconName.json")
//PlayerElem_To_ConsIconName:旅行者元素到命座图标的映射
let PlayerElem_To_ConsIconName = a.getJSON(resource + "PlayerElem_To_ConsIconName.json")
//attr_map:属性id到属性英文的映射
let attr_map = a.getJSON(resource + "attr_map.json")
//dataRelicSet:圣遗物名称→套装名称 套装名称→套装id 套装id→套装效果
let dataRelicSet = a.getJSON(resource + "dataRelicSet.json")
//dataRelicMain:圣遗物主词条→[星级→[等级→数值]]
let dataRelicMain = a.getJSON(resource + "dataRelicMain.json")
//部分没必要更新的数据，直接写在这里拿来用了。transElement和trans。
let transElement = {
    "pyro": "火", "hydro": "水", "cryo": "冰", "electro": "雷", "anemo": "风", "geo": "岩", "dendro": "草",
}
let trans = {
    //突破等级
    "Promote": [1, 20, 40, 50, 60, 70, 80, 90],
    //属性翻译，用于武器副词条、突破属性等。
    "hpPct": "生命值百分比", "atkPct": "攻击力百分比", "defPct": "防御力百分比", "dmg": "伤加成",
    //属性翻译，用于圣遗物词条。
    "hpPlus": "生命值", "hp": "生命值百分比", "atkPlus": "攻击力", "atk": "攻击力百分比", "defPlus": "防御力", "def": "防御力百分比", "recharge": "充能效率", "mastery": "元素精通", "cpct": "暴击率", "cdmg": "暴击伤害", "heal": "治疗加成", "pyro": "火伤加成", "electro": "雷伤加成", "cryo": "冰伤加成", "hydro": "水伤加成", "anemo": "风伤加成", "geo": "岩伤加成", "dendro": "草伤加成", "phy": "物伤加成",
    //圣遗物位置→圣遗物id结尾
    "1": 4, "2": 2, "3": 5, "4": 1, "5": 3,
}
export class miaoToGspanel extends plugin {
    constructor() {
        super({
            name: '面板适配',
            event: 'message',
            priority: -233,
            rule: [
                {
                    reg: '^#?转换(全部|所有)(喵喵|PY)?面(板|包)$',
                    fnc: 'M2G_all',
                    permission: 'master'
                },
                {
                    reg: '^#?转换(喵喵|PY)?面(板|包)(\\d{9})?$',
                    fnc: 'M2G_query'
                },
            ]
        })
    }
    async M2G_all() {
        if (!fs.existsSync(GspanelPath)) {
            this.reply(errorTIP)
            return false
        }
        let TimeStart = new Date().getTime()
        let KEYtoUID = await redis.keys(redisStart + "*")
        let qq2uid = a.getJSON(GspanelPath + "../qq-uid.json")
        let ErrorList = []
        let succeed = 0
        let fail = 0
        let empty = 0
        console.log(pluginINFO + `开始转换${KEYtoUID.length}个uid，下面是转换失败的数据对应的uid和报错信息。`)
        if (KEYtoUID.length > 200) this.reply(`redis里存了${KEYtoUID.length}个uid呢，可能要转换半分钟左右哦。`)
        let TimeLastLog = new Date().getTime()
        for (let key of KEYtoUID) {
            let uid = await redis.get(key)
            if (!fs.existsSync(MiaoPath + `${uid}.json`)) {
                empty++
            } else {
                let qq = await key.match(/\d+/g)
                let result = await this.M2G(uid)
                let TimeNow = await new Date().getTime()
                if (TimeNow - TimeLastLog > 300) {
                    //想自己调整日志输出间隔就改上面的if里面的数字，单位ms。
                    console.log(pluginINFO + "成功" + succeed + `${fail ? `个,失败${fail}` : ""}个,进度${succeed + fail + empty}/` + KEYtoUID.length)
                    TimeLastLog = TimeNow
                }
                qq2uid[qq] = uid
                if (result == true) succeed++
                else {
                    fail++
                    ErrorList.push(result)
                }
            }
        }
        await fs.writeFileSync(await GspanelPath.concat("../qq-uid.json"), JSON.stringify(qq2uid))
        let TimeEnd = await new Date().getTime()
        this.reply(`报告主人！本次转换总计统计到${KEYtoUID.length}个uid，其中：\n${succeed ? `成功转换${succeed}个面板数据！` : "我超，所有转换都失败了，牛逼！"}\n${empty ? `没有面板数据的有${empty}个` : "没发现没有面板数据的用户"}！\n${fail ? `转换失败的有${fail}个` : "没有出现转换失败(好耶)"}！\n本次转换总计用时${((TimeEnd - TimeStart) / 1000).toFixed(1)}s~${fail ? "\n为了避免过量信息导致风控，请自行查看后台日志喵~" : ""}`)
        console.log("以下是本次转换的报错信息（如果有的话）\n" + ErrorList)
    }
    async M2G_query() {
        if (!fs.existsSync(GspanelPath)) {
            this.reply(errorTIP)
            return false
        }
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
            this.reply("没有面板数据是不可以转换的！发送“#更新面板”来更新面板数据~")
            return false
        }
        let result = await this.M2G(uid)
        let qq2uid = a.getJSON(GspanelPath + "../qq-uid.json")
        qq2uid[qq] = uid
        fs.writeFileSync(await GspanelPath.concat("../qq-uid.json"), JSON.stringify(qq2uid))
        if (result == true) this.reply(`成功转换UID${uid}的面板数据~`)
        else this.reply(`转换UID${uid}的面板数据失败了orz，报错信息：\n${result}`)
    }
    async M2G(uid) {
        try {
            //调用前已经判断过该uid一定有面板数据，并且所有路径无误，所以接下来就是修改面板数据以适配Gspanel
            //修正面板数据，在对应目录生成文件。返回值表示处理结果(true：转换成功，其他返回值：转换失败。失败时返回报错内容以便查看日志。)
            let Miao = a.getJSON(MiaoPath + uid + ".json")
            let Gspanel = GspanelPath + uid + ".json"
            if (backupGspanel && fs.existsSync(Gspanel)) {
                //如果需要备份且有Gspanel面板
                Gspanel = a.getJSON(Gspanel)
                let target = BackupGspanelPath + uid + ".json"
                if (!fs.existsSync(target)) {
                    //如果没有备份，则进行一次备份。
                    fs.writeFileSync(target, JSON.stringify(Gspanel))
                }
            }
            Gspanel = { "avatars": [], "next": Math.floor(Miao._profile / 1000) }
            for (let i in Miao.avatars) {
                //MiaoChar：喵喵面板的具体一个角色的数据
                let MiaoChar = Miao.avatars[i]
                //如果没有武器数据，则跳过该面板。（这个理论上应该都有啊。。不知道为啥会出现没有武器的我靠）
                if (MiaoChar.weapon.name == undefined) {
                    console.log(pluginINFO + "UID" + uid + MiaoChar.name + `没有武器信息故跳过，以下是他${MiaoChar.name}的武器信息：\n` + MiaoChar.weapon)
                    continue
                }
                //如果数据来源是米游社，那根本就不会有带圣遗物的面板数据，取消执行。Miao的数据似乎有点问题，米游社来源可能误标enka，需要后期检查。
                if (MiaoChar._source == "mys") continue;
                //用参数NoData标记本面板是否有足量数据（具体来讲，是否有圣遗物详情）
                let NoData = null
                //char_Miao：喵喵的具体一个角色的资料
                let char_Miao = a.getJSON(MiaoResourecePath + `character/${MiaoChar.name}/data.json`)
                //result：Gspanel面板的具体一个角色的数据
                let result = {
                    "id": char_Miao.id,
                    "rarity": char_Miao.star,
                    "name": MiaoChar.name,
                    "slogan": char_Miao.title,
                    "element": transElement[MiaoChar.elem],
                    "cons": MiaoChar.cons,
                    "fetter": MiaoChar.fetter,
                    "level": MiaoChar.level,
                    "icon": "UI_AvatarIcon_PlayerBoy",
                    "gachaAvatarImg": "UI_Gacha_AvatarImg_PlayerBoy",
                    "baseProp": {
                        "生命值": 0,
                        "攻击力": 0,
                        "防御力": 0
                    },
                    "fightProp": {
                        "生命值": 0,
                        "攻击力": 0,
                        "防御力": 0,
                        "暴击率": 5,
                        "暴击伤害": 50,
                        "治疗加成": 0,
                        "元素精通": 0,
                        "元素充能效率": 100,
                        "物理伤害加成": 0,
                        "火元素伤害加成": 0,
                        "水元素伤害加成": 0,
                        "风元素伤害加成": 0,
                        "雷元素伤害加成": 0,
                        "草元素伤害加成": 0,
                        "冰元素伤害加成": 0,
                        "岩元素伤害加成": 0
                    },
                    "skills": { "a": { "style": "", "icon": "Skill_A_01", "level": MiaoChar.talent.a, "originLvl": MiaoChar.talent.a }, "e": { "style": "", "icon": "Skill_S_Player_01", "level": MiaoChar.talent.e, "originLvl": MiaoChar.talent.e }, "q": { "style": "", "icon": "Skill_E_Player", "level": MiaoChar.talent.q, "originLvl": MiaoChar.talent.q } }, "consts": [],
                    "weapon": {
                        "id": 114514,
                        "rarity": 1919810,
                        "name": MiaoChar.weapon.name,
                        "affix": MiaoChar.weapon.affix,
                        "level": MiaoChar.weapon.level,
                        "icon": "牛逼啊",
                        "main": 32767,
                        "sub": {
                            "prop":
                                "涩涩之力",
                            "value": "99.9%"
                        }
                    },
                    "relics": [],
                    "relicSet": {},
                    "relicCalc": {
                        "rank": "ACE",
                        "total": 233.3
                    },
                    "damage": {
                        "level": "玩得好就是挂？",
                        "data": [
                            [
                                "普攻第一段伤害",
                                "2147483647",
                                "2147483647"
                            ]
                        ],
                        "buff": [
                            [
                                "大伟哥的注视",
                                "所有伤害都能对怪物造成即死效果，且跳过死亡动画。"
                            ]
                        ]
                    },
                    "time": Math.floor(MiaoChar._time / 1000)
                }

                /**处理技能与命座 */
                if (result.cons >= char_Miao.talentCons.e) {
                    result.skills.e.style = "extra"
                    result.skills.e.level += 3
                }
                if (result.cons >= char_Miao.talentCons.q) {
                    result.skills.q.style = "extra"
                    result.skills.q.level += 3
                }
                if (MiaoChar.id == "10000007" || MiaoChar.id == "10000005") {
                    //主角在Gspanel的char-data.json没有数据！只能单独设置了orz
                    if (MiaoChar.id == "10000007") {
                        //如果是妹妹
                        result.icon = "UI_AvatarIcon_PlayerGirl"
                        result.gachaAvatarImg = "UI_Gacha_AvatarImg_PlayerGirl"
                    }
                    result.consts = [{ "style": "", "icon": PlayerElem_To_ConsIconName[`${result.element}`][0] }, { "style": "", "icon": PlayerElem_To_ConsIconName[`${result.element}`][1] }, { "style": "", "icon": PlayerElem_To_ConsIconName[`${result.element}`][2] }, { "style": "", "icon": PlayerElem_To_ConsIconName[`${result.element}`][3] }, { "style": "", "icon": PlayerElem_To_ConsIconName[`${result.element}`][4] }, { "style": "", "icon": PlayerElem_To_ConsIconName[`${result.element}`][5] }]
                } else {
                    //char_Gspanel：Gspanel的具体一个角色的资料
                    let char_Gspanel = char_data_Gspanel[MiaoChar.id]
                    try {
                        //有皮肤，用对应图标
                        result.icon = char_Gspanel.Costumes[MiaoChar.costume].icon
                        result.gachaAvatarImg = char_Gspanel.Costumes[MiaoChar.costume].art
                        //用try是因为Miao面板数据早期数据和新数据格式差距过大。。原来用的if一堆毛病
                    } catch (JiuMingA) {
                        //没皮肤，用默认图标
                        result.icon = char_Gspanel.iconName
                        result.gachaAvatarImg = `UI_Gacha_AvatarImg_${char_Gspanel.Name}`
                    }
                    //技能图标
                    result.skills.a.icon = char_Gspanel.Skills[char_Gspanel.SkillOrder[0]]
                    result.skills.e.icon = char_Gspanel.Skills[char_Gspanel.SkillOrder[1]]
                    result.skills.q.icon = char_Gspanel.Skills[char_Gspanel.SkillOrder[2]]
                    result.consts = [{ "style": "", "icon": char_Gspanel.Consts[0] }, { "style": "", "icon": char_Gspanel.Consts[1] }, { "style": "", "icon": char_Gspanel.Consts[2] }, { "style": "", "icon": char_Gspanel.Consts[3] }, { "style": "", "icon": char_Gspanel.Consts[4] }, { "style": "", "icon": char_Gspanel.Consts[5] }]
                }
                switch (result.cons) {
                    //根据命座决定图标是否亮起
                    case 0:
                        result.consts[0].style = "off"
                    case 1:
                        result.consts[1].style = "off"
                    case 2:
                        result.consts[2].style = "off"
                    case 3:
                        result.consts[3].style = "off"
                    case 4:
                        result.consts[4].style = "off"
                    case 5:
                        result.consts[5].style = "off"
                    case 6:
                    //六命富哥，命座全亮捏。
                }

                /**处理武器数据 */
                //weapon_miao：Miao具体一个武器的资料
                let weapon_miao
                try {
                    weapon_miao = a.getJSON(MiaoResourecePath + `weapon/${char_Miao.weapon}/${result.weapon.name}/data.json`)
                } catch (errorWeaponData) {
                    console.log(logger.red(`${pluginINFO}UID${uid}的${result.name}使用了${result.weapon.name}，还请自行判断该角色是否可以使用该武器。如果该角色在原版游戏中可以携带该武器，请更新miao-plugin来尝试修复该问题。以下是命令执行报错：\n`) + errorWeaponData)
                    return false
                }
                result.weapon.id = weapon_miao.id
                try {
                    result.weapon.icon = WeaponID_To_IconName[result.weapon.id]
                } catch (errorWeaponIcon) {
                    console.log(logger.red(`${pluginINFO}疑似找不到武器id${result.weapon.id}对应的图标数据。请发送`) + "#武器数据更新" + logger.red(`来获取最新武器图标数据尝试修复该问题。以下是命令执行报错：\n`) + errorWeaponIcon)
                    return false
                }
                result.weapon.rarity = weapon_miao.star
                result.weapon.sub.prop = trans[weapon_miao.attr.bonusKey]
                let levelUP = trans.Promote[MiaoChar.weapon.promote + 1]
                let levelDN = trans.Promote[MiaoChar.weapon.promote]
                if (!MiaoChar.weapon.promote) {
                    //如果调用1级数据，为简化代码生成1+级数据。
                    weapon_miao.attr.atk["1+"] = weapon_miao.attr.atk["1"]
                    weapon_miao.attr.bonusData["1+"] = weapon_miao.attr.bonusData["1"]
                }
                //根据我的测试结果和enka的数据，中间等级都是线性关系，如果出现错误请反馈。

                result.weapon.main = await this.calcBetween(weapon_miao.attr.atk, result.weapon.level, levelUP, levelDN)

                result.weapon.sub.value = String(await this.calcBetween(weapon_miao.attr.bonusData, result.weapon.level, levelUP, levelDN))

                /**处理白值 */

                let charPromote
                if (MiaoChar.id == "10000007" || MiaoChar.id == "10000005") {
                    //如果是主角需要单独处理，直接假设是满级。
                    result.baseProp.生命值 = char_Miao.baseAttr.hp
                    result.baseProp.攻击力 = char_Miao.baseAttr.atk + result.weapon.main
                    result.baseProp.防御力 = char_Miao.baseAttr.def
                    let map = [0, 0, 1, 2, 2, 3, 4]
                    charPromote = { "prop": "攻击力百分比", "value": 6 * map[MiaoChar.promote] }
                } else {
                    //char_Miao_detail：Miao具体一个角色的资料的生命、攻击、防御、突破属性。请注意，主角没有这类数据！
                    let char_Miao_detail = a.getJSON(MiaoResourecePath + `character/${MiaoChar.name}/detail.json`).attr

                    levelUP = trans.Promote[MiaoChar.promote + 1]
                    levelDN = trans.Promote[MiaoChar.promote]
                    if (!MiaoChar.promote) {
                        //如果调用1级数据，为简化代码生成1+级数据。
                        char_Miao_detail.details["1+"] = char_Miao_detail.details["1"]
                    }
                    //根据我的测试结果和enka的数据，中间等级都是线性关系，如果出现错误请反馈。
                    result.baseProp.生命值 = await this.calcBetween2(char_Miao_detail.details, result.level, 0, levelUP, levelDN)
                    result.baseProp.攻击力 = await this.calcBetween2(char_Miao_detail.details, result.level, 1, levelUP, levelDN) + result.weapon.main
                    result.baseProp.防御力 = await this.calcBetween2(char_Miao_detail.details, result.level, 2, levelUP, levelDN)
                    result.fightProp.生命值 = result.baseProp.生命值
                    result.fightProp.攻击力 = result.baseProp.攻击力
                    result.fightProp.防御力 = result.baseProp.防御力
                    /**处理角色突破属性和武器属性 */
                    charPromote = { "prop": trans[char_Miao_detail.keys[3]], "value": char_Miao_detail.details[`${levelDN}+`][3] }
                    if (charPromote.prop == "伤加成") {
                        charPromote.prop = await result.element + charPromote.prop
                    }
                }
                let calc = await this.calcAttr(result.baseProp, charPromote)
                result.fightProp[calc.prop] += calc.value
                if (result.weapon.rarity > 2) {
                    //仅当稀有度至少三星时，武器才有副属性。
                    calc = await this.calcAttr(result.baseProp, result.weapon.sub)
                    if (calc.change) {
                        result.weapon.sub.prop = result.weapon.sub.prop.replace("百分比", "")
                        result.weapon.sub.value = `${result.weapon.sub.value}%`
                    } else {
                        result.weapon.sub.value = result.weapon.sub.value.toString()
                    }
                    result.fightProp[calc.prop] += calc.value
                }
                /**处理圣遗物数据 */
                for (let j in MiaoChar.artis) {
                    //MiaoArtis：Miao的具体圣遗物
                    let MiaoArtis = MiaoChar.artis[j]
                    if (MiaoArtis.mainId == undefined && MiaoArtis.main == undefined) {
                        //没有圣遗物数据
                        NoData = MiaoChar.artis
                        break
                    }
                    if (MiaoArtis.main == undefined) {
                        //如果没有主词条数据，则表示是新版喵喵数据，采用属性ID。那么预先处理一下属性ID转为旧版喵喵数据的{key,value}的格式，以便后续处理。
                        MiaoArtis.main = {
                            "key": attr_map[MiaoArtis.mainId],
                            //主词条根据星级、等级和key给value
                            "value": dataRelicMain[attr_map[MiaoArtis.mainId]][MiaoArtis.star][MiaoArtis.level]
                        }
                        MiaoArtis.attrs = [{}, {}, {}, {}]
                        for (let k in MiaoArtis.attrIds) {
                            let Effect = attr_map[MiaoArtis.attrIds[k]]
                            for (let j in MiaoArtis.attrs) {
                                if (MiaoArtis.attrs[j].key == undefined) {
                                    //如果这个位置还没有属性
                                    MiaoArtis.attrs[j].key = Effect.key
                                    MiaoArtis.attrs[j].value = Effect.value
                                    break
                                }
                                if (MiaoArtis.attrs[j].key == Effect.key) {
                                    //如果这个位置的属性正是Effect对应的
                                    MiaoArtis.attrs[j].value += Effect.value
                                    break
                                }
                            }
                        }
                        for (let k in MiaoArtis.attrs) {
                            if (MiaoArtis.attrs[k].value == undefined) continue
                            MiaoArtis.attrs[k].value = Number(MiaoArtis.attrs[k].value.toFixed(5))
                        }
                    }
                    //artis：Gspanel的具体圣遗物
                    let artis = {
                        "pos": Number(j),
                        "rarity": MiaoArtis.star,
                        "name": MiaoArtis.name,
                        "setName": dataRelicSet[MiaoArtis.name],
                        "level": MiaoArtis.level,
                        "main": {
                            "prop": trans[MiaoArtis.main.key],
                            "value": MiaoArtis.main.value
                        },
                        "sub": [
                        ],
                        "calc": {
                            //你好！评分部分我先暂时搁置了！因为我个人只需要队伍伤害，该功能不需要评分。
                            "rank": "ACE",
                            "total": 66.6,
                            "nohit": 45,
                            "main": 77.7,
                            "sub": [
                            ],
                            "main_pct": 100.0,
                            "total_pct": 98.7
                        },
                        "icon": `UI_RelicIcon_${dataRelicSet[dataRelicSet[MiaoArtis.name]]}_${trans[j]}`
                    }
                    for (let index in MiaoArtis.attrs) {
                        //将非空词条写入，无视空词条。
                        if (MiaoArtis.attrs[index].key == undefined) {
                            //如果当前位置已经出现undefined，则后面也都是undefined，无需重复判断。
                            break
                        }
                        artis.sub[index] = {
                            "prop": trans[MiaoArtis.attrs[index].key],
                            "value": MiaoArtis.attrs[index].value
                        }
                        artis.calc.sub[index] = { "style": "great", "goal": 6.6 }
                    }
                    if (result.relicSet[artis.setName])
                        result.relicSet[artis.setName]++
                    else
                        result.relicSet[artis.setName] = 1
                    //处理artis.main→fightProp
                    calc = await this.calcAttr(result.baseProp, artis.main)
                    if (calc.change) {
                        artis.main.prop = artis.main.prop.replace("百分比", "")
                        artis.main.value = `${artis.main.value}%`
                    } else {
                        artis.main.value = artis.main.value.toString()
                    }
                    result.fightProp[calc.prop] += calc.value
                    //artis.sub→fightProp
                    for (let k in artis.sub) {
                        if (artis.sub[k].prop == undefined) continue
                        calc = await this.calcAttr(result.baseProp, artis.sub[k])
                        if (calc.change) {
                            artis.sub[k].prop = artis.sub[k].prop.replace("百分比", "")
                            artis.sub[k].value = `${artis.sub[k].value}%`
                        } else {
                            artis.sub[k].value = artis.sub[k].value.toString()
                        }
                        result.fightProp[calc.prop] += calc.value
                    }
                    result.relics.push(artis)
                }
                if (NoData) {
                    //如果没有圣遗物详细数据，则跳过该面板。
                    console.log(pluginINFO + "UID" + uid + result.name + `的圣遗物没有详细数据故跳过，以下是他${result.name}的圣遗物：`)
                    console.log(NoData)
                    continue
                }
                for (let j in result.relicSet) {
                    let Effect = dataRelicSet[dataRelicSet[j]]
                    if (Effect != undefined && result.relicSet[j] >= 2) {
                        //仅当二件套触发且效果为属性时尝试转换
                        if (Effect[0].includes("百分比")) {
                            Effect[0] = Effect[0].replace("百分比", "")
                            Effect[1] = result.baseProp[Effect[0]] * Effect[1] / 100
                        }
                        result.fightProp[Effect[0]] += Effect[1]
                    }
                }
                /**将baseProph和fightProp约分到合适位数 */
                for (let j in result.baseProp)
                    result.baseProp[j] = Number(result.baseProp[j].toFixed(2))
                for (let j in result.fightProp)
                    result.fightProp[j] = Number(result.fightProp[j].toFixed(2))


                //SKIP：relics[i].calc relicCalc damage

                Gspanel.avatars.push(result)
            }


            /**写入数据 */
            fs.writeFileSync(await GspanelPath.concat(`${uid}.json`), JSON.stringify(Gspanel))
            return true
        } catch (e) {
            console.log(logger.red(`${pluginINFO}UID${uid}报错：\n${e}`))
            return `\n${pluginINFO}在处理UID${uid}的数据时：\n${logger.red(e)}`
        }
    }
    async calcAttr(baseProp, prop_and_value) {
        //根据词条和白值返回新的一组{prop,value,change}表示应该在fightProp的哪个prop上增加value，change为true时表示百分数，需要在原属性结尾添加%。
        let prop = prop_and_value.prop
        let value = Number(prop_and_value.value)
        let change = (prop.search(/加成|百分比|充能效率|暴击/g) != -1)
        if (prop.includes("百分比")) {
            prop = prop.replace("百分比", "")
            value = baseProp[prop] * value / 100
        } else {
            if (prop == "物伤加成") {
                prop = "物理伤害加成"
            } else {
                if (prop.includes("伤加成")) {
                    prop = prop.replace("伤加成", "元素伤害加成")
                } else {
                    if (prop.includes("充能效率"))
                        prop = "元素充能效率"
                }
            }
        }
        return { prop, value, change }
    }
    async calcBetween(f, x, x_up, x_dn) {
        //根据对应关系f[x]和自变量x1、x2，线性计算f在二者之间的x对应的值，并返回二位小数。如果有index则f需要加上。
        return Number((((f[x_up] - f[x_dn + "+"]) * x - f[x_up] * x_dn + f[x_dn + "+"] * x_up) / (x_up - x_dn)).toFixed(2))
    }
    async calcBetween2(f, x, index, x_up, x_dn) {
        //根据对应关系f[x][index]和自变量x1、x2，线性计算f在二者之间的x对应的值，并返回二位小数。如果有index则f需要加上。
        return Number((((f[x_up][index] - f[x_dn + "+"][index]) * x - f[x_up][index] * x_dn + f[x_dn + "+"][index] * x_up) / (x_up - x_dn)).toFixed(2))
    }
    async findUID(QQ) {
        //根据QQ号判断对应uid，返回null表示没有对应uid。
        let uid = await redis.get(redisStart + QQ)
        return uid
    }
}