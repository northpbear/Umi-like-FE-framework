#!/usr/bin/env node

const { program } = require("commander");
const { version } = require("../package.json");

program
    .version(version, "-v, --version", "输出框架当前版本")
    .description("类Uim框架")
    .usage("<command> [options]")
    .parse(process.argv);

program.command('start')
    .description('启动服务')
    .action(function (name, other) {
        console.log(`==== run start ====`)
    }).parse(process.argv);
