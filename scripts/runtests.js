// jshint esversion: 6, browser: false, node: true
// This file is for automated testing, it should probably not be invoked for any other purpose.
// It will:
// 1. npm install
// 2. bower install
// 3. launch the server
// 4. run the tests on the machine
const Spawn = require('child_process').spawn;

const processes = [];

const killAll = (cb) => {
    processes.forEach((p) => { p.kill(); });
    setTimeout(() => {
        processes.forEach((p) => {
            console.log("Process [" + p.command + "] did not end, using kill-9");
            p.kill('SIGKILL');
        });
        cb();
    }, 10);
};
const error = (msg) => {
    killAll(() => {
        throw new Error(msg);
    });
};

const run = (cmd, args, cb) => {
    const proc = Spawn(cmd, args);
    processes.push(proc);
    proc.procName = cmd + ' ' + args.join(' ');
    console.log('>>' + proc.procName);
    proc.stdout.on('data', (data) => { process.stdout.write(data); });
    proc.stderr.on('data', (data) => { process.stderr.write(data); });
    proc.on('close', (code) => {
        const idx = processes.indexOf(proc);
        if (idx === -1) {
            error("process " + proc.procName + " disappeared from list");
            return;
        }
        processes.splice(idx, 1);
        if (code) {
            error("Process [" + proc.procName + "] ended with " + code);
        }
        cb();
    });
};

run('npm', ['install'], () => {
    const nThen = require('nthen');
    nThen((waitFor) => {
        if (process.platform === 'darwin') {
            run('bash', ['-c',
                'ps -ef | grep -v grep | grep \'Google Chrome.app/Contents/MacOS/Google Chrome\'' +
                ' | awk \'{print $2}\' | while read x; do kill $x; done'
            ], waitFor());

            run('bash', ['-c',
                'ps -ef | grep -v grep | grep \'/usr/bin/safaridriver\'' +
                ' | awk \'{print $2}\' | while read x; do kill $x; done'
            ], waitFor());

            run('bash', ['-c',
                'ps -ef | grep -v grep | grep \'/Applications/Firefox.app/Contents/MacOS/firefox-bin\'' +
                ' | awk \'{print $2}\' | while read x; do kill $x; done'
            ], waitFor());

            run('bash', ['-c',
                'lsof | grep \'TCP .*:hbci (LISTEN)\'' +
                ' | awk \'{print $2}\' | while read x; do kill $x; done'
            ], waitFor());

            run('bash', ['-c', 'rm -rf ./blob ./blobstage ./datastore'], waitFor());

            run('bash', ['-c', 'caffeinate -u -t 2'], waitFor());
        }
    }).nThen((waitFor) => {
        run('bower', ['install'], waitFor());
    }).nThen((waitFor) => {
        run('npm', ['run', 'fresh'], ()=>{});
        run('node', ['./scripts/TestSelenium.js'], waitFor());
    }).nThen((waitFor) => {
        if (process.platform === 'darwin') {
            run('bash', ['-c', 'pmset displaysleepnow'], waitFor());
        }
    }).nThen(killAll);
});
