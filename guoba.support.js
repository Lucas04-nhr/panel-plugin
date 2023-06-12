import setting from "./model/setting.js";
import lodash from "lodash";
export function supportGuoba() {
    return {
        // 插件信息，将会显示在前端页面
        pluginInfo: {
            name: 'panel-plugin',
            title: '面板插件',
            author: '@硫酸钡Barite',
            authorLink: 'https://gitee.com/CUZNIL',
            link: 'https://gitee.com/yunzai-panel/panel-plugin',
            isV3: true,
            isV2: false,
            description: '对喵喵插件的面板数据提供操作',
            // 显示图标，此为个性化配置
            icon: 'mdi:stove',
            // 图标颜色，例：#FF0000 或 rgb(255, 0, 0)
            iconColor: '#66CCFF',
            // 如果想要显示成图片，也可以填写图标路径（绝对路径）
            iconPath: `plugins/panel-plugin/resources/img/klee.ico`,
        },
        configInfo: {
            schemas: [
                {
                    component: 'Divider',
                    label: '正确安装的前提下，可以直接发送#面板路径更新 来获取Gspanel面板位置，无需手动填写。',
                },
                {
                    field: 'settings.backupGspanel',
                    label: 'py备份开关',
                    bottomHelpMessage: '是否要在转换面板时备份Gspanel面板',
                    component: 'Switch',
                },
                {
                    field: 'settings.backupMiao',
                    label: '喵喵备份开关',
                    bottomHelpMessage: '是否要在兼容面板时备份喵喵面板',
                    component: 'Switch',
                },
                {
                    field: 'path.GspanelPath',
                    label: 'py面板位置',
                    bottomHelpMessage: 'nonebot-plugin-gspanel产生的面板数据路径，需要手动配置到自己安装的路径。',
                    helpMessage: '手动填写务必保证路径结尾有/，以下路径同理。',
                    component: 'Input',
                    required: true,
                    componentProps: {
                        placeholder: 'GspanelPath：nonebot-plugin-gspanel产生的面板数据路径，需要手动配置到自己安装的路径。',
                    },
                },
                {
                    component: 'Divider',
                    label: '以下内容一般不需要修改',
                },
                {
                    field: 'path.resource',
                    label: '插件资源位置',
                    bottomHelpMessage: '该插件产生的中间文件存放的文件夹位置。download函数会默认下载文件到该位置。',
                    component: 'Input',
                    required: true,
                    componentProps: {
                        placeholder: 'resource:该插件产生的中间文件存放的文件夹位置。download函数会默认下载文件到该位置。',
                    },
                },
                {
                    field: 'path.BackupMiaoPath',
                    label: '喵喵备份位置',
                    bottomHelpMessage: '用于存放备份的喵喵面板数据，以减少未知问题导致面板错误带来的的影响。',
                    component: 'Input',
                    required: true,
                    componentProps: {
                        placeholder: 'BackupMiaoPath:用于存放备份的喵喵面板数据，以减少未知问题导致面板错误带来的的影响。',
                    },
                },
                {
                    field: 'path.BackupGspanelPath',
                    label: 'py备份位置',
                    bottomHelpMessage: '用于存放备份的nonebot-plugin-gspanel面板数据，以减少未知问题导致面板错误带来的的影响。',
                    component: 'Input',
                    required: true,
                    componentProps: {
                        placeholder: 'BackupGspanelPath:用于存放备份的nonebot-plugin-gspanel面板数据，以减少未知问题导致面板错误带来的的影响。',
                    },
                },
                {
                    field: 'path.MiaoPath',
                    label: '喵喵面板位置',
                    bottomHelpMessage: 'miao-plugin产生的面板数据路径。',
                    component: 'Input',
                    required: true,
                    componentProps: {
                        placeholder: 'MiaoPath：miao-plugin产生的面板数据路径。',
                    },
                },
                {
                    field: 'path.MiaoResourecePath',
                    label: '喵喵资源位置',
                    bottomHelpMessage: 'miao-plugin产生的面板数据路径。',
                    component: 'Input',
                    required: true,
                    componentProps: {
                        placeholder: 'MiaoResourecePath：miao-plugin安装位置下对应的资料数据存放路径。',
                    },
                },
                {
                    field: 'path.GenshinDataRepoDownload',
                    label: '原神数据网址',
                    bottomHelpMessage: '原神数据网址，用于主动更新数据时的资源获取。',
                    component: 'Input',
                    required: true,
                    componentProps: {
                        placeholder: 'GenshinDataRepoDownload：原神数据网址，用于主动更新数据时的资源获取。',
                    },
                },

            ],
            getConfigData() {
                return setting.merge()
            },
            setConfigData(data, { Result }) {
                let config = {}
                for (let [keyPath, value] of Object.entries(data)) {
                    lodash.set(config, keyPath, value)
                }
                config = lodash.merge({}, setting.merge, config)
                setting.analysis(config)
                return Result.ok({}, '保存成功~')
            }
        }
    }
}