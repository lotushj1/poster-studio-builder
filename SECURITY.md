# 安全與個資

請不要在 issue、pull request、公開 log 或 source package 中貼上：

- Figma access token、API key、session cookie、密碼或任何 credentials。
- 私人 Figma／Sites URL、未公開 source package、內部檔案路徑或客戶資料。
- 真實姓名、email、電話、地址、私人照片或其他可識別個人資訊。

若發現疑似秘密或個資，請不要把內容複製到公開討論；先在本機停止散布並透過 repository 維護者提供的私下安全管道回報，附上檔案路徑、受影響範圍與可安全重現的最小描述。若沒有私下管道，請只回報「疑似敏感資料」與位置，不要附原文。

範本本身不會保存 Figma credential，也不會將使用者照片或本機字體上傳到服務端。公開前請執行 secrets／PII deny-list 掃描，並人工檢查 sample config、README、manifest 與截圖。
