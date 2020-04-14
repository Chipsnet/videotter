const electron = require('electron');
const dialog = electron.dialog;
const OauthTwitter = require('electron-oauth-twitter');
const { DownloaderHelper } = require('node-downloader-helper');
const app = electron.app;
const fs = require('fs');
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const twitterAPI = require('twitter');
const ini = require('ini')
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./keys');

let config = ini.parse(fs.readFileSync(__dirname+'/config/token.txt', 'utf-8'))

Client_key = config.key;
Client_key_Secret = config.secret;

try {
    fs.statSync('./download');
} catch(err) {
    if(err.code === 'ENOENT') {
        fs.mkdir('./download', function (err) {
        });
    }
}

const twitter = new OauthTwitter({
    key   : Client_key,
    secret: Client_key_Secret,
});

let mainWindow = null;

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.setMenu(null);
    if (localStorage.getItem("Token") === null) {
        twitter.startRequest()
        .then((result) => {
            localStorage.setItem("Token", result.oauth_access_token)
            localStorage.setItem("Secret", result.oauth_access_token_secret)
            mainWindow.loadFile(__dirname+'/index.html');
        }).catch((error) => {
            dialog.showErrorBox('認証に失敗しました', error.toString())
            console.error(error, error.stack);
            app.quit();
        });
    } else {
        mainWindow.loadFile(__dirname+'/index.html');
    }
});

ipc.on('ready', (event, arg) => {
    twitter_url = arg;
    setTimeout(() => {
        event.sender.send('reply', `${arg}の解析を行います...`);
    }, 2000);
})

ipc.on('start', (event, arg) => {
    if (twitter_url.startsWith('https://twitter.com')) {
        var url_list = twitter_url.split('/');
        if (typeof url_list[5] === 'undefined') {
            dialog.showErrorBox('処理を続行できませんでした', 'URLが間違っています')
            twitter_url = "";
            event.sender.send('not_twitterURL', 'index.html');
        } else {
            mainWindow.webContents.send('info', {msg:`TweetID ${url_list[5]} のデータを取得します...`});
            var client = new twitterAPI({
                consumer_key:        Client_key,
                consumer_secret:     Client_key_Secret,
                access_token_key:    localStorage.getItem("Token"),
                access_token_secret: localStorage.getItem("Secret"),
            });
            var params = {
                id: url_list[5],
                tweet_mode: 'extended'
            };
            client.get('statuses/show', params, function(error, status, response){
                if (!error) {
                    mainWindow.webContents.send('info', {msg:'データの取得に成功しました。処理を行っています...'});
                    if (typeof status.extended_entities !== 'undefined') {
                        if (typeof status.extended_entities.media[0].video_info !== 'undefined') {
                            var res = status.extended_entities.media[0].video_info;
                            var bitrate = 0;
                            for ( var i = 0;  i < res.variants.length;  i++ ) {
                                if (res.variants[i].content_type == "video/mp4") {
                                    if (bitrate < res.variants[i].bitrate) {
                                        var bitrate = res.variants[i].bitrate
                                        var num = i;
                                    }
                                }
                            }
                            mainWindow.webContents.send('info', {msg:`処理に成功しました。Bitrate: ${bitrate} のMP4を検出しました。`});
                            mainWindow.webContents.send('info', {msg:`${res.variants[num].url} のダウンロードを開始します...`});
                            var dl = new DownloaderHelper(res.variants[num].url, './download');
                            dl.on('end', () => event.sender.send('success', 'ダウンロードが完了しました。自動的に初期画面に戻ります。'))
                            dl.start();
                        } else {
                            dialog.showErrorBox('処理を続行できませんでした', 'このツイートには動画が存在しません')
                            twitter_url = "";
                            event.sender.send('not_twitterURL', 'index.html');
                        }
                    } else {
                        dialog.showErrorBox('処理を続行できませんでした', 'このツイートにはメディアが存在しません')
                        twitter_url = "";
                        event.sender.send('not_twitterURL', 'index.html');
                    }
                } else {
                    dialog.showErrorBox('データの取得に失敗しました', error[0].message+'\n繰り返し表示される場合は、keysフォルダを削除してみてください。');
                    event.sender.send('not_twitterURL', 'index.html');
                }
            });
        }
    } else {
        dialog.showErrorBox('URLを解析できませんでした', 'TwitterのURLを入力してください')
        twitter_url = "";
        event.sender.send('not_twitterURL', 'index.html');
    } 
})

ipc.on('error', (event, arg) => {
    dialog.showErrorBox('URLを解析できませんでした', arg)
})
