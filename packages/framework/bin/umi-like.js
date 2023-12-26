#!/usr/bin/env node

const { program } = require("commander");
const { version } = require("../package.json");

program
    .version(version, "-v, --version", "输出框架当前版本")
    .description("类Uim框架")
    .usage("<command> [options]");

program.command('dev')
    .description('框架启动服务')
    .action(function (name, other) {
        console.log(`==== run dev ====`)
        const { dev } = require('../lib/dev');
        dev();
    });

program.command('build')
    .description('框架构建命令')
    .action(function (name, other) {
        console.log(`==== run build ====`)
        const { build } = require('../lib/build');
        build();
    });

program.parse(process.argv);