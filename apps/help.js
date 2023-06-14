export class help extends plugin {
    constructor() {
        super({
            name: '帮助',
            event: 'message',
            priority: -233,
            rule: [
                {
                    reg: '^#?面板(操作|处理)帮助$',
                    fnc: 'help',
                },
            ]
        })
    }
    async help() {
        this.reply("暂时还没写帮助，请参考项目页：https://gitee.com/yunzai-panel/README")
    }
}