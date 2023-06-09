export class help extends plugin {
    constructor() {
        super({
            name: '帮助',
            event: 'message',
            priority: -233,
            rule: [
                {
                    reg: '^#?123456789$',
                    fnc: 'help',
                    permission: 'master'
                },
            ]
        })
    }
    async help() {
    }
}