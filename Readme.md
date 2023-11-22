# FIDO2-by-React-Express-Typescript

このリポジトリは "todos-express-webauthn "に基づいて作成されています。
https://github.com/passport/todos-express-webauthn
React と Typescript を使ってモダナイズされ、書き直されました。

## 主な構成
### 基本構成
- React
- Express
- Typescript
- SQLite

### FIDO2認証について
- サーバー
  - passport
  - passport-fido2-webauthn
- クライアント
  - navigator.credentials APIを使用（javascript標準）


## 機能について 

### サインイン  
登録済みのユーザーアカウントをお持ちの場合、指紋認証などの登録時に行なった本人確認でログインできます。 
サインイン後、/logined-pageページにリダイレクトされます。このページでは、サインアップ時に入力した情報が表示されます。 
サインインせずにこのページにアクセスすると、401エラーが返されますのでご注意ください。

### サインアップ  
フォームに値を入力してアカウントを作成し、サインアップボタンをクリックします。  
ボタンをクリックした後、指紋または他の手段で本人確認を要求するので、本人確認を行います。  
本人確認が終わるとサーバーにリクエストが投げられユーザー作成完了後に、/logined-pageページにリダイレクトされます。

## Scripts
- `dev` : 開発モードでフロント（React viteサーバー port:3000）とバックエンド（Express port:4000）が起動します。
- `build` : トランスパイルを実行します。
- `start` : トランスパイルされたファイルを使用してExpressを起動します。ReactはExpressからビルトされたファイルを配信します。（port:4000）