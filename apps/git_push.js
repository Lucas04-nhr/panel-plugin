//只是为了方便提交写的，与插件功能无关。

import a from "../model/tools.js"




export class git_push extends plugin {
    constructor() {
        super({
            name: '上传修改',
            event: 'message',
            priority: -233,
            rule: [
                {
                    reg: '^#?上传插件.*$',
                    fnc: 'git_push',
                    permission: 'master'
                },
            ]
        })
    }


    async git_push() {
        let name, email, password
        try {
            ({ name, email, password } = a.getConfig("git"))
        } catch (e) {
            this.reply("芝士作者上传插件用的指令喵，你没必要用喵")
            return false
        }


        let intro = `cd plugins/panel-plugin && `
        let git = `git config --global credential.helper store && git config --global credential.username "${name}" && git config --global user.name "${name}" && git config --global user.email "${email}" && git config --global user.password "${password}" && `

        let commit = this.e.msg.replace(/#?上传插件/g, "")
        if (!commit) {
            this.reply("需要commit信息")
            return false
        }
        let result
        let cmd
        cmd = intro + git + `git add . && git commit -m "${commit}"`

        result = await execSync(cmd)

        cmd = intro + `git push`

        result = await execSync(cmd)

        result = `${result.stdout.trim()}\n${logger.red(result.stderr.trim())}`
        logger.mark(result)
        this.reply(result)


    }
}
async function execSync(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            resolve({ error, stdout, stderr })
        })
    })
}