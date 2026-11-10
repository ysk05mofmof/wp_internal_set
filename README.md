# Internal Theme 開発環境

LocalでWordPressを実行し、プロジェクトルートのVite設定でテーマのJS・SCSSをビルドします。WordPress 6.5以上、PHP 8.2以上、Node.js 24（`.nvmrc`参照）を使用します。LocalのPHPは本番と合わせてください。

開発ツール・設定・依存パッケージはルートにまとめ、テーマの実装とビルド結果は `public/wp-content/themes/internal-theme/` に配置します。以下のコマンドはすべてプロジェクトルート（`app`）で実行します。

最低対応PHPは `style.css` の指定に合わせて8.2です。本番バージョンが決まったらLocalも合わせてください。`npm run lint:php:syntax` は各自のPHP CLIで構文をチェックします。新しい関数・APIの利用やWordPress上の実動作までは検証しません。

## 別PCで再現できる範囲

このリポジトリには、自作テーマと開発ツールの設定を保存しています。lockファイルに基づく依存パッケージ、整形ルール、JS・SCSSのビルド、ブラウザの自動更新を揃えられます。Localのサイト全体を復元するものではありません。

| 対象                                    | 用意する方法                                             |
| --------------------------------------- | -------------------------------------------------------- |
| 自作テーマ・開発設定                    | 同じリポジトリ・ブランチを取得する                       |
| npm・Composerの依存                     | `npm ci` と `npm run composer -- install`                |
| Local・WordPress・PHP・DB               | 各PCでサイトを作成し、必要なバージョンを選ぶ             |
| Node.js・PHP CLI・Composer・VS Code拡張 | 各PCに導入し、実行パスを設定する                         |
| DB・投稿・メニュー・管理画面の設定      | 既存サイトから別途移行するか、初期状態から設定する       |
| uploadsの画像・プラグイン               | 別途共有・導入する。プラグインは必要なバージョンも揃える |
| `.env`・PHP実行パス・HTTPS証明書        | 各PCのサイトURL・インストール先に合わせて設定する        |

このPCで確認した構成はWindows版Local、WordPress 7.1.4、LocalのPHP 8.5.12、Node.js 24.20.0です。これは現在の実機構成で、テーマの最低対応バージョンとは異なります。macOS・Linuxでの実機検証は未実施です。lockファイルは依存バージョンを揃えますが、OSやPHPの拡張設定、WordPressのデータまでは揃えません。

## 新しいLocalサイトへの配置

1. Localをインストールし、新しいWordPressサイトを作成します。既存サイトを再現したい場合は、元サイトのWordPress・PHP・DBなどのバージョンを確認して揃えます。本番が未確定の場合、上記の実機構成を参考にしてください。
2. サイトのフォルダを開き、`app/public/` にWordPressがあることを確認します。Localが作成したWordPress本体・`wp-config.php`・DBはそのまま利用します。
3. 新しいサイトの `app/` にリポジトリを取得します。リポジトリのルートは `app/` です。`app/public/` や `internal-theme/` の中にcloneしないでください。
4. `app/` をVS Codeで開き、次の「初回セットアップ」を実施します。

新規サイトの `app/` にGit管理がまだない場合は、例えば以下で取得できます。URLは実際のリポジトリに置き換え、`main` 以外で開発中の場合は対象ブランチを指定してください。このプロジェクトにはGitリモートがまだ設定されていないため、チーム共有を始める際に共有先を用意する必要があります。

```powershell
git init
git remote add origin "リポジトリのURL"
git fetch origin
git switch --track origin/main
```

既存のGit管理があるサイトでは再初期化せず、そのチェックアウトを利用します。同名ファイルがあるため切り替えを拒否された場合は、既存ファイルを確認・退避してから進めてください。WordPress本体やDBを削除する必要はありません。

配置後は次の関係になります。リポジトリだけを空のフォルダへcloneした場合、Git管理対象外のWordPress本体などは復元されないため、Localのサイト作成と配置が別途必要です。

```text
Localのサイトフォルダ/
└─ app/                         # このリポジトリのルート・VS Codeで開く場所
   ├─ .git/
   ├─ package.json
   ├─ composer.json
   ├─ vite.config.js
   └─ public/                   # Localが用意するWordPress
      ├─ wp-config.php          # 各PC固有・Git管理対象外
      ├─ wp-admin/
      ├─ wp-includes/
      └─ wp-content/themes/internal-theme/
```

投稿や画像も同じ状態にしたい場合は、元サイトのDB・uploads・必要なプラグインを別途移行します。移行時はサイトURLの差し替えやプラグインの設定も確認してください。共有するDBや設定ファイルに認証情報・個人情報を含めないようにします。

## 初回セットアップ

この `app` フォルダをVS Codeで開き、推奨拡張（Prettier / ESLint / PHP Sniffer & Beautifier）をインストールしてください。

Node.js・npmと、PHP CLI・Composerが利用できる状態にしてください。WindowsのLocal付属ツールを使う条件や、macOS・Linuxでの指定方法は「PHP・Composerの解決」を参照してください。以下はPowerShellでの手順です。`.env` のコピーは初回のみ行い、既存の設定を上書きしないでください。

Node.jsは `.nvmrc` のバージョンを用意し、`node --version` と `npm --version` を確認します。PHP・ComposerをPATHから使う場合は `php -v` と `composer --version` も確認します。別PCの `.vscode/settings.json` や `.php-cli.ini` はコピーせず、そのPCで生成してください。

```powershell
npm ci
npm run composer -- install
npm run setup:editor
Copy-Item .env.example .env
npm run build
```

macOS・Linuxでは、環境ファイルのコピーに `cp .env.example .env` を使います。

Localを起動し、管理画面の「外観 → テーマ」でInternal Themeを有効化してください。既存のテーマは自動変更しません。

ルートの `.env` の `WP_ORIGIN` を各自のLocal URLに合わせます（例：`http://my-project.local`。末尾の `/` は付けません）。`VITE_HOST` は初期値の `localhost` を使用し、5173番ポートが使われている場合は `VITE_PORT` を変更します。HTTPSの場合は「開発」の証明書設定も行います。

各PCの `public/wp-config.php` に `define( 'WP_ENVIRONMENT_TYPE', 'local' );` があることを確認します。このPCでは設定済みですが、Gitからは共有されません。追加する場合はWordPressの読み込み処理より前に置き、同じ定数を重複定義しないでください。

最後にVS Codeを再読み込みし、`npm run lint`・`npm run lint:php`・`npm run lint:php:syntax` を実行します。`npm run dev` を起動して、テーマ表示・保存時整形・CSS差し替え・JS/PHPの自動リロードを確認してください。Windows以外では特に、実行パス・ファイル監視・HTTPS接続が各自の環境で動くことを確認します。

## 開発

```powershell
npm run dev
```

ターミナルを起動したままLocalのURLを開きます。読み込み済みCSSだけが変わった場合は、ページを再読み込みせずスタイルシートを差し替えます。JS・画像などCSS以外のビルド結果が変わった場合や、出力ファイルが削除された場合、テーマのPHPを変更した場合はページを自動再読み込みします。ビルド結果に差分がない場合は更新通知のみで表示は変わりません。PHPの処理はLocalが担当します。

CSS・JSは開発時も本番時も、テーマのPHPで指定した `dist` のファイルをWordPressサイトのURLから読み込みます。開発時はLocal、本番時は配置先のWebサーバーが配信します。`npm run dev` は初回ビルドと `src` の監視を行い、変更後に再ビルドしてブラウザへ更新を通知します。新規ファイルの追加・削除も再ビルド対象です。

開発時だけテーマ内に `.vite-dev.json` が作成され、`inc/development.php` がローカル環境かつサーバーが応答する場合にブラウザ更新用クライアントを読み込みます。これはテーマのCSS・JSの読み込み先や対象を変更しません。停止時も `dist` の読み込みは継続します。

終了時はターミナルで `Ctrl+C` を押します。強制終了などでマーカーファイルが残っても、接続確認に失敗すればブラウザ更新用クライアントは読み込みません。CSS・JSは引き続き `dist` から読み込みます。`.env`・`vite.config.js`・開発用スクリプトを変更した場合は `npm run dev` を再起動してください。

HTTPSでLocalを使う場合は、`.env` の `WP_ORIGIN` をHTTPSにし、`VITE_HTTPS_CERT` / `VITE_HTTPS_KEY` にOSで信頼済みのlocalhost用証明書と秘密鍵のパスを指定してください。Localサイトのドメイン用証明書はlocalhost用とは限りません。初期設定はHTTPです。開発サーバーはループバックのみを想定しています。

### HMRが動かないとき

- `WP_ENVIRONMENT_TYPE` が `local` か確認します。それ以外ではブラウザ更新用クライアントを読み込みません。
- ルートで `npm run dev` が起動しているか確認します。テーマ内の `.vite-dev.json` にある `origin` に `/@vite/client` を付けたURLが開けるか確認してください（例：`http://localhost:5173/@vite/client`）。接続できない場合は自動更新だけが無効になります。
- `.env` の `WP_ORIGIN` と実際に開いているLocalのURL（HTTP/HTTPS・ポート）が一致するか、ブラウザのコンソールにCORS・証明書・WebSocketのエラーがないか確認します。

## ソースとビルド出力の対応

テーマ内のサブディレクトリを保って、次のように圧縮出力します。`src/js` 以下の `.js` と `src/scss` 以下の `.scss` は、ビルド時に自動検出します。

```text
src/js/common.js           → dist/js/common.min.js
src/js/pages/index.js      → dist/js/pages/index.min.js
src/scss/common.scss       → dist/css/common.min.css
src/scss/pages/index.scss  → dist/css/pages/index.min.css
```

`_variables.scss` など、ファイル名が `_` で始まるSCSSは単独出力せず、`@use` で利用します。SCSSはJSからimportせず、独立した入口として扱ってください。JSのimportは使用できます。共通化された依存コードなど、Viteが追加生成するファイルは `dist/js/_chunks/` に出力されます。

同じ内容のSCSSや空のSCSSでも、それぞれに対応するCSSを出力します。`vite.config.js` の `wordpress-css-paths` は、ViteがCSSをまとめる場合にも手動指定するファイル名を維持するための処理です。manifestは生成・参照していません。`dist` は生成先なので直接編集せず、`src` を編集してください。

ビルド対象とページに読み込む対象は別です。初期状態では `inc/assets.php` の `wp_enqueue_style()` と `wp_enqueue_script_module()` で `dist/css/common.min.css` と `dist/js/common.min.js` を全ページに読み込みます。Viteのmanifestによる読み込み制御はありません。

追加ファイルは `inc/assets.php` の `internal_theme_enqueue_assets()` 内で、出力先とページ条件を手動指定してください。例えば、トップページだけにJSを追加する場合は次のように書きます。

```php
if ( is_front_page() ) {
    wp_enqueue_script_module(
        'internal-theme-index',
        $uri . '/dist/js/pages/index.min.js',
        array(),
        (string) filemtime( $directory . '/dist/js/pages/index.min.js' )
    );
}
```

CSSも `wp_enqueue_style()` で手動指定します。テンプレートへの直接記述に変更することもできます。固定ファイル名のキャッシュ更新にはファイルの更新日時を使います。JSはES Modules形式でビルドするため、直接記述する場合は `type="module"` を付けてください。

## 整形とチェック

```powershell
npm run format
npm run lint
npm run fix:php
npm run lint:php
npm run lint:php:syntax
npm run build
```

保存時はPHPにPHPCBF + WPCS、JS・SCSS・JSON・MarkdownなどPrettierが対応する言語にPrettierを使用します。拡張のインストール後にVS Codeを再読み込みしてください。PHP内のHTMLはPHPCBFの対応範囲で整形します。自動修正できない規約違反はPHPCSの指摘を手動修正してください。PHP向けPrettierプラグインは導入しません。SCSSの検査は現在Prettierによる書式チェックのみで、Stylelintは未導入です。

`npm run lint` はESLintとPrettierのチェック、`npm run format` はPrettierの整形です。PHPは `lint:php` / `fix:php` で別途検査・修正します。WordPress本体・プラグイン・他テーマ・生成物はフロント側のチェック対象から除外し、PHP規約チェックは自作テーマを対象にします。

共通設定は `.vscode/settings.shared.json` に保存し、`setup:editor` が各自のPHPパスを含む `.vscode/settings.json` を生成します。生成ファイルはGit管理対象外です。共通設定の更新後は再実行してください。

インデントはタブ、表示幅は4に統一します。JS・SCSSの文字列にはシングルクォートを基本として使用します（エスケープが少なくなる場合はPrettierがダブルクォートを選ぶことがあります）。JSONの引用符やYAMLのスペースインデントなど、言語仕様に必要な書式は維持します。

## PHP・Composerの解決

Windowsでは、ルートにLocalのパスを記載した `.envrc` が存在する場合、PHP・Composer・php.iniのパスだけを読み取ります（ファイル自体は実行しません）。`.envrc` はGit管理対象外のため、新しい参加者の環境には自動で用意されません。ファイルがない場合はPATHや個別指定を利用してください。Local更新後は必要に応じてパスを見直し、`npm run setup:editor` を再実行してください。

CLI用には管理対象外の `.php-cli.ini` を生成し、Localの設定を基に一時フォルダをユーザーのものへ変更し、不要なImagick拡張を外します。Local側の設定は変更しません。

他の環境ではPATHの `php` / `composer` を利用します。必要に応じて環境変数 `PHP_BINARY` / `COMPOSER_PHAR`、またはプロジェクトルートの管理対象外 `.php-tools.json` で指定できます。

macOS・LinuxではLocalのPHP・Composerパスを自動検出しません。VS Codeとターミナルから利用できるようPATHを設定するか、上記の方法で各自の実行パスを指定してください。`php -v` と `composer --version` で確認できます。

```json
{
	"php": "C:/path/to/php.exe",
	"composer": "C:/path/to/composer.phar",
	"phprc": "C:/path/to/php.ini"
}
```

PHPCBFは拡張との互換性のため3系を利用し、依存バージョンはlockファイルで共有します。

## チーム開発・配布

- lockファイルをコミットし、参加者は `npm ci` / `composer install` で同じ依存を導入します。
- Prettierは `3.9.10` に完全固定、Sassは `~1.108.1`（パッチ更新のみ許可）としています。更新は専用の変更として扱い、整形差分・ビルド結果を確認します。
- 必要に応じてローカルで整形・規約チェック・ビルドのコマンドを実行します。GitHub上での自動チェックは設定していません。
- テーマ内の `dist` はGit管理対象外です。リリース時は `npm run dev` を停止してからルートで `npm run build` を実行し、テーマのPHPテンプレート・`functions.php`・`style.css`・`inc`・`dist`など実行に必要なファイルを配布します。配布ZIPの自動作成・デプロイ処理は未導入です。
- 本番には `node_modules` / `vendor` / `.env` / `.vite-dev.json` / `.php-tools.json` や開発ツールを配置しません。本番の環境種別は `production` にします。
- DB・uploads・プラグインはこのGit管理の対象外です。必要なプラグインと匿名化した初期データの共有方法は別途決めてください。
- `src/images` は将来の画像処理用です。WebP自動変換は未導入です。

## 確認方法

テーマ有効化後に開発サーバーを起動し、SCSS変更でスタイルだけが変わること、PHP・JS変更で自動再読み込みされることを確認します。開発サーバー停止後にも `npm run build` の出力でページが表示されることを確認してください。
