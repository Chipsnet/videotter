var electron = require('electron');
var ipcRenderer = electron.ipcRenderer;

function checkText() {
	if (document.getElementById("twitter_url").value === "") {
		ipcRenderer.send('error', 'URLを入力してください')
	} else {
		ipcRenderer.send('ready', document.getElementById("twitter_url").value)
		window.location.href = "process.html";
	};
}

function logadd(arg) {
	document.getElementById("log").value += arg + "\n";
}

ipcRenderer.on('reply', (event, arg) => {
	logadd(arg);
	ipcRenderer.send('start', 'started')
})

ipcRenderer.on('not_twitterURL', (event, arg) => {
	window.location.href = "index.html"
})

ipcRenderer.on('info', (event, arg) => {
	logadd(arg.msg);
})

ipcRenderer.on('success', (event, arg) => {
	logadd(arg);
	setTimeout(() => {
        window.location.href = "index.html"
    }, 5000);
})