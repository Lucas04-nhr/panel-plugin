//只是为了方便提交写的，与插件功能无关。

import a from "../model/tools.js"



let intro = `cd plugins/panel-plugin && `

export class git_push extends plugin {
    constructor() {
        super({
            name: '上传修改',
            event: 'message',
            priority: -233,
            rule: [
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

        let name, email, password
        try {
            ({ name, email, password } = a.getConfig("git"))
        } catch (e) {
            this.reply("芝士作者上传插件用的指令喵，你没必要用喵")
            return false
        }

        let git = `git config --global credential.helper store && git config --global credential.username "${name}" && git config --global user.name "${name}" && git config --global user.email "${email}" && git config --global user.password "${password}"`
        let cmd = intro + git
        let result = await execSync(cmd)
        logger.mark(`${result.stdout.trim()}\n${logger.red(result.stderr.trim())}`)
        this.reply(result.stderr.trim())
        this.reply("因为我也不知道怎么解决的问题，第一次上传插件还是需要手动输入密码。")
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