//只是为了方便提交写的，与插件功能无关。

let intro = `cd plugins/panel-plugin && `

export class git_push extends plugin {
    constructor() {
        super({
            name: '上传修改',
            event: 'message',
            priority: -233,
            rule: [
                //芝士作者上传插件用的指令喵，插件用户没必要用喵
                {
                    reg: '^#?(上传|提交)插件.*$',
                    fnc: 'git_push',
                    permission: 'master'
                },
                {
                    reg: '^#?git登录$',
                    fnc: 'git_set',
                    permission: 'master'
                },
            ]
        })
    }

    async git_set() {
        let name = "cuznil"
        let email = "iamliujunxi@qq.com"
        let git = `git config --global credential.helper store && git config --global credential.username "${name}" && git config --global user.name "${name}" && git config --global user.email "${email}"`
        let cmd = intro + git
        let result = await execSync(cmd)
        logger.mark(`${result.stdout.trim()}\n${logger.red(result.stderr.trim())}`)
        this.reply(result.stderr.trim())
        this.reply("注意第一次上传插件需要手动输入密码。")
    }

    async git_push(e) {
        let isPush = this.e.msg.match(/^#?提交插件.*/g)


        let commit = this.e.msg.replace(/#?(提交|上传)插件/g, "")
        if (!commit) {
            this.reply("需要commit信息")
            return false
        }
        let result
        let cmd

        cmd = intro + `git add . && git commit -m "${commit}"`

        result = await execSync(cmd)

        if (isPush) return true

        cmd = intro + `git push`

        result = await execSync(cmd)

        logger.mark(`${result.stdout.trim()}\n${logger.red(result.stderr.trim())}`)
        this.reply(result.stderr.trim())


    }
}
async function execSync(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            resolve({ error, stdout, stderr })
        })
    })
}