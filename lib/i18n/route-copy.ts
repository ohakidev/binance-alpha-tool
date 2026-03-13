import type { Language } from "@/lib/i18n/translations";

type CopyMap<T> = Record<Language, T>;

export const airdropsPageCopy: CopyMap<{
  project: string;
  type: string;
  points: string;
  heroTitle: string;
  heroDescription: string;
  telegramCtaPrimary: string;
  telegramCtaSecondary: string;
  tba: string;
  tomorrow: string;
  today: string;
  todayShort: string;
  upcoming: string;
  upcomingShort: string;
  all: string;
  allShort: string;
  searchPlaceholder: string;
  chain: string;
  filtersLabel: string;
  clearAll: string;
  alphaPoints: string;
  average: string;
  totalDeducted: string;
  deductedShort: string;
  totalProjects: string;
  allProjects: string;
  amount: string;
  requiredPoints: string;
  deductedPoints: string;
  notSpecified: string;
  time: string;
  notify: string;
  viewMore: string;
  page: string;
  of: string;
  items: string;
  previous: string;
  next: string;
  detailDescription: string;
  estimatedValue: string;
  claimStart: string;
  contractAddress: string;
  sendTelegram: string;
  bscscan: string;
  pointsSuffix: string;
  claimInfoSeparator: string;
  emptyToday: string;
  emptyUpcoming: string;
  emptyAll: string;
  filteredResultsHint: string;
  waitingForUpdates: string;
}> = {
  th: {
    project: "โปรเจกต์",
    type: "ประเภท",
    points: "คะแนน",
    heroTitle: "Alpha Airdrops",
    heroDescription: "Track airdrops and TGE events in real time from public alpha data.",
    telegramCtaPrimary: "Get alpha airdrop alerts",
    telegramCtaSecondary: "Telegram alert channel",
    tba: "TBA",
    tomorrow: "พรุ่งนี้",
    today: "วันนี้",
    todayShort: "วันนี้",
    upcoming: "กำลังมา",
    upcomingShort: "เร็วๆ นี้",
    all: "ทั้งหมด",
    allShort: "ทั้งหมด",
    searchPlaceholder: "ค้นหาโปรเจกต์ หรือ Symbol...",
    chain: "เชน",
    filtersLabel: "กรอง",
    clearAll: "ล้างทั้งหมด",
    alphaPoints: "Alpha Points",
    average: "เฉลี่ย",
    totalDeducted: "หักรวม",
    deductedShort: "หัก",
    totalProjects: "ทั้งหมด",
    allProjects: "โปรเจกต์ทั้งหมด",
    amount: "จำนวน",
    requiredPoints: "Points ที่ต้องใช้",
    deductedPoints: "Points ที่จะถูกหัก",
    notSpecified: "ไม่ระบุ",
    time: "เวลา",
    notify: "แจ้งเตือน",
    viewMore: "ดูเพิ่ม",
    page: "หน้า",
    of: "จาก",
    items: "รายการ",
    previous: "ก่อนหน้า",
    next: "ถัดไป",
    detailDescription: "รายละเอียด Airdrop",
    estimatedValue: "มูลค่าประเมิน",
    claimStart: "เวลาเริ่ม Claim",
    contractAddress: "Contract Address",
    sendTelegram: "ส่งแจ้งเตือน Telegram",
    bscscan: "BscScan",
    pointsSuffix: "pts",
    claimInfoSeparator: "โดย",
    emptyToday: "ยังไม่มี Airdrop วันนี้",
    emptyUpcoming: "ยังไม่มี Airdrop ที่กำลังจะมา",
    emptyAll: "ยังไม่มี Airdrop",
    filteredResultsHint: "ลองปรับตัวกรองใหม่เพื่อดูผลลัพธ์ที่มากขึ้น",
    waitingForUpdates: "Waiting for the next public alpha data update.",
  },
  en: {
    project: "Project",
    type: "Type",
    points: "Points",
    heroTitle: "Alpha Airdrops",
    heroDescription: "Track airdrops and TGE events in real time from public alpha data.",
    telegramCtaPrimary: "Get alpha airdrop alerts",
    telegramCtaSecondary: "Telegram alert channel",
    tba: "TBA",
    tomorrow: "Tomorrow",
    today: "Today",
    todayShort: "Today",
    upcoming: "Upcoming",
    upcomingShort: "Soon",
    all: "All",
    allShort: "All",
    searchPlaceholder: "Search project or symbol...",
    chain: "Chain",
    filtersLabel: "Filters",
    clearAll: "Clear all",
    alphaPoints: "Alpha Points",
    average: "avg",
    totalDeducted: "Total deducted",
    deductedShort: "Deduct",
    totalProjects: "Total",
    allProjects: "All projects",
    amount: "Amount",
    requiredPoints: "Required points",
    deductedPoints: "Deducted points",
    notSpecified: "Not specified",
    time: "Time",
    notify: "Notify",
    viewMore: "View more",
    page: "Page",
    of: "of",
    items: "items",
    previous: "Previous",
    next: "Next",
    detailDescription: "Airdrop details",
    estimatedValue: "Estimated Value",
    claimStart: "Claim start",
    contractAddress: "Contract Address",
    sendTelegram: "Send Telegram alert",
    bscscan: "BscScan",
    pointsSuffix: "pts",
    claimInfoSeparator: "via",
    emptyToday: "No airdrops today",
    emptyUpcoming: "No upcoming airdrops",
    emptyAll: "No airdrops available",
    filteredResultsHint: "Try adjusting the filters to see more results.",
    waitingForUpdates: "Waiting for the next public alpha data update.",
  },
};

export const stabilityPageCopy: CopyMap<{
  stable: string;
  moderate: string;
  unstable: string;
  noTrade: string;
  project: string;
  stability: string;
  spreadBps: string;
  fourXDays: string;
  bps: string;
  trades: string;
  days: string;
  loadingTitle: string;
  loadingDesc: string;
  title: string;
  live: string;
  tokensTracked: string;
  alertAfterStableFor: string;
  total: string;
  noDataAvailable: string;
  autoRefreshEvery: string;
  lastUpdate: string;
  informationTips: string;
  criteriaTitle: string;
  criteriaDesc: string;
  spreadTitle: string;
  spreadDesc: string;
  sortingTitle: string;
  sortingDesc: string;
  alertsTitle: string;
  alertsDesc: string;
  disclaimerTitle: string;
  disclaimerDesc: string;
  stableAlertTitle: (symbol: string) => string;
  stableAlertBody: (symbol: string, duration: number, spreadBps: number) => string;
}> = {
  th: {
    stable: "เสถียร",
    moderate: "ปานกลาง",
    unstable: "ผันผวน",
    noTrade: "ไม่มีเทรด",
    project: "โปรเจกต์",
    stability: "เสถียรภาพ",
    spreadBps: "Spread BPS",
    fourXDays: "วัน 4x",
    bps: "bps",
    trades: "เทรด",
    days: "วัน",
    loadingTitle: "กำลังโหลดข้อมูลความเสถียร",
    loadingDesc: "กำลังวิเคราะห์สภาพตลาด...",
    title: "Stability Dashboard",
    live: "สด",
    tokensTracked: "โทเค็นที่ติดตาม",
    alertAfterStableFor: "แจ้งเตือนเมื่อเสถียรต่อเนื่องครบ",
    total: "รวม",
    noDataAvailable: "ไม่มีข้อมูล",
    autoRefreshEvery: "รีเฟรชอัตโนมัติทุก 5 วินาที",
    lastUpdate: "อัปเดตล่าสุด",
    informationTips: "ข้อมูลและคำแนะนำ",
    criteriaTitle: "เกณฑ์",
    criteriaDesc:
      "พิจารณาช่วงราคา, การแกว่งของวอลุ่ม, สไปก์ผิดปกติ และแนวโน้มระยะสั้น",
    spreadTitle: "Spread BPS",
    spreadDesc:
      "คำนวณจากส่วนเบี่ยงเบนมาตรฐานของราคาที่เทรด ยิ่งต่ำยิ่งนิ่ง ต่ำกว่า 5 bps = เสถียร ต่ำกว่า 50 bps = ปานกลาง",
    sortingTitle: "การเรียงลำดับ",
    sortingDesc:
      "กดหัวคอลัมน์เพื่อเรียง KOGE (1x) เป็นค่าอ้างอิง จากนั้นเรียงตาม เสถียร > ปานกลาง > ผันผวน",
    alertsTitle: "การแจ้งเตือน",
    alertsDesc:
      "เมื่อเปิดไว้ ระบบจะแจ้งเตือนหลังจากโปรเจกต์เสถียรต่อเนื่อง ควรเปิดหน้านี้ไว้ด้านหน้า",
    disclaimerTitle: "ข้อจำกัดความรับผิดชอบ",
    disclaimerDesc: "ตลาดมีความผันผวนสูง โปรดศึกษาด้วยตนเอง ผู้พัฒนาไม่รับผิดชอบต่อการขาดทุน",
    stableAlertTitle: (symbol) => `🟢 ${symbol} เสถียรแล้ว`,
    stableAlertBody: (symbol, duration, spreadBps) =>
      `${symbol} เสถียรต่อเนื่อง ${Math.floor(duration)} วินาทีแล้ว Spread: ${spreadBps.toFixed(2)} bps`,
  },
  en: {
    stable: "Stable",
    moderate: "Moderate",
    unstable: "Unstable",
    noTrade: "No Trade",
    project: "Project",
    stability: "Stability",
    spreadBps: "Spread BPS",
    fourXDays: "4x Days",
    bps: "bps",
    trades: "trades",
    days: "days",
    loadingTitle: "Loading stability data",
    loadingDesc: "Analyzing market conditions...",
    title: "Stability Dashboard",
    live: "LIVE",
    tokensTracked: "tokens tracked",
    alertAfterStableFor: "Alert after stable for",
    total: "Total",
    noDataAvailable: "No data available",
    autoRefreshEvery: "Auto-refresh every 5s",
    lastUpdate: "Last update",
    informationTips: "Information & Tips",
    criteriaTitle: "Criteria",
    criteriaDesc:
      "Checks price range, volume swings, abnormal spikes, and short-term trend analysis.",
    spreadTitle: "Spread BPS",
    spreadDesc:
      "Standard deviation of trade prices. Lower means more consistent. Below 5 bps = Stable, below 50 bps = Moderate.",
    sortingTitle: "Sorting",
    sortingDesc:
      "Click column headers to sort. KOGE (1x) is the baseline, followed by Stable, Moderate, and Unstable.",
    alertsTitle: "Alerts",
    alertsDesc:
      "When enabled, you'll be notified after continuous stability. Keep this page in the foreground.",
    disclaimerTitle: "Disclaimer",
    disclaimerDesc:
      "Markets are unpredictable. Do your own research; no liability for losses.",
    stableAlertTitle: (symbol) => `🟢 ${symbol} Stable Alert`,
    stableAlertBody: (symbol, duration, spreadBps) =>
      `${symbol} has been stable for ${Math.floor(duration)}s. Spread: ${spreadBps.toFixed(2)} bps`,
  },
};

export const userManagementCopy: CopyMap<{
  selectUser: string;
  addUser: string;
  cannotDeleteLastUser: string;
  deleteUserConfirm: (username: string) => string;
  switchUserHint: string;
  editUser: string;
  addNewUser: string;
  selectAvatar: string;
  username: string;
  enterUsername: string;
  usernameRequired: string;
  usernameMinLength: string;
  usernameMaxLength: string;
  usernameAlreadyExists: string;
  preview: string;
  cancel: string;
  saving: string;
  update: string;
  create: string;
  userUpdated: string;
  userCreated: string;
  saveUserFailed: string;
  characters: string;
  level: string;
  entries: string;
  incomeEntries: string;
  projectName: string;
  projectNamePlaceholder: string;
  amountUsd: string;
  category: string;
  notesOptional: string;
  notesPlaceholder: string;
  updateEntry: string;
  addEntry: string;
  deleteEntryConfirm: string;
  selectUserAndDate: string;
  validAmount: string;
  entryUpdated: string;
  entryAdded: string;
  entryDeleted: string;
  todaysTotal: string;
  todaysEntries: string;
  categories: Record<"airdrop" | "trading" | "staking" | "other", string>;
}> = {
  th: {
    selectUser: "เลือกผู้ใช้",
    addUser: "เพิ่มผู้ใช้",
    cannotDeleteLastUser: "ไม่สามารถลบผู้ใช้คนสุดท้ายได้",
    deleteUserConfirm: (username) => `ยืนยันการลบ ${username} ใช่หรือไม่?`,
    switchUserHint: "คลิกการ์ดผู้ใช้เพื่อสลับผู้ใช้ที่กำลังใช้งาน",
    editUser: "แก้ไขผู้ใช้",
    addNewUser: "เพิ่มผู้ใช้ใหม่",
    selectAvatar: "เลือกอวาตาร์",
    username: "ชื่อผู้ใช้",
    enterUsername: "กรอกชื่อผู้ใช้",
    usernameRequired: "กรุณากรอกชื่อผู้ใช้",
    usernameMinLength: "ชื่อผู้ใช้ต้องมีอย่างน้อย 2 ตัวอักษร",
    usernameMaxLength: "ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร",
    usernameAlreadyExists: "มีชื่อผู้ใช้นี้แล้ว",
    preview: "ตัวอย่าง",
    cancel: "ยกเลิก",
    saving: "กำลังบันทึก...",
    update: "อัปเดต",
    create: "สร้าง",
    userUpdated: "อัปเดตผู้ใช้แล้ว",
    userCreated: "สร้างผู้ใช้แล้ว",
    saveUserFailed: "บันทึกผู้ใช้ไม่สำเร็จ",
    characters: "ตัวอักษร",
    level: "เลเวล",
    entries: "รายการ",
    incomeEntries: "รายการรายได้",
    projectName: "ชื่อโปรเจกต์ *",
    projectNamePlaceholder: "เช่น Zeta Protocol",
    amountUsd: "จำนวนเงิน (USD) *",
    category: "หมวดหมู่ *",
    notesOptional: "บันทึกเพิ่มเติม (ไม่บังคับ)",
    notesPlaceholder: "รายละเอียดเพิ่มเติม...",
    updateEntry: "อัปเดตรายการ",
    addEntry: "เพิ่มรายการ",
    deleteEntryConfirm: "ยืนยันการลบรายการนี้หรือไม่?",
    selectUserAndDate: "กรุณาเลือกผู้ใช้และวันที่",
    validAmount: "กรุณากรอกจำนวนเงินที่ถูกต้อง",
    entryUpdated: "อัปเดตรายการแล้ว",
    entryAdded: "เพิ่มรายการแล้ว",
    entryDeleted: "ลบรายการแล้ว",
    todaysTotal: "รวมวันนี้",
    todaysEntries: "รายการวันนี้",
    categories: {
      airdrop: "Airdrop",
      trading: "Trading",
      staking: "Staking",
      other: "อื่นๆ",
    },
  },
  en: {
    selectUser: "Select User",
    addUser: "Add User",
    cannotDeleteLastUser: "Cannot delete the last user",
    deleteUserConfirm: (username) => `Are you sure you want to delete ${username}?`,
    switchUserHint: "Click on a user card to switch the active user",
    editUser: "Edit User",
    addNewUser: "Add New User",
    selectAvatar: "Select Avatar",
    username: "Username",
    enterUsername: "Enter username",
    usernameRequired: "Username is required",
    usernameMinLength: "Username must be at least 2 characters",
    usernameMaxLength: "Username must be less than 20 characters",
    usernameAlreadyExists: "Username already exists",
    preview: "Preview",
    cancel: "Cancel",
    saving: "Saving...",
    update: "Update",
    create: "Create",
    userUpdated: "User updated successfully",
    userCreated: "User created successfully",
    saveUserFailed: "Failed to save user",
    characters: "characters",
    level: "Lv",
    entries: "entries",
    incomeEntries: "Income Entries",
    projectName: "Project Name *",
    projectNamePlaceholder: "e.g., Zeta Protocol",
    amountUsd: "Amount (USD) *",
    category: "Category *",
    notesOptional: "Notes (Optional)",
    notesPlaceholder: "Additional notes...",
    updateEntry: "Update Entry",
    addEntry: "Add Entry",
    deleteEntryConfirm: "Are you sure you want to delete this entry?",
    selectUserAndDate: "Please select a user and date",
    validAmount: "Please enter a valid amount",
    entryUpdated: "Entry updated successfully",
    entryAdded: "Entry added successfully",
    entryDeleted: "Entry deleted",
    todaysTotal: "Today's Total",
    todaysEntries: "Today's Entries",
    categories: {
      airdrop: "Airdrop",
      trading: "Trading",
      staking: "Staking",
      other: "Other",
    },
  },
};

export const settingsPageCopy: CopyMap<{
  binanceApiKeyLabel: string;
  binanceApiKeyPlaceholder: string;
  binanceSecretKeyLabel: string;
  binanceSecretKeyPlaceholder: string;
  telegramIntegrationTitle: string;
  telegramIntegrationDesc: string;
  telegramBotTokenLabel: string;
  telegramBotTokenPlaceholder: string;
  telegramChatIdLabel: string;
  telegramChatIdPlaceholder: string;
  notificationOptions: Array<{ id: string; label: string; desc: string }>;
  compactModeTitle: string;
  compactModeDesc: string;
  animationsTitle: string;
  animationsDesc: string;
  exportDataTitle: string;
  exportDataDesc: string;
  exportJsonButton: string;
  importDataTitle: string;
  importDataDesc: string;
  selectFileButton: string;
  dangerZoneTitle: string;
  dangerZoneDesc: string;
  resetAllDataButton: string;
  confirmResetTitle: string;
  confirmResetDesc: string;
  confirmResetAction: string;
}> = {
  th: {
    binanceApiKeyLabel: "Credential input disabled",
    binanceApiKeyPlaceholder: "Use server-side env vars instead",
    binanceSecretKeyLabel: "Server-side only",
    binanceSecretKeyPlaceholder: "Not available on public deployment",
    telegramIntegrationTitle: "เชื่อมต่อ Telegram",
    telegramIntegrationDesc: "รับการแจ้งเตือนไปยัง Telegram โดยตรง",
    telegramBotTokenLabel: "Telegram Bot Token",
    telegramBotTokenPlaceholder: "กรอก Bot Token",
    telegramChatIdLabel: "Telegram Chat ID",
    telegramChatIdPlaceholder: "กรอก Chat ID",
    notificationOptions: [
      {
        id: "price-alerts",
        label: "แจ้งเตือนราคา",
        desc: "แจ้งเตือนเมื่อราคามีการเปลี่ยนแปลงมากผิดปกติ",
      },
      {
        id: "stability-alerts",
        label: "แจ้งเตือนความเสถียร",
        desc: "แจ้งเตือนเมื่อคะแนนความเสถียรเปลี่ยนแปลง",
      },
      {
        id: "new-listings",
        label: "ลิสต์ใหม่",
        desc: "แจ้งเตือนเมื่อมีโทเค็นลิสต์ใหม่",
      },
    ],
    compactModeTitle: "โหมดกระชับ",
    compactModeDesc: "ลดระยะห่างและขนาดตัวอักษรในหน้าจอ",
    animationsTitle: "แอนิเมชัน",
    animationsDesc: "เปิดใช้แอนิเมชันและเอฟเฟกต์ของ UI",
    exportDataTitle: "ส่งออกข้อมูล",
    exportDataDesc: "ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์สำรองแบบ JSON",
    exportJsonButton: "ส่งออก JSON",
    importDataTitle: "นำเข้าข้อมูล",
    importDataDesc: "กู้คืนข้อมูลจากไฟล์สำรอง JSON",
    selectFileButton: "เลือกไฟล์",
    dangerZoneTitle: "โซนอันตราย",
    dangerZoneDesc: "ลบข้อมูลทั้งหมดถาวร การกระทำนี้ไม่สามารถย้อนกลับได้",
    resetAllDataButton: "รีเซ็ตข้อมูลทั้งหมด",
    confirmResetTitle: "ยืนยันการลบข้อมูลทั้งหมด?",
    confirmResetDesc:
      "การกระทำนี้ไม่สามารถย้อนกลับได้ และจะลบข้อมูลทั้งหมด รวมถึงการตั้งค่า API keys และรายการรายได้",
    confirmResetAction: "ใช่ ลบทั้งหมด",
  },
  en: {
    binanceApiKeyLabel: "Credential input disabled",
    binanceApiKeyPlaceholder: "Use server-side env vars instead",
    binanceSecretKeyLabel: "Server-side only",
    binanceSecretKeyPlaceholder: "Not available on public deployment",
    telegramIntegrationTitle: "Telegram Integration",
    telegramIntegrationDesc: "Receive alerts directly to your Telegram",
    telegramBotTokenLabel: "Telegram Bot Token",
    telegramBotTokenPlaceholder: "Enter Bot Token",
    telegramChatIdLabel: "Telegram Chat ID",
    telegramChatIdPlaceholder: "Enter Chat ID",
    notificationOptions: [
      {
        id: "price-alerts",
        label: "Price Alerts",
        desc: "Get notified when price moves significantly",
      },
      {
        id: "stability-alerts",
        label: "Stability Alerts",
        desc: "Alerts for stability score changes",
      },
      {
        id: "new-listings",
        label: "New Listings",
        desc: "Notification for new token listings",
      },
    ],
    compactModeTitle: "Compact Mode",
    compactModeDesc: "Reduce spacing and font size",
    animationsTitle: "Animations",
    animationsDesc: "Enable UI animations and effects",
    exportDataTitle: "Export Data",
    exportDataDesc: "Download all your data as a JSON file backup.",
    exportJsonButton: "Export JSON",
    importDataTitle: "Import Data",
    importDataDesc: "Restore your data from a JSON backup file.",
    selectFileButton: "Select File",
    dangerZoneTitle: "Danger Zone",
    dangerZoneDesc:
      "Permanently delete all your data. This action cannot be undone.",
    resetAllDataButton: "Reset All Data",
    confirmResetTitle: "Are you absolutely sure?",
    confirmResetDesc:
      "This action cannot be undone. This will permanently delete all your data including settings, API keys, and income entries.",
    confirmResetAction: "Yes, delete everything",
  },
};
