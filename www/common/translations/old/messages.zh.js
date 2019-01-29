/*
 * This is an internal language file.
 * If you want to change some translations in your CryptPad instance, use the '/customize/translations/messages.{LANG}.js'
 * file (make a copy from /customize.dist/translations/messages.{LANG}.js)
 */
define(function () {
    var out = {};
    // translations must set this key for their language to be available in
    // the language dropdowns that are shown throughout Cryptpad's interface

    out._languageName = 'Chinese';  

    out.main_title = "CryptPad: 零知識, 即時協作編寫";
    out.main_slogan = "團結就是力量 - 合作是關鍵"; // TODO remove?

    out.type = {};
    out.type.pad = '富文本';
    out.type.code = '編碼';
    out.type.poll = '投票';
    out.type.slide = '投影片簡報';
    out.type.drive = '磁碟';
    out.type.whiteboard = '白板';
    out.type.file = '檔案';
    out.type.media = '多媒體';

    out.button_newpad = '富文件檔案';
    out.button_newcode = '新代碼檔案';
    out.button_newpoll = '新投票調查';
    out.button_newslide = '新簡報';
    out.button_newwhiteboard = '新白板';

    // NOTE: We want to update the 'common_connectionLost' key.
    // Please do not add a new 'updated_common_connectionLostAndInfo' but change directly the value of 'common_connectionLost'
    out.updated_0_common_connectionLost = "<b>伺服器連線中斷</b><br>現在是唯讀狀態，直到連線恢復正常。";
    out.common_connectionLost = out.updated_0_common_connectionLost;

    out.websocketError = '無法連結上 websocket 伺服器...';
    out.typeError = "這個編輯檔與所選的應用程式並不相容";
    out.onLogout = '你已登出, {0}點擊這裏{1} 來登入<br>或按<em>Escape</em> 來以唯讀模型使用你的編輯檔案';
    out.wrongApp = "無法在瀏覽器顯示即時期間的內容，請試著再重新載入本頁。";

    out.loading = "載入中...";
    out.error = "錯誤";
    out.saved = "儲存";
    out.synced = "所有資料已儲存好了";
    out.deleted = "自 CryptDrive 刪除檔案";

    out.disconnected = '已斷線';
    out.synchronizing = '同步中';
    out.reconnecting = '重新連結...';
    out.lag = 'Lag';
    out.readonly = '唯讀';
    out.anonymous = "匿名";
    out.yourself = "你自己";
    out.anonymousUsers = "匿名的編輯群";
    out.anonymousUser = "匿名的編輯群者";
    out.users = "用戶";
    out.and = "與";
    out.viewer = "檢視者";
    out.viewers = "檢視群";
    out.editor = "編輯者";
    out.editors = "編輯群";

    out.language = "語言";

    out.comingSoon = "即將上市...";

    out.newVersion = '<b>CryptPad 已更新!</b><br>' +
                     '檢查最新版本有什麼新功能:<br>'+
                     '<a href="https://github.com/xwiki-labs/cryptpad/releases/tag/{0}" target="_blank">CryptPad新發佈記事 {0}</a>';

    out.upgrade = "昇級";
    out.upgradeTitle = "昇級帳戶以取得更多的儲存空間";
    out.MB = "MB";
    out.GB = "GB";
    out.KB = "KB";

    out.formattedMB = "{0} MB";
    out.formattedGB = "{0} GB";
    out.formattedKB = "{0} KB";

    out.greenLight = "每件事都很順利";
    out.orangeLight = "連線速度慢可能會影響用戶體驗";
    out.redLight = "你這段期間的連線已中斷";

    out.pinLimitReached = "你已達到儲存容量上限";
    out.updated_0_pinLimitReachedAlert = "你已達到儲存容量上限，新檔案不會儲存到你的 CryptDrive.<br>" +
        '要嘛你可以自 CryptDrive 移除原有文件或是 <a href="https://accounts.cryptpad.fr/#!on={0}" target="_blank">昇級到付費版</a>增加你的儲存容量。';
    out.pinLimitReachedAlert = out.updated_0_pinLimitReachedAlert;
    out.pinLimitNotPinned = "你已達到容量使用上限<br>"+
                            "這個檔案無法儲存到你的 CryptDrive.";
    out.pinLimitDrive = "你已達到容量使用上限<br>" +
                        "你不能建立新的編輯檔案";
    out.importButtonTitle = '從電腦上傳滙入檔案';

    out.exportButtonTitle = '將這個檔案滙出到電腦';
    out.exportPrompt = '你希望怎麼命名你的檔案?';

    out.changeNamePrompt = '更換你的名稱(若留空白則會成為無名氏): ';
    out.user_rename = "改變顯示名稱";
    out.user_displayName = "顯示名稱";
    out.user_accountName = "帳號名稱";

    out.clickToEdit = "點擊以編輯";

    out.forgetButtonTitle = '將這個檔案移置垃圾筒';
    out.forgetPrompt = '點擊 OK 將把這個檔案移置垃圾筒，確定要這樣做嗎';
    out.movedToTrash = '這個檔案已被移置垃圾筒<br><a href="/drive/">讀取我的雲端硬碟</a>';

    out.shareButton = '分享';
    out.shareSuccess = '複製連結到剪貼版';

    out.newButton = '新';
    out.newButtonTitle = '建立新的工作檔案';

    out.saveTemplateButton = "存成模版";
    out.saveTemplatePrompt = "為這個模版選一個標題";
    out.templateSaved = "模版已儲存!";
    out.selectTemplate = "選擇一個模版或是按 escape 跳出";

    out.previewButtonTitle = "顯示或隱藏 Markdown 預覽模式";

    out.presentButtonTitle = "輸入簡報模式";

    out.backgroundButtonTitle = '改變簡報的顏色背景';
    out.colorButtonTitle = '在簡報模式下改變文字顏色';

    out.printButton = "列印 (enter)";
    out.printButtonTitle = "列印投影片或滙出成 PDF 檔案";
    out.printOptions = "版型選項";
    out.printSlideNumber = "顯示投影片號碼";
    out.printDate = "顯示日期";
    out.printTitle = "顯示檔案標題";
    out.printCSS = "自定風格規則 (CSS):";
    out.printTransition = "啟用轉場動畫";

    out.slideOptionsTitle = "自定你的投影片";
    out.slideOptionsButton = "儲存 (enter)";

    out.editShare = "編輯連結";
    out.editShareTitle = "複製所編輯的連結到剪貼版";
    out.editOpen = "在新分頁開啟連結編輯";
    out.editOpenTitle = "在新分頁開啟這個檔案為編輯模式";
    out.viewShare = "唯讀連結";
    out.viewShareTitle = "複製唯讀的連結到剪貼版";
    out.viewOpen = "在新分頁開啟唯讀連結";
    out.viewOpenTitle = "在新分頁開啟這個檔案為唯讀模式";

    out.notifyJoined = "{0} 已加入此協作期間";
    out.notifyRenamed = "{0} 現在改名為 {1}";
    out.notifyLeft = "{0} 已離開了這個協作期間";

    out.okButton = 'OK (enter)';

    out.cancel = "取消";
    out.cancelButton = '取消 (esc)';

    out.historyButton = "顯示文件歷史";
    out.history_next = "到下一個版本";
    out.history_prev = "到之前的版本";
    out.history_goTo = "到所選擇的版本";
    out.history_close = "回到";
    out.history_closeTitle = "關閉歷史記錄";
    out.history_restore = "重建";
    out.history_restoreTitle = "將此文件重建到所挑選的版本";
    out.history_restorePrompt = "確定要將這個展現的版本來取代現有版本嗎？";
    out.history_restoreDone = "文件已重建";
    out.history_version = "版本:";

    // Polls

    out.poll_title = "零知識日期挑選";
    out.poll_subtitle = "零知識, <em>即時</em> 排程";

    out.poll_p_save = "你的設定會立即更新, 因此從不需要按鍵儲存或擔心遺失。";
    out.poll_p_encryption = "你所有幹入的資料都會予以加密，只有取得連結者才可以讀取它。即便是伺服器也不能看到你作了什麼變動。";

    out.wizardLog = "點擊左上方的按鍵以回到你的調查";
    out.wizardTitle = "使用精靈來建立調查投票";
    out.wizardConfirm = "你真的要新增這些問題到你的調查中嗎?";

    out.poll_publish_button = "發佈";
    out.poll_admin_button = "管理者";
    out.poll_create_user = "新增使用者";
    out.poll_create_option = "新增選項";
    out.poll_commit = "投入";

    out.poll_closeWizardButton = "關閉協助精靈";
    out.poll_closeWizardButtonTitle = "關閉協助精靈";
    out.poll_wizardComputeButton = "計算最適化";
    out.poll_wizardClearButton = "清除表格";
    out.poll_wizardDescription = "透過輸入任何日期或時間分段，可自動建立一些選項";
    out.poll_wizardAddDateButton = "+ 日期";
    out.poll_wizardAddTimeButton = "+ 時間";

    out.poll_optionPlaceholder = "選項";
    out.poll_userPlaceholder = "你的名稱";
    out.poll_removeOption = "確定要移除這個選項嗎?";
    out.poll_removeUser = "確定要移除這位使用者嗎?";

    out.poll_titleHint = "標題";
    out.poll_descriptionHint = "請簡述這個調查目的，完成時使用「發佈鍵」。任何知道此調查連結者可以更改這裏的描述內容，但我們不鼓勵這麼做。.";

    // Canvas
    out.canvas_clear = "清除";
    out.canvas_delete = "刪除所選";
    out.canvas_disable = "取消繪圖";
    out.canvas_enable = "啟動繪圖";
    out.canvas_width = "寛度";
    out.canvas_opacity = "透明度";

    // File manager

    out.fm_rootName = "根目錄";
    out.fm_trashName = "垃圾桶";
    out.fm_unsortedName = "未整理的檔案";
    out.fm_filesDataName = "所有檔案";
    out.fm_templateName = "模版";
    out.fm_searchName = "搜尋";
    out.fm_searchPlaceholder = "搜尋...";
    out.fm_newButton = "新的";
    out.fm_newButtonTitle = "建立新工作檔案或資料夾";
    out.fm_newFolder = "新資料夾";
    out.fm_newFile = "新工作檔案";
    out.fm_folder = "資料夾";
    out.fm_folderName = "資料夾名稱";
    out.fm_numberOfFolders = "# 個資料夾";
    out.fm_numberOfFiles = "# 檔案";
    out.fm_fileName = "檔案名";
    out.fm_title = "標題";
    out.fm_type = "類型";
    out.fm_lastAccess = "上回使用";
    out.fm_creation = "創建";
    out.fm_forbidden = "禁止的行為";
    out.fm_originalPath = "原始路徑";
    out.fm_openParent = "顯示在目錄夾中";
    out.fm_noname = "無標題文件";
    out.fm_emptyTrashDialog = "確定要清理垃圾筒嗎?";
    out.fm_removeSeveralPermanentlyDialog = "確定要將這些 {0} 東西永自垃圾筒移除嗎？";
    out.fm_removePermanentlyDialog = "你確定要永久地移除這些項目嗎？";
    out.fm_removeSeveralDialog = "確定要將這些 {0} 東西移至垃圾筒嗎？";
    out.fm_removeDialog = "確定要將移動 {0} 至垃圾筒嗎？";
    out.fm_restoreDialog = "確定要重置 {0} 到它之前的位置嗎？";
    out.fm_unknownFolderError = "所選或上回訪問的目錄不再存在了，正開啟上層目錄中...";
    out.fm_contextMenuError = "無法在此元件下打開文本選單。如果這個問題一直發生，請試著重新載入此頁。";
    out.fm_selectError = "無法選取目標的要素。如果這個問題一直發生，請試著重新載入此頁。";
    out.fm_categoryError = "無法打開所選的類別，正在顯示根目錄。";
    out.fm_info_root = "在此建立任何巢狀目錄夾以便於整理分類你的檔案。";
    out.fm_info_unsorted = '包含所有你曾訪問過的檔案，其尚未被整理在 "根目錄" 或移到到"垃圾筒".'; // "My Documents" should match with the "out.fm_rootName" key, and "Trash" with "out.fm_trashName"
    out.fm_info_template = '包含所有工作檔案已存成模版，便於讓你在建立新工作檔案時套用。';
    out.updated_0_fm_info_trash = '清空垃圾筒好讓 CryptDrive 多出一些空間';
    out.fm_info_trash = out.updated_0_fm_info_trash;
    out.fm_info_allFiles = '包含在 "根目錄", "未整理的" 和 "垃圾筒" 裏的所有檔案。這裏你無法移動或移除檔案。'; // Same here
    out.fm_info_anonymous = '你尚未登入，因此這些工作檔案可能會被刪除。 (<a href="https://blog.cryptpad.fr/2017/05/17/You-gotta-log-in/" target="_blank">了解原因</a>). ' +
                            '<a href="/register/">註冊</a>或<a href="/login/">登入</a>以便保留它們。';
    out.fm_alert_backupUrl = "這個雲端硬碟的備份連結<br>" +
                             "<strong>高度建議</strong>把自己的 IP 資訊保留成只有自己知道<br>" +
                             "萬一瀏覽器記憶被消除，你可以用它來接收所有的檔案。<br>" +
                             "任何知道此連結的人可以編輯或移除你檔案管理底下的所有檔案。<br>";
    out.fm_alert_anonymous = "嗨你好, 你目前正以匿名方式在使用 CryptPad , 這也沒問題，不過你的東西過一段時間沒動靜後，就會自動被刪除。 " +
                             "匿名的用戶我們也取消其進階功能，因為我們要明確地讓用戶知道，這裏 " +
                             '不是一個安全存放東西的地方。你可以 <a href="https://blog.cryptpad.fr/2017/05/17/You-gotta-log-in/" target="_blank">進一步了解 </a> 關於 ' +
                             '為何我們這樣作，以及為何你最好能夠<a href="/register/">註冊</a> 以及 <a href="/login/">登錄</a>使用。';
    out.fm_backup_title = '備份連結';
    out.fm_nameFile = '你想要如何來命名這個檔案呢？';
    out.fm_error_cantPin = "內部伺服器出錯，請重新載入本頁並再試一次。";
    // File - Context menu
    out.fc_newfolder = "新資料夾";
    out.fc_rename = "重新命名";
    out.fc_open = "打開";
    out.fc_open_ro = "打開 (唯讀)";
    out.fc_delete = "刪除";
    out.fc_restore = "重置";
    out.fc_remove = "永久刪除";
    out.fc_empty = "清理垃圾筒";
    out.fc_prop = "Properties";
    out.fc_sizeInKilobytes = "容量大小 (Kilobytes)";
    // fileObject.js (logs)
    out.fo_moveUnsortedError = "你不能移動資料夾到未整理的工作檔案清單";
    out.fo_existingNameError = "名稱已被使用，請選擇其它名稱";
    out.fo_moveFolderToChildError = "你不能移動資料夾到它的子資料夾底下";
    out.fo_unableToRestore = "無法將這個檔案重置到原始的位置。你可以試著將它移動到其它新位置。";
    out.fo_unavailableName = "在新位置裏同名的檔案或資料夾名稱已存在，請重新命名後再試看看。";

    // login
    out.login_login = "登入";
    out.login_makeAPad = '匿名地建立一個工作檔案';
    out.login_nologin = "瀏覽本地的工作檔案";
    out.login_register = "註冊";
    out.logoutButton = "登出";
    out.settingsButton = "設定";

    out.login_username = "用戶名";
    out.login_password = "密碼";
    out.login_confirm = "確認你的密碼";
    out.login_remember = "記住我";

    out.login_hashing = "散列你的密碼中，這要花上一點時間";

    out.login_hello = 'Hello {0},'; // {0} is the username
    out.login_helloNoName = 'Hello,';
    out.login_accessDrive = '取用你的磁碟';
    out.login_orNoLogin = '或';

    out.login_noSuchUser = '無效的用戶名或密碼，請再試一次或重新註冊';
    out.login_invalUser = '要求用戶名';
    out.login_invalPass = '要求密碼';
    out.login_unhandledError = '發生了未預期的錯誤 :(';

    out.register_importRecent = "滙入檔案記錄 (建議)";
    out.register_acceptTerms = "我同意 <a href='/terms.html'>服務條款</a>";
    out.register_passwordsDontMatch = "密碼不相符！";
    out.register_mustAcceptTerms = "你必須同意我們的服務條款。";
    out.register_mustRememberPass = "如果你忘了密碼，我們也無法為你重置。因此務必自行好好記住！ 請在勾選處勾選確認。";

    out.register_header = "歡迎來到 CryptPad";
    out.register_explanation = [
        "<p>首先讓我們先了解幾件事</p>",
        "<ul>",
            "<li>你的密碼是你用來加密所有工作檔案的密鑰。一旦遺失它，我們也沒辦法幫你恢復你的資料。</li>",
            "<li>你可以滙入近期在瀏覽器下檢視的工作檔案到你的雲端硬碟裏。</li>",
            "<li>如果你使用的是公用分享電腦，你需要在完成工作後進行登出，只是關閉分頁是不夠的。</li>",
        "</ul>"
    ].join('');

    out.register_writtenPassword = "我已記下了我的用戶名和密碼，請繼續";
    out.register_cancel = "回去";

    out.register_warning = "零知識表示如果你遺失了密碼,我們也無法還原你的資料";

    out.register_alreadyRegistered = "這名用戶己存在了,你要登入嗎?";

    // Settings
    out.settings_title = "設定";
    out.settings_save = "儲存";
    out.settings_backupTitle = "備份或重建你所有的資料";
    out.settings_backup = "備份";
    out.settings_restore = "重建";
    out.settings_resetTitle = "清除你的雲端硬碟";
    out.settings_reset = "從你的 CryptDrive 移除所有的檔案和資料夾";
    out.settings_resetPrompt = "這個動作會自你的雲端硬碟中移除所有工作檔案<br>"+
                               "確定要繼續嗎？<br>" +
                               "輸入 “<em>I love CryptPad</em>” 來確認。";
    out.settings_resetDone = "你的目錄現已清空！";
    out.settings_resetError = "不正確的認證文字，你的 CryptDrive 並未更改。";
    out.settings_resetTips = "使用 CryptDrive 的竅門";
    out.settings_resetTipsButton = "在 CryptDrive 下重置可用的訣竅";
    out.settings_resetTipsDone = "所有的訣竅現在都可再次看到了。";

    out.settings_importTitle = "滙入這個瀏覽器近期的工作檔案到我的 CryptDrive";
    out.settings_import = "滙入";
    out.settings_importConfirm = "確定要從這個瀏覽器滙入近期的工作檔案到你的 CryptDrive ？";
    out.settings_importDone = "滙入完成";

    out.settings_userFeedbackHint1 = "CryptPad 會提供一些基本的反饋到伺服器，以讓我們知道如何改善用戶體驗。";
    out.settings_userFeedbackHint2 = "你的工作檔案內容絕不會被分享到伺服器";
    out.settings_userFeedback = "啟用用戶反饋功能";

    out.settings_anonymous = "你尚未登入，在此瀏覽器上進行特別設定。";
    out.settings_publicSigningKey = "公開金鑰簽署";

    out.settings_usage = "用法";
    out.settings_usageTitle = "查看所有置頂的工作檔案所佔的容量";
    out.settings_pinningNotAvailable = "工作檔案置頂功能只開放給已註冊用戶";
    out.settings_pinningError = "有點不對勁";
    out.settings_usageAmount = "你置頂的工作檔案佔了 {0}MB";

    out.settings_logoutEverywhereTitle = "自所有地點登出";
    out.settings_logoutEverywhere = "自所有其它的網頁期間登出";
    out.settings_logoutEverywhereConfirm = "你確定嗎？你將需要登入到所有用到設置。";

    out.upload_serverError = "伺服器出錯：本次無法上傳你的檔案";
    out.upload_uploadPending = "你欲上傳檔案正在傳輸中，要取消並上傳新檔案嗎？";
    out.upload_success = "你的檔案 ({0}) 已成功地上傳並放入到你的網路磁碟中。";
    out.upload_notEnoughSpace = "你的 CryptDrive 無足夠空間來存放這個檔案。";
    out.upload_tooLarge = "此檔案超過了上傳單一檔案可允許的容量上限。";
    out.upload_choose = "選擇一個檔案";
    out.upload_pending = "待處理";
    out.upload_cancelled = "已取消的";
    out.upload_name = "檔案名";
    out.upload_size = "大小";
    out.upload_progress = "進度";
    out.download_button = "解密 & 下載";

    // general warnings
    out.warn_notPinned = "這個工作檔案並不在任何人的 CryptDrive 裏，它將在 3 個月到期後刪除。 <a href='/about.html#pinning'>進一步了解...</a>";

    // index.html


    //about.html
    out.main_p2 = '本專案使用 <a href="http://ckeditor.com/">CKEditor</a> 視覺編輯器, <a href="https://codemirror.net/">CodeMirror</a>, 以及 <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a> 即時引擊。';
    out.main_howitworks_p1 = 'CryptPad 應用一種變體的 <a href="https://en.wikipedia.org/wiki/Operational_transformation">操作型變換 Operational transformation</a> 演算法，它利用<a href="https://bitcoin.org/bitcoin.pdf">Nakamoto Blockchain</a>來找到分散的共識, Nakamoto Blockchain 是一種建構當前流行的<a href="https://en.wikipedia.org/wiki/Bitcoin">比特幣</a>。這套演算法可避免需要一個中央的伺服器來解析操作型變換編輯衝突，而無須處理解析衝突，伺服器並不知道哪一個檔案被編輯。';

    // contact.html
    out.main_about_p2 = '若有任何問題和建議, 可以在<a href="https://twitter.com/cryptpad">tweet us</a>, <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="our issue tracker">github</a>提出問題, 或是來到 irc (<a href="http://webchat.freenode.net?channels=%23cryptpad&uio=MT1mYWxzZSY5PXRydWUmMTE9Mjg3JjE1PXRydWUe7" title="freenode webchat">irc.freenode.net</a>)打聲招呼, 再或者 <a href="mailto:research@xwiki.com">寄封電郵給我們</a>.';

    out.main_info = "<h1>Collaborate in Confidence</h1><br> 利用共同享文件發嚮點子，透過 <strong>零知識 </strong> 科技確保隱私安全; 對任何網路服務商都要加以提防。";

    out.main_howitworks = '它如何運作';
    out.main_zeroKnowledge = '零知識';
    out.main_zeroKnowledge_p = "你不必相信我們所說的<em>並不會</em> 察看你的檔案, CryptPad 革命性的零知識技術讓我們 <em>真的不能看到</em>。 進一步了解在這裏，我們如何保護用戶的 <a href=\"/privacy.html\" title='Privacy'>隱私和安全</a>。";
    out.main_writeItDown = '寫下它';
    out.main_writeItDown_p = "偉大的專案來自不起眼的小點子。記下靈感與點子的瞬間，因為你從不會知道哪個會帶來重大突破。";
    out.main_share = '分享連結, 分享工作檔案';
    out.main_share_p = "一起來發響想法點子: 在任何設備上，與朋友一起執行有效率的會議, 協作待辦清單與快速製作簡報。";
    out.main_organize = 'Get organized';
    out.main_organize_p = "利用 CryptPad 空間, 你可以保留看管重要的東西。資料夾讓你可以追踪專案和全盤了解事情的走向狀況。";
    out.tryIt = 'Try it out!';
    out.main_richText = '富文字編輯器';
    out.main_richText_p = '利用我們的即時零知識技術，集體協作地編輯富文本檔案 <a href="http://ckeditor.com" target="_blank">CkEditor</a> 應用程式application.';
    out.main_code = '代碼編輯器';
    out.main_code_p = '利用我們的即時零知識技術，集體協作地編輯程式代碼 <a href="https://www.codemirror.net" target="_blank">CodeMirror</a> 應用程式。';
    out.main_slide = '投影片編輯器';
    out.main_slide_p = '使用 Markdown 語法來建立投影片，並利用瀏覽器來展示投影片。';
    out.main_poll = '調查';
    out.main_poll_p = '規劃會議或活動，或是為問題舉行投最佳方案的投票。';
    out.main_drive = 'CryptDrive';

    out.footer_applications = "應用程式";
    out.footer_contact = "聯繫";
    out.footer_aboutUs = "關於 Cryptpad";

    out.about = "關於";
    out.privacy = "隱私";
    out.contact = "聯繫";
    out.terms = "服務條款";
    out.blog = "Blog";

    // privacy.html

    out.policy_title = 'CryptPad 隱私政策';
    out.policy_whatweknow = '我們會知道哪些關於你的資料';
    out.policy_whatweknow_p1 = '作為一個網頁上的應用程式, CryptPad 可以接取 HTTP 協議所曝露的元數據。 這包括你的 IP 地址、各式其它的 HTTP 標頭，其用於識別你特定的瀏覽器。 你可以訪問 <a target="_blank" rel="noopener noreferrer" href="https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending" title="what http headers is my browser sending">WhatIsMyBrowser.com</a>這個網站，知道你的瀏覽器分享了哪些資訊。';
    out.policy_whatweknow_p2 = '我們使用 <a href="https://www.elastic.co/products/kibana" target="_blank" rel="noopener noreferrer" title="open source analytics platform">Kibana</a>, 它是一個開源的流量數據分析平台, 以更了解用戶。Kibana 讓我們知道你是如何地發現 CryptPad, 是透過直接接入、攑搜尋引擊或是其它網站的介紹如 Reddit 和 Twitter。';
    out.policy_howweuse = '我們如何利用我們知道的東西';
    out.policy_howweuse_p1 = '我們利用這些資訊評估過去成功的效果，以更佳地決定如何推廣 CryptPad。有關你地理位置的資訊讓我們知道是否該提供英語之外的語言版本支援';
    out.policy_howweuse_p2 = "有關你的瀏覽器資訊 (是桌面還是手機操作系統) 有助於讓我們決定要優先哪些功能改善。我們開發團隊人很少，我們試著挑選盡可能地提昇更多用戶的使用體驗。";
    out.policy_whatwetell = '我們可以告訴別人關於你的哪些資料';
    out.policy_whatwetell_p1 = '我們不會給第三人我們所收集的資訊，除非被依法要求配合。';
    out.policy_links = '其它網站連結';
    out.policy_links_p1 = '本站含有其它網站的連結，包括其它組織的産品。我們無法對這些隱私實踐或任何本站以外的內容負責。一般而言，連到外站的連結會另啟新視窗，以明確讓你知道已離開了CryptPad.fr.';
    out.policy_ads = '廣告';
    out.policy_ads_p1 = '我們不會放置任何線上廣告，但會提供一些資助我們研究的機構與團體的網址連結';
    out.policy_choices = '你有的選擇';
    out.policy_choices_open = '我們的代碼是開放的，你可以選擇自行在自己的機器上來架設自己的 CryptPad.';
    out.policy_choices_vpn = '如果你要使用我們架設的服務, 但不希望曝露自己的 IP 地址, 你可以利用<a href="https://www.torproject.org/projects/torbrowser.html.en" title="downloads from the Tor project" target="_blank" rel="noopener noreferrer">Tor 瀏覽器套件</a>來保護隱藏 IP 地址, 或是使用 <a href="https://riseup.net/en/vpn" title="VPNs provided by Riseup" target="_blank" rel="noopener noreferrer">VPN</a>。';
    out.policy_choices_ads = '如果你只是想要封鎖我們的數據分析器, 你可以使用廣告封鎖工具如 <a hre="https://www.eff.org/privacybadger" title="download privacy badger" target="_blank" rel="noopener noreferrer">Privacy Badger</a>.';

    // terms.html

    out.tos_title = "CryptPad 服務條款";
    out.tos_legal = "請不要惡意、濫用或從事非法活動。";
    out.tos_availability = "希望你覺得我們的産品與服務對你有所幫助, 但我們並不能一直百分百保證它的表現穩定與可得性。請記得定期滙出你的資料。";
    out.tos_e2ee = "CryptPad 的內容可以被任何猜出或取得工作檔案分段識別碼的人讀取與修改。我們建議你使用端對端加密 (e2ee) 訊息技術來分享工作檔案連結 以及假設如果一旦連結外漏不會背上任何責任。";
    out.tos_logs = "你的瀏覽器提供給伺服器的元數據，可能會因為維護本服務之效能而被收集記錄。";
    out.tos_3rdparties = "除非法令要求，我們不會提供任何個人資料給第三方。";

    // BottomBar.html

    out.bottom_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Made with <img class="bottom-bar-heart" src="/customize/heart.png" alt="love" /> in <img class="bottom-bar-fr" src="/customize/fr.png" alt="France" /></a>';
    out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">An <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/> Labs Project </a> with the support of <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

    // Header.html

    out.header_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">With <img class="bottom-bar-heart" src="/customize/heart.png" alt="love" /> from <img class="bottom-bar-fr" src="/customize/fr.png" title="France" alt="France"/> by <img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';

    out.header_support = '<a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';
    out.header_logoTitle = '回到主頁';

    // Initial states

    out.initialState = [
        '<p>',
        '這是&nbsp;<strong>CryptPad</strong>, 零知識即時協作編輯平台，當你輸入時一切已即存好。',
        '<br>',
        '分享這個工作檔案的網址連結給友人或是使用、 <span class="fa fa-share-alt"></span> 按鈕分享<em>唯讀的連結</em>&nbsp;其只能看不能編寫。',
        '</p>'
    ].join('');

    out.codeInitialState = [
        '# CryptPad 零知識即時協作代碼編輯平台\n',
        '\n',
        '* 你所輸入的東西會予以加密，僅有知道此網頁連結者可以接取這份文件。\n',
        '* 你可以在右上角選擇欲編寫的程式語言以及樣版配色風格。'
    ].join('');

    out.slideInitialState = [
        '# CryptSlide\n',
        '1. 使用 markdown 語法來寫下你的投影片內容\n',
        '  - 進一步學習 markdown 語法 [here](http://www.markdowntutorial.com/)\n',
        '2. 利用 --- 來區隔不同的投影片\n',
        '3. 點擊下方 "Play" 鍵來查看成果',
        '  - 你的投影片會即時更新'
    ].join('');

    // Readme

    out.driveReadmeTitle = "什麼是 CryptPad?";
    out.readme_welcome = "歡迎來到 CryptPad !";
    out.readme_p1 = "歡迎來到 CryptPad, 這裏你可以獨自作個人筆記或是和別人共享協作。";
    out.readme_p2 = "這個工作檔案可以讓你快速地了解如何使用 CryptPad 作筆記，有效地整理管理文件工作檔案。";
    out.readme_cat1 = "認識如何使用 CryptDrive";
    out.readme_cat1_l1 = "建立一個工作檔案: 在 CryptDrive 底下, 點擊 {0} 然後 {1} 這樣就可以建立一個新的工作檔案。"; // 0: New, 1: Rich Text
    out.readme_cat1_l2 = "從 CryptDrive 開啟工作檔案: 雙擊工作檔案的圖示來開啟它。";
    out.readme_cat1_l3 = "分類你的工作檔案：登入之後，每一個你能接取使用的工作檔案會顯示在你雲端硬碟中的 {0} 部份。"; // 0: Unsorted files
    out.readme_cat1_l3_l1 = "你可以點擊或是拉曳檔案到雲端硬碟 {0} 區，新增資料夾。"; // 0: Documents
    out.readme_cat1_l3_l2 = "記得試著點擊圖示，以顯示更多的選項功能。";
    out.readme_cat1_l4 = "把舊的工作檔案放到垃圾筒：點擊或是拉曳檔案到 {0} 如同把它們拉到文件目錄夾一樣的方法。"; // 0: Trash
    out.readme_cat2 = "像個專業人士來編寫你的工作檔案";
    out.edit = "編輯";
    out.view = "檢視";
    out.readme_cat2_l1 = "在工作檔案下的 {0} 按鍵可讓其它的協作者接取 {1} 或是 {2} 工作檔案"; // 0: Share, 1: edit, 2: view
    out.readme_cat2_l2 = "若要更改工作檔案的名稱，只要點擊右上的鉛筆圖示即可";
    out.readme_cat3 = "發現其它的 CryptPad 應用";
    out.readme_cat3_l1 = "使用 CryptPad 代碼編輯器，你可以和其它人協作各種程式碼，如 Javascript、 markdown、 HTML 等等。";
    out.readme_cat3_l2 = "使用 CryptPad 投影片編輯功能，你可以使用 Markdown 快速製作簡報檔。";
    out.readme_cat3_l3 = "利用 CryptPoll 你可以快速作個線上調查，尤其是調查每個人有空的會議時間。";

    // Tips
    out.tips = {};
    out.tips.lag = "右上角的綠色圖標顯示你連線至 CryptPad 伺服器的連線品質。";
    out.tips.shortcuts = "`ctrl+b`, `ctrl+i` 和 `ctrl+u` 分別是粗體字、斜體、與加底線用法的快速鍵。";
    out.tips.indent = "要使用數字以及符號列表, 可使用 tab 或 shift+tab 快速地增加或滅少縮排指令。";
    out.tips.title = "點擊正上方來設定工作檔案的標題。";
    out.tips.store = "每一回你造訪一個工作檔案, 如果是登入狀態，則這些檔案會自動儲存到你的 CryptDrive.";
    out.tips.marker = "在格式下拉選單中使用 \"marker\" 可以標注反亮文字.";

    out.feedback_about = "如果你讀了這裏，也許會好奇為何當你執行某些動作時 CryptPad 會請求網頁資訊。";
    out.feedback_privacy = "我們注重你的隱私，同時也要讓 CryptPad 容易使用。我們利用這個檔案來了解哪一種介面設計為用戶所重視，透過它來請求特別的功能參數。";
    out.feedback_optout = "如果欲退出客戶資料收集, 請到 <a href='/settings/'>用戶設定頁</a>, 可以找到勾選項目來啟用或關閉用戶回饋功能。";

    return out;
});

