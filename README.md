# 面板插件 `panel-plugin`

插件功能：对[喵喵插件](https://github.com/yoimiya-kokomi/miao-plugin)的面板数据提供操作。

# 安装与更新

#### 1. 挂载至 Yunzai/plugins 目录

```
cd Yunzai/plugins
```

#### 2. 克隆插件仓库至 plugins 目录

- 使用 Gitee（国内服务器推荐使用此方法）

```
git clone https://gitee.com/yunzai-panel/panel-plugin
```

- 使用 Github（需可信的SSH密钥）

```
git clone git@github.com:Lucas04-nhr/panel-plugin.git
```

# 使用说明

安装后发送 **#面板操作帮助**  即可查看帮助。如下图：

![输入图片说明](pic/help.gif)

也可以看下面的表格：

| 功能   | 描述                                                                                                                                     | 命令         |
|------|----------------------------------------------------------------------------------------------------------------------------------------|------------|
| 面板转换 | 将[喵喵插件](../../../../yoimiya-kokomi/miao-plugin)产生的面板数据适配到[Gspanel](https://github.com/monsterxcn/nonebot-plugin-gspanel)，以便在Gspanel使用。 | #转换面板(+uid) |
| 面板兼容 | 将[喵喵插件](../../../../yoimiya-kokomi/miao-plugin)面板的旧圣遗物格式转换为新版以便使用                                                                      | #调整面板(+uid) |
| 面板备份 | 备份或恢复[喵喵插件](../../../../yoimiya-kokomi/miao-plugin)和[Gspanel](https://github.com/monsterxcn/nonebot-plugin-gspanel)的面板数据               | #备份/恢复/删除面板 |


<details><summary>点击展开所有正则</summary>

```
^#?转换(全部|所有)(喵喵|PY)?面(板|包)$
^#?转换(喵喵|PY)?面(板|包)(\\d{9})?$

^#?(兼容|调整)(全部|所有)旧?(喵喵)?面(板|包)$
^#?(兼容|调整)旧?(喵喵)?面(板|包)(\\d{9})?$

^#?((删除|清空|erase)|恢复|备份)(全部|所有|all)?(喵喵|miao|(p|P)(y|Y)|(G|g)spanel)?(面板|备份)+$

^#?武器数据更新$
^#?主角命座更新$
^#?属性映射更新$
^#?圣遗物套装更新$
^#?圣遗物主词条更新$
^#?面板路径更新$

^#?面板(操作|处理)帮助$

^#?上传插件.*$
```

</details>

# 环境配置建议

推荐使用[由各路大佬维护的Le-Yunzai](https://github.com/yoimiya-kokomi/Yunzai-Bot)，可参考[这个教程](https://github.com/CUZNIL/Yunzai-install)使用[时雨脚本](https://trss.me/)安装。

其他环境/安装方式也许会导致一些未知问题，如果遇到的话及时反馈到issue，能解决的话我这边会更新解决。


## 参考内容

[土块](https://gitee.com/SmallK111407/earth-k-plugin) [TRSS](https://gitee.com/TimeRainStarSky/TRSS-Plugin) [auto](https://gitee.com/Nwflower/auto-plugin) [锅巴](https://gitee.com/guoba-yunzai/guoba-plugin) [miao](https://gitee.com/yoimiya-kokomi/miao-plugin) [戏天](https://gitee.com/XiTianGame/xitian-plugin)
