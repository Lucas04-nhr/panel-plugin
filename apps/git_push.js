import a from "../model/tools.js"


let { name, email, password } = a.getConfig("git")

let intro = `cd plugins/panel-plugin && `
let git = `git config --global credential.helper store && git config --global user.name "${name}" && git config --global user.email "${email}" && git config --global user.password "${password}" && `


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
        let commit = this.e.msg.replace(/#?上传插件/g, "")
        if (!commit) {
            this.reply("需要commit信息")
            return false
        }
        let result
        let cmd
        cmd = intro + `git add . && git commit -m "${commit}"`
        console.log(logger.red(cmd))

        result = await execSync(cmd)

        logger.mark(`${result.stdout.trim()}\n${logger.red(result.stderr.trim())}`)
        cmd = intro + `git config --list --global        `
        console.log(logger.red(cmd))

        result = await execSync(cmd)

        logger.mark(`${result.stdout.trim()}\n${logger.red(result.stderr.trim())}`)


    }
}
async function execSync(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            resolve({ error, stdout, stderr })
        })
    })
}