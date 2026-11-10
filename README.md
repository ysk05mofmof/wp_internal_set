# Internal Theme 開発環境

LocalでWordPressを実行し、プロジェクトルートのVite設定でテーマのJS・SCSSをビルドします。WordPress 6.5以上、PHP 8.2以上、Node.js 24（`.nvmrc`参照）を使用します。LocalのPHPは本番と合わせてください。

開発ツール・設定・依存パッケージはルートにまとめ、テーマの実装とビルド結果は `public/wp-content/themes/internal-theme/` に配置します。以下のコマンドはすべてプロジェクトルート（`app`）で実行します。

## 初回セットアップ

この `app` フォルダをVS Codeで開き、推奨拡張（Prettier / ESLint / PHP Sniffer & Beautifier）をインストールしてください。

```powershell
npm ci
npm run composer -- install
npm run setup:editor
Copy-Item .env.example .env
npm run build
```

Localを起動し、管理画面の「外観 → テーマ」でInternal Themeを有効化してください。既存のテーマは自動変更しません。

`.env` の `WP_ORIGIN` を各自のLocal URLに合わせます。WordPress側の `wp-config.php` には `define( 'WP_ENVIRONMENT_TYPE', 'local' );` が必要です（この環境では設定済み）。

## 開発

```powershell
npm run dev
```

ターミナルを起動したままLocalのURLを開きます。SCSSはページ再読み込みなしで反映、JS・PHPはページを自動再読み込みします。PHPの処理はLocalが担当します。

Vite起動中だけテーマ内に `.vite-dev.json` が作成され、PHPはローカル環境かつサーバーが応答する場合にのみ開発用アセットを読み込みます。停止時はテーマ内のビルド済み `dist` に戻ります。強制終了でマーカーが残っても応答確認で判定します。

HTTPSでLocalを使う場合は、`.env` の `WP_ORIGIN` をHTTPSにし、`VITE_HTTPS_CERT` / `VITE_HTTPS_KEY` にOSで信頼済みのlocalhost用証明書と秘密鍵のパスを指定してください。Localサイトのドメイン用証明書はlocalhost用とは限りません。初期設定はHTTPです。開発サーバーはループバックのみを想定しています。

## ソースとビルド出力の対応

テーマ内のサブディレクトリを保って、次のように圧縮出力します。`src/js` 以下の `.js` と `src/scss` 以下の `.scss` は、ビルド時に自動検出します。

```text
src/js/common.js           → dist/js/common.min.js
src/js/pages/index.js      → dist/js/pages/index.min.js
src/scss/common.scss       → dist/css/common.min.css
src/scss/pages/index.scss  → dist/css/pages/index.min.css
```

`_variables.scss` など、ファイル名が `_` で始まるSCSSは単独出力せず、`@use` で利用します。SCSSはJSからimportせず、独立した入口として扱ってください。JSのimportは使用できます。共通化された依存コードなど、Viteが追加生成するファイルは `dist/js/_chunks/` に出力されます。

ビルド対象とページに読み込む対象は別です。初期状態では `common.scss` と `common.js` を全ページで読み込みます。追加したファイルは `inc/assets.php` の `internal_theme_asset_entries` フィルターで指定できます。例えば、トップページだけに追加する場合はテーマのPHPに次の設定を記述します。

```php
add_filter(
    'internal_theme_asset_entries',
    function ( $entries ) {
        if ( is_front_page() ) {
            $entries[] = 'src/scss/pages/index.scss';
            $entries[] = 'src/js/pages/index.js';
        }
        return $entries;
    }
);
```

ここでは出力先の `.min` ファイル名ではなくソースのパスを指定します。開発時はViteから読み込み、本番はmanifestを通して対応するファイルを読み込みます。固定ファイル名のキャッシュ更新にはファイルの更新日時を使います。

## 整形とチェック

```powershell
npm run format
npm run lint
npm run fix:php
npm run lint:php
npm run build
```

保存時はPHPにPHPCBF + WPCS、それ以外にPrettierを使用します。拡張のインストール後にVS Codeを再読み込みしてください。PHP内のHTMLはPHPCBFの対応範囲で整形します。自動修正できない規約違反はPHPCSの指摘を手動修正してください。PHP向けPrettierプラグインは導入しません。

共通設定は `.vscode/settings.shared.json` に保存し、`setup:editor` が各自のPHPパスを含む `.vscode/settings.json` を生成します。生成ファイルはGit管理対象外です。共通設定の更新後は再実行してください。

インデントはタブ、表示幅は4に統一します。JS・SCSSの文字列にはシングルクォートを基本として使用します（エスケープが少なくなる場合はPrettierがダブルクォートを選ぶことがあります）。JSONの引用符やYAMLのスペースインデントなど、言語仕様に必要な書式は維持します。

## PHP・Composerの解決

WindowsのLocalが生成した `.envrc` からPHP・Composer・php.iniのパスだけを読み取ります（ファイル自体は実行しません）。Local更新後は `npm run setup:editor` を再実行してください。

CLI用には管理対象外の `.php-cli.ini` を生成し、Localの設定を基に一時フォルダをユーザーのものへ変更し、不要なImagick拡張を外します。Local側の設定は変更しません。

他の環境ではPATHの `php` / `composer` を利用します。必要に応じて環境変数 `PHP_BINARY` / `COMPOSER_PHAR`、またはプロジェクトルートの管理対象外 `.php-tools.json` で指定できます。

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
- GitHub ActionsでJS・整形・PHP規約・ビルドを検証します。
- テーマ内の `dist` はGit管理対象外です。リリース時にルートでビルドし、テーマのPHPテンプレート・`style.css`・`inc`・`dist`など実行に必要なファイルを配布します。
- 本番には `node_modules` / `vendor` / `.env` / `.vite-dev.json` / `.php-tools.json` や開発ツールを配置しません。本番の環境種別は `production` にします。
- DB・uploads・プラグインはこのGit管理の対象外です。必要なプラグインと匿名化した初期データの共有方法は別途決めてください。
- `src/images` は将来の画像処理用です。WebP自動変換は未導入です。

## 確認方法

テーマ有効化後に開発サーバーを起動し、SCSS変更でスタイルだけが変わること、PHP・JS変更で自動再読み込みされることを確認します。開発サーバー停止後にも `npm run build` の出力でページが表示されることを確認してください。
