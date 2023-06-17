import Help from "../model/help.js"
import md5 from "md5"

let helpData = {
    md5: "",
    img: "",
}

let how = "(操作|处理|兼容|调整|转换|_|-)"
let panel = "(panel|面板|面包)"
let hreg = "(帮助|help|菜单|指令)"

export class help extends plugin {
    constructor() {
        super({
            name: '帮助',
            event: 'message',
            priority: -233,
            rule: [
                {
                    reg: `^#?(${how}${panel}|${panel}${how})${hreg}$`,
                    fnc: 'help',
                },
            ]
        })
    }
    async help() {

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