import a from "./tools.js"
import cfg from "../../../lib/config/config.js";

export default class Help {
    constructor(e = {}) {
        this.e = e;
        this.userId = e?.user_id;
        this._path = process.cwd().replace(/\\/g, "/");
    }

    get screenData() {
        return {
            saveId: this.userId,
            tplFile: `./plugins/panel-plugin/resources/html/help/help.html`,
            /** 绝对路径 */
            pluResPath: `${this._path}/plugins/panel-plugin/resources/`,
        };
    }

    static async get(e) {
        let html = new Help(e);
        return await html.getData();
    }

    async getData() {
        let helpData = a.getHtml("help")

        let groupCfg = cfg.getGroup(this.group_id);

        if (groupCfg.disable && groupCfg.disable.length) {
            helpData.map((item) => {
                if (groupCfg.disable.includes(item.group)) {
                    item.disable = true;
                }
                return item;
            });
        }

        let versionData = a.getHtml("version")

        const version =
            (versionData && versionData.length && versionData[0].version) || "1.0.0";


        return {
            ...this.screenData,
            saveId: "help",
            version: version,
            helpData,
        };

    }
}
