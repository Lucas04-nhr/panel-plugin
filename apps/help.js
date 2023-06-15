// import plugin from '../../../lib/plugins/plugin.js'
// import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import Help from "../model/help.js"
import md5 from "md5"
// import a from "../model/tools.js"
// import YAML from "yaml"
// import fs from "fs"

let helpData = {
    md5: "",
    img: "",
}


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
        // this.reply("暂时还没写帮助，请参考项目页：https://gitee.com/yunzai-panel/README")

        let data = await Help.get(this.e);

        if (!data) return;
        let img = await this.cache(data);
        await this.reply(img);

    }

    async cache(data) {
        let tmp = md5(JSON.stringify(data));
        if (helpData.md5 == tmp) return helpData.img;

        helpData.img = await puppeteer.screenshot("help", data);
        helpData.md5 = tmp;

        return helpData.img;
    }

}