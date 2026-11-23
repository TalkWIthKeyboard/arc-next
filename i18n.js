// UI strings. The language is picked in the popup ('auto' follows Chrome's UI language) and kept in local storage.
// Command names (Open Command Bar, …) stay English everywhere: they must match Chrome's shortcuts page.
export const LANGS = { en: 'English', 'zh-CN': '简体中文', 'zh-TW': '繁體中文', ja: '日本語' };

const S = {
  en: {
    settings: 'Settings',
    language: 'Language',
    followChrome: 'Follow Chrome',
    cleanup: 'Archive Today tabs',
    never: 'Never',
    off: 'Off',
    dur: (h) => (h % 24 ? `${h} hours` : h === 24 ? '1 day' : `${h / 24} days`),
    shortcuts: 'Keyboard shortcuts',
    importArc: 'Import from Arc',
    guide: 'Setup guide',

    search: 'Search',
    open: 'Open',
    switchToTab: 'Switch to Tab',
    bookmark: 'Bookmark',
    kChoose: 'choose',
    kOpen: 'open',
    kClose: 'close',
    placeholder: 'Search or Enter URL...',
    openAsTab: 'Open as Tab',

    getStarted: 'Get started',
    done: 'Done',
    continue: 'Continue',
    back: 'Back',
    skip: 'Skip',
    import: 'Import',
    step: (n, of) => `Step ${n} of ${of}`,
    waiting: 'Waiting…',
    notSet: 'Not set yet',
    optional: (k) => `Optional, ${k}`,

    welcomeH: 'Welcome to arc-next',
    welcomeP: 'It brings some of the Arc experience back to Chrome.',
    welcomeNote: 'Setup takes about two minutes.',

    sideH: 'Move your tabs to the side',
    sideP: "Chrome's own vertical tabs are your sidebar.",
    sideOl: '<li>Right-click the tab strip at the top of the window.</li><li>Choose <b>Show Tabs Vertically</b>.</li>',
    sideNote:
      "For Arc's <kbd>⌘S</kbd>: in System Settings → Keyboard → Keyboard Shortcuts → App Shortcuts, give Chrome's <b>Collapse Tabs</b> and <b>Expand Tabs</b> both <kbd>⌘S</kbd>.",

    keysExtra: 'Open shortcut settings ↗',
    keysH: 'Set two shortcuts',
    keysP: 'Chrome does not let an extension claim these keys by itself, so you set them once. We suggest <kbd>⌘T</kbd> and <kbd>⌘D</kbd>, the same as Arc.',
    keysNote: 'Click the pencil next to each command, then press the keys.',

    arcH: 'Bring your Arc sidebar over',
    arcP: (m) => `Favorites become pinned tabs. Spaces and folders become ${m} groups.`,
    arcDone: 'Your Arc pages are in the sidebar',
    tabs: (n) => `${n} tabs`,
    arcTick: 'Tick the Spaces that belong in this Chrome profile, then choose where each part goes. Nothing changes until you press Import.',
    arcMd: 'In this file, Favorites also includes pinned and Today tabs that were not in a folder. Arc exports them together.',
    arcSkipped: (n) => (n === 1 ? '1 link that is not a web page was left out.' : `${n} links that are not web pages were left out.`),
    refile: 'Choose another file',
    arcOl: (copy, path) =>
      `<li>Click the box, then press <kbd>⌘⇧G</kbd> in the file picker.</li><li>Paste this path and press Enter: ${copy}<br><code>${path}</code></li>`,
    copyPath: 'Copy path',
    arcWin: 'On Windows, or if that file is gone: in Arc, open Settings → Advanced → Export Data, and drop <b>Arc Data Export.md</b> here instead.',
    drop: 'Drop the file here',
    dropOr: 'or click to choose it',
    notArc: 'That does not look like an Arc file.',
    whereTo: 'Where it goes',
    favorites: 'Favorites',
    pinned: 'Pinned',
    today: 'Today',
    pinnedTabs: 'Pinned tabs',
    group: (m) => `${m} group`,

    pinH: 'Pin a page you open every day',
    pinP: 'Pinned pages are your Favorites. arc-next keeps them where you left them.',
    pinCheck: 'Right-click a tab and choose <b>&nbsp;Pin</b>',
    pinDone: 'Pinned',
    pinTry: 'Now try it in a pinned tab:',
    pinOl: (k) =>
      `<li>Click around, then press ${k} to go back to the pinned page.</li><li>Press <kbd>⌘W</kbd>. It resets instead of closing.</li><li>Click a link to another site. It opens in a floating window; click back to dismiss it.</li>`,
    pinNote: 'Open any site in another tab and pin it.',

    spaceH: 'Create your first Space',
    spaceP: 'A Space holds the pages for one project. They stay put like Favorites, and everything else is Today.',
    spaceCheck: (k) => `Go to any page and press ${k}`,
    spaceDone: 'Space created',
    spaceMore: (k, m) =>
      `Press ${k} on other pages to add them, or drag tabs in. Press it again to take a page out. Rename the group freely, just keep the ${m}.`,
    spaceNote: (m) => `A group named ${m} Space will appear at the top of your sidebar.`,

    searchH: 'Find anything with the Command Bar',
    searchP: "Open tabs, bookmarks and history in one place, ranked the way Chrome's address bar ranks them.",
    searchCheck: (k) => `Press ${k} right now`,
    searchDone: 'Opened',
    searchNote: 'Type a few letters and press Enter. <kbd>↑</kbd> <kbd>↓</kbd> to choose, <kbd>Esc</kbd> to close.',

    pipExtra: 'Open the setting ↗',
    pipH: 'Keep videos in a mini player',
    pipP: 'Chrome can move a playing video into a small window when you switch tabs, and put it back when you return. It is off until you allow it.',
    pipOl: '<li>Open the setting.</li><li>Choose <b>Sites can enter picture-in-picture automatically</b>.</li>',

    startBrowsing: 'Start browsing',
    endH: "You're all set",
    endKeys: (a, b, c) => `${a} find &nbsp; ${b} add to Space &nbsp; ${c} reset &nbsp; <kbd>⌘W</kbd> resets pinned pages`,
    endWarn: (when) => `Today tabs left unused ${when} are closed automatically. <kbd>⌘⇧T</kbd> brings them back. Change this in the toolbar popup.`,
    forH: (h) => (h % 24 ? `for ${h} hours` : h === 24 ? 'for a day' : `for ${h / 24} days`),
  },

  'zh-CN': {
    settings: '设置',
    language: '语言',
    followChrome: '跟随 Chrome',
    cleanup: '自动关闭 Today 标签页',
    never: '从不',
    off: '关',
    dur: (h) => (h % 24 ? `${h} 小时` : `${h / 24} 天`),
    shortcuts: '键盘快捷键',
    importArc: '从 Arc 导入',
    guide: '使用引导',

    search: '搜索',
    open: '打开',
    switchToTab: '切换到标签页',
    bookmark: '书签',
    kChoose: '选择',
    kOpen: '打开',
    kClose: '关闭',
    placeholder: '搜索或输入网址…',
    openAsTab: '作为标签页打开',

    getStarted: '开始',
    done: '完成',
    continue: '继续',
    back: '返回',
    skip: '跳过',
    import: '导入',
    step: (n, of) => `第 ${n} 步，共 ${of} 步`,
    waiting: '等待中…',
    notSet: '尚未设置',
    optional: (k) => `可选，${k}`,

    welcomeH: '欢迎使用 arc-next',
    welcomeP: '把 Arc 的一部分体验带回 Chrome。',
    welcomeNote: '设置大约需要两分钟。',

    sideH: '把标签页移到侧边',
    sideP: 'Chrome 自带的垂直标签页就是你的侧边栏。',
    sideOl: '<li>右键点击窗口顶部的标签栏。</li><li>选择<b>垂直显示标签页</b>（Show Tabs Vertically）。</li>',
    sideNote:
      '想要 Arc 的 <kbd>⌘S</kbd>：在 系统设置 → 键盘 → 键盘快捷键 → App 快捷键 里，给 Chrome 的“收起”和“展开”标签页两个菜单项都设为 <kbd>⌘S</kbd>（英文界面是 <b>Collapse Tabs</b> 和 <b>Expand Tabs</b>）。名称必须与你的 Chrome 菜单里显示的完全一致。',

    keysExtra: '打开快捷键设置 ↗',
    keysH: '设置两个快捷键',
    keysP: 'Chrome 不允许扩展自己占用这些按键，需要你手动设一次。建议用 <kbd>⌘T</kbd> 和 <kbd>⌘D</kbd>，和 Arc 一样。',
    keysNote: '点击每个命令旁的铅笔图标，然后按下按键。',

    arcH: '把 Arc 侧边栏搬过来',
    arcP: (m) => `Favorites 变成固定标签页，Space 和文件夹变成 ${m} 分组。`,
    arcDone: '你的 Arc 页面已在侧边栏里',
    tabs: (n) => `${n} 个标签页`,
    arcTick: '勾选属于这个 Chrome 用户的 Space，再选择每部分放到哪里。按下导入前不会有任何改动。',
    arcMd: '这个文件里，Favorites 还包含不在文件夹里的固定和 Today 标签页，Arc 是把它们一起导出的。',
    arcSkipped: (n) => `已略过 ${n} 个不是网页的链接。`,
    refile: '换一个文件',
    arcOl: (copy, path) => `<li>点击方框，在文件选择器里按 <kbd>⌘⇧G</kbd>。</li><li>粘贴这个路径并按回车：${copy}<br><code>${path}</code></li>`,
    copyPath: '复制路径',
    arcWin: '在 Windows 上，或者找不到这个文件：在 Arc 里打开 设置 → 高级 → 导出数据，把 <b>Arc Data Export.md</b> 拖到这里。',
    drop: '把文件拖到这里',
    dropOr: '或点击选择',
    notArc: '这看起来不是 Arc 的文件。',
    whereTo: '放到哪里',
    favorites: 'Favorites',
    pinned: '固定',
    today: 'Today',
    pinnedTabs: '固定标签页',
    group: (m) => `${m} 分组`,

    pinH: '固定一个每天都打开的页面',
    pinP: '固定的页面就是你的 Favorites，arc-next 会让它们待在原处。',
    pinCheck: '右键点击标签页，选择<b>固定</b>',
    pinDone: '已固定',
    pinTry: '在固定的标签页里试一试：',
    pinOl: (k) =>
      `<li>随便点几下，然后按 ${k} 回到固定的页面。</li><li>按 <kbd>⌘W</kbd>，它会重置而不是关闭。</li><li>点击指向其他网站的链接，它会在浮动窗口里打开；点回原页面就会消失。</li>`,
    pinNote: '在另一个标签页打开任意网站，然后固定它。',

    spaceH: '创建你的第一个 Space',
    spaceP: '一个 Space 装着一个项目的页面。它们像 Favorites 一样待在原处，其余的都是 Today。',
    spaceCheck: (k) => `打开任意页面，按 ${k}`,
    spaceDone: '已创建 Space',
    spaceMore: (k, m) => `在其他页面按 ${k} 加进来，或者把标签页拖进去。再按一次就移出。分组名可以随便改，保留 ${m} 就行。`,
    spaceNote: (m) => `侧边栏顶部会出现一个名为 ${m} Space 的分组。`,

    searchH: '用命令栏找到任何东西',
    searchP: '打开的标签页、书签和历史记录都在一处，排序方式与 Chrome 地址栏相同。',
    searchCheck: (k) => `现在按 ${k}`,
    searchDone: '已打开',
    searchNote: '输入几个字母后按回车。<kbd>↑</kbd> <kbd>↓</kbd> 选择，<kbd>Esc</kbd> 关闭。',

    pipExtra: '打开该设置 ↗',
    pipH: '让视频留在小窗里',
    pipP: '切换标签页时，Chrome 可以把正在播放的视频放进小窗，回来时再放回去。默认关闭，需要你允许。',
    pipOl: '<li>打开该设置。</li><li>选择<b>网站可以自动进入画中画模式</b>。</li>',

    startBrowsing: '开始浏览',
    endH: '一切就绪',
    endKeys: (a, b, c) => `${a} 搜索 &nbsp; ${b} 加入 Space &nbsp; ${c} 重置 &nbsp; <kbd>⌘W</kbd> 重置固定页面`,
    endWarn: (when) => `${when}未使用的 Today 标签页会被自动关闭，<kbd>⌘⇧T</kbd> 可以找回。可在工具栏弹窗中修改。`,
    forH: (h) => (h % 24 ? `${h} 小时` : `${h / 24} 天`),
  },

  'zh-TW': {
    settings: '設定',
    language: '語言',
    followChrome: '跟隨 Chrome',
    cleanup: '自動關閉 Today 分頁',
    never: '永不',
    off: '關',
    dur: (h) => (h % 24 ? `${h} 小時` : `${h / 24} 天`),
    shortcuts: '鍵盤快速鍵',
    importArc: '從 Arc 匯入',
    guide: '使用導覽',

    search: '搜尋',
    open: '開啟',
    switchToTab: '切換到分頁',
    bookmark: '書籤',
    kChoose: '選擇',
    kOpen: '開啟',
    kClose: '關閉',
    placeholder: '搜尋或輸入網址…',
    openAsTab: '以分頁開啟',

    getStarted: '開始',
    done: '完成',
    continue: '繼續',
    back: '返回',
    skip: '略過',
    import: '匯入',
    step: (n, of) => `第 ${n} 步，共 ${of} 步`,
    waiting: '等待中…',
    notSet: '尚未設定',
    optional: (k) => `選用，${k}`,

    welcomeH: '歡迎使用 arc-next',
    welcomeP: '把 Arc 的一部分體驗帶回 Chrome。',
    welcomeNote: '設定大約需要兩分鐘。',

    sideH: '把分頁移到側邊',
    sideP: 'Chrome 內建的垂直分頁就是你的側邊欄。',
    sideOl: '<li>在視窗頂端的分頁列上按右鍵。</li><li>選擇<b>垂直顯示分頁</b>（Show Tabs Vertically）。</li>',
    sideNote:
      '想要 Arc 的 <kbd>⌘S</kbd>：在 系統設定 → 鍵盤 → 鍵盤快速鍵 → App 快速鍵 中，把 Chrome 的「收合」和「展開」分頁兩個選單項目都設為 <kbd>⌘S</kbd>（英文介面是 <b>Collapse Tabs</b> 和 <b>Expand Tabs</b>）。名稱必須與你的 Chrome 選單顯示的完全相同。',

    keysExtra: '開啟快速鍵設定 ↗',
    keysH: '設定兩個快速鍵',
    keysP: 'Chrome 不允許擴充功能自行佔用這些按鍵，需要你手動設定一次。建議使用 <kbd>⌘T</kbd> 和 <kbd>⌘D</kbd>，與 Arc 相同。',
    keysNote: '點擊每個指令旁的鉛筆圖示，然後按下按鍵。',

    arcH: '把 Arc 側邊欄搬過來',
    arcP: (m) => `Favorites 會變成固定分頁，Space 和資料夾會變成 ${m} 群組。`,
    arcDone: '你的 Arc 頁面已在側邊欄中',
    tabs: (n) => `${n} 個分頁`,
    arcTick: '勾選屬於這個 Chrome 設定檔的 Space，再選擇每個部分要放到哪裡。按下匯入前不會有任何變更。',
    arcMd: '這個檔案中，Favorites 也包含不在資料夾裡的固定和 Today 分頁，Arc 會把它們一起匯出。',
    arcSkipped: (n) => `已略過 ${n} 個不是網頁的連結。`,
    refile: '選擇其他檔案',
    arcOl: (copy, path) => `<li>點擊方框，在檔案選擇器中按 <kbd>⌘⇧G</kbd>。</li><li>貼上這個路徑並按 Enter：${copy}<br><code>${path}</code></li>`,
    copyPath: '複製路徑',
    arcWin: '在 Windows 上，或找不到這個檔案：在 Arc 中開啟 設定 → 進階 → 匯出資料，把 <b>Arc Data Export.md</b> 拖到這裡。',
    drop: '把檔案拖到這裡',
    dropOr: '或點擊選擇',
    notArc: '這看起來不是 Arc 的檔案。',
    whereTo: '放到哪裡',
    favorites: 'Favorites',
    pinned: '固定',
    today: 'Today',
    pinnedTabs: '固定分頁',
    group: (m) => `${m} 群組`,

    pinH: '固定一個每天都會開啟的頁面',
    pinP: '固定的頁面就是你的 Favorites，arc-next 會讓它們留在原處。',
    pinCheck: '在分頁上按右鍵，選擇<b>固定</b>',
    pinDone: '已固定',
    pinTry: '在固定的分頁中試試看：',
    pinOl: (k) =>
      `<li>隨意點幾下，然後按 ${k} 回到固定的頁面。</li><li>按 <kbd>⌘W</kbd>，它會重設而不是關閉。</li><li>點擊前往其他網站的連結，它會在浮動視窗中開啟；點回原頁面就會消失。</li>`,
    pinNote: '在另一個分頁開啟任意網站，然後固定它。',

    spaceH: '建立你的第一個 Space',
    spaceP: '一個 Space 收納一個專案的頁面。它們像 Favorites 一樣留在原處，其餘的都是 Today。',
    spaceCheck: (k) => `開啟任意頁面，按 ${k}`,
    spaceDone: '已建立 Space',
    spaceMore: (k, m) => `在其他頁面按 ${k} 加入，或把分頁拖進去。再按一次就移出。群組名稱可以隨意修改，保留 ${m} 即可。`,
    spaceNote: (m) => `側邊欄頂端會出現名為 ${m} Space 的群組。`,

    searchH: '用指令列找到任何東西',
    searchP: '開啟的分頁、書籤和瀏覽記錄集中在一處，排序方式與 Chrome 網址列相同。',
    searchCheck: (k) => `現在按 ${k}`,
    searchDone: '已開啟',
    searchNote: '輸入幾個字母後按 Enter。<kbd>↑</kbd> <kbd>↓</kbd> 選擇，<kbd>Esc</kbd> 關閉。',

    pipExtra: '開啟該設定 ↗',
    pipH: '讓影片留在子母畫面中',
    pipP: '切換分頁時，Chrome 可以把正在播放的影片移到小視窗，回來時再放回去。預設關閉，需要你允許。',
    pipOl: '<li>開啟該設定。</li><li>選擇<b>網站可以自動進入子母畫面模式</b>。</li>',

    startBrowsing: '開始瀏覽',
    endH: '一切就緒',
    endKeys: (a, b, c) => `${a} 搜尋 &nbsp; ${b} 加入 Space &nbsp; ${c} 重設 &nbsp; <kbd>⌘W</kbd> 重設固定頁面`,
    endWarn: (when) => `${when}未使用的 Today 分頁會自動關閉，<kbd>⌘⇧T</kbd> 可以找回。可在工具列彈出視窗中修改。`,
    forH: (h) => (h % 24 ? `${h} 小時` : `${h / 24} 天`),
  },

  ja: {
    settings: '設定',
    language: '言語',
    followChrome: 'Chrome に合わせる',
    cleanup: 'Today タブを自動で閉じる',
    never: 'しない',
    off: 'オフ',
    dur: (h) => (h % 24 ? `${h} 時間` : `${h / 24} 日`),
    shortcuts: 'キーボード ショートカット',
    importArc: 'Arc から読み込む',
    guide: 'セットアップガイド',

    search: '検索',
    open: '開く',
    switchToTab: 'タブに切り替え',
    bookmark: 'ブックマーク',
    kChoose: '選択',
    kOpen: '開く',
    kClose: '閉じる',
    placeholder: '検索または URL を入力…',
    openAsTab: 'タブで開く',

    getStarted: 'はじめる',
    done: '完了',
    continue: '続ける',
    back: '戻る',
    skip: 'スキップ',
    import: '読み込む',
    step: (n, of) => `ステップ ${n}/${of}`,
    waiting: '待機中…',
    notSet: '未設定',
    optional: (k) => `任意、${k}`,

    welcomeH: 'arc-next へようこそ',
    welcomeP: 'Arc の体験の一部を Chrome に取り戻します。',
    welcomeNote: 'セットアップは 2 分ほどで終わります。',

    sideH: 'タブを横に移す',
    sideP: 'Chrome 標準の縦型タブがあなたのサイドバーです。',
    sideOl: '<li>ウィンドウ上部のタブバーを右クリックします。</li><li><b>タブを縦に表示</b>（Show Tabs Vertically）を選びます。</li>',
    sideNote:
      'Arc の <kbd>⌘S</kbd> を使うには：システム設定 → キーボード → キーボードショートカット → アプリのショートカット で、Chrome のタブを「折りたたむ」「展開する」2 つのメニュー項目に <kbd>⌘S</kbd> を割り当てます（英語版では <b>Collapse Tabs</b> と <b>Expand Tabs</b>）。名前はお使いの Chrome のメニュー表示と完全に一致させてください。',

    keysExtra: 'ショートカット設定を開く ↗',
    keysH: 'ショートカットを 2 つ設定する',
    keysP:
      'Chrome では拡張機能がこれらのキーを自分で割り当てられないため、一度だけ手動で設定します。Arc と同じ <kbd>⌘T</kbd> と <kbd>⌘D</kbd> がおすすめです。',
    keysNote: '各コマンドの横の鉛筆アイコンをクリックして、キーを押します。',

    arcH: 'Arc のサイドバーを移す',
    arcP: (m) => `Favorites は固定タブに、Space とフォルダは ${m} グループになります。`,
    arcDone: 'Arc のページがサイドバーに入りました',
    tabs: (n) => `${n} 個のタブ`,
    arcTick: 'この Chrome プロファイルで使う Space にチェックを入れ、各項目の移し先を選んでください。「読み込む」を押すまで何も変わりません。',
    arcMd: 'このファイルでは、フォルダに入っていない固定タブと Today タブも Favorites に含まれます。Arc がまとめて書き出すためです。',
    arcSkipped: (n) => `Web ページではないリンク ${n} 件を除外しました。`,
    refile: '別のファイルを選ぶ',
    arcOl: (copy, path) =>
      `<li>枠をクリックし、ファイル選択画面で <kbd>⌘⇧G</kbd> を押します。</li><li>このパスを貼り付けて Enter を押します：${copy}<br><code>${path}</code></li>`,
    copyPath: 'パスをコピー',
    arcWin:
      'Windows の場合やファイルが見つからない場合：Arc で 設定 → 詳細 → データを書き出す を開き、<b>Arc Data Export.md</b> をここにドロップしてください。',
    drop: 'ファイルをここにドロップ',
    dropOr: 'またはクリックして選択',
    notArc: 'Arc のファイルではないようです。',
    whereTo: '移し先',
    favorites: 'Favorites',
    pinned: '固定',
    today: 'Today',
    pinnedTabs: '固定タブ',
    group: (m) => `${m} グループ`,

    pinH: '毎日開くページを固定する',
    pinP: '固定したページがあなたの Favorites です。arc-next はそれを元の場所に保ちます。',
    pinCheck: 'タブを右クリックして<b>固定</b>を選ぶ',
    pinDone: '固定しました',
    pinTry: '固定したタブで試してみましょう：',
    pinOl: (k) =>
      `<li>いくつかリンクをたどってから ${k} を押すと、固定したページに戻ります。</li><li><kbd>⌘W</kbd> を押すと、閉じずにリセットされます。</li><li>別のサイトへのリンクをクリックすると、フローティングウィンドウで開きます。元のページをクリックすると消えます。</li>`,
    pinNote: '別のタブで好きなサイトを開いて固定してください。',

    spaceH: '最初の Space を作る',
    spaceP: 'Space には 1 つのプロジェクトのページをまとめます。Favorites と同じく元の場所に残り、それ以外はすべて Today です。',
    spaceCheck: (k) => `好きなページで ${k} を押す`,
    spaceDone: 'Space を作成しました',
    spaceMore: (k, m) =>
      `ほかのページでも ${k} を押すか、タブをドラッグして追加できます。もう一度押すと外れます。グループ名は ${m} を残せば自由に変えられます。`,
    spaceNote: (m) => `サイドバーの一番上に ${m} Space という名前のグループが表示されます。`,

    searchH: 'コマンドバーで何でも探す',
    searchP: '開いているタブ、ブックマーク、履歴を 1 か所で検索。並び順は Chrome のアドレスバーと同じです。',
    searchCheck: (k) => `今すぐ ${k} を押す`,
    searchDone: '開きました',
    searchNote: '数文字入力して Enter。<kbd>↑</kbd> <kbd>↓</kbd> で選択、<kbd>Esc</kbd> で閉じます。',

    pipExtra: '設定を開く ↗',
    pipH: '動画をミニプレーヤーで再生し続ける',
    pipP: 'タブを切り替えると、Chrome は再生中の動画を小さなウィンドウに移し、戻ると元に戻せます。許可するまではオフです。',
    pipOl: '<li>設定を開きます。</li><li><b>サイトが自動的にピクチャー イン ピクチャー モードに入ることを許可する</b>を選びます。</li>',

    startBrowsing: 'ブラウジングを始める',
    endH: '準備完了です',
    endKeys: (a, b, c) => `${a} 検索 &nbsp; ${b} Space に追加 &nbsp; ${c} リセット &nbsp; <kbd>⌘W</kbd> 固定ページをリセット`,
    endWarn: (when) => `${when}使われていない Today タブは自動で閉じます。<kbd>⌘⇧T</kbd> で戻せます。ツールバーのポップアップで変更できます。`,
    forH: (h) => (h % 24 ? `${h} 時間` : `${h / 24} 日間`),
  },
};

let cur = 'en';

// 'auto' (or nothing saved): Chrome's UI language, falling back to English.
export function resolve(pref) {
  if (S[pref]) return pref;
  const ui = chrome.i18n.getUILanguage().toLowerCase();
  if (ui.startsWith('zh')) return /tw|hk|mo|hant/.test(ui) ? 'zh-TW' : 'zh-CN';
  return ui.startsWith('ja') ? 'ja' : 'en';
}

// Service workers cannot use top-level await, so callers await this instead.
export const ready = chrome.storage.local.get('lang').then(({ lang }) => {
  cur = resolve(lang);
});
chrome.storage.onChanged.addListener((c, area) => {
  if (area === 'local' && c.lang) cur = resolve(c.lang.newValue);
});

export function t(key, ...args) {
  const v = S[cur][key] ?? S.en[key];
  return typeof v === 'function' ? v(...args) : v;
}
