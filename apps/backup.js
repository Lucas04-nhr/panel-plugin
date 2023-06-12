import a from "../model/tools.js"

let { MiaoPath, GspanelPath, BackupMiaoPath, BackupGspanelPath } = a.getConfig("path")

export class backup extends plugin {
    constructor() {
        super({
            name: '备份',
            event: 'message',
            priority: -233,
            rule: [
                {
                    reg: '^#?恢复(喵喵|miao|(p|P)(y|Y)|(G|g)spanel)?(面板|备份)+$',
                    fnc: 'recover_query',
                    permission: 'master'
                },
                {
                    reg: '^#?恢复(全部|所有|all)(喵喵|miao|(p|P)(y|Y)|(G|g)spanel)?(面板|备份)+$',
                    fnc: 'recover_all',
                    permission: 'master'
                },
            ]
        })
    }
    async recover_query() {
    }


    async recover_all() {
    }
}