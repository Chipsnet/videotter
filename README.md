# Videotter

## これはなに

- Twitter動画をダウンロードできます
- 自分のアカウントで認証するので、サーバーの負荷を気にしなくて済みます

## インストール

tbd

## ソースコードから実行

要求環境

- Node.js (v12.16.2確認済み)
- yarn (npmでも可)

まずCloneします

`git clone https://github.com/Chipsnet/videotter.git`

ソースのディレクトリに移動します

`cd videotter`

依存関係をインストールします

`yarn install`

Twitterから、ConsumerTokenを取得します

https://developer.twitter.com/en/apps

`src/config/ex.token.txt` を `token.txt` に変更して、トークンを入力します。

```
key = [ConsumerToken]
secret = [ConsumerTokenSecret]
```

実行します

`yarn start`

## ビルド

現在Windowsのみ対応してます

`yarn build`