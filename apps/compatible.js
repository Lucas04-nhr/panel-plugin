export class compatible extends plugin {
    constructor() {
        super({
            name: '旧面板转新版',
            event: 'message',
            priority: -233,
            rule: [
                {
                    reg: '^#?123456789$',
                    fnc: 'compatible',
                    permission: 'master'
                },
            ]
        })
    }
    async compatible() {
    }
}